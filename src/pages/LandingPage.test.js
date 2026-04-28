import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';

// Mock react-router-dom's useNavigate hook
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('LandingPage', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    render(<LandingPage />);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TC-001: Renders the Navbar with correct elements
  test('TC-001: should render the Navbar with logo and navigation links', () => {
    expect(screen.getByText('CardOnboard')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Features' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Benefits' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'How it Works' })).toBeInTheDocument();
    expect(screen.getByText('Basic Details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply Now' })).toBeInTheDocument();
  });

  // TC-002: Navbar "Apply Now" button navigates to /form
  test('TC-002: should navigate to /form when Navbar "Apply Now" button is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
    expect(mockNavigate).toHaveBeenCalledWith('/form');
  });

  // TC-003: Navbar "Basic Details" link navigates to /basic-details
  test('TC-003: should navigate to /basic-details when Navbar "Basic Details" link is clicked', () => {
    fireEvent.click(screen.getByText('Basic Details'));
    expect(mockNavigate).toHaveBeenCalledWith('/basic-details');
  });

  // TC-004: Renders the Hero Section with main content
  test('TC-004: should render the Hero Section with title and subtitle', () => {
    expect(screen.getByText("India's Most Rewarding Credit Card")).toBeInTheDocument();
    expect(screen.getByText(/Earn up to 10X rewards on everyday spends/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Apply Now - It's Free" })).toBeInTheDocument();
    expect(screen.getByText('No impact on CIBIL score')).toBeInTheDocument();
  });

  // TC-005: Hero Section "Apply Now" button navigates to /form
  test('TC-005: should navigate to /form when Hero Section "Apply Now" button is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: "Apply Now - It's Free" }));
    expect(mockNavigate).toHaveBeenCalledWith('/form');
  });

  // TC-006: Renders the Stats Section with all statistics
  test('TC-006: should render the Stats Section with all key statistics', () => {
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('Cashback on Groceries')).toBeInTheDocument();
    expect(screen.getByText('10X')).toBeInTheDocument();
    expect(screen.getByText('Reward Points')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('Fuel Surcharge Waiver')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Forex Markup')).toBeInTheDocument();
  });

  // TC-007: Renders the Partners Section with partner names
  test('TC-007: should render the Partners Section with partner names', () => {
    expect(screen.getByText('Exclusive rewards with')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('Flipkart')).toBeInTheDocument();
    expect(screen.getByText('Swiggy')).toBeInTheDocument();
    expect(screen.getByText('Zomato')).toBeInTheDocument();
    expect(screen.getByText('BookMyShow')).toBeInTheDocument();
    expect(screen.getByText('MakeMyTrip')).toBeInTheDocument();
    expect(screen.getByText('+500 more')).toBeInTheDocument();
  });

  // TC-008: Renders the Features Section with all features
  test('TC-008: should render the Features Section with all listed features', () => {
    expect(screen.getByText('Why Choose Us')).toBeInTheDocument();
    expect(screen.getByText('Designed for the Modern Indian')).toBeInTheDocument();
    expect(screen.getByText('Instant Approval')).toBeInTheDocument();
    expect(screen.getByText('Welcome Bonus')).toBeInTheDocument();
    expect(screen.getByText('Zero Joining Fee')).toBeInTheDocument();
    expect(screen.getByText('24/7 Support')).toBeInTheDocument();
  });

  // TC-009: Renders the Benefits Section with all benefits
  test('TC-009: should render the Benefits Section with all listed benefits', () => {
    expect(screen.getByText('Exclusive Benefits')).toBeInTheDocument();
    expect(screen.getByText('Save More on What You Love')).toBeInTheDocument();
    expect(screen.getByText('5% Cashback on Groceries')).toBeInTheDocument();
    expect(screen.getByText('Flat 20% Off on Food Orders')).toBeInTheDocument();
    expect(screen.getByText('Free Airport Lounge Access')).toBeInTheDocument();
  });

  // TC-010: Hero image is present and has correct alt text
  test('TC-010: should display the premium credit card image', () => {
    const cardImage = screen.getByAltText('Premium Credit Card');
    expect(cardImage).toBeInTheDocument();
    expect(cardImage).toHaveAttribute('src', '/images/credit-card.jpg');
  });

  // TC-011: Credit card features are displayed in the hero section
  test('TC-011: should display credit card features in the hero section', () => {
    expect(screen.getByText('Contactless Payments')).toBeInTheDocument();
    expect(screen.getByText('UPI Enabled')).toBeInTheDocument();
    expect(screen.getByText('International Usage')).toBeInTheDocument();
  });
});