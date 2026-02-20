/**
 * Unit tests for src/api/CustomerDataSubmission_DB.js
 */

jest.mock('../services/FormValidator');

const API_BASE_URL = 'http://localhost:5000';

import { CustomerDataSubmission } from '../src/api/CustomerDataSubmission_DB';
import FormValidator from '../src/services/FormValidator';

describe('CustomerDataSubmission', () => {
  describe('submitCustomerForm', () => {
    test('should return success response with customer ID on successful submission', async () => {
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
      };

      FormValidator.validateAll.mockReturnValue({});

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ customerId: '123' }),
        })
      );

      const response = await CustomerDataSubmission.submitCustomerForm(customerData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.message).toBe('Customer data submitted successfully');
      expect(response.data.customerId).toBe('123');
      expect(response.data.firstName).toBe('John');
      expect(FormValidator.validateAll).toHaveBeenCalledWith(customerData, 'customer');
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phoneNumber: customerData.phone,
          accountType: 'individual',
          employmentStatus: null,
          annualIncome: null,
          dateOfBirth: null,
          nationality: null,
        }),
      });
    });

    test('should return error response when validation fails', async () => {
      const customerData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        phone: '123',
      };

      FormValidator.validateAll.mockReturnValue({
        firstName: 'First name is required',
        lastName: 'Last name is required',
        email: 'Invalid email format',
        phone: 'Invalid phone number',
      });

      const response = await CustomerDataSubmission.submitCustomerForm(customerData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toEqual({
        firstName: 'First name is required',
        lastName: 'Last name is required',
        email: 'Invalid email format',
        phone: 'Invalid phone number',
      });
      expect(FormValidator.validateAll).toHaveBeenCalledWith(customerData, 'customer');
    });
  });
});