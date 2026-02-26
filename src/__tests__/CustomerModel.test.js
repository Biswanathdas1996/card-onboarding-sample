const CustomerModel = require('../../db/models/CustomerModel');
const db = require('../../db/config');
const { v4: uuidv4 } = require('uuid');

// Mock the db module
jest.mock('../../db/config', () => ({
  queryOne: jest.fn(),
  queryAll: jest.fn(),
}));

describe('CustomerModel', () => {
  let mockCustomerData;
  let mockCustomerId;

  beforeEach(() => {
    mockCustomerId = uuidv4();
    mockCustomerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '1234567890',
      accountType: 'Savings',
      employmentStatus: 'Employed',
      annualIncome: 50000,
      dateOfBirth: '1990-01-01',
      nationality: 'American',
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new customer record successfully', async () => {
      // Arrange
      const mockDbResult = { id: mockCustomerId, created_at: new Date().toISOString() };
      db.queryOne.mockResolvedValue(mockDbResult);

      // Act
      const result = await CustomerModel.create(mockCustomerData);

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.any(String),
        [
          mockCustomerData.firstName,
          mockCustomerData.lastName,
          mockCustomerData.email,
          mockCustomerData.phoneNumber,
          mockCustomerData.accountType,
          mockCustomerData.employmentStatus,
          mockCustomerData.annualIncome,
          mockCustomerData.dateOfBirth,
          mockCustomerData.nationality,
        ]
      );
      expect(result).toEqual({
        success: true,
        customerId: mockCustomerId,
        createdAt: mockDbResult.created_at,
      });
    });

    it('should handle optional fields correctly when creating a customer', async () => {
      // Arrange
      const customerDataWithOptionalFieldsMissing = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        accountType: 'Checking',
      };
      const mockDbResult = { id: uuidv4(), created_at: new Date().toISOString() };
      db.queryOne.mockResolvedValue(mockDbResult);

      // Act
      const result = await CustomerModel.create(customerDataWithOptionalFieldsMissing);

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.any(String),
        [
          customerDataWithOptionalFieldsMissing.firstName,
          customerDataWithOptionalFieldsMissing.lastName,
          customerDataWithOptionalFieldsMissing.email,
          null, // phoneNumber
          customerDataWithOptionalFieldsMissing.accountType,
          null, // employmentStatus
          null, // annualIncome
          null, // dateOfBirth
          null, // nationality
        ]
      );
      expect(result.success).toBe(true);
      expect(result.customerId).toBe(mockDbResult.id);
    });

    it('should return a duplicate email error if email already exists', async () => {
      // Arrange
      const duplicateEmailError = new Error('Unique constraint violation');
      duplicateEmailError.code = '23505'; // PostgreSQL unique violation error code
      db.queryOne.mockRejectedValue(duplicateEmailError);

      // Act
      const result = await CustomerModel.create(mockCustomerData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email already registered',
        code: 'DUPLICATE_EMAIL',
      });
    });

    it('should throw an error for other database errors during creation', async () => {
      // Arrange
      const genericError = new Error('Database connection failed');
      db.queryOne.mockRejectedValue(genericError);

      // Act & Assert
      await expect(CustomerModel.create(mockCustomerData)).rejects.toThrow(genericError);
    });
  });

  describe('getById', () => {
    it('should retrieve a customer record by ID', async () => {
      // Arrange
      const mockCustomerRecord = { id: mockCustomerId, ...mockCustomerData, status: 'pending' };
      db.queryOne.mockResolvedValue(mockCustomerRecord);

      // Act
      const result = await CustomerModel.getById(mockCustomerId);

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [mockCustomerId]);
      expect(result).toEqual(mockCustomerRecord);
    });

    it('should return null if customer ID does not exist', async () => {
      // Arrange
      db.queryOne.mockResolvedValue(null);

      // Act
      const result = await CustomerModel.getById(mockCustomerId);

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
      // Arrange
      const genericError = new Error('DB error');
      db.queryOne.mockRejectedValue(genericError);

      // Act & Assert
      await expect(CustomerModel.getById(mockCustomerId)).rejects.toThrow(genericError);
    });
  });

  describe('getByEmail', () => {
    it('should retrieve a customer record by email', async () => {
      // Arrange
      const mockCustomerRecord = { id: mockCustomerId, ...mockCustomerData, status: 'pending' };
      db.queryOne.mockResolvedValue(mockCustomerRecord);

      // Act
      const result = await CustomerModel.getByEmail(mockCustomerData.email);

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [mockCustomerData.email]);
      expect(result).toEqual(mockCustomerRecord);
    });

    it('should return null if customer email does not exist', async () => {
      // Arrange
      db.queryOne.mockResolvedValue(null);

      // Act
      const result = await CustomerModel.getByEmail('nonexistent@example.com');

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
      // Arrange
      const genericError = new Error('DB error');
      db.queryOne.mockRejectedValue(genericError);

      // Act & Assert
      await expect(CustomerModel.getByEmail(mockCustomerData.email)).rejects.toThrow(genericError);
    });
  });

  describe('updateStatus', () => {
    it('should update the status of a customer record', async () => {
      // Arrange
      const newStatus = 'approved';
      const mockUpdatedRecord = { id: mockCustomerId, status: newStatus, updated_at: new Date().toISOString() };
      db.queryOne.mockResolvedValue(mockUpdatedRecord);

      // Act
      const result = await CustomerModel.updateStatus(mockCustomerId, newStatus);

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [newStatus, mockCustomerId]);
      expect(result).toEqual(mockUpdatedRecord);
    });

    it('should return null if customer ID to update does not exist', async () => {
      // Arrange
      db.queryOne.mockResolvedValue(null);

      // Act
      const result = await CustomerModel.updateStatus(uuidv4(), 'rejected');

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should throw an error if database query fails', async () => {
      // Arrange
      const genericError = new Error('DB error');
      db.queryOne.mockRejectedValue(genericError);

      // Act & Assert
      await expect(CustomerModel.updateStatus(mockCustomerId, 'approved')).rejects.toThrow(genericError);
    });
  });

  describe('getAll', () => {
    it('should retrieve all customer records with default pagination', async () => {
      // Arrange
      const mockCustomers = [
        { id: uuidv4(), firstName: 'A', email: 'a@example.com', status: 'pending' },
        { id: uuidv4(), firstName: 'B', email: 'b@example.com', status: 'approved' },
      ];
      db.queryAll.mockResolvedValue(mockCustomers);

      // Act
      const result = await CustomerModel.getAll();

      // Assert
      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), [20, 0]); // Default limit and offset
      expect(result).toEqual(mockCustomers);
    });

    it('should retrieve customer records with specified pagination', async () => {
      // Arrange
      const mockCustomers = [
        { id: uuidv4(), firstName: 'C', email: 'c@example.com', status: 'pending' },
      ];
      db.queryAll.mockResolvedValue(mockCustomers);
      const limit = 10;
      const offset = 5;

      // Act
      const result = await CustomerModel.getAll(limit, offset);

      // Assert
      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(db.queryAll).toHaveBeenCalledWith(expect.any(String), [limit, offset]);
      expect(result).toEqual(mockCustomers);
    });

    it('should return an empty array if no customers are found', async () => {
      // Arrange
      db.queryAll.mockResolvedValue([]);

      // Act
      const result = await CustomerModel.getAll();

      // Assert
      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should throw an error if database query fails', async () => {
      // Arrange
      const genericError = new Error('DB error');
      db.queryAll.mockRejectedValue(genericError);

      // Act & Assert
      await expect(CustomerModel.getAll()).rejects.toThrow(genericError);
    });
  });

  describe('count', () => {
    it('should return the total count of customers', async () => {
      // Arrange
      const mockCountResult = { count: '123' };
      db.queryOne.mockResolvedValue(mockCountResult);

      // Act
      const result = await CustomerModel.count();

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String));
      expect(result).toBe(123);
    });

    it('should return 0 if no customers are found', async () => {
      // Arrange
      const mockCountResult = { count: '0' };
      db.queryOne.mockResolvedValue(mockCountResult);

      // Act
      const result = await CustomerModel.count();

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toBe(0);
    });

    it('should throw an error if database query fails', async () => {
      // Arrange
      const genericError = new Error('DB error');
      db.queryOne.mockRejectedValue(genericError);

      // Act & Assert
      await expect(CustomerModel.count()).rejects.toThrow(genericError);
    });
  });

  describe('delete', () => {
    it('should delete a customer record by ID', async () => {
      // Arrange
      const mockDeleteResult = { id: mockCustomerId };
      db.queryOne.mockResolvedValue(mockDeleteResult);

      // Act
      const result = await CustomerModel.delete(mockCustomerId);

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), [mockCustomerId]);
      expect(result).toEqual({ success: true });
    });

    it('should return success: false if customer ID to delete does not exist', async () => {
      // Arrange
      db.queryOne.mockResolvedValue(null);

      // Act
      const result = await CustomerModel.delete(uuidv4());

      // Assert
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: false });
    });

    it('should throw an error if database query fails', async () => {
      // Arrange
      const genericError = new Error('DB error');
      db.queryOne.mockRejectedValue(genericError);

      // Act & Assert
      await expect(CustomerModel.delete(mockCustomerId)).rejects.toThrow(genericError);
    });
  });
});