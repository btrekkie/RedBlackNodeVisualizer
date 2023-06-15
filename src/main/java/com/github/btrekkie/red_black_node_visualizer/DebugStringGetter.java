package com.github.btrekkie.red_black_node_visualizer;

import com.github.btrekkie.red_black_node.RedBlackNode;

/**
 * Computes debug strings for RedBlackNodes.
 * @param <N> The type of the RedBlackNodes.
 */
public interface DebugStringGetter<N extends RedBlackNode<?>> {
    /** Returns the debug string for the specified node, or null if it does not have one. */
    public String getDebugString(N node);
}
