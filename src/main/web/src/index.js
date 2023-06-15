import React from 'react';
import ReactDOM from 'react-dom/client';
import {HomePage} from './pages/HomePage';
import './index.css';

/**
 * Top-level function for rendering the RedBlackNode visualizer page.
 * @param {string} defaultTreeStr The string representation for the tree to show
 *     initially, if any.
 */
window.renderVisualizer = (defaultTreeStr) => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <React.StrictMode>
            <HomePage defaultTreeStr={defaultTreeStr} />
        </React.StrictMode>
    );
};

/**
 * Sets the red_black_node_visualizer_id query parameter to the specified
 * string, without reloading the page or adding a history entry.
 */
window.setIdParam = (id) => {
    const query = new URLSearchParams(window.location.search);
    query.set('red_black_node_visualizer_id', id);
    window.history.replaceState(
        {}, '', `${window.location.pathname}?${query.toString()}`);
};

if (process.env.NODE_ENV === 'development') {
    window.renderVisualizer(null);
}
