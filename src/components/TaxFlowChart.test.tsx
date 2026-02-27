import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaxFlowChart, { TaxFlowStep } from './TaxFlowChart';

describe('TaxFlowChart', () => {
  const mockSteps: TaxFlowStep[] = [
    { id: '1', title: 'Step 1 Title', description: 'Description for step 1.', orderSequence: 1 },
    { id: '2', title: 'Step 2 Title', description: 'Description for step 2.', orderSequence: 2 },
    { id: '3', title: 'Step 3 Title', description: 'Description for step 3.', orderSequence: 3 },
  ];

  // Test 1: Renders correctly with a basic set of steps
  test('should render the flowchart with provided steps', () => {
    render(<TaxFlowChart steps={mockSteps} />);

    expect(screen.getByLabelText('Tax Filing Process Flowchart')).toBeInTheDocument();
    expect(screen.getByText('Step 1 Title')).toBeInTheDocument();
    expect(screen.getByText('Description for step 1.')).toBeInTheDocument();
    expect(screen.getByText('Step 2 Title')).toBeInTheDocument();
    expect(screen.getByText('Description for step 2.')).toBeInTheDocument();
    expect(screen.getByText('Step 3 Title')).toBeInTheDocument();
    expect(screen.getByText('Description for step 3.')).toBeInTheDocument();

    // Check for arrows between steps
    const arrows = screen.getAllByRole('listitem').slice(0, -1); // Arrows are between steps, not after the last one
    expect(arrows.length).toBe(mockSteps.length - 1);
  });

  // Test 2: Renders steps in the correct order based on orderSequence
  test('should render steps in ascending order of orderSequence', () => {
    const unorderedSteps: TaxFlowStep[] = [
      { id: 'b', title: 'Step B', description: 'Desc B', orderSequence: 2 },
      { id: 'a', title: 'Step A', description: 'Desc A', orderSequence: 1 },
      { id: 'c', title: 'Step C', description: 'Desc C', orderSequence: 3 },
    ];
    render(<TaxFlowChart steps={unorderedSteps} />);

    const stepTitles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(stepTitles).toEqual(['Step A', 'Step B', 'Step C']);
  });

  // Test 3: Renders fallback message when no steps are provided (empty array)
  test('should display a fallback message when no steps are provided', () => {
    render(<TaxFlowChart steps={[]} />);
    expect(screen.getByText('No tax filing steps available at the moment. Please try again later.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tax Filing Process Flowchart')).not.toBeInTheDocument(); // Container should not have aria-label if no steps
  });

  // Test 4: Renders fallback message when steps prop is undefined
  test('should display a fallback message when steps prop is undefined', () => {
    // @ts-ignore: Intentionally passing undefined for testing edge case
    render(<TaxFlowChart steps={undefined} />);
    expect(screen.getByText('No tax filing steps available at the moment. Please try again later.')).toBeInTheDocument();
  });

  // Test 5: Renders fallback message when steps prop is null
  test('should display a fallback message when steps prop is null', () => {
    // @ts-ignore: Intentionally passing null for testing edge case
    render(<TaxFlowChart steps={null} />);
    expect(screen.getByText('No tax filing steps available at the moment. Please try again later.')).toBeInTheDocument();
  });

  // Test 6: Renders a single step correctly without an arrow
  test('should render a single step without a downward arrow', () => {
    const singleStep: TaxFlowStep[] = [
      { id: '1', title: 'Only Step', description: 'This is the only step.', orderSequence: 1 },
    ];
    render(<TaxFlowChart steps={singleStep} />);

    expect(screen.getByText('Only Step')).toBeInTheDocument();
    expect(screen.queryByLabelText('Decorative arrow, hidden from screen readers')).not.toBeInTheDocument();
  });

  // Test 7: Renders image when imageUrl is provided
  test('should render an image if imageUrl is provided', () => {
    const stepsWithImage: TaxFlowStep[] = [
      {
        id: '1',
        title: 'Step with Image',
        description: 'Description with an image.',
        orderSequence: 1,
        imageUrl: 'https://example.com/image.png',
      },
    ];
    render(<TaxFlowChart steps={stepsWithImage} />);

    const image = screen.getByAltText('Visual for Step with Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.png');
  });

  // Test 8: Renders SVG when svgData is provided
  test('should render SVG data if svgData is provided', () => {
    const stepsWithSvg: TaxFlowStep[] = [
      {
        id: '1',
        title: 'Step with SVG',
        description: 'Description with SVG.',
        orderSequence: 1,
        svgData: '<svg data-testid="test-svg" width="10" height="10"><circle cx="5" cy="5" r="4" fill="red"/></svg>',
      },
    ];
    render(<TaxFlowChart steps={stepsWithSvg} />);

    const svgContainer = screen.getByTestId('test-svg').closest('div');
    expect(svgContainer).toBeInTheDocument();
    expect(svgContainer).toHaveAttribute('dangerouslysetinnerhtml'); // Check for the attribute that indicates innerHTML usage
    expect(screen.getByTestId('test-svg')).toBeInTheDocument();
  });

  // Test 9: Renders both image and SVG if both are provided (SVG takes precedence visually in the current implementation)
  test('should render both image and SVG if both are provided', () => {
    const stepsWithBoth: TaxFlowStep[] = [
      {
        id: '1',
        title: 'Step with Both',
        description: 'Description with both image and SVG.',
        orderSequence: 1,
        imageUrl: 'https://example.com/image.png',
        svgData: '<svg data-testid="test-svg-both" width="10" height="10"><rect x="0" y="0" width="10" height="10" fill="green"/></svg>',
      },
    ];
    render(<TaxFlowChart steps={stepsWithBoth} />);

    expect(screen.getByAltText('Visual for Step with Both')).toBeInTheDocument();
    expect(screen.getByTestId('test-svg-both')).toBeInTheDocument();
  });

  // Test 10: Accessibility attributes for step title and card
  test('should have correct accessibility attributes for step cards and titles', () => {
    render(<TaxFlowChart steps={mockSteps} />);

    const step1Card = screen.getByRole('listitem', { name: /Step 1 Title/i });
    expect(step1Card).toBeInTheDocument();
    expect(step1Card).toHaveAttribute('aria-labelledby', 'step-title-1');

    const step1Title = screen.getByRole('heading', { level: 3, name: 'Step 1 Title' });
    expect(step1Title).toBeInTheDocument();
    expect(step1Title).toHaveAttribute('id', 'step-title-1');
  });

  // Test 11: DownwardArrow has aria-hidden="true"
  test('DownwardArrow should have aria-hidden="true"', () => {
    render(<TaxFlowChart steps={mockSteps} />);
    const arrows = screen.getAllByRole('listitem').slice(0, -1); // Get all arrows
    arrows.forEach((arrow) => {
      // The arrow is a sibling of the FlowStepCard, so we need to find it relative to the wrapper
      const arrowElement = arrow.nextElementSibling;
      expect(arrowElement).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // Test 12: No image or SVG when imageUrl and svgData are not provided
  test('should not render image or SVG if neither imageUrl nor svgData are provided', () => {
    const stepsWithoutMedia: TaxFlowStep[] = [
      { id: '1', title: 'No Media Step', description: 'Just text.', orderSequence: 1 },
    ];
    render(<TaxFlowChart steps={stepsWithoutMedia} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByTestId('test-svg')).not.toBeInTheDocument();
  });
});