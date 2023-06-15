import classnames from 'classnames';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {importTree} from '../../node';
import {NodeInfo} from './NodeInfo';
import {Subtree} from './Subtree';
import './Visualizer.css';

/**
 * Adds all of the nodes in the subtree rooted at the specified Node whose nodes
 * are at depth maxDepth or less to the "nodes" array.
 */
function addNodesAtMaxDepth(node, maxDepth, nodes) {
    if (node.depth <= maxDepth) {
        nodes.push(node);
        if (node.left !== null) {
            addNodesAtMaxDepth(node.left, maxDepth, nodes);
        }
        if (node.right !== null) {
            addNodesAtMaxDepth(node.right, maxDepth, nodes);
        }
    }
}

/**
 * Renders a visualization for the specified tree, including rendering the tree
 * and an info pane.
 * @param {function} editTree Responds to the user selecting to change the tree
 *     we are visualizing.
 * @param {boolean} isInitialized Whether we can render the tree. If this is
 *     false, we render dummy content instead of the tree.
 * @param {function} setIsInitialized Indicates that we can render the tree,
 *     rather than having to render dummy content.
 * @param {Object} treeJson The JSON representation of the tree. This is the
 *     result of calling JSON.parse on the tree's string representation.
 */
export function Visualizer({
    editTree,
    isInitialized,
    setIsInitialized,
    treeJson,
}) {
    // The DOM element for the tree's scroll container
    const scrollElement = useRef(null);

    // The DOM element for the scrollable contents of scrollElement
    const scrollContentElement = useRef(null);

    // The "anchor" for the element we are currently expanding or collapsing, if
    // any. This has entries for "x", the horizontal distance from the left edge
    // of scrollContentElement to the anchor, and "y", the vertical distance
    // from the top edge to the anchor. See the comments for
    // Subtree.props.scrollToNode.
    const expandCollapseElementAnchor = useRef(null);

    // The "anchor" for selectedNode, if any. This has entries for "x", the
    // horizontal distance from the left edge of scrollContentElement to the
    // anchor, and "y", the vertical distance from the top edge to the anchor.
    // See the comments for Subtree.props.scrollToNode.
    const selectedElementAnchor = useRef(null);

    // Whether to scroll to selectedNode once we obtain its "anchor." See the
    // comments for Subtree.props.scrollToNode.
    const shouldScrollToSelectedNode = useRef(false);

    // The title text to display for the tree
    const [title, setTitle] = useState(null);

    // The tree's root Node. This is null prior to initialization.
    const [root, setRoot] = useState(null);

    // The Node that is currently highlighted, if any
    const [selectedNode, setSelectedNode] = useState(null);

    // A map from the IDs of the non-leaf nodes whose subtrees are currently
    // expanded to true. Leaf nodes are always taken to be expanded, even though
    // they do not appear in expandedNodeIds.
    const [expandedNodeIds, setExpandedNodeIds] = useState({});

    useEffect(() => {
        if (title !== null) {
            document.title = `RedBlackNode visualizer - ${title}`;
        } else {
            document.title = 'RedBlackNode visualizer';
        }
    }, [title]);

    /**
     * Returns the IDs of the non-leaf nodes to initially expand, as in
     * expandedNodeIds.
     * @param {Node} root The root node.
     * @param {Node} selectedNode The node that is initially highlighted, if
     *     any.
     * @return {Object} The expanded node IDs.
     */
    const initialExpandedNodesIds = useCallback(
        (root, selectedNode) => {
            const expandedNodeIds = {};
            if (root !== null) {
                if (selectedNode !== root) {
                    if (selectedNode.left !== null ||
                            selectedNode.right !== null) {
                        expandedNodeIds[selectedNode.id] = true;
                    }
                    for (let node = selectedNode.parent; node !== null;
                            node = node.parent) {
                        expandedNodeIds[node.id] = true;
                    }
                } else {
                    const nodes = [];
                    addNodesAtMaxDepth(root, 2, nodes);
                    nodes.forEach(node => {
                        if (node.left !== null || node.right !== null) {
                            expandedNodeIds[node.id] = true;
                        }
                    });
                }
            }
            return expandedNodeIds;
        }, []);

    useEffect(
        () => {
            const {
                root,
                selectedNode: treeSelectedNode,
                title,
            } = importTree(treeJson);
            setTitle(title);
            setRoot(root);

            const initialSelectedNode = treeSelectedNode || root;
            setSelectedNode(initialSelectedNode);
            setExpandedNodeIds(
                initialExpandedNodesIds(root, initialSelectedNode));
            setIsInitialized();
        }, [
            treeJson, initialExpandedNodesIds, setSelectedNode,
            setExpandedNodeIds, setIsInitialized
        ]);

    /** Highlights the specified Node. */
    function selectNode(newSelectedNode) {
        setSelectedNode(newSelectedNode);
        setExpandedNodeIds((expandedNodeIds) => {
            const newExpandedNodeIds = {...expandedNodeIds};
            if (newSelectedNode.left !== null ||
                    newSelectedNode.right !== null) {
                newExpandedNodeIds[newSelectedNode.id] = true;
            }
            for (let node = newSelectedNode.parent; node !== null;
                    node = node.parent) {
                newExpandedNodeIds[node.id] = true;
            }
            return newExpandedNodeIds;
        });
    }

    /**
     * Highlights the specified node, and scrolls to it once we obtain its
     * "anchor." See the comments for Subtree.props.scrollToNode.
     */
    function selectAndScrollToNode(newSelectedNode) {
        selectNode(newSelectedNode);
        shouldScrollToSelectedNode.current = true;
    }

    /**
     * Returns a node's "anchor". The return value has entries for "x", the
     * horizontal distance from the left edge of scrollContentElement to the
     * anchor, and "y", the vertical distance from the top edge to the anchor.
     * See the comments for Subtree.props.scrollToNode.
     * @param {Object} element The node's DOM element.
     * @param {number} anchorX The horizontal distance from the left edge of
     *     "element" to the anchor.
     * @param {number} anchorY The vertical distance from the top edge of
     *     "element" to the anchor.
     */
    function elementAnchor(element, anchorX, anchorY) {
        const elementRect = element.getBoundingClientRect();
        const scrollRect = scrollContentElement.current.getBoundingClientRect();
        return {
            x: elementRect.x + anchorX - scrollRect.x,
            y: elementRect.y + anchorY - scrollRect.y,
        };
    }

    /** Sets whether a node is expanded, as in Subtree.props.setIsExpanded. */
    function setNodeIsExpanded(
            nodeId, isExpanded, expandCollapseElement, anchorX, anchorY) {
        expandCollapseElementAnchor.current = elementAnchor(
            expandCollapseElement, anchorX, anchorY);
        setExpandedNodeIds((expandedNodeIds) => {
            const newExpandedNodeIds = {...expandedNodeIds};
            if (isExpanded) {
                newExpandedNodeIds[nodeId] = true;
            } else {
                delete newExpandedNodeIds[nodeId];
            }
            return newExpandedNodeIds;
        });

        if (!isExpanded) {
            setSelectedNode(selectedNode => {
                for (let node = selectedNode; node !== null;
                        node = node.parent) {
                    if (node.id === nodeId) {
                        return null;
                    }
                }
                return selectedNode;
            });
        }
    }

    /**
     * Scrolls scrollElement to a new anchor point. This makes it so that
     * "anchor" is displayed in the same position as prevAnchor was (or as close
     * as possible, if prevAnchor is too close to the edge of the scrollable
     * content to achieve this). "anchor" and prevAnchor have entries for "x",
     * the horizontal distance from the left edge of scrollContentElement to the
     * anchors, and "y", the vertical distance from the top edge to the anchors.
     */
    function scrollToAnchor(anchor, prevAnchor) {
        scrollElement.current.scroll(
            scrollElement.current.scrollLeft + anchor.x - prevAnchor.x,
            scrollElement.current.scrollTop + anchor.y - prevAnchor.y);
    }

    /**
     * Scrolls to a node after having just expanded or collapsed it, as in
     * Subtree.props.scrollToNode.
     */
    function scrollToNode(expandCollapseElement, anchorX, anchorY) {
        if (expandCollapseElementAnchor.current !== null) {
            const anchor = elementAnchor(
                expandCollapseElement, anchorX, anchorY);
            scrollToAnchor(anchor, expandCollapseElementAnchor.current);
            expandCollapseElementAnchor.current = null;
        }
    }

    /**
     * Gives information about the DOM element for a node after it is selected,
     * as in Subtree.props.setSelectedElement.
     */
    function setSelectedElement(selectedElement, anchorX, anchorY) {
        const anchor = elementAnchor(selectedElement, anchorX, anchorY);
        if (shouldScrollToSelectedNode.current) {
            scrollToAnchor(anchor, selectedElementAnchor.current);
            shouldScrollToSelectedNode.current = false;
        }
        selectedElementAnchor.current = anchor;
    }

    if (!isInitialized) {
        return null;
    }
    return (
        <div className="Visualizer">
            <div className="Visualizer__node-info-container">
                <NodeInfo
                    editTree={editTree}
                    node={selectedNode}
                    root={root}
                    setNode={selectAndScrollToNode}
                />
            </div>
            <div className="Visualizer__tree-container" ref={scrollElement}>
                <div
                    className={classnames('Visualizer__tree', {
                        'Visualizer__tree--empty': root === null,
                    })}
                    ref={scrollContentElement}
                >
                    {title !== null ? (
                        <div className="Visualizer__title">{title}</div>
                    ) : null}
                    {root !== null ? (
                        <Subtree
                            expandedNodeIds={expandedNodeIds}
                            node={root}
                            scrollToNode={scrollToNode}
                            selectNode={selectNode}
                            selectedNode={selectedNode}
                            setIsExpanded={setNodeIsExpanded}
                            setSelectedElement={setSelectedElement}
                        />
                    ) : 'leaf'}
                </div>
            </div>
        </div>
    );
}
