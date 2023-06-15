import classnames from 'classnames';
import React, {useEffect, useState} from 'react';
import {Button} from '../Button';
import {InlineCode} from '../Text';
import {ErrorIcon} from './ErrorIcon';
import './NodeInfo.css';

/**
 * Renders a pane displaying information about a particular Node.
 * @param {function} editTree Responds to the user selecting to change the tree
 *     we are visualizing.
 * @param {Node} node The Node. If no node is currently highlighted, this is
 *     null.
 * @param {function} setNode Sets the node that the user wishes to highlight.
 *     This takes one argument: the Node.
 * @param {Node} root The root node of the tree we are visualizing.
 */
export function NodeInfo({editTree, node, setNode, root}) {
    // Whether to show that the user has copied the debug string
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setIsCopied(false);
    }, [node, setIsCopied]);

    /**
     * Returns the first Node after startNode in the tree that contains it that
     * has an error (as in Node.hasError), if any.
     */
    function findNextErrorNode(startNode) {
        let parent = startNode;
        while (parent !== null &&
                (parent.right === null || !parent.right.subtreeHasError)) {
            while (parent.parent !== null && parent.parent.right === parent) {
                parent = parent.parent;
            }
            parent = parent.parent;
            if (parent === null || parent.hasError) {
                return parent;
            }
        }

        let child = parent.right;
        while (true) {
            if (child.left !== null && child.left.subtreeHasError) {
                child = child.left;
            } else if (child.hasError) {
                return child;
            } else {
                child = child.right;
            }
        }
    }

    /**
     * Returns the first Node in the tree after "node" that has an error (as in
     * Node.hasError), if any. This wraps, meaning that if there is no node
     * after "node" that has an error, it returns the first node that has an
     * error. If "node" is null, this returns the first node that has an error.
     */
    function findNextErrorNodeWrapped() {
        if (root === null) {
            return null;
        }

        if (node !== null) {
            const errorNode = findNextErrorNode(node);
            if (errorNode !== null) {
                return errorNode;
            }
        }

        const startNode = root.min();
        if (startNode.hasError) {
            return startNode;
        } else {
            return findNextErrorNode(startNode);
        }
    }

    /**
     * Responds to the user clicking the button for copying the debug string.
     */
    function handleCopyClicked() {
        navigator.clipboard.writeText(node.debugStr).then(() => {
            setIsCopied(true);
        });
    }

    /**
     * Renders the specified Node's ID.
     * @param {Node} node The Node.
     * @param {boolean} isNodeLeaf Whether a null value refers to a leaf node,
     *     as opposed to the parent of the root node.
     * @return {ReactNode} The result.
     */
    function renderNodeId(node, isNullLeaf) {
        if (node === null && !isNullLeaf) {
            return 'null';
        } else {
            return (
                <span
                    className={classnames('NodeInfo__node-id', {
                        'NodeInfo__node-id--black':
                            node === null || !node.isRed,
                        'NodeInfo__node-id--red': node !== null && node.isRed,
                    })}
                >
                    {node !== null ?
                        `#${node.id.toLocaleString('en-US')}` : 'leaf'}
                </span>
            );
        }
    }

    /**
     * Renders the specified content as a link to the specified Node. When the
     * link is clicked, we call setNode(node). If "node" is null, we do not link
     * to a node.
     * @param {Node} node The Node.
     * @param {ReactNode} content The content to wrap.
     * @return {ReactNode} The result.
     */
    function renderNodeLink(node, content) {
        if (node === null) {
            return content;
        } else {
            return (
                <span
                    className="NodeInfo__node-link"
                    onClick={() => {
                        setNode(node);
                    }}
                    onKeyPress={(event) => {
                        if (event.key === 'Enter') {
                            setNode(node);
                        }
                    }}
                    role="link"
                    tabIndex={0}
                >
                    {content}
                </span>
            );
        }
    }

    /** Renders an ErrorIcon as inline text. */
    function renderErrorIcon() {
        return (
            <span className="NodeInfo__error-icon">
                <ErrorIcon />
            </span>
        );
    }

    /**
     * Renders any errors specific to the specified child pointer (i.e. errors
     * saying that unsanitizedChild !== child).
     * @param {Node} child The node's child (node.left or node.right).
     * @param {Node} unsanitizedChild The node's child in the original tree,
     *     before it was sanitized (node.unsanitizedLeft or
     *     node.unsanitizedRight). This corresponds to "child".
     * @param {string} directionStr The direction of the child: 'left' or
     *     'right'.
     * @return {ReactNode} The result.
     */
    function renderChildPointerError(child, unsanitizedChild, directionStr) {
        if (unsanitizedChild === node) {
            return (
                <div>
                    {renderErrorIcon()}
                    {'The node is its own '}
                    {directionStr}
                    {' child.'}
                </div>
            );
        } else if (unsanitizedChild !== child &&

                // If unsanitizedChild.parent === null, we render a "following
                // child pointers results in a cycle" or "node is its own child"
                // error
                unsanitizedChild.parent !== null &&

                // If unsanitizedChild.parent === node, we render a "left and
                // right children are the same" or "node is its own child" error
                unsanitizedChild.parent !== node) {
            return (
                <div>
                    {renderErrorIcon()}
                    {'The '}
                    {directionStr}
                    {' child is also the child of '}
                    {renderNodeLink(
                        unsanitizedChild.parent,
                        <>
                            {'node '}
                            {renderNodeId(
                                unsanitizedChild.parent, false)}
                        </>
                    )}
                    .
                </div>
            );
        } else {
            return null;
        }
    }

    /**
     * Renders any errors concerning node pointers, i.e. errors indicating that
     * node.unsanitizedParent !== parent, node.unsanitizedLeft !== left,
     * node.unsanitizedRight !== right, or node.isUnsanitizedParentInTree is
     * false.
     */
    function renderPointerErrors() {
        const parent = node.parent;
        const unsanitizedLeft = node.unsanitizedLeft;
        const unsanitizedRight = node.unsanitizedRight;
        return (
            <>
                {!node.isUnsanitizedParentInTree ||
                    node.unsanitizedParent !== parent ? (
                        <div>
                            {renderErrorIcon()}
                            {parent !== null ? (
                                <>
                                    {'The node is a child of '}
                                    {renderNodeLink(
                                        parent,
                                        <>
                                            {'node '}
                                            {renderNodeId(parent, false)}
                                        </>)}
                                    {', but its '}
                                    <InlineCode>parent</InlineCode>
                                    {' pointer does not match this node.'}
                                </>
                            ) : (
                                node.unsanitizedParent === node ? (
                                    'The node is its own parent.'
                                ) : (
                                    <>
                                        {'Repeatedly following '}
                                        <InlineCode>parent</InlineCode>
                                        {' pointers results in a cycle that '}
                                        leads back to this node.
                                    </>
                                )
                            )}
                        </div>
                    ) : null}
                {((unsanitizedLeft !== node.left &&
                    unsanitizedLeft.parent === null) ||
                    (unsanitizedRight !== node.right &&
                        unsanitizedRight.parent === null)) &&
                    (unsanitizedLeft !== node && unsanitizedRight !== node) ? (
                        <div>
                            {renderErrorIcon()}
                            Repeatedly following child pointers results in a
                            cycle that leads back to this node.
                        </div>
                    ) : (
                        unsanitizedLeft === unsanitizedRight &&
                        unsanitizedLeft !== null && unsanitizedLeft !== node ? (
                            <div>
                                {renderErrorIcon()}
                                The left and right children are the same.
                            </div>
                        ) : null
                    )}
                {renderChildPointerError(node.left, unsanitizedLeft, 'left')}
                {renderChildPointerError(node.right, unsanitizedRight, 'right')}
            </>
        );
    }

    /**
     * Renders any errors for "node", as in Node.hasError, except for the errors
     * rendered in renderPointerErrors().
     */
    function renderNonPointerErrors() {
        const parent = node.parent;
        return (
            <>
                {node.isRed && parent === null ? (
                    <div>
                        {renderErrorIcon()}
                        Red root node.
                    </div>
                ) : null}
                {node.isRed && parent !== null && parent.isRed ? (
                    <div>
                        {renderErrorIcon()}
                        Red child of red node.
                    </div>
                ) : null}
                {parent === null && !node.areBlackPathsEqual ? (
                    <div>
                        {renderErrorIcon()}
                        Not all root-to-leaf paths have the same number of black
                        nodes.
                    </div>
                ) : null}
                {node.nodeIsValidError !== null ? (
                    <div>
                        {renderErrorIcon()}
                        <InlineCode>assertNodeIsValid()</InlineCode>
                        {' threw an exception:'}
                        <div
                            className="NodeInfo__is-valid-error-text"
                            title={node.nodeIsValidError}
                        >
                            {node.nodeIsValidError}
                        </div>
                    </div>
                ) : null}
                {node.useSubtreeIsValidError &&
                    node.subtreeIsValidError !== null ? (
                        <div>
                            {renderErrorIcon()}
                            <InlineCode>assertSubtreeIsValid()</InlineCode>
                            {' threw an exception:'}
                            <div
                                className="NodeInfo__is-valid-error-text"
                                title={node.subtreeIsValidError}
                            >
                                {node.subtreeIsValidError}
                            </div>
                        </div>
                    ) : null}
            </>
        );
    }

    /**
     * Renders a description of all of the errors for "node", as in
     * Node.hasError.
     */
    function renderErrors() {
        if (node.hasError) {
            return (
                <div className="NodeInfo__errors">
                    {renderPointerErrors()}
                    {renderNonPointerErrors()}
                </div>
            );
        } else {
            return null;
        }
    }

    /** Renders certain general information about "node". */
    function renderGeneralInfo() {
        const unsanitizedLeft = node.unsanitizedLeft;
        const unsanitizedRight = node.unsanitizedRight;
        return (
            <div className="NodeInfo__general-info">
                <div>
                    {'ID/rank: '}
                    {renderNodeId(node, false)}
                </div>
                <div>
                    {node.isUnsanitizedParentInTree ? (
                        <>
                            {node.unsanitizedParent !== node.parent ?
                                renderErrorIcon() : null}
                            {renderNodeLink(
                                node.unsanitizedParent,
                                <>
                                    {'Parent: '}
                                    {renderNodeId(
                                        node.unsanitizedParent, false)}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {renderErrorIcon()}
                            Parent: not shown in visualization
                        </>
                    )}
                </div>
                <div>
                    {unsanitizedLeft !== node.left ||
                        (unsanitizedLeft === unsanitizedRight &&
                            unsanitizedLeft !== null) ?
                        renderErrorIcon() : null}
                    {renderNodeLink(
                        unsanitizedLeft,
                        <>
                            {'Left child: '}
                            {renderNodeId(unsanitizedLeft, true)}
                        </>
                    )}
                </div>
                <div>
                    {unsanitizedRight !== node.right ||
                        (unsanitizedRight === unsanitizedLeft &&
                            unsanitizedRight !== null) ?
                        renderErrorIcon() : null}
                    {renderNodeLink(
                        unsanitizedRight,
                        <>
                            {'Right child: '}
                            {renderNodeId(unsanitizedRight, true)}
                        </>
                    )}
                </div>
                <div>
                    {`Subtree size: ${node.size.toLocaleString('en-US')}`}
                </div>
                <div>{`Depth: ${node.depth.toLocaleString('en-US')}`}</div>
                <div>{`Height: ${node.height.toLocaleString('en-US')}`}</div>
                <div>
                    {`Black depth: ${node.blackDepth.toLocaleString('en-US')}`}
                </div>
                <div>
                    {'Black height: '}
                    {node.blackHeight.toLocaleString('en-US')}
                </div>
            </div>
        );
    }

    const nextErrorNode = findNextErrorNodeWrapped();
    return (
        <div className="NodeInfo">
            <div className="NodeInfo__buttons">
                <Button onClick={editTree} type="secondary">Change tree</Button>
                {nextErrorNode !== null ? (
                    <div className="NodeInfo__error-button">
                        <Button
                            disabled={nextErrorNode === node}
                            onClick={() => {
                                if (nextErrorNode !== node) {
                                    setNode(nextErrorNode);
                                }
                            }}
                            type="secondary"
                        >
                            Next error
                        </Button>
                    </div>
                ) : null}
            </div>
            {node !== null ? (
                <>
                    {renderErrors()}
                    {renderGeneralInfo()}
                    {node.debugStr !== null ? (
                        <>
                            Debug string:
                            <textarea
                                className="NodeInfo__debug-str"
                                disabled
                                value={node.debugStr}
                            />
                            {navigator.clipboard ? (
                                <Button
                                    clicked={isCopied}
                                    onClick={handleCopyClicked}
                                    type="primary"
                                >
                                    {isCopied ? 'Copied' : 'Copy'}
                                </Button>
                            ) : null}
                        </>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
