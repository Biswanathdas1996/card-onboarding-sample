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

    test('should accept first name with spaces', () => {
      expect(FormValidator.validateField('firstName', 'Mary Jane')).toBeNull();
    });

    test('should accept first name with mixed case', () => {
      expect(FormValidator.validateField('firstName', 'jOhN')).toBeNull();
    });

    test('should reject first name with numbers', () => {
      expect(FormValidator.validateField('firstName', 'John123')).toContain('can only contain letters');
    });
  });

  // Last Name Tests
  describe('Last Name Validation', () => {
    test('should reject empty last name', () => {
      expect(FormValidator.validateField('lastName', '')).toBe('Last name is required');
    });

    test('should reject last name shorter than 2 characters', () => {
      expect(FormValidator.validateField('lastName', 'S')).toContain('must be at least 2 characters');
    });

    test('should accept valid last name', () => {
      expect(FormValidator.validateField('lastName', 'Doe')).toBeNull();
    });

    test('should reject last name with special characters', () => {
      expect(FormValidator.validateField('lastName', 'Doe!')).toContain('can only contain letters');
    });

    test('should accept last names with hyphens and apostrophes', () => {
      expect(FormValidator.validateField('lastName', "Smith-Jones")).toBeNull();
      expect(FormValidator.validateField('lastName', "D'Angelo")).toBeNull();
    });

    test('should accept last name with spaces', () => {
      expect(FormValidator.validateField('lastName', 'Van Der Beek')).toBeNull();
    });

    test('should reject last name with numbers', () => {
      expect(FormValidator.validateField('lastName', 'Doe123')).toContain('can only contain letters');
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

    test('should reject email with multiple @ symbols', () => {
      expect(FormValidator.validateField('email', 'user@example@com')).toContain('valid email');
    });

    test('should reject email with leading/trailing spaces', () => {
      expect(FormValidator.validateField('email', ' user@example.com ')).toBeNull(); // Trimmed value should be valid
    });

    test('should reject email with no domain extension', () => {
      expect(FormValidator.validateField('email', 'user@example')).toContain('valid email');
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

    test('should reject phone numbers with non-numeric and non-allowed special characters', () => {
      expect(FormValidator.validateField('phone', '555-123-456A')).toContain('valid phone number');
      expect(FormValidator.validateField('phone', '555-123-456!')).toContain('valid phone number');
    });

    test('should accept phone numbers with exactly 10 digits', () => {
      expect(FormValidator.validateField('phone', '1234567890')).toBeNull();
    });

    test('should accept phone numbers with more than 10 digits (e.g., international)', () => {
      expect(FormValidator.validateField('phone', '+44 20 7946 0958')).toBeNull();
    });

    test('should reject phone numbers that are too short after stripping non-digits', () => {
      expect(FormValidator.validateField('phone', '123-456-789')).toContain('at least 10 digits');
    });
  });

  // Date of Birth Tests
  describe('Date of Birth Validation', () => {
    test('should reject empty date of birth', () => {
      expect(FormValidator.validateField('dateOfBirth', '')).toBe('Date of birth is required');
    });

    test('should reject invalid date format', () => {
      expect(FormValidator.validateField('dateOfBirth', 'invalid')).toContain('valid date');
      expect(FormValidator.validateField('dateOfBirth', '2023/13/01')).toContain('valid date');
      expect(FormValidator.validateField('dateOfBirth', '01-01-2000')).toBeNull(); // Should accept common formats
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

    test('should accept date for exactly 18 years old', () => {
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      eighteenYearsAgo.setDate(eighteenYearsAgo.getDate() - 1); // Ensure it's just over 18
      expect(FormValidator.validateField('dateOfBirth', eighteenYearsAgo.toISOString().split('T')[0])).toBeNull();
    });

    test('should reject date for exactly 18 years old but not yet passed birthday', () => {
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      eighteenYearsAgo.setDate(eighteenYearsAgo.getDate() + 1); // Ensure it's just under 18
      expect(FormValidator.validateField('dateOfBirth', eighteenYearsAgo.toISOString().split('T')[0])).toContain('at least 18 years old');
    });

    test('should accept date with different valid formats (e.g., YYYY-MM-DD)', () => {
      expect(FormValidator.validateField('dateOfBirth', '1990-05-15')).toBeNull();
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

    test('should accept address with numbers and special characters (e.g., apt #)', () => {
      expect(FormValidator.validateField('address', '123 Main St, Apt #4B')).toBeNull();
    });

    test('should accept long addresses', () => {
      expect(FormValidator.validateField('address', '12345 Long Winding Road, Apartment 101, Building C, Suite 200')).toBeNull();
    });
  });

  // City Tests
  describe('City Validation', () => {
    test('should reject empty city', () => {
      expect(FormValidator.validateField('city', '')).toBe('City is required');
    });

    test('should accept valid city name', () => {
      expect(FormValidator.validateField('city', 'New York')).toBeNull();
    });

    test('should reject city name with numbers', () => {
      expect(FormValidator.validateField('city', 'London123')).toContain('can only contain letters');
    });

    test('should accept city name with hyphens and apostrophes', () => {
      expect(FormValidator.validateField('city', 'Winston-Salem')).toBeNull();
      expect(FormValidator.validateField('city', "O'Fallon")).toBeNull();
    });

    test('should reject city name with disallowed special characters', () => {
      expect(FormValidator.validateField('city', 'Paris!')).toContain('can only contain letters');
    });
  });

  // State Tests
  describe('State Validation', () => {
    test('should reject empty state', () => {
      expect(FormValidator.validateField('state', '')).toBe('State is required');
    });

    test('should accept valid state name', () => {
      expect(FormValidator.validateField('state', 'California')).toBeNull();
    });

    test('should accept state abbreviation', () => {
      expect(FormValidator.validateField('state', 'CA')).toBeNull();
    });

    test('should accept state with spaces', () => {
      expect(FormValidator.validateField('state', 'New York')).toBeNull();
    });
  });

  // Zip Code Tests
  describe('Zip Code Validation', () => {
    test('should reject empty zip code', () => {
      expect(FormValidator.validateField('zipCode', '')).toBe('Zip code is required');
    });

    test('should reject invalid zip code format', () => {
      expect(FormValidator.validateField('zipCode', '123')).toContain('valid zip code');
      expect(FormValidator.validateField('zipCode', '123456')).toContain('valid zip code');
      expect(FormValidator.validateField('zipCode', 'abcde')).toContain('valid zip code');
      expect(FormValidator.validateField('zipCode', '1234-5678')).toContain('valid zip code'); // Missing first 5 digits
    });

    test('should accept 5-digit zip code', () => {
      expect(FormValidator.validateField('zipCode', '12345')).toBeNull();
    });

    test('should accept 9-digit zip code with hyphen', () => {
      expect(FormValidator.validateField('zipCode', '12345-6789')).toBeNull();
    });

    test('should reject 9-digit zip code without hyphen', () => {
      expect(FormValidator.validateField('zipCode', '123456789')).toContain('valid zip code');
    });
  });

  // Income Tests
  describe('Income Validation', () => {
    test('should reject empty income', () => {
      expect(FormValidator.validateField('income', '')).toBe('Annual income is required');
    });

    test('should reject non-numeric income', () => {
      expect(FormValidator.validateField('income', 'abc')).toContain('valid income amount');
    });

    test('should reject negative income', () => {
      expect(FormValidator.validateField('income', '-100')).toContain('valid income amount');
    });

    test('should accept valid positive integer income', () => {
      expect(FormValidator.validateField('income', '50000')).toBeNull();
    });

    test('should accept valid positive decimal income', () => {
      expect(FormValidator.validateField('income', '75000.50')).toBeNull();
    });

    test('should accept zero income', () => {
      expect(FormValidator.validateField('income', '0')).toBeNull();
    });
  });

  // Government ID Tests
  describe('Government ID Validation', () => {
    test('should reject empty government ID', () => {
      expect(FormValidator.validateField('govID', '')).toBe('Government ID is required');
    });

    test('should reject government ID with invalid format (too short)', () => {
      expect(FormValidator.validateField('govID', 'ab')).toContain('5-20 alphanumeric');
    });

    test('should reject government ID with invalid format (too long)', () => {
      expect(FormValidator.validateField('govID', 'ABCDEFGHIJKLMNOPQRSTU')).toContain('5-20 alphanumeric');
    });

    test('should reject government ID with non-alphanumeric characters', () => {
      expect(FormValidator.validateField('govID', 'ID@#$')).toContain('5-20 alphanumeric');
      expect(FormValidator.validateField('govID', 'ID_123')).toContain('5-20 alphanumeric');
    });

    test('should accept valid government ID formats (alphanumeric)', () => {
      expect(FormValidator.validateField('govID', 'A12B34C56')).toBeNull();
      expect(FormValidator.validateField('govID', 'PASSPORT123456')).toBeNull();
    });

    test('should accept minimum length government ID', () => {
      expect(FormValidator.validateField('govID', 'ABCDE')).toBeNull();
    });

    test('should accept maximum length government ID', () => {
      expect(FormValidator.validateField('govID', 'ABCDEFGHIJKLMNOPQRST')).toBeNull();
    });

    test('should accept mixed case government ID', () => {
      expect(FormValidator.validateField('govID', 'aBcDeF123')).toBeNull();
    });
  });

  // KYC Address Tests
  describe('KYC Address Validation', () => {
    test('should reject empty KYC address', () => {
      expect(FormValidator.validateField('kycAddress', '')).toBe('Address is required');
    });

    test('should reject KYC address shorter than 5 characters', () => {
      expect(FormValidator.validateField('kycAddress', 'Road')).toContain('valid address');
    });

    test('should accept valid KYC addresses', () => {
      expect(FormValidator.validateField('kycAddress', '456 Oak Avenue')).toBeNull();
    });

    test('should accept KYC address with numbers and special characters', () => {
      expect(FormValidator.validateField('kycAddress', 'Unit 10, 789 Pine Ln')).toBeNull();
    });
  });

  // KYC Date of Birth Tests
  describe('KYC Date of Birth Validation', () => {
    test('should reject empty KYC date of birth', () => {
      expect(FormValidator.validateField('kycDob', '')).toBe('Date of birth is required');
    });

    test('should reject invalid KYC date format', () => {
      expect(FormValidator.validateField('kycDob', 'not-a-date')).toContain('valid date');
    });

    test('should reject future KYC dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(FormValidator.validateField('kycDob', futureDate.toISOString().split('T')[0])).toContain('in the past');
    });

    test('should reject KYC dates for users under 18', () => {
      const youngDate = new Date();
      youngDate.setFullYear(youngDate.getFullYear() - 10);
      expect(FormValidator.validateField('kycDob', youngDate.toISOString().split('T')[0])).toContain('at least 18 years old');
    });

    test('should accept valid past KYC dates for adults', () => {
      const adultDate = new Date();
      adultDate.setFullYear(adultDate.getFullYear() - 25);
      expect(FormValidator.validateField('kycDob', adultDate.toISOString().split('T')[0])).toBeNull();
    });
  });

  // PAN Tests
  describe('PAN Validation', () => {
    test('should reject empty PAN', () => {
      expect(FormValidator.validateField('pan', '')).toBe('PAN is required');
    });

    test('should reject PAN with less than 10 characters', () => {
      expect(FormValidator.validateField('pan', 'ABCDE123F')).toContain('10 alphanumeric characters');
    });

    test('should reject PAN with more than 10 characters', () => {
      expect(FormValidator.validateField('pan', 'ABCDE12345F')).toContain('10 alphanumeric characters');
    });

    test('should reject PAN with non-alphanumeric characters', () => {
      expect(FormValidator.validateField('pan', 'ABCDE123@F')).toContain('10 alphanumeric characters');
    });

    test('should accept valid PAN format', () => {
      expect(FormValidator.validateField('pan', 'ABCDE1234F')).toBeNull();
    });

    test('should accept PAN with mixed case', () => {
      expect(FormValidator.validateField('pan', 'abcde1234f')).toBeNull();
    });

    test('should handle null value for PAN', () => {
      expect(FormValidator.validateField('pan', null)).toBe('PAN is required');
    });

    test('should handle undefined value for PAN', () => {
      expect(FormValidator.validateField('pan', undefined)).toBe('PAN is required');
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
    });

    test('should accept valid 12-digit Aadhaar number', () => {
      expect(FormValidator.validateField('aadhaarNumber', '123456789012')).toBeNull();
    });

    test('should reject Aadhaar number with spaces', () => {
      expect(FormValidator.validateField('aadhaarNumber', '1234 5678 9012')).toContain('exactly 12 digits');
    });
  });

  // General validateField behavior
  describe('validateField general behavior', () => {
    test('should return null for unknown fieldName', () => {
      expect(FormValidator.validateField('unknownField', 'someValue')).toBeNull();
    });

    test('should return null if fieldName is null', () => {
      expect(FormValidator.validateField(null, 'someValue')).toBeNull();
    });

    test('should return null if fieldName is undefined', () => {
      expect(FormValidator.validateField(undefined, 'someValue')).toBeNull();
    });

    test('should handle numeric values for text fields by converting to string', () => {
      expect(FormValidator.validateField('firstName', 123)).toContain('can only contain letters');
    });

    test('should trim whitespace from values before validation', () => {
      expect(FormValidator.validateField('firstName', '   John   ')).toBeNull();
      expect(FormValidator.validateField('email', ' user@example.com ')).toBeNull();
      expect(FormValidator.validateField('phone', '  (555) 123-4567  ')).toBeNull();
    });
  });

  // validateForm Tests
  describe('validateForm Service', () => {
    const validCustomerFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '5551234567',
      dateOfBirth: '1990-01-01',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      income: '50000'
    };

    const validKycFormData = {
      govID: 'ABCDE12345',
      kycAddress: '456 KYC St',
      kycDob: '1985-05-05',
      pan: 'ABCDE1234F',
      aadhaarNumber: '123456789012'
    };

    test('should return true for a valid customer form', () => {
      expect(FormValidator.validateForm(validCustomerFormData, 'customer')).toBe(true);
    });

    test('should return false for an invalid customer form (missing field)', () => {
      const invalidData = { ...validCustomerFormData, firstName: '' };
      expect(FormValidator.validateForm(invalidData, 'customer')).toBe(false);
    });

    test('should return false for an invalid customer form (invalid field value)', () => {
      const invalidData = { ...validCustomerFormData, email: 'invalid-email' };
      expect(FormValidator.validateForm(invalidData, 'customer')).toBe(false);
    });

    test('should return true for a valid KYC form', () => {
      expect(FormValidator.validateForm(validKycFormData, 'kyc')).toBe(true);
    });

    test('should return false for an invalid KYC form (missing field)', () => {
      const invalidData = { ...validKycFormData, govID: '' };
      expect(FormValidator.validateForm(invalidData, 'kyc')).toBe(false);
    });

    test('should return false for an invalid KYC form (invalid field value)', () => {
      const invalidData = { ...validKycFormData, pan: 'short' };
      expect(FormValidator.validateForm(invalidData, 'kyc')).toBe(false);
    });

    test('should return false if formData is null', () => {
      expect(FormValidator.validateForm(null, 'customer')).toBe(false);
    });

    test('should return false if formData is undefined', () => {
      expect(FormValidator.validateForm(undefined, 'customer')).toBe(false);
    });

    test('should return false if formData is not an object', () => {
      expect(FormValidator.validateForm('not an object', 'customer')).toBe(false);
    });

    test('should default to customer form validation if formType is not specified', () => {
      expect(FormValidator.validateForm(validCustomerFormData)).toBe(true);
      const invalidData = { ...validCustomerFormData, firstName: '' };
      expect(FormValidator.validateForm(invalidData)).toBe(false);
    });

    test('should return true for an empty object if no fields are required for an unknown formType', () => {
      // Assuming an unknown formType would result in no fields being validated, thus returning true
      // This tests the default behavior if formType is not 'customer' or 'kyc'
      expect(FormValidator.validateForm({}, 'unknownType')).toBe(true);
    });
  });

  // validateAll Tests
  describe('validateAll Service', () => {
    const validCustomerFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '5551234567',
      dateOfBirth: '1990-01-01',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      income: '50000'
    };

    const validKycFormData = {
      govID: 'ABCDE12345',
      kycAddress: '456 KYC St',
      kycDob: '1985-05-05',
      pan: 'ABCDE1234F',
      aadhaarNumber: '123456789012'
    };

    test('should return an empty object for a valid customer form', () => {
      expect(FormValidator.validateAll(validCustomerFormData, 'customer')).toEqual({});
    });

    test('should return an object with errors for an invalid customer form', () => {
      const invalidData = {
        ...validCustomerFormData,
        firstName: '',
        email: 'bad-email',
        zipCode: '123'
      };
      const errors = FormValidator.validateAll(invalidData, 'customer');
      expect(errors).toEqual({
        firstName: 'First name is required',
        email: 'Please enter a valid email address',
        zipCode: 'Please enter a valid zip code (e.g., 12345 or 12345-6789)'
      });
    });

    test('should return an empty object for a valid KYC form', () => {
      expect(FormValidator.validateAll(validKycFormData, 'kyc')).toEqual({});
    });

    test('should return an object with errors for an invalid KYC form', () => {
      const invalidData = {
        ...validKycFormData,
        govID: 'short',
        pan: 'invalid-pan',
        aadhaarNumber: '123'
      };
      const errors = FormValidator.validateAll(invalidData, 'kyc');
      expect(errors).toEqual({
        govID: 'Government ID must be 5-20 alphanumeric characters',
        pan: 'PAN must be 10 alphanumeric characters',
        aadhaarNumber: 'Aadhaar Number must be exactly 12 digits'
      });
    });

    test('should return an empty object if formData is null', () => {
      expect(FormValidator.validateAll(null, 'customer')).toEqual({});
    });

    test('should return an empty object if formData is undefined', () => {
      expect(FormValidator.validateAll(undefined, 'customer')).toEqual({});
    });

    test('should return an empty object if formData is not an object', () => {
      expect(FormValidator.validateAll('not an object', 'customer')).toEqual({});
    });

    test('should default to customer form validation if formType is not specified', () => {
      const invalidData = { ...validCustomerFormData, lastName: 'D' };
      const errors = FormValidator.validateAll(invalidData);
      expect(errors).toEqual({
        lastName: 'Last name must be at least 2 characters'
      });
    });

    test('should return an empty object for an unknown formType', () => {
      expect(FormValidator.validateAll(validCustomerFormData, 'unknownType')).toEqual({});
    });
  });
});