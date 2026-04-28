import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';

// Mock react-router-dom's useNavigate hook
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('LandingPage', () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  // TC-LP-001: Renders the LandingPage component without crashing
  test('should render the LandingPage component without crashing', () => {
    render(<LandingPage />);
    expect(screen.getByText(/CardOnboard/i)).toBeInTheDocument();
    expect(screen.getByText(/India's Most Rewarding Credit Card/i)).toBeInTheDocument();
  });

  // TC-LP-002: Navigates to '/basic-details' when "Basic Details" link is clicked
  test('should navigate to /basic-details when "Basic Details" link is clicked', () => {
    render(<LandingPage />);
    const basicDetailsLink = screen.getByText(/Basic Details/i);
    fireEvent.click(basicDetailsLink);
    expect(mockNavigate).toHaveBeenCalledWith('/basic-details');
  });

  // TC-LP-003: Navigates to '/form' when "Apply Now" button in navbar is clicked
  test('should navigate to /form when "Apply Now" button in navbar is clicked', () => {
    render(<LandingPage />);
    const applyNowButton = screen.getByRole('button', { name: /Apply Now/i });
    fireEvent.click(applyNowButton);
    expect(mockNavigate).toHaveBeenCalledWith('/form');
  });

  // TC-LP-004: Navigates to '/form' when "Apply Now - It's Free" button in hero section is clicked
  test('should navigate to /form when "Apply Now - It\'s Free" button in hero section is clicked', () => {
    render(<LandingPage />);
    const applyNowFreeButton = screen.getByRole('button', { name: /Apply Now - It's Free/i });
    fireEvent.click(applyNowFreeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/form');
  });

  // TC-LP-005: Renders all feature cards correctly
  test('should render all feature cards correctly', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Instant Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/Get approved in minutes with Aadhaar-based e-KYC verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome Bonus/i)).toBeInTheDocument();
    expect(screen.getByText(/Earn 5,000 reward points on your first transaction worth Rs. 500/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Joining Fee/i)).toBeInTheDocument();
    expect(screen.getByText(/No annual fee for the first year. Waived on spending Rs. 1 lakh\/year/i)).toBeInTheDocument();
    expect(screen.getByText(/24\/7 Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Dedicated customer support available in Hindi, English & regional languages/i)).toBeInTheDocument();
  });

  // TC-LP-006: Renders all stat cards correctly
  test('should render all stat cards correctly', () => {
    render(<LandingPage />);
    expect(screen.getByText(/5%/i)).toBeInTheDocument();
    expect(screen.getByText(/Cashback on Groceries/i)).toBeInTheDocument();
    expect(screen.getByText(/BigBasket, Zepto, Blinkit/i)).toBeInTheDocument();

    expect(screen.getByText(/10X/i)).toBeInTheDocument();
    expect(screen.getByText(/Reward Points/i)).toBeInTheDocument();
    expect(screen.getByText(/On Dining & Movies/i)).toBeInTheDocument();

    expect(screen.getByText(/â‚¹500/i)).toBeInTheDocument();
    expect(screen.getByText(/Fuel Surcharge Waiver/i)).toBeInTheDocument();
    expect(screen.getByText(/Per month at all pumps/i)).toBeInTheDocument();

    expect(screen.getByText(/0%/i)).toBeInTheDocument();
    expect(screen.getByText(/Forex Markup/i)).toBeInTheDocument();
    expect(screen.getByText(/On international spends/i)).toBeInTheDocument();
  });

  // TC-LP-007: Renders all partner names correctly
  test('should render all partner names correctly', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Amazon/i)).toBeInTheDocument();
    expect(screen.getByText(/Flipkart/i)).toBeInTheDocument();
    expect(screen.getByText(/Swiggy/i)).toBeInTheDocument();
    expect(screen.getByText(/Zomato/i)).toBeInTheDocument();
    expect(screen.getByText(/BookMyShow/i)).toBeInTheDocument();
    expect(screen.getByText(/MakeMyTrip/i)).toBeInTheDocument();
    expect(screen.getByText(/\+500 more/i)).toBeInTheDocument();
  });

  // TC-LP-008: Renders all steps correctly
  test('should render all steps correctly', () => {
    render(<LandingPage />);
    expect(screen.getByText(/01/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply Online/i)).toBeInTheDocument();
    expect(screen.getByText(/Fill the form in just 2 minutes with basic details/i)).toBeInTheDocument();

    expect(screen.getByText(/02/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify with Aadhaar/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick e-KYC verification using your Aadhaar & PAN/i)).toBeInTheDocument();

    expect(screen.getByText(/03/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Approved/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant approval with credit limit up to â‚¹5 lakhs/i)).toBeInTheDocument();

    expect(screen.getByText(/04/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Using/i)).toBeInTheDocument();
    expect(screen.getByText(/Virtual card activated instantly, physical card in 3-5 days/i)).toBeInTheDocument();
  });

  // TC-LP-009: Renders all testimonial cards correctly
  test('should render all testimonial cards correctly', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/Mumbai/i)).toBeInTheDocument();
    expect(screen.getByText(/The rewards on dining are amazing! I save almost â‚¹2,000 every month on Swiggy and Zomato orders./i)).toBeInTheDocument();

    expect(screen.getByText(/Rahul Verma/i)).toBeInTheDocument();
    expect(screen.getByText(/Bengaluru/i)).toBeInTheDocument();
    expect(screen.getByText(/Got approved in just 10 minutes. The fuel surcharge waiver alone saves me â‚¹500 monthly./i)).toBeInTheDocument();

    expect(screen.getByText(/Anita Desai/i)).toBeInTheDocument();
    expect(screen.getByText(/Delhi/i)).toBeInTheDocument();
    expect(screen.getByText(/Best card for online shopping! The cashback on Amazon and Flipkart is unbeatable./i)).toBeInTheDocument();
  });

  // TC-LP-010: Navbar links should have correct href attributes
  test('should have correct href attributes for navbar links', () => {
    render(<LandingPage />);
    expect(screen.getByRole('link', { name: /Features/i })).toHaveAttribute('href', '#features');
    expect(screen.getByRole('link', { name: /Benefits/i })).toHaveAttribute('href', '#benefits');
    expect(screen.getByRole('link', { name: /How it Works/i })).toHaveAttribute('href', '#how-it-works');
  });

  // TC-LP-011: Hero section displays correct main heading and subtitle
  test('should display correct main heading and subtitle in hero section', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1, name: /India's Most Rewarding Credit Card/i })).toBeInTheDocument();
    expect(screen.getByText(/Earn up to 10X rewards on everyday spends. Zero joining fee, instant approval with Aadhaar e-KYC, and exclusive benefits on 500\+ partner brands./i)).toBeInTheDocument();
  });

  // TC-LP-012: Hero image and card features are displayed
  test('should display hero image and card features', () => {
    render(<LandingPage />);
    expect(screen.getByAltText(/Premium Credit Card/i)).toBeInTheDocument();
    expect(screen.getByText(/Contactless Payments/i)).toBeInTheDocument();
    expect(screen.getByText(/UPI Enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/International Usage/i)).toBeInTheDocument();
  });

  // TC-LP-013: Benefits section displays correct heading and list items
  test('should display correct heading and list items in benefits section', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { level: 2, name: /Save More on What You Love/i })).toBeInTheDocument();
    expect(screen.getByText(/5% Cashback on Groceries/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant cashback on BigBasket, Zepto, Blinkit, DMart & more/i)).toBeInTheDocument();
    expect(screen.getByText(/Flat 20% Off on Food Orders/i)).toBeInTheDocument();
    expect(screen.getByText(/Valid on Swiggy, Zomato up to â‚¹150 per order/i)).toBeInTheDocument();
    expect(screen.getByText(/Free Airport Lounge Access/i)).toBeInTheDocument();
    expect(screen.getByText(/4 complimentary visits per year at domestic airports/i)).toBeInTheDocument();
  });
});