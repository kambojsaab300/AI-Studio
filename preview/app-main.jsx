import React from 'react';
import { createRoot } from 'react-dom/client';
import StandaloneAppPage from '../src/components/apps/StandaloneAppPage.jsx';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('App render error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: '#f87171', background: '#07080d', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem' }}>AI Studio App Workspace Error</h2>
                    <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ padding: '10px 20px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '1.5rem', fontWeight: 'bold' }}
                    >
                        Reload Workspace
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <StandaloneAppPage />
    </ErrorBoundary>
);
