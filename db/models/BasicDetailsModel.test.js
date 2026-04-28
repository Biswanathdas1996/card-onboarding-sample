const BasicDetailsModel = require('../../../db/models/BasicDetailsModel');
const db = require('../../../db/config'); // Adjust path as per your project structure

// Mock the entire db module
jest.mock('../../../db/config', () => ({
  queryOne: jest.fn(),
  queryAll: jest.fn(),
}));

describe('BasicDetailsModel', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error output during tests
  });

  afterEach(() => {
    console.error.mockRestore(); // Restore console.error after each test
  });

  describe('create', () => {
    test('TC-BDM-001: should successfully create a new basic details record', async () => {
      const mockBasicData = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
      };
      const mockCreatedRecord = {
        id: 'mock-uuid-1',
        name: 'John Doe',
        date_of_birth: '1990-01-01',
        address: '123 Main St',
        created_at: new Date().toISOString(),
      };

      db.queryOne.mockResolvedValueOnce(mockCreatedRecord);

      const result = await BasicDetailsModel.create(mockBasicData);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO basic_details'),
        [mockBasicData.name, mockBasicData.dateOfBirth, mockBasicData.address]
      );
      expect(result).toEqual({
        success: true,
        data: mockCreatedRecord,
      });
    });

    test('TC-BDM-002: should throw an error if database operation fails during creation', async () => {
      const mockBasicData = {
        name: 'Jane Doe',
        dateOfBirth: '1985-05-10',
        address: '456 Oak Ave',
      };
      const mockError = new Error('Database insert failed');

      db.queryOne.mockRejectedValueOnce(mockError);

      await expect(BasicDetailsModel.create(mockBasicData)).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Basic details creation error:', mockError);
    });

    test('TC-BDM-003: should handle missing basicData fields gracefully (database should reject)', async () => {
      const mockBasicData = {
        name: 'Missing Address',
        dateOfBirth: '2000-01-01',
        // address is missing
      };
      const mockError = new Error('SQLSTATE[23502]: Not null violation'); // Example database error for missing required field

      db.queryOne.mockRejectedValueOnce(mockError);

      await expect(BasicDetailsModel.create(mockBasicData)).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Basic details creation error:', mockError);
    });
  });

  describe('getById', () => {
    test('TC-BDM-004: should retrieve a basic details record by a valid ID', async () => {
      const mockId = 'mock-uuid-2';
      const mockRecord = {
        id: mockId,
        name: 'Alice Smith',
        date_of_birth: '1975-11-20',
        address: '789 Pine Ln',
        created_at: new Date().toISOString(),
      };

      db.queryOne.mockResolvedValueOnce(mockRecord);

      const result = await BasicDetailsModel.getById(mockId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, date_of_birth, address, created_at FROM basic_details WHERE id = $1'),
        [mockId]
      );
      expect(result).toEqual(mockRecord);
    });

    test('TC-BDM-005: should return null/undefined if no record found for the given ID', async () => {
      const mockId = 'non-existent-uuid';

      db.queryOne.mockResolvedValueOnce(undefined); // Or null, depending on db.queryOne implementation for no results

      const result = await BasicDetailsModel.getById(mockId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    test('TC-BDM-006: should throw an error if database operation fails during getById', async () => {
      const mockId = 'error-uuid';
      const mockError = new Error('Database select failed');

      db.queryOne.mockRejectedValueOnce(mockError);

      await expect(BasicDetailsModel.getById(mockId)).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Get basic details error:', mockError);
    });
  });

  describe('getAll', () => {
    test('TC-BDM-007: should retrieve all basic details records with default pagination', async () => {
      const mockRecords = [{
        id: 'mock-uuid-3',
        name: 'Bob Johnson',
        date_of_birth: '1980-03-15',
        address: '101 Elm St',
        created_at: new Date().toISOString(),
      }, {
        id: 'mock-uuid-4',
        name: 'Charlie Brown',
        date_of_birth: '1995-07-22',
        address: '202 Maple Ave',
        created_at: new Date().toISOString(),
      }, ];

      db.queryAll.mockResolvedValueOnce(mockRecords);

      const result = await BasicDetailsModel.getAll(); // No limit/offset provided

      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, date_of_birth, address, created_at FROM basic_details ORDER BY created_at DESC LIMIT $1 OFFSET $2'),
        [100, 0] // Default limit and offset
      );
      expect(result).toEqual(mockRecords);
    });

    test('TC-BDM-008: should retrieve basic details records with custom pagination', async () => {
      const mockRecords = [{
        id: 'mock-uuid-5',
        name: 'Diana Prince',
        date_of_birth: '1960-08-01',
        address: '303 Amazon Way',
        created_at: new Date().toISOString(),
      }, ];
      const limit = 1;
      const offset = 1;

      db.queryAll.mockResolvedValueOnce(mockRecords);

      const result = await BasicDetailsModel.getAll(limit, offset);

      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(db.queryAll).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, date_of_birth, address, created_at FROM basic_details ORDER BY created_at DESC LIMIT $1 OFFSET $2'),
        [limit, offset]
      );
      expect(result).toEqual(mockRecords);
    });

    test('TC-BDM-009: should return an empty array if no records found', async () => {
      db.queryAll.mockResolvedValueOnce([]);

      const result = await BasicDetailsModel.getAll();

      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    test('TC-BDM-010: should throw an error if database operation fails during getAll', async () => {
      const mockError = new Error('Database select all failed');

      db.queryAll.mockRejectedValueOnce(mockError);

      await expect(BasicDetailsModel.getAll()).rejects.toThrow(mockError);
      expect(db.queryAll).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Get all basic details error:', mockError);
    });
  });

  describe('count', () => {
    test('TC-BDM-011: should return the total count of basic details records', async () => {
      const mockCountResult = {
        count: '5',
      }; // Database returns count as string

      db.queryOne.mockResolvedValueOnce(mockCountResult);

      const result = await BasicDetailsModel.count();

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM basic_details;');
      expect(result).toBe(5);
    });

    test('TC-BDM-012: should return 0 if no records exist', async () => {
      const mockCountResult = {
        count: '0',
      };

      db.queryOne.mockResolvedValueOnce(mockCountResult);

      const result = await BasicDetailsModel.count();

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toBe(0);
    });

    test('TC-BDM-013: should throw an error if database operation fails during count', async () => {
      const mockError = new Error('Database count failed');

      db.queryOne.mockRejectedValueOnce(mockError);

      await expect(BasicDetailsModel.count()).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Count basic details error:', mockError);
    });
  });

  describe('delete', () => {
    test('TC-BDM-014: should successfully delete a basic details record by ID', async () => {
      const mockId = 'mock-uuid-6';
      const mockDeletedRecord = {
        id: mockId,
      };

      db.queryOne.mockResolvedValueOnce(mockDeletedRecord);

      const result = await BasicDetailsModel.delete(mockId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM basic_details WHERE id = $1 RETURNING id;'),
        [mockId]
      );
      expect(result).toEqual({
        success: true,
      });
    });

    test('TC-BDM-015: should return success: false if no record was deleted (ID not found)', async () => {
      const mockId = 'non-existent-delete-uuid';

      db.queryOne.mockResolvedValueOnce(undefined); // No record returned means no deletion

      const result = await BasicDetailsModel.delete(mockId);

      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: false,
      });
    });

    test('TC-BDM-016: should throw an error if database operation fails during deletion', async () => {
      const mockId = 'error-delete-uuid';
      const mockError = new Error('Database delete failed');

      db.queryOne.mockRejectedValueOnce(mockError);

      await expect(BasicDetailsModel.delete(mockId)).rejects.toThrow(mockError);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Delete basic details error:', mockError);
    });
  });
});