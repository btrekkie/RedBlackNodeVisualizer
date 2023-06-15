package com.github.btrekkie.red_black_node_visualizer.test;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

import com.github.btrekkie.red_black_node_visualizer.DebugStringGetter;
import com.github.btrekkie.red_black_node_visualizer.RedBlackNodeVisualizer;

public class RedBlackNodeVisualizerTest {
    /** Tests RedBlackNodeVisualizer.export with simple trees. */
    @Test
    public void testBasic() {
        RedBlackNodeVisualizer.export(TestNode.leaf);
        TestNode node1 = new TestNode(7);
        node1.left = TestNode.leaf;
        node1.right = TestNode.leaf;
        node1.sum = 7;
        RedBlackNodeVisualizer.export(node1, "Foo");

        TestNode node2 = new TestNode(6);
        node1.left = node2;
        node2.parent = node1;
        node2.left = TestNode.leaf;
        node2.right = TestNode.leaf;
        node2.isRed = true;
        node2.sum = 6;
        node1.sum = 13;
        RedBlackNodeVisualizer.export(node1);
        RedBlackNodeVisualizer.export(node2, "Bar");
    }

    /** Tests RedBlackNodeVisualizer.export with simple trees that violate the red-black properties. */
    @Test
    public void testBasicRedBlackErrors() {
        TestNode node1 = new TestNode();
        node1.isRed = true;
        RedBlackNodeVisualizer.export(node1);
        node1.left = TestNode.leaf;
        node1.right = TestNode.leaf;
        RedBlackNodeVisualizer.export(node1);

        TestNode node2 = new TestNode();
        node1.left = node2;
        node2.parent = node1;
        node2.left = TestNode.leaf;
        node2.right = TestNode.leaf;
        node2.isRed = true;
        RedBlackNodeVisualizer.export(node2, "Foo");
        node1.isRed = false;
        node2.isRed = false;
        RedBlackNodeVisualizer.export(node1);

        TestNode node3 = new TestNode();
        node2.right = node3;
        node3.parent = node2;
        node3.left = TestNode.leaf;
        node3.right = TestNode.leaf;
        node2.isRed = true;
        node3.isRed = true;
        RedBlackNodeVisualizer.export(node3);
    }

    /**
     * Tests RedBlackNodeVisualizer.export with simple trees that have repeated nodes or nodes whose children's "parent"
     * pointers are not equal to the nodes.
     */
    @Test
    public void testBasicPointerErrors() {
        TestNode node1 = new TestNode();
        node1.left = TestNode.leaf;
        node1.right = node1;
        RedBlackNodeVisualizer.export(node1);
        node1.right = TestNode.leaf;
        node1.parent = node1;
        RedBlackNodeVisualizer.export(node1);

        TestNode node2 = new TestNode();
        TestNode node3 = new TestNode();
        TestNode node4 = new TestNode();
        node1.parent = null;
        node1.left = node2;
        node1.right = node3;
        node2.parent = node1;
        node2.left = TestNode.leaf;
        node2.right = node4;
        node3.parent = node1;
        node3.left = node4;
        node3.right = TestNode.leaf;
        node4.parent = node2;
        node4.left = TestNode.leaf;
        node4.right = TestNode.leaf;
        node4.isRed = true;
        RedBlackNodeVisualizer.export(node1);
        RedBlackNodeVisualizer.export(node4);
        node2.right = TestNode.leaf;
        node3.right = node4;
        node4.parent = node3;
        RedBlackNodeVisualizer.export(node2);

        TestNode node5 = new TestNode();
        TestNode node6 = new TestNode();
        node5.parent = node6;
        node5.left = TestNode.leaf;
        node5.right = TestNode.leaf;
        node6.parent = node5;
        node6.left = TestNode.leaf;
        node6.right = TestNode.leaf;
        RedBlackNodeVisualizer.export(node5);
        node5.parent = null;
        node5.right = node6;
        node6.left = node5;
        node6.isRed = true;
        RedBlackNodeVisualizer.export(node5);
    }

    /** Tests RedBlackNodeVisualizer.export with simple trees for which assertNodeIsValid() throws an exception. */
    @Test
    public void testBasicNodeIsValidError() {
        TestNode node1 = new TestNode(18);
        node1.left = TestNode.leaf;
        node1.right = TestNode.leaf;
        node1.sum = 4;
        RedBlackNodeVisualizer.export(node1);

        TestNode node2 = new TestNode(42);
        node1.right = node2;
        node2.parent = node1;
        node2.left = TestNode.leaf;
        node2.right = TestNode.leaf;
        node2.isRed = true;
        node2.sum = 42;
        node1.sum = -60;
        RedBlackNodeVisualizer.export(node1);

        TestNode leaf = new TestNode();
        leaf.sum = 10;
        node1.sum = 70;
        node2.sum = 52;
        node2.left = leaf;
        RedBlackNodeVisualizer.export(node2);
    }

    /**
     * Tests RedBlackNodeVisualizer.export with a simple tree for which assertSubtreeIsValid() throws an exception in
     * the TestNode class, but not in its superclass (super.assertSubtreeIsValid()).
     */
    @Test
    public void testBasicSubtreeIsValidError() {
        TestNode node1 = new TestNode(25);
        TestNode node2 = new TestNode(36);
        node1.left = node2;
        node1.right = TestNode.leaf;
        node1.sum = 61;
        node2.parent = node1;
        node2.left = TestNode.leaf;
        node2.right = TestNode.leaf;
        node2.isRed = true;
        node2.sum = 36;
        RedBlackNodeVisualizer.export(node1);
    }

    /**
     * Tests RedBlackNodeVisualizer.export with simple trees that have leaf nodes with invalid parent, left, right, or
     * isRed fields.
     */
    @Test
    public void testBasicLeafErrors() {
        TestNode node1 = new TestNode();
        TestNode node2 = new TestNode();
        node1.right = node2;
        node2.parent = node1;
        node2.left = TestNode.leaf;
        node2.right = TestNode.leaf;
        node2.isRed = true;
        RedBlackNodeVisualizer.export(node1);

        TestNode node3 = new TestNode();
        node1.left = TestNode.leaf;
        node2.left = node3;
        node2.right = null;
        node2.isRed = false;
        node3.parent = node2;
        node3.left = TestNode.leaf;
        node3.right = TestNode.leaf;
        RedBlackNodeVisualizer.export(node1);

        node2.left = null;
        node2.right = node3;
        RedBlackNodeVisualizer.export(node1);
        node2.right = null;
        RedBlackNodeVisualizer.export(node1);
        node2.parent = null;
        node2.isRed = true;
        RedBlackNodeVisualizer.export(node1);
    }

    /** Tests RedBlackNodeVisualizer.export with trees that have a lot of nodes. */
    @Test
    public void testLarge() {
        List<TestNode> nodes = new ArrayList<TestNode>(1000);
        for (int i = 0; i < 1000; i++) {
            nodes.add(new TestNode(i));
        }
        TestNode root = TestNode.createTree(nodes, TestNode.leaf);
        RedBlackNodeVisualizer.export(root);
        RedBlackNodeVisualizer.export(nodes.get(0), "Large");
        RedBlackNodeVisualizer.export(nodes.get(0), new DebugStringGetter<TestNode>() {
            @Override
            public String getDebugString(TestNode node) {
                return "Value: " + node.value + "\nSum: " + node.sum;
            }
        });

        for (TestNode node : nodes) {
            if (node.isRed) {
                node.isRed = false;
                break;
            }
        }
        RedBlackNodeVisualizer.export(root);
    }

    /** Tests RedBlackNodeVisualizer.export with a simple tree when passing in DebugStringGetters. */
    @Test
    public void testBasicDebugString() {
        TestNode node1 = new TestNode(14);
        TestNode node2 = new TestNode(17);
        node1.left = TestNode.leaf;
        node1.right = node2;
        node1.sum = 31;
        node2.parent = node1;
        node2.left = TestNode.leaf;
        node2.right = TestNode.leaf;
        node2.isRed = true;
        node2.sum = 17;
        RedBlackNodeVisualizer.export(node1, new DebugStringGetter<TestNode>() {
           @Override
            public String getDebugString(TestNode node) {
                return "Value: " + node.value + "\nSum: " + node.sum;
            }
        });
        RedBlackNodeVisualizer.export(node2, "With debug strings", new DebugStringGetter<TestNode>() {
            @Override
            public String getDebugString(TestNode node) {
                if (node.value == 14) {
                    return null;
                } else {
                    return "Foo\n\t\r\\ \u1234\u2345";
                }
            }
        });
    }
}
