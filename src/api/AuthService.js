/**
 * AuthService API
 * Handles authentication-related API calls, including login.
 */

/**
 * API Base URL pointing to Express backend
 */
const API_BASE_URL = 'http://localhost:5000';

/**
 * Simulated API delay for realistic behavior
 */
const simulateNetworkDelay = (ms = 500) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const AuthService = {
  /**
   * Login user
   * @param {string} username - User's username or email
   * @param {string} password - User's password
   * @returns {Promise<object>} - API response with authentication status and user data
   */
  login: async (username, password) => {
    try {
      // Simulate network delay
      await simulateNetworkDelay(200);

      // Call backend API to authenticate user
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          status: response.status,
          message: errorData.message || 'Login failed',
          error: errorData.error,
          timestamp: new Date().toISOString()
        };
      }

      const result = await response.json();

      console.log('User logged in:', result);

      return {
        success: true,
        status: 200,
        message: 'Login successful',
        data: {
          userId: result.userId,
          username: result.username,
          email: result.email,
          sessionToken: result.sessionToken,
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error during login:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred during login',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Logout user (invalidate session) - Placeholder, implement as needed
   * @returns {Promise<object>} - API response
   */
  logout: async () => {
    try {
      // Simulate network delay
      await simulateNetworkDelay(100);

      // Mock API response
      console.log('User logged out');

      return {
        success: true,
        status: 200,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error during logout:', error);
      return {
        success: false,
        status: 500,
        message: 'An error occurred during logout',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },
};

export default AuthService;