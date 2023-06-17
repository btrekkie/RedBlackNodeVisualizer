import classnames from 'classnames';
import React, {useCallback, useEffect, useRef} from 'react';
import {ErrorIcon} from './ErrorIcon';
import './Subtree.css';

// The number of milliseconds between when the user starts hovering over a node
// and when we select the node. The purpose of this delay is to make it possible
// to move the cursor to the node info pane without changing the selected node
// or dodging all of the non-selected nodes.
const HOVER_SELECT_MS = 250;

// The number of milliseconds after the user clicks and holds an expanded node
// that we highlight the node. The purpose of the click and hold feature is to
// provide an alternative to hovering over a node for mobile devices.
const CLICK_AND_HOLD_SELECT_MS = 600;

// The horizontal distance from the left edge of an expanded node to the node's
// "anchor," as in Subtree.props.scrollToNode.
const NODE_ANCHOR_X = 20;

// The vertical distance from the top edge of an expanded node to the node's
// "anchor," as in Subtree.props.scrollToNode.
const NODE_ANCHOR_Y = 20;

// The horizontal distance from the left edge of a collaped subtree to the
// node's "anchor," as in Subtree.props.scrollToNode.
const COLLAPSED_SUBTREE_ANCHOR_X = 30;

// The vertical distance from the top edge of a collaped subtree to the node's
// "anchor," as in Subtree.props.scrollToNode.
const COLLAPSED_SUBTREE_ANCHOR_Y = 1;

/** Returns a short text representation of the specified integer. */
function prettyPrintInt(value) {
    if (value < 10000) {
        return value;
    } else if (value < 1000000) {
        return `${Math.floor(value / 1000)}K`;
    } else if (value < 10000000) {
        return `${Math.floor(value / 100000) / 10}M`;
    } else if (value < 1000000000) {
        return `${Math.floor(value / 1000000)}M`;
    } else if (value < 10000000000) {
        return `${Math.floor(value / 100000000) / 10}B`;
    } else if (value < 100000000000) {
        return `${Math.floor(value / 1000000000)}B`;
    } else {
        return '99B+';
    }
}

/**
 * Renders the subtree rooted at the specified Node. Nodes may be collapsed in
 * order to hide their subtrees.
 * @param {Object} expandedNodeIds A map from the IDs of the non-leaf nodes
 *     whose subtrees are currently expanded to true. Leaf nodes are always
 *     taken to be expanded, even though they do not appear in expandedNodeIds.
 *     Note that it is possible for a node to be collapsed and for one of its
 *     descendants to be expanded. In this case, the descendant will become
 *     visible if all of its ancestors are later expanded.
 * @param {Node} node The Node.
 * @param {function} scrollToNode Scrolls to "node" after having just expanded
 *     or collapsed the node and then rerendered the node. This takes three
 *     arguments: the node's DOM element, the horizontal distance from the left
 *     edge of the node to its anchor, and the vertical distance from the top
 *     edge of the node to its anchor.
 *
 *     A node's "anchor" is the point in the node that is connected to its
 *     parent. In the case of an expanded node, this could be the center of the
 *     node. In the case fo a collapsed subtree, this could be the triangle's
 *     top vertex.
 * @param {function} selectNode Sets the node that the user wishes to highlight.
 *     This takes one argument: the Node.
 * @param {function} setIsExpanded Sets whether a non-leaf node is expanded.
 *     This takes five arguments: the node's ID, whether it is expanded, the
 *     node's DOM element, the horizontal distance from the left edge of the
 *     node to its "anchor" as in scrollToNode, and the vertical distance from
 *     the top edge of the node to its anchor.
 * @param {function} setSelectedElement Gives information about the DOM element
 *     for a node after it is selected. If node === selectedNode, then after the
 *     node is rendered, this is called with three arguments: the node's DOM
 *     element, the horizontal distance from the left edge of the node to its
 *     "anchor" as in scrollToNode, and the vertical distance from the top edge
 *     of the node to its anchor.
 */
export function Subtree({
    expandedNodeIds,
    node,
    scrollToNode,
    selectNode,
    selectedNode,
    setIsExpanded,
    setSelectedElement,
}) {
    // The node's DOM element (the node circle or collaped subtree triangle)
    const nodeElement = useRef(null);

    // The ID of the timer for waiting until the user has hovered over the node
    // for HOVER_SELECT_MS, if any. This is null if the node is collapsed.
    const hoverTimerId = useRef(null);

    // The ID of the timer for waiting until the user has clicked and held the
    // node for CLICK_AND_HOLD_SELECT_MS, if any. This is null if the node is
    // collapsed.
    const clickAndHoldTimerId = useRef(null);

    // Whether the last time the user started clicking the node, he clicked and
    // held for at least CLICK_AND_HOLD_SELECT_MS. This is unspecified if the
    // node is collapsed.
    const isClickAndHold = useRef(false);

    /**
     * Returns whether the specified node's subtree is expanded.
     * @param {Node} node The node.
     * @param {Object} expandedNodeIds A map from the IDs of the non-leaf nodes
     *     whose subtrees are currently expanded to true. Leaf nodes are always
     *     taken to be expanded, even though they do not appear in
     *     expandedNodeIds.
     * @return {boolean} Whether the node is expanded.
     */
    const getIsExpanded = useCallback((node, expandedNodeIds) => {
        return expandedNodeIds[node.id] ||
            (node.left === null && node.right === null);
    }, []);

    // Whether "node" was expanded the last time the Subtree was rendered
    const wasExpanded = useRef(getIsExpanded(node, expandedNodeIds));

    // Clears hoverTimerId and clickAndHoldTimerId by stopping any running
    // timers and setting them to null.
    const clearTimers = useCallback(() => {
        if (hoverTimerId.current !== null) {
            clearTimeout(hoverTimerId.current);
            hoverTimerId.current = null;
        }
        if (clickAndHoldTimerId.current !== null) {
            clearTimeout(clickAndHoldTimerId.current);
            clickAndHoldTimerId.current = null;
        }
    }, []);

    useEffect(() => clearTimers, [clearTimers]);

    useEffect(() => {
        const isExpanded = getIsExpanded(node, expandedNodeIds);
        if (isExpanded !== wasExpanded.current) {
            wasExpanded.current = isExpanded;
            if (isExpanded) {
                scrollToNode(nodeElement.current, NODE_ANCHOR_X, NODE_ANCHOR_Y);
            } else {
                scrollToNode(
                    nodeElement.current,
                    COLLAPSED_SUBTREE_ANCHOR_X, COLLAPSED_SUBTREE_ANCHOR_Y);
            }
        }
    }, [node, expandedNodeIds, getIsExpanded, scrollToNode]);

    useEffect(() => {
        if (node === selectedNode) {
            setSelectedElement(
                nodeElement.current, NODE_ANCHOR_X, NODE_ANCHOR_Y);
        }
    }, [node, selectedNode, setSelectedElement]);

    /**
     * Responds to the user clicking on the node element. This assumes that
     * "node" is expanded.
     */
    function handleNodeClick() {
        if (!isClickAndHold.current) {
            if (node.left !== null || node.right !== null) {
                setIsExpanded(
                    node.id, false, nodeElement.current,
                    NODE_ANCHOR_X, NODE_ANCHOR_Y);
            }
            clearTimers();
        }
    }

    /**
     * Responds to the user clicking on the collapsed subtree element. This
     * assumes that "node" is collapsed.
     */
    function handleCollapsedSubtreeClick() {
        setIsExpanded(
            node.id, true, nodeElement.current,
            COLLAPSED_SUBTREE_ANCHOR_X, COLLAPSED_SUBTREE_ANCHOR_Y);
    }

    /**
     * Responds to the mouse entering the node element. This assumes that "node"
     * is expanded.
     */
    function handleNodeMouseEnter() {
        hoverTimerId.current = setTimeout(() => {
            hoverTimerId.current = null;
            selectNode(node);
        }, HOVER_SELECT_MS);
    }

    /**
     * Responds to the mouse leaving the node element. This assumes that "node"
     * is expanded.
     */
    function handleNodeMouseLeave() {
        isClickAndHold.current = false;
        clearTimers();
    }

    /**
     * Responds to the mouse pressing down over the node element. This assumes
     * that "node" is expanded.
     */
    function handleNodeMouseDown() {
        isClickAndHold.current = false;
        clickAndHoldTimerId.current = setTimeout(() => {
            isClickAndHold.current = true;
            selectNode(node);
            clickAndHoldTimerId.current = null;
            clearTimers();
        }, CLICK_AND_HOLD_SELECT_MS);
    }

    const isExpanded = getIsExpanded(node, expandedNodeIds);
    return (
        <div
            className={classnames('Subtree', {
                'Subtree--collapsed': !isExpanded,
                'Subtree--has-error': node.hasError,
                'Subtree--root': node.parent === null,
            })}
        >
            <div className="Subtree__subtree-column">
                <div className="Subtree__edge">
                    {(node.parent !== null && node.parent.right === node) ? (
                        <div className="Subtree__edge-up-left" />
                    ) : null}
                </div>
                {(isExpanded && node.left !== null) ? (
                    <Subtree
                        expandedNodeIds={expandedNodeIds}
                        node={node.left}
                        scrollToNode={scrollToNode}
                        selectNode={selectNode}
                        selectedNode={selectedNode}
                        setIsExpanded={setIsExpanded}
                        setSelectedElement={setSelectedElement}
                    />
                ) : null}
            </div>
            <div className="Subtree__node-column">
                {isExpanded ? (
                    <>
                        {node.hasError ? (
                            <div className="Subtree__node-error">
                                <ErrorIcon />
                            </div>
                        ) : null}
                        <div
                            className={classnames('Subtree__node', {
                                'Subtree__node--black': !node.isRed,
                                'Subtree__node--red': node.isRed,
                                'Subtree__node--selected':
                                    node === selectedNode,
                            })}
                            onClick={handleNodeClick}
                            onMouseDown={handleNodeMouseDown}
                            onMouseEnter={handleNodeMouseEnter}
                            onMouseLeave={handleNodeMouseLeave}
                            ref={nodeElement}
                            role="button"
                        >
                            <div className="Subtree__node__text">
                                #
                                {prettyPrintInt(node.id)}
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        className="Subtree__collapsed-subtree"
                        onClick={handleCollapsedSubtreeClick}
                        ref={nodeElement}
                        role="button"
                    >
                        <svg
                            className="Subtree__collapsed-subtree__triangle"
                            height={70}
                            width={60}
                        >
                            <polygon
                                fill="#c0c0c0"
                                points="30,1 59,69 1,69"
                                stroke="#000"
                                strokeWidth={2}
                            />
                        </svg>
                        {node.subtreeHasError ? (
                            <div className="Subtree__collapsed-subtree__error">
                                <ErrorIcon />
                            </div>
                        ) : null}
                        <div className="Subtree__collapsed-subtree__text">
                            {prettyPrintInt(node.size)}
                            <br />
                            nodes
                        </div>
                    </div>
                )}
            </div>
            <div className="Subtree__subtree-column">
                <div className="Subtree__edge">
                    {(node.parent !== null && node.parent.left === node) ? (
                        <div className="Subtree__edge-up-right" />
                    ) : null}
                </div>
                {(isExpanded && node.right !== null) ? (
                    <Subtree
                        expandedNodeIds={expandedNodeIds}
                        node={node.right}
                        scrollToNode={scrollToNode}
                        selectNode={selectNode}
                        selectedNode={selectedNode}
                        setIsExpanded={setIsExpanded}
                        setSelectedElement={setSelectedElement}
                    />
                ) : null}
            </div>
        </div>
    );
}
