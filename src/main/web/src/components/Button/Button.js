import classnames from 'classnames';
import React from 'react';
import './Button.css';

/**
 * Renders a clickable button control. This might not render a "button" element.
 * @param {ReactNode} children The button's contents (i.e. its text).
 * @param {boolean} clicked Whether to show the button as having been previously
 *     clicked. Currently, this only works if "type" is 'secondary'.
 * @param {boolean} disabled Whether user interaction is disabled.
 * @param {function} onClick Responds to the user pressing the button. This
 *     should be absent if "disabled" is true.
 * @param {string} type The button's functional category, suggesting what
 *     styling to use. This must be "primary" or "secondary".
 */
export function Button({
    children,
    clicked = false,
    disabled = false,
    onClick,
    type,
}) {
    /** Responds to the specified keypress event on the button. */
    function handleKeyPress(event) {
        if (event.key === 'Enter' && onClick) {
            onClick();
        }
    }

    return (
        <div
            className={classnames('Button', {
                'Button--clicked': clicked,
                'Button--disabled': disabled,
                'Button--primary': type === 'primary',
                'Button--secondary': type === 'secondary',
            })}
            onClick={onClick}
            onKeyPress={handleKeyPress}
            role="button"
            tabIndex={disabled ? null : 0}
        >
            {children}
        </div>
    );
}
