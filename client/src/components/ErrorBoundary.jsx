import React from 'react';

/**
 * ErrorBoundary React component to catch unhandled JavaScript rendering errors
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-fallback"
          style={{
            padding: '2rem',
            margin: '2rem auto',
            maxWidth: '600px',
            border: '2px solid #d32f2f',
            borderRadius: '8px',
            backgroundColor: '#ffebee',
            color: '#b71c1c',
            fontFamily: 'sans-serif',
          }}
        >
          <h2 style={{ marginTop: 0 }}>⚠️ Something went wrong</h2>
          <p>The application encountered an unexpected UI error.</p>
          {this.state.error && (
            <pre
              style={{
                backgroundColor: '#fff',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #ffcdd2',
                overflowX: 'auto',
                fontSize: '0.85rem',
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              id="error-boundary-retry-btn"
              onClick={this.handleReset}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#d32f2f',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Try Again / Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
