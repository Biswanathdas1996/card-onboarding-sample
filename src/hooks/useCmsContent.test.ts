import { renderHook, act, waitFor } from '@testing-library/react';
import { useCmsContent, CmsContent } from './useCmsContent';
import { enableFetchMocks } from 'jest-fetch-mock';

enableFetchMocks();

interface TestCmsContent extends CmsContent {
  extraField?: string;
}

const mockContent: TestCmsContent = {
  id: '1',
  title: 'Test Title',
  description: 'Test Description',
  steps: [
    {
      step_id: 'step1',
      step_number: 1,
      title: 'Step 1',
      description: 'Description for step 1',
      order_sequence: 1,
    },
  ],
  extraField: 'extra value',
};

const mockFallbackContent: TestCmsContent = {
  id: 'fallback',
  title: 'Fallback Title',
  description: 'Fallback Description',
};

describe('useCmsContent', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Positive Tests (Happy Path)
  it('should fetch content successfully and return it', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });

    const { result } = renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.content).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.content).toEqual(mockContent);
    expect(result.current.error).toBeUndefined();
  });

  it('should initialize with fallback content if provided', () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });

    const { result } = renderHook(() =>
      useCmsContent<TestCmsContent>({
        url: '/api/content',
        fallbackContent: mockFallbackContent,
      })
    );

    expect(result.current.content).toEqual(mockFallbackContent);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it('should refetch content when refetch is called', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });

    const { result } = renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content).toEqual(mockContent);

    const updatedContent = { ...mockContent, title: 'Updated Title' };
    fetchMock.mockResponseOnce(JSON.stringify(updatedContent), { status: 200 });

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content).toEqual(updatedContent);
  });

  it('should include Authorization header when authToken is a string', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });

    renderHook(() =>
      useCmsContent<TestCmsContent>({ url: '/api/content', authToken: 'test-token' })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/content', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('should include Authorization header when authToken is a function returning a string', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });
    const getAuthToken = jest.fn().mockResolvedValue('dynamic-token');

    renderHook(() =>
      useCmsContent<TestCmsContent>({ url: '/api/content', authToken: getAuthToken })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(getAuthToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/content', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dynamic-token',
      },
    });
  });

  it('should include Authorization header when authToken is a function returning a promise of a string', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });
    const getAuthToken = jest.fn().mockResolvedValue(Promise.resolve('async-token'));

    renderHook(() =>
      useCmsContent<TestCmsContent>({ url: '/api/content', authToken: getAuthToken })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(getAuthToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/content', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer async-token',
      },
    });
  });

  it('should not include Authorization header if authToken is undefined', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });

    renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/content', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should not include Authorization header if authToken function returns undefined', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });
    const getAuthToken = jest.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useCmsContent<TestCmsContent>({ url: '/api/content', authToken: getAuthToken })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(getAuthToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/content', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should refetch content after cache invalidation period', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });

    const { result } = renderHook(() =>
      useCmsContent<TestCmsContent>({
        url: '/api/content',
        cacheInvalidationPeriod: 1000, // 1 second
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content).toEqual(mockContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const updatedContent = { ...mockContent, title: 'Refetched Title' };
    fetchMock.mockResponseOnce(JSON.stringify(updatedContent), { status: 200 });

    act(() => {
      jest.advanceTimersByTime(1001); // Advance past the cache invalidation period
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content).toEqual(updatedContent);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should not refetch content if cache invalidation period has not passed', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });

    const { result } = renderHook(() =>
      useCmsContent<TestCmsContent>({
        url: '/api/content',
        cacheInvalidationPeriod: 5000, // 5 seconds
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content).toEqual(mockContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(2000); // Advance less than the cache invalidation period
    });

    // Ensure no new fetch call is made
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.content).toEqual(mockContent);
  });

  it('should not refetch content if cacheInvalidationPeriod is 0 or undefined', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockContent), { status: 200 });

    const { result } = renderHook(() =>
      useCmsContent<TestCmsContent>({
        url: '/api/content',
        cacheInvalidationPeriod: 0,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(10000); // A long time
    });

    expect(fetchMock).toHaveBeenCalledTimes(1); // Should not have refetched
  });

  // Negative Tests (Error Cases)
  it('should handle network errors gracefully', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    const { result } = renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.content).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Network error');
  });

  it('should set error and use fallback content on network error if provided', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useCmsContent<TestCmsContent>({
        url: '/api/content',
        fallbackContent: mockFallbackContent,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.content).toEqual(mockFallbackContent);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Network error');
  });

  it('should handle 404 response with JSON error body', async () => {
    const errorJson = { message: 'Content not found' };
    fetchMock.mockResponseOnce(JSON.stringify(errorJson), { status: 404, headers: { 'Content-Type': 'application/json' } });

    const { result } = renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.content).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Failed to fetch CMS content: Content not found');
  });

  it('should handle 500 response with plain text error body', async () => {
    fetchMock.mockResponseOnce('Internal Server Error', { status: 500, headers: { 'Content-Type': 'text/plain' } });

    const { result } = renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.content).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Failed to fetch CMS content: Internal Server Error');
  });

  it('should handle 500 response with no body and use status text', async () => {
    fetchMock.mockResponseOnce('', { status: 500, statusText: 'Server Error' });

    const { result } = renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.content).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Failed to fetch CMS content: Server Error');
  });

  it('should handle 500 response with no body or status text and use status code', async () => {
    fetchMock.mockResponseOnce('', { status: 500 });

    const { result } = renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.content).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Failed to fetch CMS content: 500');
  });

  it('should handle invalid JSON response', async () => {
    fetchMock.mockResponseOnce('this is not json', { status: 200 });

    const { result } = renderHook(() => useCmsContent<TestCmsContent>({ url: '/api/content' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.content).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Failed to parse response JSON');
  });
});