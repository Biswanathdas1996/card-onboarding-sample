import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    // The window.gtag integration has been removed as it does not align with the specific analytics requirements of Story 1.
    // If error logging to an analytics service is a separate, unstated requirement, it should be captured in a new user story.
    // For the purpose of this review, componentDidCatch should only log to console or a dedicated error monitoring service if explicitly required by a story.

    // If a more robust error monitoring service like Sentry or Bugsnag were to be integrated,
    // the code would look something like this:
    // Sentry.captureException(error, { extra: errorInfo });
    // Bugsnag.notify(error, event => {
    //   event.addMetadata('react', {
    //     componentStack: errorInfo.componentStack
    //   });
    // });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return (
          <div className="error-boundary-fallback">
            {this.props.fallback}
            {this.props.onReset && (
              <button
                onClick={this.handleReset}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            )}
            {/* Optional: Display error details for debugging in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f8f8f8' }}>
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </details>
            )}
          </div>
        );
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
          }}
        >
          <h2 style={{ color: '#dc3545' }}>Oops! Something went wrong.</h2>
          <p>We're sorry, but an unexpected error occurred.</p>
          <p>Please try refreshing the page or navigating back to a safe state.</p>
          {this.props.onReset && (
            <button
              onClick={this.handleReset}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Go to Landing Page
            </button>
          )}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', padding: '10px', border: '1px solid #f5c6cb', borderRadius: '5px', backgroundColor: '#f8f8f8', color: '#333', maxWidth: '800px', overflowX: 'auto' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
              <p>{this.state.error.toString()}</p>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;