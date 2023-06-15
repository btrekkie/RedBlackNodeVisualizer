/**
 * A node in a red-black tree. Dummy leaf nodes are represented as null.
 *
 * All of the fields enumerated below are computed after constructing the Node
 * object, and are null prior to being set.
 */
export class Node {
    // The Node object for the node's left child
    left = null;

    // The Node object for the node's right child
    right = null;

    // The ID of the node's left child in the original tree, before it was
    // sanitized, or null if this is the same as the ID of the left child in the
    // sanitized tree. This is a negative number if the original left child does
    // not appear in the sanitized tree.
    unsanitizedLeftId = null;

    // The ID of the node's right child in the original tree, before it was
    // sanitized, or null if this is the same as the ID of the right child in
    // the sanitized tree. This is a negative number if the original right child
    // does not appear in the sanitized tree.
    unsanitizedRightId = null;

    // The Node object for the node's parent in the original tree, before it was
    // sanitized, if any. This is null if the original parent does not appear in
    // the sanitized tree.
    unsanitizedParent = null;

    // The Node object for the node's left child in the original tree, before it
    // was sanitized.
    unsanitizedLeft = null;

    // The Node object for the node's right child in the original tree, before
    // it was sanitized.
    unsanitizedRight = null;

    // Whether the sanitized tree contains the node's parent in the original
    // (unsanitized) tree. If the node had no parent in the original tree, this
    // is true.
    isUnsanitizedParentInTree = null;


    // The node's "ID". This is equal to the node's rank, i.e. the number of
    // nodes that come before the node in the tree that contains it.
    id = null;

    // The number of nodes in the subtree rooted at this node
    size = null;

    // The node's depth, i.e. the number of edges in the path from the node to
    // the root
    depth = null;

    // The node's height, i.e. the maximum number of edges in a path from the
    // node to a non-dummy leaf node
    height = null;

    // The node's black depth, i.e. the number of black nodes in the path from
    // the node to the root
    blackDepth = null;

    // The node's black height, i.e. the maximum number of black nodes in a path
    // from the node down to a dummy leaf node, excluding the dummy leaf node.
    blackHeight = null;

    // Whether all paths from the node down to a dummy leaf node have the same
    // number of black nodes
    areBlackPathsEqual = null;

    // Whether there is an error with this node. The possible errors are as
    // follows:
    //
    // - unsanitizedParent !== parent, unsanitizedLeft !== left, or
    //   unsanitizedRight !== right
    // - isUnsanitizedParentInTree is false
    // - A red root node
    // - A red child of a red node
    // - areBlackPathsEqual is false, and this is the root node
    // - nodeIsValidError !== null
    // - subtreeIsValidError !== null && useSubtreeIsValidError
    hasError = null;

    // Whether hasError is true for any node in the subtree rooted at this node
    subtreeHasError = null;

    // Whether to include subtreeIsValidError in the list of the node's errors
    useSubtreeIsValidError = null;

    /**
     * Constructs a new Node.
     * @param {string} debugStr The node's debug string, if any.
     * @param {boolean} hasUnsanitizedParentId Whether the node's parent in the
     *     original tree differs from its parent in the sanitized tree.
     * @param {boolean} isRed Whether the node is colored red.
     * @param {string} nodeIsValidError The error emitted by the Java method
     *     RedBlackNode.assertNodeIsValid(), if any. This is null if the tree is
     *     not a valid red-black tree, as in
     *     RedBlackNode.assertSubtreeIsValidRedBlack(), because in that case, we
     *     are not permitted to call assertNodeIsValid().
     * @param {Node} parent The node's parent, if any.
     * @param {string} subtreeIsValidError The error emitted by the Java method
     *     RedBlackNode.assertSubtreeIsValid(), if this method was called and
     *     emitted an error.
     * @param {int} unsanitizedParentId The ID of the node's parent in the
     *     original tree, before it was sanitized, if this differs from that of
     *     the sanitized tree. This is null if the original parent was null or
     *     does not appear in the sanitized tree.
     */
    constructor({
        debugStr,
        hasUnsanitizedParentId,
        isRed,
        nodeIsValidError,
        parent,
        subtreeIsValidError,
        unsanitizedParentId,
    }) {
        this.debugStr = debugStr;
        this.hasUnsanitizedParentId = hasUnsanitizedParentId;
        this.isRed = isRed;
        this.nodeIsValidError = nodeIsValidError;
        this.parent = parent;
        this.subtreeIsValidError = subtreeIsValidError;
        this.unsanitizedParentId = unsanitizedParentId;
    }

    /** Returns the first Node in the subtree rooted at this node. */    
    min() {
        let node;
        for (node = this; node.left !== null; node = node.left);
        return node;
    }

    /**
     * Returns the Node immediately after this in the tree that contains this
     * node, if any.
     */
    successor() {
        if (this.right !== null) {
            let node;
            for (node = this.right; node.left !== null; node = node.left);
            return node;
        } else if (this.parent === null) {
            return null;
        } else {
            let node;
            for (node = this;
                    node.parent !== null && node.parent.right === node;
                    node = node.parent);
            return node.parent;
        }
    }
}
