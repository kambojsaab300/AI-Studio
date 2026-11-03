import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../app/AI Studio Customer.jsx';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Customer Portal render error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: '#f87171', background: '#0c0a09', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#facc15', marginBottom: '1rem' }}>AI Studio Customer Portal Error</h2>
                    <pre style={{ background: '#1c1917', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ padding: '10px 20px', background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '1.5rem', fontWeight: 'bold' }}
                    >
                        Reload Customer Portal
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
