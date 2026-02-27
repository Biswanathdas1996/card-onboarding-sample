import React from 'react';
import styled from 'styled-components';

// Define the type for a single step in the flowchart
export interface TaxFlowStep {
  id: string;
  title: string;
  description: string;
  orderSequence: number;
  imageUrl?: string; // Added for Story 8
  svgData?: string; // Added for Story 8
}

// Styled components for the flowchart elements
const FlowChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 100%;
  max-width: 800px; /* Max width for desktop */
  margin: 0 auto;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const FlowStepWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const FlowStepCard = styled.div`
  background-color: #007bff; /* Blue background */
  color: #ffffff; /* White text */
  border-radius: 15px; /* Rounded corners */
  padding: 20px 25px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 300px; /* Max width for a step card */
  box-sizing: border-box;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
  }

  @media (max-width: 768px) {
    padding: 15px 20px;
    max-width: 90%; /* Adjust for smaller screens */
  }
`;

const StepTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1.2em;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.1em;
  }
`;

const StepDescription = styled.p`
  margin: 0;
  font-size: 0.95em;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.9em;
  }
`;

const DownwardArrow = styled.div`
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 20px solid #007bff; /* Blue arrow */
  margin: 0 0 20px 0; /* Space between arrow and next step */

  @media (max-width: 768px) {
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 18px solid #007bff;
    margin: 0 0 18px 0;
  }
`;

const StepImage = styled.img`
  max-width: 100%;
  height: auto;
  margin-top: 10px;
  border-radius: 8px;
`;

const StepSvgContainer = styled.div`
  margin-top: 10px;
  max-width: 100%;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    max-width: 100%;
    height: auto;
  }
`;

interface TaxFlowChartProps {
  steps: TaxFlowStep[];
}

const TaxFlowChart: React.FC<TaxFlowChartProps> = ({ steps }) => {
  if (!steps || steps.length === 0) {
    // Render a fallback or an empty state if no steps are provided
    return (
      <FlowChartContainer>
        <p>No tax filing steps available at the moment. Please try again later.</p>
      </FlowChartContainer>
    );
  }

  // Sort steps by orderSequence to ensure correct display order
  const sortedSteps = [...steps].sort((a, b) => a.orderSequence - b.orderSequence);

  return (
    <FlowChartContainer aria-label="Tax Filing Process Flowchart">
      {sortedSteps.map((step, index) => (
        <FlowStepWrapper key={step.id}>
          <FlowStepCard role="listitem" aria-labelledby={`step-title-${step.id}`}>
            <StepTitle id={`step-title-${step.id}`}>{step.title}</StepTitle>
            <StepDescription>{step.description}</StepDescription>
            {step.imageUrl && <StepImage src={step.imageUrl} alt={`Visual for ${step.title}`} />}
            {step.svgData && (
              <StepSvgContainer dangerouslySetInnerHTML={{ __html: step.svgData }} />
            )}
          </FlowStepCard>
          {index < sortedSteps.length - 1 && (
            <DownwardArrow aria-hidden="true" /> // Decorative arrow, hidden from screen readers
          )}
        </FlowStepWrapper>
      ))}
    </FlowChartContainer>
  );
};

export default TaxFlowChart;