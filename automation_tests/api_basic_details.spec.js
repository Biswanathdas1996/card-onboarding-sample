const { test, expect } = require('@playwright/test');

const API_URL = 'http://localhost:5000';

test.describe('Basic Details API Tests', () => {
  let createdUserId;
  let testSpecificUserIds = []; // To store user IDs created within a specific test for cleanup

  test.afterEach(async ({ request }) => {
    // Clean up any single user created by tests like TC-021
    if (createdUserId) {
      await request.delete(`${API_URL}/api/basic-details/${createdUserId}`);
      createdUserId = null;
    }
    // Clean up users created within TC-020 or similar tests
    for (const id of testSpecificUserIds) {
      await request.delete(`${API_URL}/api/basic-details/${id}`);
    }
    testSpecificUserIds = []; // Clear for the next test
  });

  test('TC-021: API endpoint POST /api/basic-details creates user', async ({ request }) => {
    const userData = {
      name: 'API Test User',
      dateOfBirth: '1988-06-15',
      address: 'API Test Address 123'
    };

    const response = await request.post(`${API_URL}/api/basic-details`, {
      data: userData
    });

    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toHaveProperty('id');
    expect(responseBody.data.name).toBe(userData.name);
    expect(responseBody.data.date_of_birth).toBe(userData.dateOfBirth); // Note: API returns snake_case
    expect(responseBody.data.address).toBe(userData.address);
    expect(responseBody.data).toHaveProperty('created_at');

    createdUserId = responseBody.data.id;

    // Verify by fetching the created user
    const getResponse = await request.get(`${API_URL}/api/basic-details/${createdUserId}`);
    expect(getResponse.status()).toBe(200);
    const getUserBody = await getResponse.json();
    expect(getUserBody.success).toBe(true);
    expect(getUserBody.data.id).toBe(createdUserId);
  });

  test('TC-020: API endpoint GET /api/basic-details returns all users', async ({ request }) => {
    // Create a few users first to ensure there's data
    const user1 = {
      name: 'User One',
      dateOfBirth: '1990-01-01',
      address: 'Address One'
    };
    const user2 = {
      name: 'User Two',
      dateOfBirth: '1991-02-02',
      address: 'Address Two'
    };
    const user3 = {
      name: 'User Three',
      dateOfBirth: '1992-03-03',
      address: 'Address Three'
    };

    const res1 = await request.post(`${API_URL}/api/basic-details`, { data: user1 });
    const data1 = await res1.json();
    const res2 = await request.post(`${API_URL}/api/basic-details`, { data: user2 });
    const data2 = await res2.json();
    const res3 = await request.post(`${API_URL}/api/basic-details`, { data: user3 });
    const data3 = await res3.json();

    // Store IDs for cleanup in testSpecificUserIds
    testSpecificUserIds.push(data1.data.id, data2.data.id, data3.data.id);

    const response = await request.get(`${API_URL}/api/basic-details`);
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(Array.isArray(responseBody.data)).toBe(true);
    expect(responseBody.data.length).toBeGreaterThanOrEqual(3);

    // Verify that the created users are present and ordered by created_at DESC
    const namesInResponse = responseBody.data.map(u => u.name);
    expect(namesInResponse).toContain('User One');
    expect(namesInResponse).toContain('User Two');
    expect(namesInResponse).toContain('User Three');

    // Check order (newest first)
    const sortedData = [...responseBody.data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    expect(responseBody.data.map(u => u.id)).toEqual(sortedData.map(u => u.id));

    expect(responseBody.pagination).toBeDefined();
    expect(responseBody.pagination.total).toBeGreaterThanOrEqual(3);
  });

  test('TC-016: Backend server is down during submission (simulated)', async ({ request }) => {
    // This test case requires stopping the backend server, which is outside the scope of a single Playwright test run.
    // A typical approach would be to have a separate test environment or a custom test runner hook
    // that can control the backend server's state.
    // For demonstration, we'll simulate a network error by attempting to connect to a non-existent port or URL.
    // In a real scenario, you'd use a tool like `msw` for mocking or a dedicated test setup.

    const invalidApiUrl = 'http://localhost:9999'; // Assuming this port is not in use
    const userData = {
      name: 'Network Error User',
      dateOfBirth: '1990-01-01',
      address: '123 Network Error St'
    };

    // Use failOnStatusCode: false to prevent Playwright from throwing an error on non-2xx responses
    // and allow us to assert on the response status or lack thereof.
    const response = await request.post(`${invalidApiUrl}/api/basic-details`, {
      data: userData,
      timeout: 1000, // Short timeout to fail quickly
      failOnStatusCode: false
    });

    // Expect a network-related error status or a connection refused status
    // Playwright's request.post will return a Response object even for network errors,
    // but its status will often be 0 or it will throw if failOnStatusCode is true.
    // With failOnStatusCode: false, we can check the status directly.
    expect(response.status()).toBe(0); // Status 0 typically indicates a network error/connection refused
  });
});
