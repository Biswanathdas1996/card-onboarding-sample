import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

// Mock the lazy-loaded components and their fallback
jest.mock('./pages/LandingPage', () => () => <div>LandingPage Mock</div>);
jest.mock('./pages/CustomerForm', () => () => <div>CustomerForm Mock</div>);
jest.mock('./pages/BasicDetailsPage', () => () => <div>BasicDetailsPage Mock</div>);
jest.mock('./pages/KYCPage', () => () => <div>KYCPage Mock</div>);

describe('App Component', () => {
  // TC-001: Should render the LandingPage component for the root path
  test('should render the LandingPage component for the root path', () => {
    window.history.pushState({}, 'Test page', '/');
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.getByText('LandingPage Mock')).toBeInTheDocument();
  });

  // TC-002: Should render the CustomerForm component for the /form path
  test('should render the CustomerForm component for the /form path', () => {
    window.history.pushState({}, 'Test page', '/form');
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.getByText('CustomerForm Mock')).toBeInTheDocument();
  });

  // TC-003: Should render the BasicDetailsPage component for the /basic-details path
  test('should render the BasicDetailsPage component for the /basic-details path', () => {
    window.history.pushState({}, 'Test page', '/basic-details');
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.getByText('BasicDetailsPage Mock')).toBeInTheDocument();
  });

  // TC-004: Should render the LoadingSpinner then KYCPage component for the /kyc path
  test('should render the LoadingSpinner then KYCPage component for the /kyc path', async () => {
    window.history.pushState({}, 'Test page', '/kyc');
    render(
      <Router>
        <App />
      </Router>
    );

    // Expect LoadingSpinner to be visible initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for the lazy-loaded component to appear
    await waitFor(() => expect(screen.getByText('KYCPage Mock')).toBeInTheDocument());
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  // TC-005: Should apply the app-container class to the main div
  test('should apply the app-container class to the main div', () => {
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.getByRole('main', { hidden: true }).closest('div')).toHaveClass('app-container');
  });
});

// Helper component to test the LoadingSpinner in isolation
function TestLoadingSpinner() {
  const KYCPage = React.lazy(() => new Promise(resolve => setTimeout(() => resolve({ default: () => <div>KYCPage Content</div> }), 100)));
  return (
    <Suspense fallback={
      <div data-testid="loading-spinner">
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              borderTop: '3px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>Loading...</p>
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    }>
      <KYCPage />
    </Suspense>
  );
}

describe('LoadingSpinner Component', () => {
  // TC-006: Should render the "Loading..." text
  test('should render the "Loading..." text', async () => {
    render(<TestLoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
  });

  // TC-007: Should contain a spinning element
  test('should contain a spinning element', async () => {
    render(<TestLoadingSpinner />);
    const spinnerContainer = screen.getByTestId('loading-spinner');
    const spinnerDiv = spinnerContainer.querySelector('div > div > div'); // Selects the div with the border and animation
    expect(spinnerDiv).toHaveStyle('animation: spin 0.8s linear infinite');
    expect(spinnerDiv).toHaveStyle('border-radius: 50%');
    await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());
  });

  // TC-008: Should apply correct background styling
  test('should apply correct background styling', async () => {
    render(<TestLoadingSpinner />);
    const spinnerContainer = screen.getByTestId('loading-spinner');
    const backgroundDiv = spinnerContainer.querySelector('div'); // Selects the div with minHeight and background
    expect(backgroundDiv).toHaveStyle('min-height: 100vh');
    expect(backgroundDiv).toHaveStyle('background: linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)');
    await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument());
  });
});