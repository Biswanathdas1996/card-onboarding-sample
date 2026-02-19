/**
 * SessionService
 * Manages user sessions using localStorage
 */

const SessionService = {
  /**
   * Sets a session variable in localStorage
   * @param {string} key - The key to store the session variable under
   * @param {any} value - The value to store
   */
  setSession: (key, value) => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error setting session:', error);
    }
  },

  /**
   * Retrieves a session variable from localStorage
   * @param {string} key - The key to retrieve the session variable from
   * @returns {any|null} - The value of the session variable, or null if not found
   */
  getSession: (key) => {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  /**
   * Clears a session variable from localStorage
   * @param {string} key - The key to clear
   */
  clearSession: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  /**
   * Clears all session variables from localStorage
   */
  clearAllSessions: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing all sessions:', error);
    }
  }
};

export default SessionService;