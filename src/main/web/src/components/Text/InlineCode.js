import React from 'react';
import './InlineCode.css';

/** Renders text styled as inline programming code. */
export function InlineCode({children}) {
    return <code className="InlineCode">{children}</code>;
}
