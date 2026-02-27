/**
 * @file src/types/taxFlow.ts
 * @description TypeScript interfaces for `TaxFilingProcessFlowPage` props, state, and the structure of tax flow steps.
 * This file defines the data structures used across the application for managing and displaying the
 * individual tax filing process flow. It includes interfaces for the properties passed to the
 * `TaxFilingProcessFlowPage` component, its internal state, and the detailed structure of each
 * step within the tax filing process flowchart.
 */

/**
 * @interface TaxFlowStep
 * @description Defines the structure for a single step in the tax filing process flowchart.
 * This interface is used to represent each individual step, including its unique identifier,
 * sequential number, title, detailed description, and the order in which it should appear.
 * It also includes an optional image URL or SVG data for visual representation of the step.
 */
export interface TaxFlowStep {
  /**
   * @property {string} step_id - A unique identifier for the tax flow step.
   * This typically corresponds to a primary key in a database.
   */
  step_id: string;
  /**
   * @property {number} step_number - The numerical identifier for the step, often used for display.
   * This might not be the same as `order_sequence` if steps are reordered.
   */
  step_number: number;
  /**
   * @property {string} title - The main title or heading for the step.
   * This content is typically fetched from a CMS or database.
   */
  title: string;
  /**
   * @property {string} description - A detailed description of the step.
   * This content is typically fetched from a CMS or database and can include rich text.
   */
  description: string;
  /**
   * @property {number} order_sequence - The sequential order of the step within the entire process flow.
   * This is crucial for correct display order.
   */
  order_sequence: number;
  /**
   * @property {string | null} [image_url] - Optional URL to an image associated with this step.
   * This could be an icon, diagram, or other visual aid.
   */
  image_url?: string | null;
  /**
   * @property {string | null} [svg_data] - Optional SVG data directly embedded for visual elements.
   * This can be used for dynamic or lightweight graphics.
   */
  svg_data?: string | null;
}

/**
 * @interface TaxFilingProcessFlowPageProps
 * @description Defines the properties that can be passed to the `TaxFilingProcessFlowPage` component.
 * Currently, this page is designed to fetch its content dynamically, so direct props might be minimal.
 * However, it's good practice to define this for future extensibility, e.g., if a parent component
 * needs to pass a specific flow ID or initial data.
 */
export interface TaxFilingProcessFlowPageProps {
  /**
   * @property {string | null} [flowId] - Optional ID to specify a particular tax filing flow,
   * if the application supports multiple types of tax flows.
   */
  flowId?: string | null;
  /**
   * @property {string | null} [initialTitle] - Optional initial title for the page,
   * which might be overridden by CMS content.
   */
  initialTitle?: string | null;
}

/**
 * @interface TaxFilingProcessFlowPageState
 * @description Defines the internal state managed by the `TaxFilingProcessFlowPage` component.
 * This includes the fetched content from the CMS/API, loading status, and any error information.
 */
export interface TaxFilingProcessFlowPageState {
  /**
   * @property {string} pageTitle - The main title of the tax filing process flow page,
   * typically fetched from the CMS.
   */
  pageTitle: string;
  /**
   * @property {string} introductoryText - The introductory text displayed at the top of the page,
   * typically fetched from the CMS.
   */
  introductoryText: string;
  /**
   * @property {TaxFlowStep[]} flowSteps - An array of `TaxFlowStep` objects representing
   * the individual steps in the tax filing process flowchart.
   */
  flowSteps: TaxFlowStep[];
  /**
   * @property {boolean} isLoading - Indicates whether the page content is currently being loaded
   * from the API or CMS.
   */
  isLoading: boolean;
  /**
   * @property {string | null} error - Stores any error message that occurred during content fetching
   * or processing. Null if no error.
   */
  error: string | null;
  /**
   * @property {boolean} isNavigating - Indicates if the navigation to the next page is in progress.
   * Used to disable buttons and show loading indicators during transition.
   */
  isNavigating: boolean;
}

/**
 * @interface TaxFlowContentResponse
 * @description Defines the expected structure of the JSON response from the
 * `/api/tax-flow-content` endpoint.
 */
export interface TaxFlowContentResponse {
  /**
   * @property {string} pageTitle - The main title for the tax filing process flow page.
   */
  pageTitle: string;
  /**
   * @property {string} introductoryText - The introductory text for the page.
   */
  introductoryText: string;
  /**
   * @property {TaxFlowStep[]} steps - An array of tax flow steps, ordered by `order_sequence`.
   */
  steps: TaxFlowStep[];
  /**
   * @property {string | null} [flowchartImageUrl] - Optional URL to a single image representing the entire flowchart.
   */
  flowchartImageUrl?: string | null;
  /**
   * @property {string | null} [flowchartSvgData] - Optional SVG data representing the entire flowchart.
   */
  flowchartSvgData?: string | null;
}