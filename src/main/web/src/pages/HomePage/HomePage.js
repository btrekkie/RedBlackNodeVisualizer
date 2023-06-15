import React, {useCallback, useEffect, useState} from 'react';
import {TreeStrForm} from '../../components/TreeStrForm';
import {Visualizer} from '../../components/Visualizer';

/**
 * The main page for the project.
 * @param {string} defaultTreeStr The string representation for the tree to show
 *     initially, if any.
 */
export function HomePage({defaultTreeStr}) {
    // The currently saved string representation for a tree, if any
    const [treeStr, setTreeStr] = useState(defaultTreeStr);

    // Whether to render a TreeStrForm component
    const [shouldShowForm, setShouldShowForm] = useState(
        defaultTreeStr === null);

    // Whether to render a Visualizer component
    const [shouldShowVisualizer, setShouldShowVisualizer] = useState(false);

    // Whether we can render the tree, as in Visualizer.props.isInitialized
    const [isVisualizerInitialized, setIsVisualizerInitialized] = useState(
        false);

    // The result of calling JSON.parse(treeStr). This is null if that produces
    // an error or if treeStr is null.
    const [treeJson, setTreeJson] = useState(null);

    // Whether to display an error indicating that the user previously submitted
    // an invalid string representation of a tree
    const [hasError, setHasError] = useState(false);

    // Shows the tree with the specified string representation. If we detect
    // that it is not a valid string representation, we display an error message
    // in the form instead.
    const visualize = useCallback((newTreeStr) => {
        let newTreeJson;
        let newHasError;
        try {
            newTreeJson = JSON.parse(newTreeStr);
            newHasError = false;
        } catch (error) {
            newTreeJson = null;
            newHasError = true;
        }

        setTreeJson(newTreeJson);
        setHasError(newHasError);
        if (!newHasError) {
            setTreeStr(newTreeStr);
            setShouldShowVisualizer(true);
        }
    }, [setTreeStr, setShouldShowVisualizer, setTreeJson, setHasError]);

    useEffect(() => {
        if (defaultTreeStr !== null) {
            visualize(defaultTreeStr);
        }
    }, [defaultTreeStr, visualize]);

    /**
     * Switches to the form view allowing the user to input the tree to
     * visualize.
     */
    function editTree() {
        setShouldShowForm(true);
        setShouldShowVisualizer(false);
        setIsVisualizerInitialized(false);
    }

    /**
     * Responds to becoming able to render the tree, as in
     * Visualizer.props.setIsInitialized.
     */
    function handleVisualizerInitialized() {
        setIsVisualizerInitialized(true);
        setShouldShowForm(false);
    }

    // In order to prevent the webpage from briefly displaying nothing, when the
    // user submits the form, we continue displaying the form until Visualizer
    // is done initializing. While it is initializing, we display Visualizer
    // with "display: none" so as to hide any dummy content.
    return (
        <>
            {shouldShowForm ? (
                <TreeStrForm
                    defaultTreeStr={treeStr}
                    hasError={hasError}
                    onSubmit={visualize}
                />
            ) : null}
            {shouldShowVisualizer ? (
                <div style={shouldShowForm ? {display: 'none'} : {}}>
                    <Visualizer
                        editTree={editTree}
                        isInitialized={isVisualizerInitialized}
                        setIsInitialized={handleVisualizerInitialized}
                        treeJson={treeJson}
                    />
                </div>
            ) : null}
        </>
    );
}
