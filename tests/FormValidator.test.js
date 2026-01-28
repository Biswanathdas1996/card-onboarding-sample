/**
 * FormValidator.test.js
 * Unit tests for FormValidator service
 */

import FormValidator from '../services/FormValidator';

describe('FormValidator Service', () => {
  // First Name Tests
  describe('First Name Validation', () => {
    test('should reject empty first name', () => {
      expect(FormValidator.validateField('firstName', '')).toBe('First name is required');
    });

    test('should reject first name shorter than 2 characters', () => {
      expect(FormValidator.validateField('firstName', 'A')).toContain('must be at least 2 characters');
    });

    test('should accept valid first name', () => {
      expect(FormValidator.validateField('firstName', 'John')).toBeNull();
    });

    test('should reject first name with special characters', () => {
      expect(FormValidator.validateField('firstName', 'John@')).toContain('can only contain letters');
    });

    test('should accept first names with hyphens and apostrophes', () => {
      expect(FormValidator.validateField('firstName', "Jean-Pierre")).toBeNull();
      expect(FormValidator.validateField('firstName', "O'Connor")).toBeNull();
    });
  });

  // Email Tests
  describe('Email Validation', () => {
    test('should reject empty email', () => {
      expect(FormValidator.validateField('email', '')).toBe('Email is required');
    });

    test('should reject invalid email format', () => {
      expect(FormValidator.validateField('email', 'invalid-email')).toContain('valid email');
      expect(FormValidator.validateField('email', 'user@')).toContain('valid email');
      expect(FormValidator.validateField('email', '@example.com')).toContain('valid email');
    });

    test('should accept valid email addresses', () => {
      expect(FormValidator.validateField('email', 'user@example.com')).toBeNull();
      expect(FormValidator.validateField('email', 'test.user@domain.co.uk')).toBeNull();
    });
  });

  // Phone Tests
  describe('Phone Number Validation', () => {
    test('should reject empty phone number', () => {
      expect(FormValidator.validateField('phone', '')).toBe('Phone number is required');
    });

    test('should reject phone numbers with less than 10 digits', () => {
      expect(FormValidator.validateField('phone', '(555) 123')).toContain('at least 10 digits');
    });

    test('should accept valid phone formats', () => {
      expect(FormValidator.validateField('phone', '5551234567')).toBeNull();
      expect(FormValidator.validateField('phone', '(555) 123-4567')).toBeNull();
      expect(FormValidator.validateField('phone', '+1 555 123 4567')).toBeNull();
    });
  });

  // Date of Birth Tests
  describe('Date of Birth Validation', () => {
    test('should reject empty date of birth', () => {
      expect(FormValidator.validateField('dateOfBirth', '')).toBe('Date of birth is required');
    });

    test('should reject invalid date format', () => {
      expect(FormValidator.validateField('dateOfBirth', 'invalid')).toContain('valid date');
    });

    test('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(FormValidator.validateField('dateOfBirth', futureDate.toISOString().split('T')[0])).toContain('in the past');
    });

    test('should reject dates for users under 18', () => {
      const youngDate = new Date();
      youngDate.setFullYear(youngDate.getFullYear() - 15);
      expect(FormValidator.validateField('dateOfBirth', youngDate.toISOString().split('T')[0])).toContain('at least 18 years old');
    });

    test('should accept valid past dates for adults', () => {
      const adultDate = new Date();
      adultDate.setFullYear(adultDate.getFullYear() - 30);
      expect(FormValidator.validateField('dateOfBirth', adultDate.toISOString().split('T')[0])).toBeNull();
    });
  });

  // Address Tests
  describe('Address Validation', () => {
    test('should reject empty address', () => {
      expect(FormValidator.validateField('address', '')).toBe('Address is required');
    });

    test('should reject address shorter than 5 characters', () => {
      expect(FormValidator.validateField('address', 'Main')).toContain('valid address');
    });

    test('should accept valid addresses', () => {
      expect(FormValidator.validateField('address', '123 Main Street')).toBeNull();
    });
  });

  // Government ID Tests
  describe('Government ID Validation', () => {
    test('should reject empty government ID', () => {
      expect(FormValidator.validateField('govID', '')).toBe('Government ID is required');
    });

    test('should reject government ID with invalid format', () => {
      expect(FormValidator.validateField('govID', 'ab')).toContain('5-20 alphanumeric');
      expect(FormValidator.validateField('govID', 'ID@#$')).toContain('5-20 alphanumeric');
    });

    test('should accept valid government ID formats', () => {
      expect(FormValidator.validateField('govID', 'A12B34C56')).toBeNull();
      expect(FormValidator.validateField('govID', 'PASSPORT123456')).toBeNull();
    });
  });

  // Aadhaar Number Tests
  describe('Aadhaar Number Validation', () => {
    test('should reject empty Aadhaar number', () => {
      expect(FormValidator.validateField('aadhaarNumber', '')).toBe('Aadhaar Number is required');
    });

    test('should reject Aadhaar number with less than 12 digits', () => {
      expect(FormValidator.validateField('aadhaarNumber', '12345678901')).toContain('exactly 12 digits');
    });

    test('should reject Aadhaar number with more than 12 digits', () => {
      expect(FormValidator.validateField('aadhaarNumber', '1234567890123')).toContain('exactly 12 digits');
    });

    test('should reject Aadhaar number with non-numeric characters', () => {
      expect(FormValidator.validateField('aadhaarNumber', '1234567890AB')).toContain('exactly 12 digits');
      expect(FormValidator.validateField('aadhaarNumber', '123456-78901')).toContain('exactly 12 digits');
      expect(FormValidator.validateField('aadhaarNumber', 'ABCDEFGHIJKL')).toContain('exactly 12 digits');
    });

    test('should accept valid 12-digit Aadhaar numbers', () => {
      expect(FormValidator.validateField('aadhaarNumber', '123456789012')).toBeNull();
      expect(FormValidator.validateField('aadhaarNumber', '000000000000')).toBeNull();
      expect(FormValidator.validateField('aadhaarNumber', '999999999999')).toBeNull();
    });

    test('should handle whitespace in Aadhaar validation', () => {
      expect(FormValidator.validateField('aadhaarNumber', ' 123456789012 ')).toBeNull();
    });
  });

  // Form Validation Tests
  describe('Complete Form Validation', () => {
    test('should validate complete customer form', () => {
      const validFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        income: '75-100k'
      };

      expect(FormValidator.validateForm(validFormData, 'customer')).toBe(true);
    });

    test('should validate complete KYC form', () => {
      const validKYCData = {
        govID: 'A12B34C56',
        kycAddress: '123 Main Street, Apartment 4B',
        kycDob: '1990-01-01',
        pan: 'ABCD1234EF',
        aadhaarNumber: '123456789012'
      };

      expect(FormValidator.validateForm(validKYCData, 'kyc')).toBe(true);
    });

    test('should return false for incomplete form', () => {
      const incompleteData = {
        firstName: 'John',
        lastName: '',
        email: 'john@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        income: '75-100k'
      };

      expect(FormValidator.validateForm(incompleteData, 'customer')).toBe(false);
    });
  });

  // Validate All (Returns Error Object)
  describe('Validate All', () => {
    test('should return object with all validation errors', () => {
      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid',
        phone: '123',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        income: ''
      };

      const errors = FormValidator.validateAll(invalidData, 'customer');
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.firstName).toBeTruthy();
      expect(errors.email).toBeTruthy();
    });

    test('should return empty object for valid data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        income: '75-100k'
      };

      const errors = FormValidator.validateAll(validData, 'customer');
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});
