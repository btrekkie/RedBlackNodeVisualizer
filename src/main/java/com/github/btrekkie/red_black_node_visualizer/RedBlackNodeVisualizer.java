package com.github.btrekkie.red_black_node_visualizer;

import java.awt.Desktop;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.github.btrekkie.red_black_node.RedBlackNode;

/** Provides static methods for displaying RedBlackNode trees using a web interface. */
public class RedBlackNodeVisualizer {
    /** The maximum number of web visualizations to have open at a time via showInWebBrowser. */
    private static final int MAX_WEB = 10;

    /**
     * The IDs of the web visualizations that are currently open, as in the return value of showInWebBrowser. webIds
     * should only be accessed in a synchronized(webIds) block or equivalent.
     */
    private static Set<String> webIds = new HashSet<>();

    /**
     * Returns whether we regard the specified node as a leaf node for the purposes of RedBlackNodeVisualizer. We regard
     * nodes that have at least one null child as leaf nodes.
     */
    private static boolean isLeaf(RedBlackNode<?> node) {
        return node.left == null || node.right == null;
    }

    /**
     * Returns whether the specified character is a printable ASCII character, as opposed to a control character or a
     * non-ASCII character.
     */
    private static boolean isPrintableAscii(char c) {
        return c >= ' ' && c <= '~';
    }

    /**
     * Appends a JavaScript string literal for the specified string to "builder". For example,
     * appendJsStr("foo", '\'', builder) might append "'foo'". If "quote" is '"', then this will append a valid JSON
     * string literal.
     * @param str The value of the string literal.
     * @param quote The quote character to use: '"' or '\''.
     * @param builder The builder to append to.
     */
    private static void appendJsStr(String str, char quote, StringBuilder builder) {
        builder.append(quote);
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            if (c == quote || c == '\\') {
                builder.append('\\');
                builder.append(c);
            } else if (isPrintableAscii(c)) {
                builder.append(c);
            } else {
                builder.append(String.format("\\u%04x", (int)c));
            }
        }
        builder.append(quote);
    }

    /**
     * Appends a JSON string literal for the specified string to "builder". For example, appendJsonStr("foo", builder)
     * might append "\"foo\"".
     */
    private static void appendJsonStr(String str, StringBuilder builder) {
        appendJsStr(str, '"', builder);
    }

    /** Appends a JSON string literal for the specified exception for the visualizer website to "builder". */
    private static void appendException(Exception exception, StringBuilder builder) {
        String className;
        if (exception.getClass().isAnonymousClass()) {
            className = exception.getClass().getSuperclass().getSimpleName();
        } else {
            className = exception.getClass().getSimpleName();
        }
        appendJsonStr(className + ": " + exception.getMessage(), builder);
    }

    /**
     * Appends a JSON representation of the sanitized subtree rooted at "node" for the visualizer website to "builder".
     * @param <N> The type of the nodes.
     * @param node The node to export.
     * @param debugStringGetter The DebugStringGetter to use, if any.
     * @param root The sanitized root of the tree that contains "node".
     * @param leftChildren A map from each node to its left child in the sanitized tree, as computed by sanitizeSubtree.
     * @param rightChildren A map from each node to its right child in the sanitized tree, as computed by
     *     sanitizeSubtree.
     * @param nodeIds A map from each node to its ID (or rank) in the sanitized tree, as computed by sanitizeSubtree.
     * @param isValidRedBlack Whether the tree containing "node" is a valid red-black tree, as in
     *     assertSubtreeIsValidRedBlack().
     * @param builder The builder to append to.
     */
    private static <N extends RedBlackNode<N>> void exportSubtree(
            N node, DebugStringGetter<? super N> debugStringGetter, N root,
            Map<Reference<N>, N> leftChildren, Map<Reference<N>, N> rightChildren, Map<Reference<N>, Integer> nodeIds,
            boolean isValidRedBlack, StringBuilder builder) {
        builder.append("{\"c\":");
        builder.append(node.isRed);
        if (debugStringGetter != null) {
            String debugStr = debugStringGetter.getDebugString(node);
            if (debugStr != null) {
                builder.append(",\"d\":");
                appendJsonStr(debugStr, builder);
            }
        }

        if (isValidRedBlack) {
            try {
                node.assertNodeIsValid();
            } catch (RuntimeException exception) {
                builder.append(",\"e\":");
                appendException(exception, builder);
            }
        }
        if (node.parent == null) {
            try {
                node.assertSubtreeIsValid();
            } catch (RuntimeException exception) {
                builder.append(",\"se\":");
                appendException(exception, builder);
            }
        }

        Reference<N> parentReference = new Reference<>(node.parent);
        if (node.parent != null) {
            if (leftChildren.get(parentReference) != node && rightChildren.get(parentReference) != node) {
                builder.append(",\"p\":");
                Integer parentId = nodeIds.get(parentReference);
                builder.append(parentId != null ? parentId : -1);
            }
        } else if (node != root) {
            builder.append(",\"p\":null");
        }

        Reference<N> nodeReference = new Reference<>(node);
        N left = leftChildren.get(nodeReference);
        if (left != null) {
            builder.append(",\"l\":");
            RedBlackNodeVisualizer.<N>exportSubtree(
                left, debugStringGetter, root, leftChildren, rightChildren, nodeIds, isValidRedBlack, builder);
        } else if (!isLeaf(node.left)) {
            builder.append(",\"l\":");
            builder.append(nodeIds.get(new Reference<>(node.left)));
        }

        N right = rightChildren.get(nodeReference);
        if (right != null) {
            builder.append(",\"r\":");
            RedBlackNodeVisualizer.<N>exportSubtree(
                right, debugStringGetter, root, leftChildren, rightChildren, nodeIds, isValidRedBlack, builder);
        } else if (!isLeaf(node.right)) {
            builder.append(",\"r\":");
            builder.append(nodeIds.get(new Reference<>(node.right)));
        }
        builder.append('}');
    }

    /**
     * Produces a "sanitized" representation of the subtree rooted at "node". In other words, this converts the subtree
     * into a valid binary tree if it wasn't one already. This does not look at any "parent" pointers; it only looks at
     * the "left" and "right" pointers. All nodes reachable via some series of "left" and "right" pointers that does not
     * include a leaf node will appear in the resulting tree.
     * @param <N> The type of the nodes.
     * @param node The root of the subtree.
     * @param leftChildren A map from each node to its left child in the sanitized tree. sanitizeSubtree adds entries to
     *     this map.
     * @param rightChildren A map from each node to its right child in the sanitized tree. sanitizeSubtree adds entries
     *     to this map.
     * @param nodeIds A map from each node to its ID (or rank) in the sanitized tree. sanitizeSubtree adds entries to
     *     this map.
     * @param visited The nodes we have reached in the process of sanitizing the tree that contains "node". This must
     *     initially include "node" itself. sanitizeSubtree adds to this set.
     */
    private static <N extends RedBlackNode<N>> void sanitizeSubtree(
            N node, Map<Reference<N>, N> leftChildren, Map<Reference<N>, N> rightChildren,
            Map<Reference<N>, Integer> nodeIds, Set<Reference<N>> visited) {
        Reference<N> nodeReference = new Reference<>(node);
        if (!isLeaf(node.left) && visited.add(new Reference<>(node.left))) {
            sanitizeSubtree(node.left, leftChildren, rightChildren, nodeIds, visited);
            leftChildren.put(nodeReference, node.left);
        } else {
            leftChildren.put(nodeReference, null);
        }

        nodeIds.put(nodeReference, nodeIds.size());

        if (!isLeaf(node.right) && visited.add(new Reference<>(node.right))) {
            sanitizeSubtree(node.right, leftChildren, rightChildren, nodeIds, visited);
            rightChildren.put(nodeReference, node.right);
        } else {
            rightChildren.put(nodeReference, null);
        }
    }

    /**
     * Returns a string representation of the red-black tree containing the specified node, which may be used to
     * visualize the tree. The node will initially be highlighted in the visualization (unless it does not appear in the
     * visualization due to structural errors in the tree).
     * @param <N> The type of the nodes.
     * @param node The node.
     * @param title Title text to display in the visualization.
     * @param debugStringGetter A DebugStringGetter that computes the debug strings to display for the nodes in the
     *     visualization. For example, this could return the values stored in the nodes.
     * @return The string.
     */
    public static <N extends RedBlackNode<N>> String export(
            N node, String title, DebugStringGetter<? super N> debugStringGetter) {
        StringBuilder builder = new StringBuilder();
        builder.append('{');
        if (title != null) {
            builder.append("\"title\":");
            appendJsonStr(title, builder);
            builder.append(',');
        }
        if (isLeaf(node)) {
            builder.append("\"tree\":null}");
            return builder.toString();
        }

        Set<Reference<N>> parents = new HashSet<>();
        N root;
        for (root = node; root.parent != null && parents.add(new Reference<>(root)); root = root.parent);

        Map<Reference<N>, N> leftChildren = new HashMap<>();
        Map<Reference<N>, N> rightChildren = new HashMap<>();
        Map<Reference<N>, Integer> nodeIds = new HashMap<>();
        Set<Reference<N>> visited = new HashSet<>();
        visited.add(new Reference<>(root));
        sanitizeSubtree(root, leftChildren, rightChildren, nodeIds, visited);

        boolean isValidRedBlack;
        if (root.parent != null) {
            isValidRedBlack = false;
        } else {
            try {
                root.assertSubtreeIsValidRedBlack();
                isValidRedBlack = true;
            } catch (RuntimeException exception) {
                isValidRedBlack = false;
            }
        }

        Integer nodeId = nodeIds.get(new Reference<>(node));
        if (nodeId != null) {
            builder.append("\"selectedNode\":");
            builder.append(nodeId);
            builder.append(',');
        }
        builder.append("\"tree\":");
        RedBlackNodeVisualizer.<N>exportSubtree(
            root, debugStringGetter, root, leftChildren, rightChildren, nodeIds, isValidRedBlack, builder);
        builder.append("}");
        return builder.toString();
    }

    /**
     * Returns a string representation of the red-black tree containing the specified node, which may be used to
     * visualize the tree. The node will initially be highlighted in the visualization (unless it does not appear in the
     * visualization due to structural errors in the tree).
     * @param <N> The type of the nodes.
     * @param node The node.
     * @param debugStringGetter A DebugStringGetter that computes the debug strings to display for the nodes in the
     *     visualization. For example, this could return the values stored in the nodes.
     * @return The string.
     */
    public static <N extends RedBlackNode<N>> String export(N node, DebugStringGetter<? super N> debugStringGetter) {
        return RedBlackNodeVisualizer.<N>export(node, null, debugStringGetter);
    }

    /**
     * Returns a string representation of the red-black tree containing the specified node, which may be used to
     * visualize the tree. The node will initially be highlighted in the visualization (unless it does not appear in the
     * visualization due to structural errors in the tree).
     * @param <N> The type of the nodes.
     * @param node The node.
     * @param title Title text to display in the visualization.
     * @return The string.
     */
    public static <N extends RedBlackNode<N>> String export(N node, String title) {
        return export(node, title, null);
    }

    /**
     * Returns a string representation of the red-black tree containing the specified node, which may be used to
     * visualize the tree. The node will initially be highlighted in the visualization (unless it does not appear in the
     * visualization due to structural errors in the tree).
     * @param <N> The type of the nodes.
     * @param node The node.
     * @return The string.
     */
    public static <N extends RedBlackNode<N>> String export(N node) {
        return export(node, null, null);
    }

    /** Returns the string contents of the specified Reader. */
    private static String read(Reader reader) throws IOException {
        StringBuilder builder = new StringBuilder();
        char[] chars = new char[1024];
        int charCount = reader.read(chars);
        while (charCount >= 0) {
            builder.append(chars, 0, charCount);
            charCount = reader.read(chars);
        }
        return builder.toString();
    }

    /**
     * Writes a stand-alone HTML page for visualizing a red-black tree to the specified file.
     * @param treeStr The string representation of the tree, as returned by "export".
     * @param id The string to add to the URL as a red_black_node_visualizer query parameter, if any.
     * @param output The file.
     */
    private static void writeHtml(String treeStr, String id, File output) throws IOException {
        Reader reader = new InputStreamReader(RedBlackNodeVisualizer.class.getResourceAsStream("index.html"));
        String contents;
        try {
            contents = read(reader);
        } finally {
            reader.close();
        }

        StringBuilder builder = new StringBuilder();
        if (id != null) {
            builder.append("window.setIdParam(");
            appendJsStr(id, '"', builder);
            builder.append(");");
        }

        builder.append("window.renderVisualizer(");
        if (treeStr != null) {
            appendJsStr(treeStr, '\'', builder);
        } else {
            builder.append("null");
        }
        builder.append(");");

        String adjContents = contents.replace("<!-- Call window.renderVisualizer here -->", builder);

        FileWriter writer = new FileWriter(output);
        try {
            writer.write(adjContents);
        } finally {
            writer.close();
        }
    }

    /**
     * Writes a stand-alone HTML page for visualizing a red-black tree to the specified file.
     * @param treeStr The string representation of the tree, as returned by "export".
     * @param output The file.
     */
    public static void writeHtml(String treeStr, File output) throws IOException {
        writeHtml(treeStr, null, output);
    }

    /**
     * Writes a stand-alone HTML page for visualizing red-black trees to the specified file. The page has an input where
     * you can enter the string representation of the tree to visualize, as returned by "export".
     * @param output The file.
     */
    public static void writeHtml(File output) throws IOException {
        writeHtml(null, output);
    }

    /**
     * Opens a webpage for visualizing a red-black tree in the default web browser.
     *
     * As a courtesy, this will only open up to a limited number of visualizations at once (per process). If we are at
     * this limit, the call to showInWebBrowser will have no effect. To stop counting a visualization towards this
     * limit, call "closed".
     * @param treeStr The string representation of the tree, as returned by "export".
     * @return A unique string ID for the open visualization, which may later be passed to "closed". This returns null
     *     if we did not open the visualization due to reaching the limit.
     * @throws IOException If there was an I/O error, e.g. when reading or writing an HTML file or launching the web
     *     browser.
     * @throws UnsupportedOperationException If the Desktop.Action.BROWSE action is not supported in this environment.
     * @throws SecurityException If the action was prevented for security reasons, as in the Desktop.browse method.
     */
    public static String showInWebBrowser(String treeStr) throws IOException {
        if (!Desktop.isDesktopSupported() || !Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
            throw new UnsupportedOperationException("Cannot open web browser");
        }

        String id;
        synchronized (webIds) {
            if (webIds.size() >= MAX_WEB) {
                return null;
            }
            id = UUID.randomUUID().toString();
            webIds.add(id);
        }

        try {
            File file = Files.createTempFile("red_black_node_visualizer_", ".html").toFile();
            writeHtml(treeStr, id, file);
            Desktop.getDesktop().browse(file.toURI());
        } catch (Exception exception) {
            closed(id);
            throw exception;
        }
        return id;
    }

    /**
     * Opens a webpage for visualizing red-black trees in the default web browser. The page has an input where you can
     * enter the string representation of the tree to visualize, as returned by "export".
     *
     * As a courtesy, this will only open up to a limited number of visualizations at once (per process). If we are at
     * this limit, the call to showInWebBrowser will have no effect. To stop counting a visualization towards this
     * limit, call "closed".
     * @return A unique string ID for the open visualization, which may later be passed to "closed". This returns null
     *     if we did not open the visualization due to reaching the limit.
     * @throws IOException If there was an I/O error, e.g. when reading or writing an HTML file or launching the web
     *     browser.
     * @throws UnsupportedOperationException If the Desktop.Action.BROWSE action is not supported in this environment.
     * @throws SecurityException If the action was prevented for security reasons, as in the Desktop.browse method.
     */
    public static String showInWebBrowser() throws IOException {
        return showInWebBrowser(null);
    }

    /**
     * Stops counting the open web browser visualization with the specified ID against the limit.
     *
     * As a courtesy, showInWebBrowser will only open up to a limited number of visualizations at once (per process).
     * The URL for a visualization has a "red_black_node_visualizer_id" query string parameter with the ID of the
     * visualization. If you're able to detect when a webpage is closed, you can check for this parameter and call
     * "closed" with its value. Alternatively, if you want to effectively bypass the visualization limit, you can call
     * "closed" immediately after calling showInWebBrowser.
     */
    public static void closed(String id) {
        synchronized (webIds) {
            webIds.remove(id);
        }
    }
}
