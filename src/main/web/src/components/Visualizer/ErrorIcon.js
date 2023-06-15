import React from 'react';
import './ErrorIcon.css';

/** Renders an icon indicating that there is a problem. */
export function ErrorIcon() {
    return (
        <span className="ErrorIcon">
            <svg className="ErrorIcon__triangle" height={20} width={20}>
                <polygon
                    fill="#e0e000"
                    points="10,1 19,19 1,19"
                    stroke="#000"
                    strokeWidth={1}
                />
            </svg>
            <div className="ErrorIcon__text">!</div>
        </span>
    );
}
