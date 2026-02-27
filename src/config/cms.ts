import dotenv from 'dotenv';

dotenv.config();

interface TaxFlowContent {
  title: string;
  steps: Array<{
    step_id: string;
    step_number: number;
    title: string;
    description: string;
    order_sequence: number;
    image_url?: string;
    svg_data?: string;
  }>;
}

interface FinancePolicyDocumentContent {
  title: string;
  content: string; // This could be a URL to a PDF, or actual document content
  documentUrl?: string; // Added to support a URL for the document
}

interface CmsConfig {
  cmsBaseUrl: string;
  cmsApiKey: string;
  endpoints: {
    taxFlowContent: string;
    financePolicyDocument: string;
    analyticsEvent: string;
  };
  contentTypes: {
    taxProcessStep: string;
    document: string;
  };
  fallbackContent: {
    taxFlow: TaxFlowContent; // Changed to match the new interface
    financePolicyDocument: FinancePolicyDocumentContent; // Changed to match the new interface
    analyticsEvent: Record<string, unknown>;
  };
  analytics: {
    serviceProvider: 'GoogleAnalytics' | 'Mixpanel' | 'Amplitude' | 'None';
    trackingId: string;
  };
}

// Validate CMS_API_KEY at startup
if (!process.env.CMS_API_KEY) {
  // In a production environment, you might want to throw an error and exit
  // console.error('CRITICAL: CMS_API_KEY is not defined. Application cannot start.');
  // process.exit(1);
  console.warn('CMS_API_KEY is not defined. Using an empty string. This should be set in production.');
}

const cmsConfig: CmsConfig = {
  cmsBaseUrl: process.env.CMS_BASE_URL || 'https://api.example-cms.com/v1',
  cmsApiKey: process.env.CMS_API_KEY || '', // Removed hardcoded default, now defaults to empty string if not set
  endpoints: {
    taxFlowContent: '/tax-filing-process-flow',
    financePolicyDocument: '/documents/finance-policy-document', // Changed to be a CMS entry, not direct PDF path
    analyticsEvent: '/analytics/event', // Endpoint for server-side analytics if needed
  },
  contentTypes: {
    taxProcessStep: 'taxProcessStep',
    document: 'document',
  },
  fallbackContent: {
    taxFlow: { // Updated to match TaxFlowContent interface
      title: 'Individual Tax Filing Process Flow (Fallback)',
      steps: [
        {
          step_id: 'fb-step-1',
          step_number: 1,
          title: 'Gather Documents',
          description: 'Collect all necessary financial documents like W-2s, 1099s, and receipts.',
          order_sequence: 1,
        },
        {
          step_id: 'fb-step-2',
          step_number: 2,
          title: 'Determine Filing Status',
          description: 'Choose your appropriate filing status: Single, Married Filing Jointly, etc.',
          order_sequence: 2,
        },
        {
          step_id: 'fb-step-3',
          step_number: 3,
          title: 'Calculate Income',
          description: 'Sum up all sources of income for the tax year.',
          order_sequence: 3,
        },
        {
          step_id: 'fb-step-4',
          step_number: 4,
          title: 'Claim Deductions & Credits',
          description: 'Identify eligible deductions and credits to reduce your taxable income.',
          order_sequence: 4,
        },
        {
          step_id: 'fb-step-5',
          step_number: 5,
          title: 'File Your Return',
          description: 'Submit your completed tax return to the relevant tax authority.',
          order_sequence: 5,
        },
      ],
    },
    financePolicyDocument: { // Updated to match FinancePolicyDocumentContent interface
      title: 'Finance Policy Document (Fallback)',
      content: 'This is a fallback content for the finance policy document. The actual document could not be loaded at this time. Please try again later or contact support.',
      documentUrl: '/fallback-documents/finance-policy-document-fallback.pdf', // Example fallback PDF URL
    },
    analyticsEvent: {
      status: 'failed',
      message: 'Analytics event could not be sent to CMS.'
    }
  },
  analytics: {
    serviceProvider: (process.env.ANALYTICS_PROVIDER as CmsConfig['analytics']['serviceProvider']) || 'None',
    trackingId: process.env.ANALYTICS_TRACKING_ID || '',
  },
};

/**
 * Fetches content from the CMS.
 * @param endpoint The specific CMS endpoint to fetch.
 * @returns A Promise resolving to the fetched data, or the fallback content on error.
 */
export async function fetchCmsContent<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${cmsConfig.cmsBaseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${cmsConfig.cmsApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`CMS API error for ${endpoint}: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch CMS content: ${response.statusText}`);
    }

    const data: T = await response.json();
    return data;
  } catch (error: unknown) {
    console.error(`Error fetching CMS content from ${endpoint}:`, error instanceof Error ? error.message : String(error));
    // Return appropriate fallback based on endpoint
    if (endpoint === cmsConfig.endpoints.taxFlowContent) {
      // Ensure the fallback strictly adheres to the expected TaxFlowContent interface
      return cmsConfig.fallbackContent.taxFlow as T;
    } else if (endpoint === cmsConfig.endpoints.financePolicyDocument) {
      // Ensure the fallback strictly adheres to the expected FinancePolicyDocumentContent interface
      return cmsConfig.fallbackContent.financePolicyDocument as T;
    } else if (endpoint === cmsConfig.endpoints.analyticsEvent) {
      return cmsConfig.fallbackContent.analyticsEvent as T;
    }
    // For other endpoints, return a generic error message or a default empty object
    console.warn(`No specific fallback content defined for endpoint: ${endpoint}. Returning a generic error message.`);
    throw new Error(`CMS content unavailable for ${endpoint} and no specific fallback provided.`);
  }
}

/**
 * Sends an analytics event to the configured service.
 * This is a client-side function, but the configuration lives here.
 * @param eventName The name of the event.
 * @param eventProperties Optional properties for the event.
 */
export function sendAnalyticsEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
  if (cmsConfig.analytics.serviceProvider === 'GoogleAnalytics' && cmsConfig.analytics.trackingId) {
    // Example for Google Analytics (gtag.js)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventProperties);
    } else {
      console.warn('Google Analytics gtag not initialized.');
    }
  } else if (cmsConfig.analytics.serviceProvider === 'Mixpanel' && cmsConfig.analytics.trackingId) {
    // Example for Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(eventName, eventProperties);
    } else {
      console.warn('Mixpanel not initialized.');
    }
  } else if (cmsConfig.analytics.serviceProvider === 'Amplitude' && cmsConfig.analytics.trackingId) {
    // Example for Amplitude
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.getInstance().logEvent(eventName, eventProperties);
    } else {
      console.warn('Amplitude not initialized.');
    }
  } else if (cmsConfig.analytics.serviceProvider === 'None') {
    console.info(`Analytics event "${eventName}" not sent: Analytics provider is set to 'None'.`, eventProperties);
  } else {
    console.warn(`Analytics event "${eventName}" not sent: Unknown or unconfigured analytics provider "${cmsConfig.analytics.serviceProvider}".`, eventProperties);
  }
}

export default cmsConfig;