/**
 * AuthService
 * Frontend API client for authentication flows (login, MFA verification, forgot password)
 * Implements RBI-aligned secure authentication without storing or logging plaintext credentials
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthService = {
  /**
   * Authenticate user with email and password (primary authentication)
   * On success, MFA will be required before a session is granted
   * @param {string} email - User email address
   * @param {string} password - User password (never stored or logged)
   * @returns {Promise<{success: boolean, mfaPending: boolean, sessionToken: string|null, message: string}>}
   */
  login: async (email, password) => {
    if (!email || !password) {
      return {
        success: false,
        mfaPending: false,
        sessionToken: null,
        message: 'Email and password are required'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          mfaPending: false,
          sessionToken: null,
          message: data.message || 'Invalid email or password'
        };
      }

      return {
        success: data.success || false,
        mfaPending: data.mfaPending || false,
        sessionToken: data.sessionToken || null,
        message: data.message || ''
      };
    } catch (error) {
      console.error('Login request failed:', error.message);
      return {
        success: false,
        mfaPending: false,
        sessionToken: null,
        message: 'Unable to connect to the server. Please try again.'
      };
    }
  },

  /**
   * Verify MFA code for the current authentication transaction
   * A valid sessionToken from login() is required
   * On success, an authenticated authToken is returned
   * @param {string} sessionToken - Temporary session token from successful primary auth
   * @param {string} code - MFA code provided by the user
   * @returns {Promise<{success: boolean, authToken: string|null, message: string}>}
   */
  verifyMFA: async (sessionToken, code) => {
    if (!sessionToken || !code) {
      return {
        success: false,
        authToken: null,
        message: 'Session token and MFA code are required'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionToken,
          code: String(code).trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          authToken: null,
          message: data.message || 'MFA verification failed'
        };
      }

      return {
        success: data.success || false,
        authToken: data.authToken || null,
        message: data.message || ''
      };
    } catch (error) {
      console.error('MFA verification request failed:', error.message);
      return {
        success: false,
        authToken: null,
        message: 'Unable to connect to the server. Please try again.'
      };
    }
  },

  /**
   * Initiate the forgot password flow for the given email address
   * Response is intentionally generic to prevent user enumeration
   * @param {string} email - Email address to send the password reset link to
   * @returns {Promise<{success: boolean, message: string}>}
   */
  forgotPassword: async (email) => {
    if (!email) {
      return {
        success: false,
        message: 'Email address is required'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Unable to process your request. Please try again.'
        };
      }

      return {
        success: data.success || false,
        message: data.message || 'If an account with that email exists, a password reset link has been sent.'
      };
    } catch (error) {
      console.error('Forgot password request failed:', error.message);
      return {
        success: false,
        message: 'Unable to connect to the server. Please try again.'
      };
    }
  }
};

export default AuthService;