# Description
This is a library for viewing a
[RedBlackNode](https://github.com/btrekkie/RedBlackNode) tree using a web
interface. Here's an example:

<https://btrekkie.github.io/RedBlackNodeVisualizer/example-tree.html>

If you have already exported a red-black tree, you can view it here:

<https://btrekkie.github.io/RedBlackNodeVisualizer/tree.html>

This was created in order to help debug uses of `RedBlackNode`, but it could
also be used for instruction or learning.

# Features
* Visualize an arbitrary red-black tree in a webpage.
* Any errors in the tree reported by `RedBlackNode.assertSubtreeIsValid()` are
  highlighted.
* A red-black tree may be exported as a string and then visualized later.
* A visualization may also be exported as a stand-alone HTML file.
* Portions of the tree may be shown as collapsed subtree triangles. This makes
  it possible to view very large trees without a ton of clutter and without
  waiting a long time for the webpage to render.
* Each node can include an arbitrary debug string, such as the value stored in
  the node. The debug strings are shown in the tree's visualization.

# Example usage
```java
MyRedBlackNode foo(MyRedBlackNode root) {
    root.assertSubtreeIsValid();
    String before = RedBlackNodeVisualizer.export(root, "Before");

    root = doRiskyThings(root);

    try {
        root.assertSubtreeIsValid();
    } catch (RuntimeException e) {
        String after = RedBlackNodeVisualizer.export(root, "After");
        RedBlackNodeVisualizer.showInWebBrowser(before);
        RedBlackNodeVisualizer.showInWebBrowser(after);
        throw e;
    }
    return root;
}
```

# Documentation
See <https://btrekkie.github.io/RedBlackNodeVisualizer/index.html> for API
documentation.
