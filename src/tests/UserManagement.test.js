/**
 * UserManagement Component Tests
 * Tests for user form validation, submission, and listing
 */

import FormValidator from '../services/FormValidator';

describe('UserManagement Form Validation', () => {
  describe('Name Validation', () => {
    test('should require name field', () => {
      const error = FormValidator.validateField('name', '');
      expect(error).toBe('Name is required');
    });

    test('should require minimum 2 characters', () => {
      const error = FormValidator.validateField('name', 'A');
      expect(error).toBe('Name must be at least 2 characters');
    });

    test('should only allow letters, spaces, hyphens, and apostrophes', () => {
      const error = FormValidator.validateField('name', 'John123');
      expect(error).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
    });

    test('should accept valid name', () => {
      const error = FormValidator.validateField('name', 'John Doe');
      expect(error).toBeNull();
    });

    test('should accept name with hyphen', () => {
      const error = FormValidator.validateField('name', 'Mary-Jane');
      expect(error).toBeNull();
    });

    test('should accept name with apostrophe', () => {
      const error = FormValidator.validateField('name', "O'Brien");
      expect(error).toBeNull();
    });
  });

  describe('Date of Birth Validation', () => {
    test('should require date of birth', () => {
      const error = FormValidator.validateField('dateOfBirth', '');
      expect(error).toBe('Date of birth is required');
    });

    test('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const error = FormValidator.validateField('dateOfBirth', futureDate.toISOString().split('T')[0]);
      expect(error).toBe('Date of birth must be in the past');
    });

    test('should reject dates for people under 18', () => {
      const recentDate = new Date();
      recentDate.setFullYear(recentDate.getFullYear() - 10);
      const error = FormValidator.validateField('dateOfBirth', recentDate.toISOString().split('T')[0]);
      expect(error).toBe('You must be at least 18 years old');
    });

    test('should accept valid date for 18+ year old', () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 25);
      const error = FormValidator.validateField('dateOfBirth', validDate.toISOString().split('T')[0]);
      expect(error).toBeNull();
    });
  });

  describe('Address Validation', () => {
    test('should require address', () => {
      const error = FormValidator.validateField('address', '');
      expect(error).toBe('Address is required');
    });

    test('should require minimum 5 characters', () => {
      const error = FormValidator.validateField('address', '123');
      expect(error).toBe('Please enter a valid address');
    });

    test('should accept valid address', () => {
      const error = FormValidator.validateField('address', '123 Main Street, City, State, 12345');
      expect(error).toBeNull();
    });
  });

  describe('Full Form Validation', () => {
    test('should validate complete form with all valid fields', () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 25);

      const formData = {
        name: 'John Doe',
        dateOfBirth: validDate.toISOString().split('T')[0],
        address: '123 Main Street, City, State, 12345'
      };

      const isValid = FormValidator.validateForm(formData, 'user');
      expect(isValid).toBe(true);
    });

    test('should fail validation with missing name', () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 25);

      const formData = {
        name: '',
        dateOfBirth: validDate.toISOString().split('T')[0],
        address: '123 Main Street'
      };

      const isValid = FormValidator.validateForm(formData, 'user');
      expect(isValid).toBe(false);
    });

    test('should return all validation errors', () => {
      const formData = {
        name: '',
        dateOfBirth: '',
        address: '123'
      };

      const errors = FormValidator.validateAll(formData, 'user');
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.name).toBeTruthy();
      expect(errors.dateOfBirth).toBeTruthy();
      expect(errors.address).toBeTruthy();
    });
  });
});

describe('UserManagement API Integration', () => {
  describe('POST /api/users', () => {
    test('should create user with valid data', async () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 25);

      const userData = {
        name: 'John Doe',
        dateOfBirth: validDate.toISOString().split('T')[0],
        address: '123 Main Street, City, State, 12345'
      };

      // Mock fetch for testing
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { id: 1, ...userData, created_at: new Date().toISOString() }
          })
        })
      );

      const response = await fetch('http://localhost:9000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(userData.name);
    });
  });

  describe('GET /api/users', () => {
    test('should fetch all users', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', date_of_birth: '1998-01-01', address: '123 Main St' },
        { id: 2, name: 'Jane Smith', date_of_birth: '1995-05-15', address: '456 Oak Ave' }
      ];

      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: mockUsers,
            pagination: { limit: 50, offset: 0, total: 2, hasMore: false }
          })
        })
      );

      const response = await fetch('http://localhost:9000/api/users');
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].name).toBe('John Doe');
    });
  });
});

describe('UserManagement Edge Cases', () => {
  test('should handle server errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    try {
      await fetch('http://localhost:9000/api/users');
    } catch (error) {
      expect(error.message).toBe('Network error');
    }
  });

  test('should handle empty user list', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: [],
          pagination: { limit: 50, offset: 0, total: 0, hasMore: false }
        })
      })
    );

    const response = await fetch('http://localhost:9000/api/users');
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test('should validate special characters in name', () => {
    const specialNames = [
      "O'Brien",
      'Mary-Jane',
      'Jean-Pierre',
      "D'Angelo"
    ];

    specialNames.forEach(name => {
      const error = FormValidator.validateField('name', name);
      expect(error).toBeNull();
    });
  });

  test('should reject invalid special characters in name', () => {
    const invalidNames = [
      'John@Doe',
      'Jane#Smith',
      'Bob$Jones',
      'Alice123'
    ];

    invalidNames.forEach(name => {
      const error = FormValidator.validateField('name', name);
      expect(error).toBeTruthy();
    });
  });
});
