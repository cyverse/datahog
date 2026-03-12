import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataBrowser } from './browser/DataBrowser';
import { AnalyzePanel } from './browser/AnalyzePanel';

function App() {
    const [mode, setMode] = useState('browse');
    const [analyzePath, setAnalyzePath] = useState('');

    const handleAnalyze = (path) => {
        setAnalyzePath(path);
        setMode('analyze');
    };

    return (
        <>
            {mode === 'browse' && (
                <DataBrowser onAnalyze={handleAnalyze} />
            )}
            {mode === 'analyze' && (
                <AnalyzePanel path={analyzePath} onBack={() => setMode('browse')} />
            )}
        </>
    );
}

const root = createRoot(document.getElementById('app'));
root.render(<App />);
