import React from 'react';

interface State { error: Error | null; info: string }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, info: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error, info: '' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.setState({ info: info.componentStack ?? '' });
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div style={{
          padding: 32, background: '#0f0f13', color: '#e2e2e8',
          fontFamily: 'monospace', minHeight: '100vh',
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: 12 }}>⚠️ Something went wrong</h2>
          <pre style={{ color: '#e67e22', whiteSpace: 'pre-wrap', marginBottom: 16, fontSize: 13 }}>
            {this.state.error.message}
          </pre>
          <pre style={{ color: '#666', whiteSpace: 'pre-wrap', fontSize: 11, maxHeight: 300, overflow: 'auto' }}>
            {this.state.info}
          </pre>
          <button
            onClick={() => this.setState({ error: null, info: '' })}
            style={{ marginTop: 16, padding: '8px 16px', background: '#d4af37', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
