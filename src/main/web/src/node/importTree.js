import {Node} from './Node';

/**
 * Returns a Node object for the subtree encoded in the specified JSON object,
 * as in the string representation of a tree. This only sets the fields passed
 * to the Node constructor and the "left", "right", unsanitizedLeftId, and
 * unsanitizedRightId fields.
 * @param {Object} json The JSON object.
 * @param {Node} parent The node's parent, if any.
 * @return {Node} The node.
 */
function jsonToNode(json, parent) {
    let debugStr;
    if (json.d !== undefined) {
        debugStr = json.d;
    } else {
        debugStr = null;
    }
    let unsanitizedParentId;
    if (json.p !== undefined) {
        unsanitizedParentId = json.p;
    } else {
        unsanitizedParentId = null;
    }
    let nodeIsValidError;
    if (json.e !== undefined) {
        nodeIsValidError = json.e;
    } else {
        nodeIsValidError = null;
    }
    let subtreeIsValidError;
    if (json.se !== undefined) {
        subtreeIsValidError = json.se;
    } else {
        subtreeIsValidError = null;
    }
    const node = new Node({
        debugStr,
        hasUnsanitizedParentId: json.p !== undefined,
        isRed: json.c,
        nodeIsValidError,
        parent,
        subtreeIsValidError,
        unsanitizedParentId,
    });

    if (json.l !== undefined && json.l !== null) {
        if (typeof json.l === 'object') {
            node.left = jsonToNode(json.l, node);
        } else {
            node.unsanitizedLeftId = json.l;
        }
    }
    if (json.r !== undefined && json.r !== null) {
        if (typeof json.r === 'object') {
            node.right = jsonToNode(json.r, node);
        } else {
            node.unsanitizedRightId = json.r;
        }
    }
    return node;
}

/**
 * Sets the "id" fields of the Nodes in the tree rooted at the specified node.
 * @param {Node} root The root. This may not be null.
 * @return {Object} A map from the ID of each node in the tree to the Node.
 */
function setIds(root) {
    const nodes = {};
    let id = 0;
    for (let node = root.min(); node !== null; node = node.successor()) {
        node.id = id;
        nodes[id] = node;
        id++;
    }
    return nodes;
}

/**
 * Sets the unsanitizedParent, unsanitizedLeft, unsanitizedRight, and
 * isUnsanitizedParentInTree fields of the specified Node.
 * @param {Node} node The Node.
 * @param {Object} nodes A map from the ID of each node in the tree containing
 *     "node" to the Node.
 */
function setUnsanitizedPointers(node, nodes) {
    const parent = node.parent;
    if (!node.hasUnsanitizedParentId) {
        node.unsanitizedParent = parent;
        node.isUnsanitizedParentInTree = true;
    } else if (node.unsanitizedParentId !== null) {
        if (node.unsanitizedParentId >= 0) {
            node.unsanitizedParent = nodes[node.unsanitizedParentId];
            node.isUnsanitizedParentInTree = true;
        } else {
            node.unsanitizedParent = null;
            node.isUnsanitizedParentInTree = false;
        }
    } else {
        node.unsanitizedParent = null;
        node.isUnsanitizedParentInTree = true;
    }

    if (node.unsanitizedLeftId === null) {
        node.unsanitizedLeft = node.left;
    } else {
        node.unsanitizedLeft = nodes[node.unsanitizedLeftId];
    }
    if (node.unsanitizedRightId === null) {
        node.unsanitizedRight = node.right;
    } else {
        node.unsanitizedRight = nodes[node.unsanitizedRightId];
    }
}

/**
 * Sets the metadata fields of the specified Node that are computed from the
 * parent's metadata. A node's metadata are the data not set in jsonToNode or
 * setIds.
 */
function setMetadataFromParent(node) {
    const parent = node.parent;
    if (parent === null) {
        node.depth = 0;
        node.blackDepth = node.isRed ? 0 : 1;
    } else {
        node.depth = parent.depth + 1;
        node.blackDepth = parent.blackDepth + (node.isRed ? 0 : 1);
    }
}

/**
 * Sets the metadata fields of the specified Node that are computed from the
 * children's metadata, apart from those set in setErrorFlags. A node's metadata
 * are the data not set in jsonToNode or setIds.
 */
function setGeneralInfoFromChildren(node) {
    const left = node.left;
    const right = node.right;
    let size = 1;
    let height = 0;
    let blackHeight = node.isRed ? 0 : 1;
    let areBlackPathsEqual = true;
    if (left !== null) {
        size += left.size;
        height = left.height + 1;
        blackHeight = left.blackHeight + (node.isRed ? 0 : 1);
        if (!left.areBlackPathsEqual) {
            areBlackPathsEqual = false;
        }
    }
    if (right !== null) {
        size += right.size;
        height = Math.max(height, right.height + 1);
        blackHeight = Math.max(
            blackHeight, right.blackHeight + (node.isRed ? 0 : 1));
        if (!right.areBlackPathsEqual) {
            areBlackPathsEqual = false;
        }
    }
    node.size = size;
    node.height = height;
    node.blackHeight = blackHeight;
    node.areBlackPathsEqual =
        areBlackPathsEqual &&
        (left !== null ? left.blackHeight : 0) ===
        (right !== null ? right.blackHeight : 0);
}

/**
 * Sets the hasError, subtreeHasError, and useSubtreeIsValidError fields of the
 * specified Node.
 */
function setErrorFlags(node) {
    const parent = node.parent;
    const left = node.left;
    const right = node.right;
    let hasError =
        node.unsanitizedParent !== parent || !node.isUnsanitizedParentInTree ||
        node.unsanitizedLeft !== left || node.unsanitizedRight !== right ||
        (node.isRed && (parent === null || parent.isRed)) ||
        (parent === null && !node.areBlackPathsEqual) ||
        node.nodeIsValidError !== null;
    let subtreeHasError =
        hasError || (left !== null && left.subtreeHasError) ||
        (right !== null && right.subtreeHasError);

    node.useSubtreeIsValidError =
        parent === null && !subtreeHasError &&
        node.subtreeIsValidError !== null;
    if (node.useSubtreeIsValidError) {
        hasError = true;
        subtreeHasError = true;
    }
    node.hasError = hasError;
    node.subtreeHasError = subtreeHasError;
}

/**
 * Sets all of the fields of all of the Nodes in the subtree rooted at the
 * specified Node, apart from those set in jsonToNode and setIds.
 * @param {Node} node The Node.
 * @param {Object} nodes A map from the ID of each node in the tree containing
 *     "node" to the Node.
 */
function setMetadata(node, nodes) {
    setUnsanitizedPointers(node, nodes);
    setMetadataFromParent(node);

    if (node.left !== null) {
        setMetadata(node.left, nodes);
    }
    if (node.right !== null) {
        setMetadata(node.right, nodes);
    }

    setGeneralInfoFromChildren(node);
    setErrorFlags(node);
}

/**
 * Returns a representation of a tree that uses Nodes, given the JSON
 * representation of the tree. The return value has three entries:
 *
 * root: The root Node of the tree. This is null if the tree is just a dummy
 *     leaf node.
 * selectedNode: The Node to highlight initially, if this was specified.
 * title: The title text to display for the tree.
 *
 * @param {Object} json The JSON representation. This is the result of calling
 *     JSON.parse on the tree's string representation.
 * @return {Object} The Node-based representation.
 */
export function importTree(json) {
    const title = json.title || null;
    if (json.tree === null) {
        return {
            root: null,
            selectedNode: null,
            title,
        };
    }

    const root = jsonToNode(json.tree, null);
    const nodes = setIds(root);
    setMetadata(root, nodes);

    let selectedNode;
    if (json.selectedNode !== undefined && json.selectedNode !== null) {
        selectedNode = nodes[json.selectedNode];
    } else {
        selectedNode = null;
    }
    return {
        root,
        selectedNode,
        title: json.title || null,
    };
}
