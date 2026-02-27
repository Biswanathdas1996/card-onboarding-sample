import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import TaxFilingProcessFlowPage from '../src/pages/TaxFilingProcessFlowPage';
import { trackPageView, trackEvent } from '../src/services/analytics';
import { fetchTaxFlowContent } from '../src/api/cmsService';
import ErrorBoundary from '../src/components/ErrorBoundary';
import DocumentViewer from '../src/components/DocumentViewer';

// Mock external dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
jest.mock('../src/services/analytics', () => ({
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
}));
jest.mock('../src/api/cmsService', () => ({
  fetchTaxFlowContent: jest.fn(),
}));
jest.mock('../src/components/ErrorBoundary', () => ({ children, pageName }) => (
  <div data-testid="error-boundary">{children}</div>
));
jest.mock('../src/components/DocumentViewer', () => ({ documentUrl }) => (
  <div data-testid="document-viewer">{documentUrl}</div>
));

const mockNavigate = jest.fn();

const mockTaxFlowContent = {
  pageTitle: 'Test Tax Filing Process Flow',
  introText: 'This is an introduction to the test tax filing process.',
  steps: [
    { step_id: 'step-1', step_number: 1, title: 'Step One', description: 'Description for step one.', order_sequence: 1 },
    { step_id: 'step-2', step_number: 2, title: 'Step Two', description: 'Description for step two.', order_sequence: 2 },
    { step_id: 'step-3', step_number: 3, title: 'Step Three', description: 'Description for step three.', order_sequence: 3 },
  ],
  documentUrl: 'https://example.com/test-document.pdf',
};

// Mock ResizeObserver for responsive tests
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
global.ResizeObserver = mockResizeObserver;

describe('TaxFilingProcessFlowPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    // Reset window.innerWidth for each test
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  // Positive Tests (Happy Path)
  test('should render loading state initially', async () => {
    (fetchTaxFlowContent as jest.Mock).mockReturnValueOnce(new Promise(() => { })); // Never resolve
    render(
      <BrowserRouter>
        <TaxFilingProcessFlowPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading tax filing process flow...')).toBeInTheDocument();
    expect(trackPageView).toHaveBeenCalledWith('/tax-filing-process-flow');
  });

  test('should render content fetched from CMS successfully', async () => {
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce(mockTaxFlowContent);
    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText(mockTaxFlowContent.pageTitle)).toBeInTheDocument();
    expect(screen.getByText(mockTaxFlowContent.introText)).toBeInTheDocument();
    mockTaxFlowContent.steps.forEach(step => {
      expect(screen.getByText(`Step ${step.step_number}: ${step.title}`)).toBeInTheDocument();
      expect(screen.getByText(step.description)).toBeInTheDocument();
    });
    expect(screen.getByTestId('document-viewer')).toHaveTextContent(mockTaxFlowContent.documentUrl);
    expect(screen.getByRole('button', { name: /Continue to Application/i })).toBeInTheDocument();
    expect(trackPageView).toHaveBeenCalledWith('/tax-filing-process-flow');
  });

  test('should call navigate to /customer-form when continue button is clicked', async () => {
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce(mockTaxFlowContent);
    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });

    const continueButton = screen.getByRole('button', { name: /Continue to Application/i });
    expect(continueButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(continueButton);
    });

    expect(continueButton).toBeDisabled();
    expect(continueButton).toHaveTextContent('Loading...');
    expect(trackEvent).toHaveBeenCalledWith('TaxFilingProcessFlow', 'Continue Button Clicked');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/customer-form');
    }, { timeout: 600 }); // Wait for the setTimeout delay
  });

  test('should display steps in correct order', async () => {
    const orderedSteps = [
      { step_id: 'step-a', step_number: 1, title: 'First Step', description: 'Desc A', order_sequence: 1 },
      { step_id: 'step-b', step_number: 2, title: 'Second Step', description: 'Desc B', order_sequence: 2 },
      { step_id: 'step-c', step_number: 3, title: 'Third Step', description: 'Desc C', order_sequence: 3 },
    ];
    const shuffledSteps = [orderedSteps[2], orderedSteps[0], orderedSteps[1]];
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce({ ...mockTaxFlowContent, steps: shuffledSteps });

    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });

    const stepTitles = screen.getAllByRole('heading', { level: 3 });
    expect(stepTitles[0]).toHaveTextContent(`Step ${orderedSteps[0].step_number}: ${orderedSteps[0].title}`);
    expect(stepTitles[1]).toHaveTextContent(`Step ${orderedSteps[1].step_number}: ${orderedSteps[1].title}`);
    expect(stepTitles[2]).toHaveTextContent(`Step ${orderedSteps[2].step_number}: ${orderedSteps[2].title}`);
  });

  test('should render without DocumentViewer if documentUrl is not provided', async () => {
    const contentWithoutDoc = { ...mockTaxFlowContent, documentUrl: undefined };
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce(contentWithoutDoc);
    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });
    expect(screen.queryByTestId('document-viewer')).not.toBeInTheDocument();
  });

  // Visual characteristics and arrows (User Story 15)
  test('should display flowchart steps with correct visual characteristics and arrows', async () => {
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce(mockTaxFlowContent);
    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });

    const stepElements = screen.getAllByTestId(/^flow-step-/); // Assuming steps have data-testid="flow-step-X"
    expect(stepElements.length).toBe(mockTaxFlowContent.steps.length);

    stepElements.forEach(stepElement => {
      // Assert background color (e.g., blue)
      expect(stepElement).toHaveStyle('background-color: #3b82f6'); // Example Tailwind blue-500
      // Assert border-radius (e.g., rounded)
      expect(stepElement).toHaveStyle('border-radius: 0.5rem'); // Example Tailwind rounded-lg
      // Assert text color (e.g., white)
      expect(stepElement).toHaveStyle('color: #ffffff'); // Example Tailwind text-white
    });

    // Assert presence of downward-pointing arrows (assuming they are rendered as specific elements)
    // This might require a more specific data-testid or class name for the arrow elements
    const arrowElements = screen.queryAllByTestId('flow-arrow'); // Assuming arrows have data-testid="flow-arrow"
    // Expect N-1 arrows for N steps
    expect(arrowElements.length).toBe(mockTaxFlowContent.steps.length - 1);
    arrowElements.forEach(arrow => {
      expect(arrow).toBeInTheDocument();
      // Further assertions could be made on arrow styling if needed, e.g., direction
    });
  });

  // Responsive behavior (User Story 19)
  test('should adjust layout for mobile devices (vertical stacking)', async () => {
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce(mockTaxFlowContent);

    // Simulate mobile screen size
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 400 });

    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });

    // Re-trigger ResizeObserver if component relies on it for layout changes
    // This part is tricky as JSDOM doesn't fully support layout.
    // We'll assert based on classes or styles that would be applied conditionally.
    // Assuming a class like 'flex-col' is applied on small screens to the container of steps.
    const flowContainer = screen.getByTestId('tax-flow-steps-container'); // Assuming a container for steps
    expect(flowContainer).toHaveClass('flex-col'); // Assert vertical stacking class
    expect(flowContainer).not.toHaveClass('lg:flex-row'); // Assert horizontal class is not present

    // Verify text legibility (e.g., font size adjustment, no truncation)
    // This is harder to test directly without visual inspection, but we can check for
    // classes that would ensure legibility.
    const stepTitles = screen.getAllByRole('heading', { level: 3 });
    stepTitles.forEach(title => {
      // Example: check for a class that ensures text wraps or scales
      expect(title).toHaveClass('text-base'); // Example: mobile font size
      expect(title).not.toHaveClass('lg:text-lg'); // Example: desktop font size not present
    });
  });

  // Negative Tests (Error Cases)
  test('should render fallback content when fetchTaxFlowContent fails and provide a "Go to Home" option', async () => {
    (fetchTaxFlowContent as jest.Mock).mockRejectedValueOnce(new Error('CMS is down'));
    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Individual Tax Filing Process Flow (Fallback)')).toBeInTheDocument();
    expect(screen.getByText('We are experiencing issues loading the content. Here is a simplified overview of the process.')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Gather Documents')).toBeInTheDocument();
    expect(screen.getByText('Step 5: Receive Confirmation')).toBeInTheDocument();
    expect(screen.getByTestId('document-viewer')).toHaveTextContent('https://www.africau.edu/images/default/sample.pdf');
    expect(screen.queryByText('Failed to load content. Please try again later.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument();

    // Assert the presence of a "Go to Home" button and its functionality (User Story 12)
    const goToHomeButton = screen.getByRole('button', { name: /Go to Home/i });
    expect(goToHomeButton).toBeInTheDocument();
    fireEvent.click(goToHomeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // Edge Cases
  test('should render with empty steps array', async () => {
    const contentWithNoSteps = { ...mockTaxFlowContent, steps: [] };
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce(contentWithNoSteps);
    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });
    expect(screen.getByText(contentWithNoSteps.pageTitle)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument(); // No steps should be rendered
    expect(screen.queryByText(/Step \d:/)).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('flow-arrow').length).toBe(0); // No arrows if no steps
  });

  test('should render with null content from CMS', async () => {
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce(null);
    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });
    // Should fall back to default titles and intro text
    expect(screen.getByText('Individual Tax Filing Process Flow (Fallback)')).toBeInTheDocument(); // Should hit fallback
    expect(screen.getByText('We are experiencing issues loading the content. Here is a simplified overview of the process.')).toBeInTheDocument();
    // And fallback steps from the error handling
    expect(screen.getByText('Step 1: Gather Documents')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Home/i })).toBeInTheDocument(); // Fallback should include home button
  });

  test('should render with undefined content from CMS', async () => {
    (fetchTaxFlowContent as jest.Mock).mockResolvedValueOnce(undefined);
    await act(async () => {
      render(
        <BrowserRouter>
          <TaxFilingProcessFlowPage />
        </BrowserRouter>
      );
    });
    // Should fall back to default titles and intro text
    expect(screen.getByText('Individual Tax Filing Process Flow (Fallback)')).toBeInTheDocument(); // Should hit fallback
    expect(screen.getByText('We are experiencing issues loading the content. Here is a simplified overview of the process.')).toBeInTheDocument();
    // And fallback steps from the error handling
    expect(screen.getByText('Step 1: Gather Documents')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Home/i })).toBeInTheDocument(); // Fallback should include home button
  });
});