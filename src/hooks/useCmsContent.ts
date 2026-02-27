import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @interface CmsContent
 * @description Defines the structure for content fetched from the CMS.
 */
export interface CmsContent {
  id: string;
  title: string;
  description: string;
  steps?: Array<{
    step_id: string;
    step_number: number;
    title: string;
    description: string;
    order_sequence: number;
    image_url?: string;
    svg_data?: string;
  }>;
  // Add other fields as necessary based on CMS structure
}

/**
 * @interface UseCmsContentOptions
 * @description Options for configuring the useCmsContent hook.
 */
export interface UseCmsContentOptions {
  /**
   * The URL to fetch content from the CMS.
   * @example '/api/tax-flow-content'
   */
  url: string;
  /**
   * Optional fallback content to use if fetching fails or content is empty.
   */
  fallbackContent?: CmsContent;
  /**
   * Optional cache invalidation period in milliseconds.
   * If provided, content will be re-fetched after this period.
   */
  cacheInvalidationPeriod?: number;
  /**
   * Optional authentication token or a function to retrieve it.
   * If provided, it will be used in the Authorization header.
   */
  authToken?: string | (() => Promise<string | undefined> | string | undefined);
}

/**
 * @function useCmsContent
 * @template T
 * @description A custom React hook to fetch and manage content from a headless CMS.
 * It handles loading states, error handling, and provides fallback content.
 *
 * @param {UseCmsContentOptions} options - Configuration options for the hook.
 * @returns {{
 *   content: T | undefined;
 *   isLoading: boolean;
 *   error: Error | undefined;
 *   refetch: () => void;
 * }} An object containing the fetched content, loading state, error, and a refetch function.
 */
export const useCmsContent = <T extends CmsContent = CmsContent>(
  options: UseCmsContentOptions
) => {
  const { url, fallbackContent, cacheInvalidationPeriod, authToken } = options;

  const [content, setContent] = useState<T | undefined>(fallbackContent as T);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const lastFetchedRef = useRef<number>(0);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      let token: string | undefined;
      if (typeof authToken === 'function') {
        token = await authToken();
      } else {
        token = authToken;
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        let errorBody: any;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            errorBody = await response.json();
          } catch (jsonError) {
            errorBody = { message: `Failed to parse error JSON: ${jsonError}` };
          }
        } else {
          try {
            errorBody = { message: await response.text() };
          } catch (textError) {
            errorBody = { message: `Failed to read error response: ${textError}` };
          }
        }
        throw new Error(`Failed to fetch CMS content: ${errorBody.message || response.statusText || response.status}`);
      }

      const data: T = await response.json();

      if (!data) {
        throw new Error('CMS content is empty or malformed.');
      }

      setContent(data);
      lastFetchedRef.current = Date.now();
    } catch (err) {
      console.error('Error fetching CMS content:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      if (fallbackContent) {
        setContent(fallbackContent as T);
      } else {
        setContent(undefined);
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, fallbackContent, authToken]);

  useEffect(() => {
    fetchContent();

    let intervalId: NodeJS.Timeout | undefined = undefined;
    if (cacheInvalidationPeriod && cacheInvalidationPeriod > 0) {
      intervalId = setInterval(() => {
        if (Date.now() - lastFetchedRef.current > cacheInvalidationPeriod) {
          fetchContent();
        }
      }, Math.min(cacheInvalidationPeriod, 5000)); // Check more frequently, e.g., every 5 seconds or the cache period if smaller
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchContent, cacheInvalidationPeriod]);

  const refetch = useCallback(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, isLoading, error, refetch };
};