import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { trackPageView, trackEvent } from '../services/analytics'; // Story 1
import { fetchTaxFlowContent } from '../api/cmsService'; // Story 2, Story 11
import ErrorBoundary from '../components/ErrorBoundary'; // Story 12
import DocumentViewer from '../components/DocumentViewer'; // Story 3

// Define interfaces for CMS content and flowchart steps
interface FlowchartStep {
  step_id: string;
  step_number: number;
  title: string;
  description: string;
  order_sequence: number;
  image_url?: string; // Story 8
  svg_data?: string; // Story 8
}

interface TaxFlowContent {
  pageTitle: string;
  introText: string;
  steps: FlowchartStep[];
  documentUrl?: string; // For the integrated document viewer
}

// Styled Components for responsiveness and consistent styling (Story 13, 19, 20)
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%);
  min-height: 100vh;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1000px;
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  @media (max-width: 768px) {
    padding: 30px 15px;
    border-radius: 16px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 20px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 15px;
  }
`;

const IntroText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
  max-width: 800px;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 30px;
  }
`;

const FlowchartContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 50px;
`;

const FlowchartStepWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 300px; /* Limit step width for better readability */
  margin-bottom: 20px; /* Space between steps */

  &:last-child {
    margin-bottom: 0;
  }
`;

const FlowchartStepBox = styled.div`
  background-color: #6366f1; /* Blue rounded rectangle */
  color: #ffffff;
  border-radius: 12px;
  padding: 20px 25px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  width: 100%;
  box-sizing: border-box;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 10px;
  }

  p {
    font-size: 0.95rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.9);
  }

  @media (max-width: 768px) {
    padding: 15px 20px;
    h3 {
      font-size: 1.1rem;
    }
    p {
      font-size: 0.9rem;
    }
  }
`;

const Arrow = styled.div`
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 15px solid rgba(255, 255, 255, 0.3); /* Downward-pointing arrow */
  margin: 10px 0; /* Space between step and arrow */
`;

const DocumentViewerWrapper = styled.div`
  width: 100%;
  max-width: 900px;
  height: 600px; /* Fixed height for the viewer */
  margin-top: 40px;
  margin-bottom: 50px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background-color: #f0f0f0; /* Fallback background for viewer */

  @media (max-width: 768px) {
    height: 400px;
    margin-top: 30px;
    margin-bottom: 40px;
  }
`;

const ContinueButton = styled.button<{ $isLoading: boolean }>`
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  color: #ffffff;
  padding: 15px 30px;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  min-width: 200px; /* Ensure good tappable area */
  min-height: 44px; /* Ensure good tappable area */

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(90deg, #4a4d9e, #6b45b0);
  }

  ${props => props.$isLoading && `
    background: linear-gradient(90deg, #4a4d9e, #6b45b0);
    cursor: not-allowed;
    position: relative;
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      top: 50%;
      left: 50%;
      margin-left: -8px;
      margin-top: -8px;
      border: 2px solid #fff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    span {
      visibility: hidden;
    }
  `}

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    padding: 12px 25px;
    font-size: 1rem;
    min-width: 180px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  font-size: 1.2rem;
  color: #ef4444;
  text-align: center;

  button {
    margin-top: 20px;
    background-color: #ef4444;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #dc2626;
    }
  }
`;

const TaxFilingProcessFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<TaxFlowContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Fetch content from CMS (Story 2, 11)
  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTaxFlowContent();
      setContent(data);
    } catch (err) {
      console.error('Failed to fetch tax flow content:', err);
      setError('Failed to load content. Please try again later.');
      // Fallback content for robustness (Story 2)
      setContent({
        pageTitle: 'Individual Tax Filing Process Flow (Fallback)',
        introText: 'We are experiencing issues loading the content. Here is a simplified overview of the process.',
        steps: [
          { step_id: 'fallback-1', step_number: 1, title: 'Gather Documents', description: 'Collect all necessary financial documents.' },
          { step_id: 'fallback-2', step_number: 2, title: 'Prepare Your Return', description: 'Fill out the tax forms accurately.' },
          { step_id: 'fallback-3', step_number: 3, title: 'Review and Submit', description: 'Double-check everything before submission.' },
          { step_id: 'fallback-4', step_number: 4, title: 'Pay Taxes (If Applicable)', description: 'Settle any outstanding tax liabilities.' },
          { step_id: 'fallback-5', step_number: 5, title: 'Receive Confirmation', description: 'Get confirmation of your filing.' },
        ],
        documentUrl: 'https://www.africau.edu/images/default/sample.pdf' // A generic sample PDF for fallback
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
    trackPageView('/tax-filing-process-flow'); // Story 1
  }, [loadContent]);

  const handleContinue = useCallback(() => {
    setIsNavigating(true);
    trackEvent('TaxFilingProcessFlow', 'Continue Button Clicked'); // Story 1
    // Simulate a slight delay for smooth transition and loading indicator (Story 18)
    setTimeout(() => {
      navigate('/customer-form'); // Story 14, 16
    }, 500);
  }, [navigate]);

  if (loading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <LoadingState>Loading tax filing process flow... 
</LoadingState>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (error && !content) { // Only show error if no fallback content could be loaded
    return (
      <PageContainer>
        <ContentWrapper>
          <ErrorState>
            <p>{error}</p>
            <button onClick={loadContent}>Retry</button>
          </ErrorState>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <ErrorBoundary pageName="TaxFilingProcessFlowPage"> {/* Story 12 */}
      <PageContainer>
        <ContentWrapper>
          <Title>{content?.pageTitle || 'Individual Tax Filing Process Flow'}</Title> {/* Story 20 */}
          <IntroText>{content?.introText || 'Understand the step-by-step process for filing your individual taxes. This guide will walk you through each stage, ensuring a smooth and compliant submission.'}</IntroText>

          <FlowchartContainer>
            {content?.steps && content.steps.sort((a, b) => a.order_sequence - b.order_sequence).map((step, index) => (
              <FlowchartStepWrapper key={step.step_id}>
                <FlowchartStepBox>
                  <h3>Step {step.step_number}: {step.title}</h3>
                  <p>{step.description}</p>
                </FlowchartStepBox>
                {index < content.steps.length - 1 && <Arrow />}
              </FlowchartStepWrapper>
            ))}
          </FlowchartContainer>

          {content?.documentUrl && (
            <DocumentViewerWrapper>
              <DocumentViewer documentUrl={content.documentUrl} /> {/* Story 3 */}
            </DocumentViewerWrapper>
          )}

          <ContinueButton onClick={handleContinue} disabled={isNavigating} $isLoading={isNavigating}>
            <span>{isNavigating ? 'Loading...' : 'Continue to Application'}</span> {/* Story 14, 18 */}
          </ContinueButton>
        </ContentWrapper>
      </PageContainer>
    </ErrorBoundary>
  );
};

export default TaxFilingProcessFlowPage;