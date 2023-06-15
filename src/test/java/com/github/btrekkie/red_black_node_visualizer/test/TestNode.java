package com.github.btrekkie.red_black_node_visualizer.test;

import com.github.btrekkie.red_black_node.RedBlackNode;

/**
 * A RedBlackNode to use for testing. Each node has an integer value and stores the sum of the values in its subtree. A
 * tree stores nodes in ascending order of value. These properties are checked in assertNodeIsValid() and
 * assertSubtreeIsValid().
 */
public class TestNode extends RedBlackNode<TestNode> {
    /** The dummy leaf node. */
    public static final TestNode leaf = new TestNode();

    public final int value;

    /** The sum of the values stored in the subtree rooted at this node. */
    public int sum;

    public TestNode(int value) {
        this.value = value;
    }

    /** Constructs a new TestNode with a value of 0. */
    public TestNode() {
        value = 0;
    }

    @Override
    public boolean augment() {
        int newSum = left.sum + right.sum + value;
        if (newSum == sum) {
            return false;
        } else {
            sum = newSum;
            return true;
        }
    }

    @Override
    public int compareTo(TestNode other) {
        return Integer.compare(value, other.value);
    }

    @Override
    public void assertNodeIsValid() {
        if (isLeaf()) {
            if (sum != 0) {
                throw new RuntimeException("sum is wrong");
            }
        } else if (sum != left.sum + right.sum + value) {
            throw new RuntimeException("sum is wrong");
        }
    }

    @Override
    public void assertSubtreeIsValid() {
        super.assertSubtreeIsValid();
        assertOrderIsValid(null);
    }
}
