const BasicDetailsModel = require('./BasicDetailsModel');
const db = require('../config');
const { v4: uuidv4 } = require('uuid');

// Mock the database module
jest.mock('../config', () => ({
  queryOne: jest.fn(),
  queryAll: jest.fn(),
}));

describe('BasicDetailsModel', () => {
  const mockDate = '1990-01-01';
  const mockAddress = '123 Test St';
  const mockName = 'John Doe';
  const mockId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  const mockCreatedAt = new Date().toISOString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should successfully create a new basic details record', async () => {
      const basicData = {
        name: mockName,
        dateOfBirth: mockDate,
        address: mockAddress,
      };
      const expectedResult = {
        id: mockId,
        name: mockName,
        date_of_birth: mockDate,
        address: mockAddress,
        created_at: mockCreatedAt,
      };

      db.queryOne.mockResolvedValue(expectedResult);

      const result = await BasicDetailsModel.create(basicData);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO basic_details'),
        [basicData.name, basicData.dateOfBirth, basicData.address]
      );
      expect(result).toEqual({ success: true, data: expectedResult });
    });

    test('should throw an error if database operation fails during creation', async () => {
      const basicData = {
        name: mockName,
        dateOfBirth: mockDate,
        address: mockAddress,
      };
      const mockError = new Error('Database insert failed');
      db.queryOne.mockRejectedValue(mockError);

      await expect(BasicDetailsModel.create(basicData)).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
    });

    test('should handle missing data gracefully (database constraint error)', async () => {
      const basicData = {
        name: mockName,
        // dateOfBirth is missing
        address: mockAddress,
      };
      const mockError = new Error('null value in column "date_of_birth" violates not-null constraint');
      db.queryOne.mockRejectedValue(mockError);

      await expect(BasicDetailsModel.create(basicData)).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    test('should successfully retrieve a basic details record by ID', async () => {
      const expectedRecord = {
        id: mockId,
        name: mockName,
        date_of_birth: mockDate,
        address: mockAddress,
        created_at: mockCreatedAt,
      };
      db.queryOne.mockResolvedValue(expectedRecord);

      const result = await BasicDetailsModel.getById(mockId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, date_of_birth, address, created_at FROM basic_details WHERE id = $1;'),
        [mockId]
      );
      expect(result).toEqual(expectedRecord);
    });

    test('should return null if no record is found for the given ID', async () => {
      db.queryOne.mockResolvedValue(null);

      const result = await BasicDetailsModel.getById(mockId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test('should throw an error if database operation fails during retrieval', async () => {
      const mockError = new Error('Database select failed');
      db.queryOne.mockRejectedValue(mockError);

      await expect(BasicDetailsModel.getById(mockId)).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAll', () => {
    test('should retrieve all basic details records with default pagination', async () => {
      const expectedRecords = [{
        id: mockId,
        name: mockName,
        date_of_birth: mockDate,
        address: mockAddress,
        created_at: mockCreatedAt,
      }];
      db.queryAll.mockResolvedValue(expectedRecords);

      const result = await BasicDetailsModel.getAll();

      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, date_of_birth, address, created_at FROM basic_details ORDER BY created_at DESC LIMIT $1 OFFSET $2;'),
        [100, 0]
      );
      expect(result).toEqual(expectedRecords);
    });

    test('should retrieve basic details records with custom pagination', async () => {
      const expectedRecords = [{
        id: mockId,
        name: mockName,
        date_of_birth: mockDate,
        address: mockAddress,
        created_at: mockCreatedAt,
      }];
      db.queryAll.mockResolvedValue(expectedRecords);

      const limit = 5;
      const offset = 10;
      const result = await BasicDetailsModel.getAll(limit, offset);

      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, date_of_birth, address, created_at FROM basic_details ORDER BY created_at DESC LIMIT $1 OFFSET $2;'),
        [limit, offset]
      );
      expect(result).toEqual(expectedRecords);
    });

    test('should return an empty array if no records are found', async () => {
      db.queryAll.mockResolvedValue([]);

      const result = await BasicDetailsModel.getAll();

      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    test('should throw an error if database operation fails during retrieval of all records', async () => {
      const mockError = new Error('Database select all failed');
      db.queryAll.mockRejectedValue(mockError);

      await expect(BasicDetailsModel.getAll()).rejects.toThrow(mockError);
      expect(db.queryAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('count', () => {
    test('should return the total count of basic details records', async () => {
      const expectedCount = 5;
      db.queryOne.mockResolvedValue({ count: expectedCount.toString() });

      const result = await BasicDetailsModel.count();

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM basic_details;');
      expect(result).toBe(expectedCount);
    });

    test('should return 0 if no records are present', async () => {
      db.queryOne.mockResolvedValue({ count: '0' });

      const result = await BasicDetailsModel.count();

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toBe(0);
    });

    test('should throw an error if database operation fails during count', async () => {
      const mockError = new Error('Database count failed');
      db.queryOne.mockRejectedValue(mockError);

      await expect(BasicDetailsModel.count()).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    test('should successfully delete a basic details record by ID', async () => {
      db.queryOne.mockResolvedValue({ id: mockId });

      const result = await BasicDetailsModel.delete(mockId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM basic_details WHERE id = $1 RETURNING id;'),
        [mockId]
      );
      expect(result).toEqual({ success: true });
    });

    test('should return success: false if no record is found for deletion', async () => {
      db.queryOne.mockResolvedValue(null);

      const result = await BasicDetailsModel.delete(mockId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: false });
    });

    test('should throw an error if database operation fails during deletion', async () => {
      const mockError = new Error('Database delete failed');
      db.queryOne.mockRejectedValue(mockError);

      await expect(BasicDetailsModel.delete(mockId)).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
    });
  });
});