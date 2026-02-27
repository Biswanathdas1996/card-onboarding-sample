import TaxFlowService from './TaxFlowService';
import * as Analytics from '../utils/analytics'; // Assuming an analytics utility

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console.log and console.error to prevent test output pollution
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock the analytics utility
jest.mock('../utils/analytics', () => ({
  trackEvent: jest.fn(),
  logError: jest.fn(),
}));

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  jest.useFakeTimers(); // Enable fake timers for cache expiration tests
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  jest.useRealTimers(); // Restore real timers
});

// Mock environment variable
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules(); // Most important - it clears the cache
  process.env = {
    ...originalEnv,
    REACT_APP_API_BASE_URL: 'http://test-api.com',
  };
  TaxFlowService.clearCache(); // Clear cache before each test
  Analytics.trackEvent.mockClear(); // Clear mock calls for analytics
  Analytics.logError.mockClear(); // Clear mock calls for error logging
});

afterEach(() => {
  process.env = originalEnv; // Restore original env
  jest.clearAllMocks();
});

const mockTaxFlowContent = {
  pageTitle: 'Test Tax Flow',
  introductoryText: 'Welcome to the test tax flow.',
  steps: [
    {
      step_id: 'step1',
      step_number: 1,
      title: 'Step One',
      description: 'Description for step one.',
      order_sequence: 1,
    },
    {
      step_id: 'step2',
      step_number: 2,
      title: 'Step Two',
      description: 'Description for step two.',
      order_sequence: 2,
    },
  ],
  policyDocumentUrl: 'http://test.com/policy.pdf',
};

describe('TaxFlowService', () => {
  describe('fetchTaxFlowContent', () => {
    it('should fetch tax flow content successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaxFlowContent),
        headers: {
          get: (header) => {
            if (header === 'ETag') return 'W/"abc"';
            if (header === 'Last-Modified') return 'Mon, 01 Jan 2024 00:00:00 GMT';
            return null;
          },
        },
      });

      const response = await TaxFlowService.fetchTaxFlowContent('session123', 'user456');

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/api/tax-flow-content', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockTaxFlowContent);
      expect(response.message).toBe('Tax flow content fetched successfully');
      expect(Analytics.trackEvent).toHaveBeenCalledWith('tax_flow_content_fetched', {
        source: 'api',
        sessionId: 'session123',
        userId: 'user456',
      });
      expect(console.log).toHaveBeenCalledWith('Fetched tax flow content from API and cached.');
    });

    it('should return cached data on subsequent calls within cache duration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaxFlowContent),
        headers: {
          get: (header) => {
            if (header === 'ETag') return 'W/"abc"';
            if (header === 'Last-Modified') return 'Mon, 01 Jan 2024 00:00:00 GMT';
            return null;
          },
        },
      });

      // First call, populates cache
      await TaxFlowService.fetchTaxFlowContent('session123', 'user456');
      mockFetch.mockClear(); // Clear mock to ensure it's not called again
      Analytics.trackEvent.mockClear(); // Clear analytics mock for this part of the test

      // Second call, should use cache
      const response = await TaxFlowService.fetchTaxFlowContent('session123', 'user456');

      expect(mockFetch).not.toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockTaxFlowContent);
      expect(response.message).toBe('Tax flow content retrieved from cache');
      expect(Analytics.trackEvent).toHaveBeenCalledWith('tax_flow_content_fetched', {
        source: 'cache',
        sessionId: 'session123',
        userId: 'user456',
      });
      expect(console.log).toHaveBeenCalledWith('Serving tax flow content from cache.');
    });

    it('should re-fetch data if cache is expired', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaxFlowContent),
        headers: {
          get: (header) => {
            if (header === 'ETag') return 'W/"abc"';
            if (header === 'Last-Modified') return 'Mon, 01 Jan 2024 00:00:00 GMT';
            return null;
          },
        },
      });

      // First call, populates cache
      await TaxFlowService.fetchTaxFlowContent('session123', 'user456');
      Analytics.trackEvent.mockClear(); // Clear analytics mock for this part of the test

      // Advance timers past cache duration
      jest.advanceTimersByTime(5 * 60 * 1000 + 1);

      const updatedContent = { ...mockTaxFlowContent, pageTitle: 'Updated Title' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updatedContent),
        headers: {
          get: (header) => {
            if (header === 'ETag') return 'W/"def"';
            if (header === 'Last-Modified') return 'Tue, 02 Jan 2024 00:00:00 GMT';
            return null;
          },
        },
      });

      // Second call, should re-fetch
      const response = await TaxFlowService.fetchTaxFlowContent('session123', 'user456');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(updatedContent);
      expect(Analytics.trackEvent).toHaveBeenCalledWith('tax_flow_content_fetched', {
        source: 'api',
        sessionId: 'session123',
        userId: 'user456',
      });
      expect(console.log).toHaveBeenCalledWith('Fetched tax flow content from API and cached.');
    });

    it('should handle 304 Not Modified response when client has cached data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaxFlowContent),
        headers: {
          get: (header) => {
            if (header === 'ETag') return 'W/"abc"';
            if (header === 'Last-Modified') return 'Mon, 01 Jan 2024 00:00:00 GMT';
            return null;
          },
        },
      });

      // First call to populate the cache
      await TaxFlowService.fetchTaxFlowContent('session123', 'user456');
      mockFetch.mockClear(); // Clear mock for the next fetch
      Analytics.trackEvent.mockClear(); // Clear analytics mock for this part of the test

      // Now, mock the 304 response for the subsequent call
      mockFetch.mockResolvedValueOnce({
        ok: false, // 304 is not "ok" in fetch, but handled specifically
        status: 304,
        json: () => Promise.resolve({}), // No body for 304
        headers: {
          get: (header) => {
            if (header === 'ETag') return 'W/"abc"';
            if (header === 'Last-Modified') return 'Mon, 01 Jan 2024 00:00:00 GMT';
            return null;
          },
        },
      });

      const response = await TaxFlowService.fetchTaxFlowContent('session123', 'user456');

      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/api/tax-flow-content', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'If-None-Match': 'W/"abc"',
          'If-Modified-Since': 'Mon, 01 Jan 2024 00:00:00 GMT',
        },
      });
      expect(response.success).toBe(true);
      expect(response.status).toBe(304);
      expect(response.data).toEqual(mockTaxFlowContent);
      expect(response.message).toBe('Tax flow content not modified');
      expect(Analytics.trackEvent).toHaveBeenCalledWith('tax_flow_content_fetched', {
        source: 'server_cache_304',
        sessionId: 'session123',
        userId: 'user456',
      });
      expect(console.log).toHaveBeenCalledWith('Tax flow content not modified, serving from client cache.');
    });

    it('should re-fetch if 304 Not Modified but no client-side cache available', async () => {
      // Ensure cache is empty
      TaxFlowService.clearCache();

      // Mock the initial 304 response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 304,
        json: () => Promise.resolve({}),
        headers: {
          get: () => null,
        },
      });

      // Mock a successful re-fetch response
      const refetchedContent = { ...mockTaxFlowContent, pageTitle: 'Refetched Content' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(refetchedContent),
        headers: {
          get: (header) => {
            if (header === 'ETag') return 'W/"def"';
            if (header === 'Last-Modified') return 'Tue, 02 Jan 2024 00:00:00 GMT';
            return null;
          },
        },
      });

      const response = await TaxFlowService.fetchTaxFlowContent('session123', 'user456');

      expect(mockFetch).toHaveBeenCalledTimes(2); // Should attempt fetch twice
      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(refetchedContent);
      expect(response.message).toBe('Tax flow content fetched successfully');
      expect(Analytics.trackEvent).toHaveBeenCalledWith('tax_flow_content_fetched', {
        source: 'api',
        sessionId: 'session123',
        userId: 'user456',
      });
      expect(console.log).toHaveBeenCalledWith('Received 304 Not Modified but no client-side cache available. Re-fetching content.');
      expect(Analytics.logError).not.toHaveBeenCalled(); // No error should be logged for this scenario
    });

    it('should handle API error responses (e.g., 404)', async () => {
      const errorMessage = 'Content not found';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: errorMessage, error: 'Not Found' }),
        headers: { get: () => null },
      });

      const response = await TaxFlowService.fetchTaxFlowContent('session123', 'user456');

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.message).toBe(errorMessage);
      expect(response.data).toBeNull();
      expect(response.error).toBe('Not Found');
      expect(Analytics.logError).toHaveBeenCalledWith(
        'API Error fetching tax flow content:',
        { message: errorMessage, error: 'Not Found' }
      );
      expect(Analytics.trackEvent).toHaveBeenCalledWith('tax_flow_content_fetch_failed', {
        httpStatus: 404,
        errorMessage: errorMessage,
        sessionId: 'session123',
        userId: 'user456',
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Failed to fetch');
      mockFetch.mockRejectedValueOnce(networkError);

      const response = await TaxFlowService.fetchTaxFlowContent('session123', 'user456');

      expect(response.success).toBe(false);
      expect(response.status).toBe(500);
      expect(response.message).toBe('An unexpected error occurred while fetching tax flow content');
      expect(response.data).toBeNull();
      expect(response.error).toBe(networkError.message);
      expect(Analytics.logError).toHaveBeenCalledWith(
        'Network or unexpected error fetching tax flow content:',
        networkError
      );
      expect(Analytics.trackEvent).toHaveBeenCalledWith('tax_flow_content_fetch_error', {
        errorMessage: networkError.message,
        sessionId: 'session123',
        userId: 'user456',
      });
    });

    it('should use default API_BASE_URL if REACT_APP_API_BASE_URL is not set', async () => {
      process.env.REACT_APP_API_BASE_URL = undefined;
      jest.resetModules(); // Reload module to pick up new env
      const TaxFlowServiceWithDefaultUrl = require('./TaxFlowService').default;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaxFlowContent),
        headers: {
          get: () => null,
        },
      });

      const response = await TaxFlowServiceWithDefaultUrl.fetchTaxFlowContent();

      // Assuming the default URL is '/api' or similar if REACT_APP_API_BASE_URL is not set
      // The actual default URL would depend on the implementation of TaxFlowService
      // For this test, we'll assume it falls back to a relative path or a hardcoded default.
      // Let's assume the default base URL is just an empty string or '/' which results in '/api/tax-flow-content'
      expect(mockFetch).toHaveBeenCalledWith('/api/tax-flow-content', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockTaxFlowContent);
    });
  });
});