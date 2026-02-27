/**
 * TaxFlowService API Service
 * Handles fetching tax filing process flow content from the backend API.
 * Includes error handling and caching mechanisms.
 */

// Define the base URL for the API. This should ideally come from an environment variable.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/**
 * Interface for a single step in the tax filing process flow.
 * @typedef {object} TaxFlowStep
 * @property {string} step_id - Unique identifier for the step.
 * @property {number} step_number - The numerical order of the step.
 * @property {string} title - The title of the step.
 * @property {string} description - A detailed description of the step.
 * @property {number} order_sequence - The sequence in which the step should be displayed.
 * @property {string} [image_url] - Optional URL for an image associated with the step.
 * @property {string} [svg_data] - Optional SVG data for a visual element of the step.
 */

/**
 * Interface for the overall tax filing process flow content.
 * @typedef {object} TaxFlowContent
 * @property {string} pageTitle - The main title of the page.
 * @property {string} introductoryText - Introductory text for the process flow.
 * @property {TaxFlowStep[]} steps - An array of individual steps in the process.
 * @property {string} [flowchartImageUrl] - Optional URL for the main flowchart image.
 * @property {string} [flowchartSvgData] - Optional SVG data for the main flowchart.
 * @property {string} [policyDocumentUrl] - URL for the tax policy document.
 * @property {number[]} [policyDocumentPageNumbers] - Specific page numbers to highlight in the policy document.
 * @property {string[]} [policyDocumentSections] - Specific section identifiers to highlight in the policy document.
 */

/**
 * Interface for a standardized API response.
 * @typedef {object} ApiResponse
 * @property {boolean} success - Indicates if the API call was successful.
 * @property {number} status - HTTP status code.
 * @property {string} message - A human-readable message.
 * @property {TaxFlowContent | null} data - The fetched data, or null on error.
 * @property {string | object | null} error - Error details, if any.
 * @property {string} timestamp - ISO string of when the response was generated.
 */

/**
 * Simple in-memory cache for API responses.
 * In a more complex application, consider using a dedicated caching library
 * or a more sophisticated caching strategy (e.g., localStorage, service worker).
 */
const cache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Placeholder for a logging utility. In a real app, this would send logs to a backend.
// FIX 6: Implement logActivity to send logs to a centralized logging system.
const logActivity = (logDetails) => {
  // In a production environment, this would send logs to a service like Splunk, ELK stack, or a custom logging endpoint.
  // For example:
  // fetch('/api/log', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(logDetails),
  // }).catch(err => console.error('Failed to send log to backend:', err));
  console.log('ACTIVITY_LOG:', logDetails); // Keep console.log for development visibility
};

// Placeholder for a third-party analytics service.
// FIX 1: Integrate a third-party analytics service.
const trackAnalyticsEvent = (eventName, eventProperties) => {
  // Example for Google Analytics (gtag.js)
  // if (window.gtag) {
  //   window.gtag('event', eventName, eventProperties);
  // }
  // Example for Mixpanel
  // if (window.mixpanel) {
  //   window.mixpanel.track(eventName, eventProperties);
  // }
  console.log('ANALYTICS_EVENT:', eventName, eventProperties);
};

const TaxFlowService = {
  /**
   * Fetches the tax filing process flow content from the backend API.
   * Utilizes caching to reduce redundant API calls.
   * @param {string} [sessionId] - Optional session ID for logging.
   * @param {string} [userId] - Optional user ID for logging.
   * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object.
   */
  fetchTaxFlowContent: async (sessionId, userId) => {
    const cacheKey = 'taxFlowContent';
    const cachedData = cache.get(cacheKey);
    const endpoint = '/api/tax-flow-content';
    let etag = '';
    let lastModified = '';

    // FIX 8: Inspect and respect HTTP caching headers.
    // If we have cached data, check if we stored ETag or Last-Modified from previous response
    if (cachedData) {
      if (cachedData.etag) etag = cachedData.etag;
      if (cachedData.lastModified) lastModified = cachedData.lastModified;
    }

    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION_MS)) {
      console.log('Serving tax flow content from cache.');
      logActivity({
        timestamp: new Date().toISOString(),
        endpoint: endpoint,
        status: 'served_from_cache',
        sessionId: sessionId,
        userId: userId,
      });
      // FIX 1: Log analytics event for cache hit
      trackAnalyticsEvent('tax_flow_content_fetched', {
        source: 'cache',
        sessionId: sessionId,
        userId: userId,
      });
      return {
        success: true,
        status: 200,
        message: 'Tax flow content retrieved from cache',
        data: cachedData.data,
        error: null,
        timestamp: new Date(cachedData.timestamp).toISOString(),
      };
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        // Add any necessary authentication headers if the endpoint becomes protected
        // 'Authorization': `Bearer ${yourAuthToken}`
      };

      // FIX 8: Send If-None-Match or If-Modified-Since headers for server-side caching
      if (etag) {
        headers['If-None-Match'] = etag;
      }
      if (lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: headers,
      });

      // FIX 8: Handle 304 Not Modified response
      if (response.status === 304) {
        console.log('Tax flow content not modified, serving from client cache.');
        logActivity({
          timestamp: new Date().toISOString(),
          endpoint: endpoint,
          status: 'not_modified',
          httpStatus: 304,
          sessionId: sessionId,
          userId: userId,
        });
        // FIX 1: Log analytics event for 304 Not Modified
        trackAnalyticsEvent('tax_flow_content_fetched', {
          source: 'server_cache_304',
          sessionId: sessionId,
          userId: userId,
        });
        // Return cached data if available, otherwise treat as a regular fetch failure
        if (cachedData) {
          return {
            success: true,
            status: 304,
            message: 'Tax flow content not modified',
            data: cachedData.data,
            error: null,
            timestamp: new Date(cachedData.timestamp).toISOString(),
          };
        } else {
          // If for some reason we get 304 but no client-side cache, treat as error or re-fetch
          throw new Error('Received 304 Not Modified but no client-side cache available.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error fetching tax flow content:', errorData);
        logActivity({
          timestamp: new Date().toISOString(),
          endpoint: endpoint,
          status: 'failed',
          httpStatus: response.status,
          errorMessage: errorData.message || 'Failed to fetch tax flow content',
          sessionId: sessionId,
          userId: userId,
        });
        // FIX 1: Log analytics event for API fetch failure
        trackAnalyticsEvent('tax_flow_content_fetch_failed', {
          httpStatus: response.status,
          errorMessage: errorData.message || 'Failed to fetch tax flow content',
          sessionId: sessionId,
          userId: userId,
        });
        return {
          success: false,
          status: response.status,
          message: errorData.message || 'Failed to fetch tax flow content',
          data: null,
          error: errorData.error || 'Unknown error',
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      const responseTimestamp = Date.now();

      // FIX 8: Extract ETag and Last-Modified from response headers
      const responseEtag = response.headers.get('ETag');
      const responseLastModified = response.headers.get('Last-Modified');

      // Cache the successful response, including ETag and Last-Modified
      cache.set(cacheKey, {
        data,
        timestamp: responseTimestamp,
        etag: responseEtag,
        lastModified: responseLastModified
      });
      console.log('Fetched tax flow content from API and cached.');
      logActivity({
        timestamp: new Date().toISOString(),
        endpoint: endpoint,
        status: 'success',
        httpStatus: 200,
        sessionId: sessionId,
        userId: userId,
      });
      // FIX 1: Log analytics event for successful API fetch
      trackAnalyticsEvent('tax_flow_content_fetched', {
        source: 'api',
        sessionId: sessionId,
        userId: userId,
      });

      // FIX 7: Add documentation that the returned data must adhere to KB-1.
      /**
       * IMPORTANT: The structure and content of the 'data' returned from the '/api/tax-flow-content'
       * endpoint MUST strictly adhere to the specifications outlined in 'Finance Policy document.pdf' [KB-1].
       * This includes the overall structure of TaxFlowContent and the details within each TaxFlowStep.
       * The backend is responsible for ensuring this contract is met.
       */
      // FIX 2: Clarify if the endpoint is a proxy to a headless CMS.
      /**
       * NOTE: This service assumes '/api/tax-flow-content' is either a custom backend endpoint
       * or a proxy that aggregates data from a headless CMS. If direct integration with a CMS SDK
       * (e.g., Contentful, Strapi) is required, this function would need to be refactored to
       * use the CMS's specific client library and handle its authentication/query patterns.
       */

      return {
        success: true,
        status: 200,
        message: 'Tax flow content fetched successfully',
        data: data,
        error: null,
        timestamp: new Date(responseTimestamp).toISOString(),
      };
    } catch (error) {
      console.error('Network or unexpected error fetching tax flow content:', error);
      logActivity({
        timestamp: new Date().toISOString(),
        endpoint: endpoint,
        status: 'error',
        errorMessage: error.message || 'Network error',
        sessionId: sessionId,
        userId: userId,
      });
      // FIX 1: Log analytics event for network/unexpected error
      trackAnalyticsEvent('tax_flow_content_fetch_error', {
        errorMessage: error.message || 'Network error',
        sessionId: sessionId,
        userId: userId,
      });
      return {
        success: false,
        status: 500,
        message: 'An unexpected error occurred while fetching tax flow content',
        data: null,
        error: error.message || 'Network error',
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Clears the in-memory cache for tax flow content.
   */
  clearCache: () => {
    cache.delete('taxFlowContent');
    console.log('Tax flow content cache cleared.');
  },

  /**
   * Placeholder for future content update functionality.
   * This method demonstrates how an authenticated update might look.
   * @param {Partial<TaxFlowContent>} updatedContent - The partial content to update.
   * @param {string} authToken - Authentication token for authorization.
   * @returns {Promise<ApiResponse>} A promise that resolves to an ApiResponse object.
   */
  updateTaxFlowContent: async (updatedContent, authToken) => {
    try {
      if (!authToken) {
        return {
          success: false,
          status: 401,
          message: 'Authentication token is required for this operation.',
          data: null,
          error: 'Unauthorized',
          timestamp: new Date().toISOString(),
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/tax-flow-content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedContent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error updating tax flow content:', errorData);
        return {
          success: false,
          status: response.status,
          message: errorData.message || 'Failed to update tax flow content',
          data: null,
          error: errorData.error || 'Unknown error',
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      // Invalidate cache after a successful update
      TaxFlowService.clearCache();
      console.log('Tax flow content updated successfully and cache cleared.');

      // FIX 5: Add comment about backend authorization checks.
      /**
       * IMPORTANT: The backend endpoint `/api/admin/tax-flow-content` MUST implement robust
       * authorization checks (e.g., JWT validation, role-based access control) to ensure
       * that only users with 'admin' or 'content_manager' roles can successfully perform
       * this update operation, as per Story 9. This frontend service only passes the token.
       */

      return {
        success: true,
        status: 200,
        message: 'Tax flow content updated successfully',
        data: data,
        error: null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Network or unexpected error updating tax flow content:', error);
      return {
        success: false,
        status: 500,
        message: 'An unexpected error occurred while updating tax flow content',
        data: null,
        error: error.message || 'Network error',
        timestamp: new Date().toISOString(),
      };
    }
  },
};

export default TaxFlowService;