import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '../src/App';

// Mock all page components to prevent them from rendering and to isolate App's routing logic
jest.mock('../src/pages/LandingPage', () => {
  return function MockLandingPage() {
    return <div data-testid="landing-page">LandingPage</div>;
  };
});
jest.mock('../src/pages/CustomerForm', () => {
  return function MockCustomerForm() {
    return <div data-testid="customer-form">CustomerForm</div>;
  };
});
jest.mock('../src/pages/BasicDetailsPage', () => {
  return function MockBasicDetailsPage() {
    return <div data-testid="basic-details-page">BasicDetailsPage</div>;
  };
});
jest.mock('../src/pages/KYCPage', () => {
  return function MockKYCPage() {
    return <div data-testid="kyc-page">KYCPage</div>;
  };
});

describe('App Routing', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock console.error to suppress React Router warnings in tests if any
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    jest.restoreAllMocks();
  });

  // TC-APP-001: Test that the LandingPage component renders for the root path
  test('should render LandingPage for the root path "/"', () => {
    window.history.pushState({}, 'Test page', '/');
    render(<App />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  // TC-APP-002: Test that the CustomerForm component renders for the "/form" path
  test('should render CustomerForm for the "/form" path', () => {
    window.history.pushState({}, 'Test page', '/form');
    render(<App />);
    expect(screen.getByTestId('customer-form')).toBeInTheDocument();
  });

  // TC-APP-003: Test that the BasicDetailsPage component renders for the "/basic-details" path
  test('should render BasicDetailsPage for the "/basic-details" path', () => {
    window.history.pushState({}, 'Test page', '/basic-details');
    render(<App />);
    expect(screen.getByTestId('basic-details-page')).toBeInTheDocument();
  });

  // TC-APP-004: Test that the KYCPage component renders for the "/kyc" path after Suspense fallback
  test('should render KYCPage for the "/kyc" path after Suspense fallback', async () => {
    window.history.pushState({}, 'Test page', '/kyc');
    render(<App />);

    // Expect the loading spinner to be present initially due to lazy loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for the lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId('kyc-page')).toBeInTheDocument();
    });

    // Ensure the loading spinner is no longer present
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  // TC-APP-005: Test that an unknown path does not render any specific page (assuming no 404 route is defined)
  test('should not render any specific page for an unknown path (e.g., "/unknown")', () => {
    window.history.pushState({}, 'Test page', '/unknown');
    render(<App />);

    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('customer-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('basic-details-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kyc-page')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});