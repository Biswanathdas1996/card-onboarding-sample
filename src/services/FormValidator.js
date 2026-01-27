/**
 * FormValidator Service
 * Provides validation rules for customer form and KYC fields
 */

const FormValidator = {
  /**
   * Validate individual field based on field name and value
   * @param {string} fieldName - The name of the field to validate
   * @param {string} value - The value to validate
   * @returns {string|null} - Error message if invalid, null if valid
   */
  validateField: (fieldName, value) => {
    if (!fieldName || value === undefined) return null;

    const trimmedValue = String(value).trim();

    // Customer Form Fields
    if (fieldName === 'firstName' || fieldName === 'lastName') {
      if (!trimmedValue) {
        return `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
      }
      if (trimmedValue.length < 2) {
        return `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
      }
      if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue)) {
        return `${fieldName === 'firstName' ? 'First' : 'Last'} name can only contain letters, spaces, hyphens, and apostrophes`;
      }
      return null;
    }

    if (fieldName === 'email') {
      if (!trimmedValue) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        return 'Please enter a valid email address';
      }
      return null;
    }

    if (fieldName === 'phone') {
      if (!trimmedValue) return 'Phone number is required';
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(trimmedValue)) {
        return 'Please enter a valid phone number';
      }
      if (trimmedValue.replace(/\D/g, '').length < 10) {
        return 'Phone number must be at least 10 digits';
      }
      return null;
    }

    if (fieldName === 'dateOfBirth') {
      if (!trimmedValue) return 'Date of birth is required';
      const dob = new Date(trimmedValue);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (isNaN(dob.getTime())) {
        return 'Please enter a valid date';
      }
      if (dob >= today) {
        return 'Date of birth must be in the past';
      }
      if (age < 18) {
        return 'You must be at least 18 years old';
      }
      return null;
    }

    if (fieldName === 'address') {
      if (!trimmedValue) return 'Address is required';
      if (trimmedValue.length < 5) {
        return 'Please enter a valid address';
      }
      return null;
    }

    if (fieldName === 'city') {
      if (!trimmedValue) return 'City is required';
      if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue)) {
        return 'City name can only contain letters, spaces, hyphens, and apostrophes';
      }
      return null;
    }

    if (fieldName === 'state') {
      if (!trimmedValue) return 'State is required';
      return null;
    }

    if (fieldName === 'zipCode') {
      if (!trimmedValue) return 'Zip code is required';
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(trimmedValue)) {
        return 'Please enter a valid zip code (e.g., 12345 or 12345-6789)';
      }
      return null;
    }

    if (fieldName === 'income') {
      if (!trimmedValue) return 'Annual income is required';
      const incomeValue = parseFloat(trimmedValue);
      if (isNaN(incomeValue) || incomeValue < 0) {
        return 'Please enter a valid income amount';
      }
      return null;
    }

    // KYC Fields
    if (fieldName === 'govID') {
      if (!trimmedValue) return 'Government ID is required';
      // Support various ID formats: SSN (###-##-####), Driver's License, Passport numbers
      const govIDRegex = /^[A-Z0-9]{5,20}$/i;
      if (!govIDRegex.test(trimmedValue)) {
        return 'Government ID must be 5-20 alphanumeric characters';
      }
      return null;
    }

    if (fieldName === 'kycAddress') {
      if (!trimmedValue) return 'Address is required';
      if (trimmedValue.length < 5) {
        return 'Please enter a valid address';
      }
      return null;
    }

    if (fieldName === 'kycDob') {
      if (!trimmedValue) return 'Date of birth is required';
      const dob = new Date(trimmedValue);
      const today = new Date();
      if (isNaN(dob.getTime())) {
        return 'Please enter a valid date';
      }
      if (dob >= today) {
        return 'Date of birth must be in the past';
      }
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        return 'You must be at least 18 years old';
      }
      return null;
    }

    // PAN Field - Permanent Account Number
    if (fieldName === 'pan') {
      if (!trimmedValue) return 'PAN is required';
      const panRegex = /^[A-Za-z0-9]{10}$/;
      if (!panRegex.test(trimmedValue)) {
        return 'PAN must be 10 alphanumeric characters';
      }
      return null;
    }

    return null;
  },

  /**
   * Validate entire form
   * @param {object} formData - The form data object to validate
   * @param {string} formType - Type of form ('customer' or 'kyc')
   * @returns {boolean} - True if all fields are valid
   */
  validateForm: (formData, formType = 'customer') => {
    if (!formData || typeof formData !== 'object') return false;

    if (formType === 'customer') {
      const requiredFields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'dateOfBirth',
        'address',
        'city',
        'state',
        'zipCode',
        'income'
      ];

      for (const field of requiredFields) {
        const error = FormValidator.validateField(field, formData[field]);
        if (error) return false;
      }
    } else if (formType === 'kyc') {
      const requiredFields = ['govID', 'kycAddress', 'kycDob', 'pan'];

      for (const field of requiredFields) {
        const error = FormValidator.validateField(field, formData[field]);
        if (error) return false;
      }
    }

    return true;
  },

  /**
   * Get all validation errors for a form
   * @param {object} formData - The form data object to validate
   * @param {string} formType - Type of form ('customer' or 'kyc')
   * @returns {object} - Object with field names as keys and error messages as values
   */
  validateAll: (formData, formType = 'customer') => {
    const errors = {};

    if (!formData || typeof formData !== 'object') return errors;

    let fields = [];
    if (formType === 'customer') {
      fields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'dateOfBirth',
        'address',
        'city',
        'state',
        'zipCode',
        'income'
      ];
    } else if (formType === 'kyc') {
      fields = ['govID', 'kycAddress', 'kycDob', 'pan'];
    }

    for (const field of fields) {
      const error = FormValidator.validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
      }
    }

    return errors;
  }
};

export default FormValidator;
