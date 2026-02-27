import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';
import CustomerForm from './pages/CustomerForm';
import ErrorBoundary from './components/ErrorBoundary';

// Mock lazy-loaded components
jest.mock('./pages/KYCPage', () => {
  const MockKYCPage = () => <div>Mock KYC Page</div>;
  return MockKYCPage;
});
jest.mock('./pages/TaxFilingProcessFlowPage', () => {
  const MockTaxFilingProcessFlowPage = () => <div>Mock Tax Filing Process Flow Page</div>;
  return MockTaxFilingProcessFlowPage;
});

// Mock ErrorBoundary to simplify testing its presence
jest.mock('./components/ErrorBoundary', () => {
  const MockErrorBoundary = ({ children }) => <div data-testid="error-boundary">{children}</div>;
  return MockErrorBoundary;
});

describe('App Routing', () => {
  // Test case 1: Verify that the LandingPage is rendered for the root path
  test('renders LandingPage for the root path "/"', () => {
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.getByText('Welcome to Landing Page')).toBeInTheDocument(); // Assuming LandingPage renders this text
  });

  // Test case 2: Verify that CustomerForm is rendered for the "/form" path
  test('renders CustomerForm for the "/form" path', () => {
    window.history.pushState({}, 'Test page', '/form');
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.getByText('Customer Form Page')).toBeInTheDocument(); // Assuming CustomerForm renders this text
  });

  // Test case 3: Verify that KYCPage is lazy-loaded and rendered for the "/kyc" path
  test('renders KYCPage for the "/kyc" path after lazy loading', async () => {
    window.history.pushState({}, 'Test page', '/kyc');
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument(); // Initial loading state
    await waitFor(() => expect(screen.getByText('Mock KYC Page')).toBeInTheDocument());
  });

  // Test case 4: Verify that TaxFilingProcessFlowPage is lazy-loaded and rendered for "/tax-filing-process"
  test('renders TaxFilingProcessFlowPage for the "/tax-filing-process" path after lazy loading', async () => {
    window.history.pushState({}, 'Test page', '/tax-filing-process');
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument(); // Initial loading state
    await waitFor(() => expect(screen.getByText('Mock Tax Filing Process Flow Page')).toBeInTheDocument());
  });

  // Test case 5: Verify that TaxFilingProcessFlowPage is wrapped with ErrorBoundary
  test('TaxFilingProcessFlowPage route is wrapped with ErrorBoundary', async () => {
    window.history.pushState({}, 'Test page', '/tax-filing-process');
    render(
      <Router>
        <App />
      </Router>
    );
    await waitFor(() => {
      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toBeInTheDocument();
      expect(screen.getByText('Mock Tax Filing Process Flow Page')).toBeInTheDocument();
      expect(errorBoundary).toContainElement(screen.getByText('Mock Tax Filing Process Flow Page'));
    });
  });

  // Test case 6: Verify that other routes are not wrapped with ErrorBoundary
  test('CustomerForm route is NOT wrapped with ErrorBoundary', () => {
    window.history.pushState({}, 'Test page', '/form');
    render(
      <Router>
        <App />
      </Router>
    );
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    expect(screen.getByText('Customer Form Page')).toBeInTheDocument();
  });

  // Test case 7: Verify that KYCPage route is NOT wrapped with ErrorBoundary
  test('KYCPage route is NOT wrapped with ErrorBoundary', async () => {
    window.history.pushState({}, 'Test page', '/kyc');
    render(
      <Router>
        <App />
      </Router>
    );
    await waitFor(() => {
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
      expect(screen.getByText('Mock KYC Page')).toBeInTheDocument();
    });
  });

  // Test case 8: Verify that a non-existent route does not render any specific page content
  test('renders nothing specific for a non-existent route', () => {
    window.history.pushState({}, 'Test page', '/non-existent-route');
    render(
      <Router>
        <App />
      </Router>
    );
    // Expecting no specific page content to be present, might render a default 404 if implemented,
    // but for this App.js, it would just be an empty Routes match.
    expect(screen.queryByText('Welcome to Landing Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Customer Form Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Mock KYC Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Mock Tax Filing Process Flow Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});

// Mock the actual components for shallow rendering in App.js tests
jest.mock('./pages/LandingPage', () => {
  const MockLandingPage = () => <div>Welcome to Landing Page</div>;
  return MockLandingPage;
});

jest.mock('./pages/CustomerForm', () => {
  const MockCustomerForm = () => <div>Customer Form Page</div>;
  return MockCustomerForm;
});