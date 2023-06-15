import classnames from 'classnames';
import React, {useEffect, useRef, useState} from 'react';
import {Button} from '../Button';
import {InlineCode} from '../Text';
import './TreeStrForm.css';

/**
 * A form for inputting a string representation of a red-black tree, in order to
 * visualize the tree.
 * @param {string} defaultTreeStr The initial value of the text entry, if any.
 * @param {boolean} hasError Whether to display an error indicating that the
 *     user previously submitted an invalid string representation.
 * @param {function} onSubmit Responds to the user submitting a string
 *     representation to visualize. The function accepts one argument: the
 *     string.
 */
export function TreeStrForm({defaultTreeStr, hasError, onSubmit}) {
    // The "textarea"'s DOM element
    const textarea = useRef(null);

    // The text currently entered into the input
    const [treeStr, setTreeStr] = useState(defaultTreeStr || '');

    useEffect(() => {
        textarea.current.select();
        textarea.current.focus();
    }, []);

    /** Responds to the user clicking the "Visualize" button. */
    function handleVisualizeClick() {
        if (treeStr !== '' && onSubmit) {
            onSubmit(treeStr);
        }
    }

    return (
        <div className="TreeStrForm">
            <p className="TreeStrForm__heading">
                Welcome to RedBlackNode visualizer!
            </p>
            <p>
                How to use:
            </p>
            <p>
                {'Step 1: Get '}
                <a
                    href="https://github.com/btrekkie/RedBlackNode"
                    target="_blank"
                >
                    RedBlackNode
                </a>
                {' and '}
                <a
                    href="https://github.com/btrekkie/RedBlackNodeVisualizer"
                    target="_blank"
                >
                    RedBlackNodeVisualizer
                </a>
                .
            </p>
            <p>
                {'Step 2: Export a '}
                <InlineCode>RedBlackNode</InlineCode>
                {' by calling '}
                <InlineCode>RedBlackNodeVisualizer.export</InlineCode>
                .
            </p>
            <p>
                Step 3: Paste the resulting string into the below text box.
            </p>
            <p>
                Step 4: Click "Visualize."
            </p>
            <textarea
                className={classnames('TreeStrForm__textarea', {
                    'TreeStrForm__textarea--error': hasError,
                })}
                defaultValue={defaultTreeStr}
                onChange={(event) => {
                    setTreeStr(event.target.value);
                }}
                ref={textarea}
            />
            {hasError ? (
                <div className="TreeStrForm__error">
                    Error parsing red-black tree
                </div>
            ) : null}
            <div className="TreeStrForm__button">
                <Button
                    disabled={treeStr === ''}
                    onClick={handleVisualizeClick}
                    type="primary"
                >
                    Visualize
                </Button>
            </div>
        </div>
    );
}
