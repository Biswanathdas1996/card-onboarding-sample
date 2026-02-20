jest.mock('../config');

const CustomerModel = require('./CustomerModel');
const db = require('../config');

describe('CustomerModel', () => {
  describe('create', () => {
    it('should create a new customer record and return success', async () => {
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '123-456-7890',
        accountType: 'Savings',
        employmentStatus: 'Employed',
        annualIncome: 50000,
        dateOfBirth: '1990-01-01',
        nationality: 'US',
      };

      const mockResult = { id: 'some-uuid', created_at: '2023-10-27T00:00:00.000Z' };
      db.queryOne.mockResolvedValue(mockResult);

      const result = await CustomerModel.create(customerData);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [
        'John',
        'Doe',
        'john.doe@example.com',
        '123-456-7890',
        'Savings',
        'Employed',
        50000,
        '1990-01-01',
        'US',
      ]);
      expect(result).toEqual({
        success: true,
        customerId: 'some-uuid',
        createdAt: '2023-10-27T00:00:00.000Z',
      });
    });

    it('should handle null values for optional fields', async () => {
      const customerData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        accountType: 'Checking',
      };

      const mockResult = { id: 'another-uuid', created_at: '2023-10-27T00:00:00.000Z' };
      db.queryOne.mockResolvedValue(mockResult);

      const result = await CustomerModel.create(customerData);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [
        'Jane',
        'Smith',
        'jane.smith@example.com',
        null,
        'Checking',
        null,
        null,
        null,
        null,
      ]);
      expect(result).toEqual({
        success: true,
        customerId: 'another-uuid',
        createdAt: '2023-10-27T00:00:00.000Z',
      });
    });
  });

  describe('getById', () => {
    it('should get customer by ID', async () => {
      const customerId = 'some-uuid';
      const mockCustomer = {
        id: customerId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '123-456-7890',
        account_type: 'Savings',
        employment_status: 'Employed',
        annual_income: 50000,
        date_of_birth: '1990-01-01',
        nationality: 'US',
        status: 'pending',
        created_at: '2023-10-26T00:00:00.000Z',
        updated_at: '2023-10-27T00:00:00.000Z',
      };
      db.queryOne.mockResolvedValue(mockCustomer);

      const result = await CustomerModel.getById(customerId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [customerId]);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('getByEmail', () => {
    it('should get customer by email', async () => {
      const email = 'john.doe@example.com';
      const mockCustomer = {
        id: 'some-uuid',
        first_name: 'John',
        last_name: 'Doe',
        email: email,
        phone_number: '123-456-7890',
        account_type: 'Savings',
        employment_status: 'Employed',
        annual_income: 50000,
        date_of_birth: '1990-01-01',
        nationality: 'US',
        status: 'pending',
        created_at: '2023-10-26T00:00:00.000Z',
        updated_at: '2023-10-27T00:00:00.000Z',
      };
      db.queryOne.mockResolvedValue(mockCustomer);

      const result = await CustomerModel.getByEmail(email);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [email]);
      expect(result).toEqual(mockCustomer);
    });
  });
});