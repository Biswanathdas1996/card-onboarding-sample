import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from './ErrorBoundary';

// A component that will throw an error for testing purposes
const ProblemChild = () => {
  throw new Error('Test error');
};

const AnotherProblemChild = () => {
  React.useEffect(() => {
    throw new Error('Error from useEffect');
  }, []);
  return null;
};

describe('ErrorBoundary', () => {
  const originalError = console.error;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console.error output during tests to avoid polluting test results
    // but still capture calls to it for assertions.
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  // Test 1: Renders children normally when no error occurs
  test('should render children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>Test Child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  // Test 2: Catches errors from children and displays default fallback UI
  test('should catch errors and display default fallback UI', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('No error yet')).toBeInTheDocument();

    act(() => {
      rerender(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.queryByText('No error yet')).not.toBeInTheDocument();
    expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText("We're sorry, but an unexpected error occurred.")).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledTimes(2); // One for getDerivedStateFromError, one for componentDidCatch
    expect(errorSpy).toHaveBeenCalledWith(
      'Uncaught error in ErrorBoundary:',
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  // Test 3: Catches errors and displays custom fallback UI
  test('should catch errors and display custom fallback UI when provided', () => {
    const CustomFallback = () => <h1>Custom Fallback UI</h1>;
    const { rerender } = render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('No error yet')).toBeInTheDocument();

    act(() => {
      rerender(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.queryByText('No error yet')).not.toBeInTheDocument();
    expect(screen.getByText('Custom Fallback UI')).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  // Test 4: Calls onReset prop when "Try again" button is clicked in custom fallback
  test('should call onReset prop when "Try again" button is clicked in custom fallback', () => {
    const handleReset = jest.fn();
    const CustomFallback = ({ onReset }: { onReset?: () => void }) => (
      <>
        <h1>Custom Fallback UI</h1>
        {onReset && <button onClick={onReset}>Try again</button>}
      </>
    );
    const { rerender } = render(
      <ErrorBoundary fallback={<CustomFallback onReset={handleReset} />} onReset={handleReset}>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary fallback={<CustomFallback onReset={handleReset} />} onReset={handleReset}>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    const tryAgainButton = screen.getByRole('button', { name: /Try again/i });
    fireEvent.click(tryAgainButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Custom Fallback UI')).not.toBeInTheDocument();
    expect(screen.getByText('No error yet')).toBeInTheDocument(); // Should re-render children after reset
    expect(errorSpy).toHaveBeenCalledTimes(2); // Error logging should not be reset
  });

  // Test 5: Calls onReset prop when "Go to Landing Page" button is clicked in default fallback
  test('should call onReset prop when "Go to Landing Page" button is clicked in default fallback', () => {
    const handleReset = jest.fn();
    const { rerender } = render(
      <ErrorBoundary onReset={handleReset}>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary onReset={handleReset}>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    const goToLandingPageButton = screen.getByRole('button', { name: /Go to Landing Page/i });
    fireEvent.click(goToLandingPageButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Oops! Something went wrong.')).not.toBeInTheDocument();
    expect(screen.getByText('No error yet')).toBeInTheDocument(); // Should re-render children after reset
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  // Test 6: Does not show reset button if onReset prop is not provided (custom fallback)
  test('should not show reset button in custom fallback if onReset prop is not provided', () => {
    const CustomFallback = ({ onReset }: { onReset?: () => void }) => (
      <>
        <h1>Custom Fallback UI</h1>
        {onReset && <button onClick={onReset}>Try again</button>}
      </>
    );
    const { rerender } = render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.queryByRole('button', { name: /Try again/i })).not.toBeInTheDocument();
  });

  // Test 7: Does not show reset button in default fallback if onReset prop is not provided
  test('should not show reset button in default fallback if onReset prop is not provided', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.queryByRole('button', { name: /Go to Landing Page/i })).not.toBeInTheDocument();
  });

  // Test 8: Displays error details in development mode for default fallback
  test('should display error details in development mode for default fallback', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { rerender } = render(
      <ErrorBoundary>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText('Error Details')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Error Details')); // Open details
    expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
    expect(screen.getByText(/componentStack/i)).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  // Test 9: Does not display error details in production mode for default fallback
  test('should not display error details in production mode for default fallback', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { rerender } = render(
      <ErrorBoundary>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  // Test 10: Displays error details in development mode for custom fallback
  test('should display error details in development mode for custom fallback', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const CustomFallback = ({ error, errorInfo }: { error?: Error, errorInfo?: React.ErrorInfo }) => (
      <>
        <h1>Custom Fallback UI</h1>
        {error && errorInfo && (
          <div>
            <h2>Error Details</h2>
            <p>{error.toString()}</p>
            <pre>{errorInfo.componentStack}</pre>
          </div>
        )}
      </>
    );
    const { rerender } = render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
    expect(screen.getByText(/componentStack/i)).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  // Test 11: Does not display error details in production mode for custom fallback
  test('should not display error details in production mode for custom fallback', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const CustomFallback = ({ error, errorInfo }: { error?: Error, errorInfo?: React.ErrorInfo }) => (
      <>
        <h1>Custom Fallback UI</h1>
        {process.env.NODE_ENV === 'development' && error && errorInfo && (
          <div>
            <h2>Error Details</h2>
            <p>{error.toString()}</p>
            <pre>{errorInfo.componentStack}</pre>
          </div>
        )}
      </>
    );
    const { rerender } = render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.queryByText(/Error: Test error/i)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  // Test 12: ErrorBoundary state is reset after onReset is called
  test('should reset ErrorBoundary state after onReset is called', () => {
    const handleReset = jest.fn();
    const { rerender } = render(
      <ErrorBoundary onReset={handleReset}>
        <div>No error yet</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary onReset={handleReset}>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument();
    const goToLandingPageButton = screen.getByRole('button', { name: /Go to Landing Page/i });
    fireEvent.click(goToLandingPageButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('No error yet')).toBeInTheDocument();

    // Verify internal state is reset by trying to trigger another error
    act(() => {
      rerender(
        <ErrorBoundary onReset={handleReset}>
          <ProblemChild />
        </ErrorBoundary>
      );
    });
    expect(screen.getByText('Oops! Something went wrong.')).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledTimes(4); // 2 for first error, 2 for second error
  });

  // Test 13: componentDidCatch logs error and errorInfo
  test('componentDidCatch should log the error and errorInfo', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <div>Child</div>
      </ErrorBoundary>
    );

    act(() => {
      rerender(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      );
    });

    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(
      'Uncaught error in ErrorBoundary:',
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });
});