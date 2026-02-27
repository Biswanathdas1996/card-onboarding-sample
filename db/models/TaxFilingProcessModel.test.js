const TaxFilingProcessModel = require('./TaxFilingProcessModel');
const db = require('../../db/config');
const {
  v4: uuidv4
} = require('uuid');

// Mock the db module
jest.mock('../../db/config', () => ({
  query: jest.fn(),
}));

// Mock uuidv4 to return a consistent UUID for testing
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('TaxFilingProcessModel', () => {
  beforeEach(() => {
    // Reset mocks before each test
    db.query.mockReset();
    uuidv4.mockReset();
  });

  describe('getAllStepsOrdered', () => {
    test('should retrieve all steps ordered by sequence successfully', async () => {
      const mockSteps = [{
        step_id: '1',
        step_number: 1,
        title: 'Step 1',
        description: 'Desc 1',
        order_sequence: 1,
        image_url: null,
        svg_data: null,
        created_at: new Date().toISOString(), // Use ISO string for consistency
        updated_at: new Date().toISOString() // Use ISO string for consistency
      }, {
        step_id: '2',
        step_number: 2,
        title: 'Step 2',
        description: 'Desc 2',
        order_sequence: 2,
        image_url: 'http://example.com/img2.png',
        svg_data: '<svg>...</svg>',
        created_at: new Date().toISOString(), // Use ISO string for consistency
        updated_at: new Date().toISOString() // Use ISO string for consistency
      }, ];
      db.query.mockResolvedValue({
        rows: mockSteps
      });

      const steps = await TaxFilingProcessModel.getAllStepsOrdered();

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY order_sequence ASC'));
      // Assert that the returned steps match the mock, allowing for Date objects
      expect(steps).toEqual(mockSteps.map(step => ({
        ...step,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      })));
    });

    test('should return an empty array if no steps are found', async () => {
      db.query.mockResolvedValue({
        rows: []
      });

      const steps = await TaxFilingProcessModel.getAllStepsOrdered();

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(steps).toEqual([]);
    });

    test('should throw an error if the database query fails', async () => {
      const mockError = new Error('Database connection failed');
      db.query.mockRejectedValue(mockError);

      await expect(TaxFilingProcessModel.getAllStepsOrdered()).rejects.toThrow('Failed to retrieve tax filing process steps.');
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStepById', () => {
    const mockStepId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    const mockStep = {
      step_id: mockStepId,
      step_number: 1,
      title: 'Step 1',
      description: 'Description for step 1',
      order_sequence: 1,
      image_url: null,
      svg_data: null,
      created_at: new Date().toISOString(), // Use ISO string for consistency
      updated_at: new Date().toISOString(), // Use ISO string for consistency
    };

    test('should retrieve a step by ID successfully', async () => {
      db.query.mockResolvedValue({
        rows: [mockStep]
      });

      const step = await TaxFilingProcessModel.getStepById(mockStepId);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), [mockStepId]);
      // Assert that the returned step matches the mock, allowing for Date objects
      expect(step).toEqual({
        ...mockStep,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });

    test('should return null if no step is found for the given ID', async () => {
      db.query.mockResolvedValue({
        rows: []
      });

      const step = await TaxFilingProcessModel.getStepById(mockStepId);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(step).toBeNull();
    });

    test('should throw an error if stepId is null', async () => {
      await expect(TaxFilingProcessModel.getStepById(null)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if stepId is undefined', async () => {
      await expect(TaxFilingProcessModel.getStepById(undefined)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if stepId is not a string', async () => {
      await expect(TaxFilingProcessModel.getStepById(123)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if the database query fails', async () => {
      const mockError = new Error('Database query error');
      db.query.mockRejectedValue(mockError);

      await expect(TaxFilingProcessModel.getStepById(mockStepId)).rejects.toThrow(`Failed to retrieve tax filing process step with ID ${mockStepId}.`);
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('createStep', () => {
    const newStepData = {
      step_number: 1,
      title: 'New Step',
      description: 'Description for new step',
      order_sequence: 1,
      image_url: 'http://example.com/new.png',
      svg_data: '<svg>new</svg>',
    };
    const mockUuid = 'new-step-uuid';

    beforeEach(() => {
      uuidv4.mockReturnValue(mockUuid);
    });

    test('should create a new step successfully with all data', async () => {
      const createdStep = {
        step_id: mockUuid,
        ...newStepData,
        created_at: new Date(), // Fix: Should be Date object
        updated_at: new Date(), // Fix: Should be Date object
      };
      db.query.mockResolvedValue({
        rows: [createdStep]
      });

      const result = await TaxFilingProcessModel.createStep(newStepData);

      expect(uuidv4).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tax_filing_process_steps'),
        [
          mockUuid,
          newStepData.step_number,
          newStepData.title,
          newStepData.description,
          newStepData.order_sequence,
          newStepData.image_url,
          newStepData.svg_data,
        ]
      );
      expect(result).toEqual({
        ...createdStep,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });

    test('should create a new step successfully with minimal data (null image_url and svg_data)', async () => {
      const minimalStepData = {
        step_number: 2,
        title: 'Minimal Step',
        description: 'Minimal description',
        order_sequence: 2,
      };
      const createdStep = {
        step_id: mockUuid,
        ...minimalStepData,
        image_url: null,
        svg_data: null,
        created_at: new Date(), // Fix: Should be Date object
        updated_at: new Date(), // Fix: Should be Date object
      };
      db.query.mockResolvedValue({
        rows: [createdStep]
      });

      const result = await TaxFilingProcessModel.createStep(minimalStepData);

      expect(uuidv4).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tax_filing_process_steps'),
        [
          mockUuid,
          minimalStepData.step_number,
          minimalStepData.title,
          minimalStepData.description,
          minimalStepData.order_sequence,
          null, // Expect null for image_url
          null, // Expect null for svg_data
        ]
      );
      expect(result).toEqual({
        ...createdStep,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });

    test('should throw an error for invalid step_number (zero)', async () => {
      const invalidData = { ...newStepData,
        step_number: 0
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid step_number: Must be a positive number.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for invalid step_number (negative)', async () => {
      const invalidData = { ...newStepData,
        step_number: -1
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid step_number: Must be a positive number.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for invalid step_number (not a number)', async () => {
      const invalidData = { ...newStepData,
        step_number: 'one'
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid step_number: Must be a positive number.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for empty title', async () => {
      const invalidData = { ...newStepData,
        title: ''
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid title: Cannot be empty.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for title with only whitespace', async () => {
      const invalidData = { ...newStepData,
        title: '   '
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid title: Cannot be empty.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for non-string title', async () => {
      const invalidData = { ...newStepData,
        title: 123
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid title: Cannot be empty.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for empty description', async () => {
      const invalidData = { ...newStepData,
        description: ''
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid description: Cannot be empty.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for description with only whitespace', async () => {
      const invalidData = { ...newStepData,
        description: '   '
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid description: Cannot be empty.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for non-string description', async () => {
      const invalidData = { ...newStepData,
        description: 123
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid description: Cannot be empty.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for invalid order_sequence (zero)', async () => {
      const invalidData = { ...newStepData,
        order_sequence: 0
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid order_sequence: Must be a positive number.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for invalid order_sequence (negative)', async () => {
      const invalidData = { ...newStepData,
        order_sequence: -1
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid order_sequence: Must be a positive number.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for invalid order_sequence (not a number)', async () => {
      const invalidData = { ...newStepData,
        order_sequence: 'one'
      };
      await expect(TaxFilingProcessModel.createStep(invalidData)).rejects.toThrow('Invalid order_sequence: Must be a positive number.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw a specific error for unique constraint violation (e.g., duplicate order_sequence)', async () => {
      const mockError = new Error('duplicate key value violates unique constraint "tax_filing_process_steps_order_sequence_key"');
      mockError.code = '23505'; // PostgreSQL unique_violation error code
      db.query.mockRejectedValue(mockError);

      await expect(TaxFilingProcessModel.createStep(newStepData)).rejects.toThrow('Failed to create tax filing process step: A step with the same order sequence already exists.');
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('should throw a generic error if the database query fails for other reasons', async () => {
      const mockError = new Error('Database insert failed');
      db.query.mockRejectedValue(mockError);

      await expect(TaxFilingProcessModel.createStep(newStepData)).rejects.toThrow('Failed to create tax filing process step.');
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateStep', () => {
    const existingStepId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    const updateData = {
      title: 'Updated Title',
      description: 'Updated Description',
      image_url: 'http://example.com/updated.png',
      svg_data: '<svg>updated</svg>',
      order_sequence: 5,
      step_number: 3,
    };
    const updatedStepResult = {
      step_id: existingStepId,
      ...updateData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    test('should update an existing step successfully with all fields', async () => {
      db.query.mockResolvedValue({
        rows: [{
          ...updatedStepResult,
          created_at: new Date(updatedStepResult.created_at),
          updated_at: new Date(updatedStepResult.updated_at),
        }]
      });

      const result = await TaxFilingProcessModel.updateStep(existingStepId, updateData);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tax_filing_process_steps SET'),
        expect.arrayContaining([
          updateData.title,
          updateData.description,
          updateData.image_url,
          updateData.svg_data,
          updateData.order_sequence,
          updateData.step_number,
          existingStepId,
        ])
      );
      expect(result).toEqual({
        ...updateData,
        step_id: existingStepId,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });

    test('should update an existing step successfully with partial fields (only title)', async () => {
      const partialUpdateData = {
        title: 'Partial Update Title'
      };
      const partialUpdatedStepResult = {
        ...updatedStepResult,
        title: partialUpdateData.title,
        description: 'Original Description', // Assume original description
        image_url: null, // Assume original null
        svg_data: null, // Assume original null
        order_sequence: 1, // Assume original order_sequence
        step_number: 1, // Assume original step_number
      };
      db.query.mockResolvedValue({
        rows: [{
          ...partialUpdatedStepResult,
          created_at: new Date(partialUpdatedStepResult.created_at),
          updated_at: new Date(partialUpdatedStepResult.updated_at),
        }]
      });

      const result = await TaxFilingProcessModel.updateStep(existingStepId, partialUpdateData);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tax_filing_process_steps SET'),
        expect.arrayContaining([
          partialUpdateData.title,
          existingStepId,
        ])
      );
      expect(result).toEqual({
        ...partialUpdatedStepResult,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });

    test('should return null if no step is found for the given ID to update', async () => {
      db.query.mockResolvedValue({
        rows: []
      });

      const result = await TaxFilingProcessModel.updateStep(existingStepId, updateData);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test('should throw an error if stepId is null', async () => {
      await expect(TaxFilingProcessModel.updateStep(null, updateData)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if stepId is undefined', async () => {
      await expect(TaxFilingProcessModel.updateStep(undefined, updateData)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if stepId is not a string', async () => {
      await expect(TaxFilingProcessModel.updateStep(123, updateData)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if updateData is empty', async () => {
      await expect(TaxFilingProcessModel.updateStep(existingStepId, {})).rejects.toThrow('No update data provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for invalid step_number in updateData (zero)', async () => {
      const invalidData = { ...updateData,
        step_number: 0
      };
      await expect(TaxFilingProcessModel.updateStep(existingStepId, invalidData)).rejects.toThrow('Invalid step_number: Must be a positive number.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error for invalid order_sequence in updateData (negative)', async () => {
      const invalidData = { ...updateData,
        order_sequence: -1
      };
      await expect(TaxFilingProcessModel.updateStep(existingStepId, invalidData)).rejects.toThrow('Invalid order_sequence: Must be a positive number.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw a specific error for unique constraint violation during update', async () => {
      const mockError = new Error('duplicate key value violates unique constraint "tax_filing_process_steps_order_sequence_key"');
      mockError.code = '23505';
      db.query.mockRejectedValue(mockError);

      await expect(TaxFilingProcessModel.updateStep(existingStepId, updateData)).rejects.toThrow('Failed to update tax filing process step: A step with the same order sequence already exists.');
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('should throw a generic error if the database query fails during update', async () => {
      const mockError = new Error('Database update failed');
      db.query.mockRejectedValue(mockError);

      await expect(TaxFilingProcessModel.updateStep(existingStepId, updateData)).rejects.toThrow(`Failed to update tax filing process step with ID ${existingStepId}.`);
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteStep', () => {
    const mockStepId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

    test('should delete a step successfully', async () => {
      db.query.mockResolvedValue({
        rowCount: 1
      });

      const result = await TaxFilingProcessModel.deleteStep(mockStepId);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM tax_filing_process_steps WHERE step_id = $1'), [mockStepId]);
      expect(result).toBe(true);
    });

    test('should return false if no step is found for the given ID to delete', async () => {
      db.query.mockResolvedValue({
        rowCount: 0
      });

      const result = await TaxFilingProcessModel.deleteStep(mockStepId);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });

    test('should throw an error if stepId is null', async () => {
      await expect(TaxFilingProcessModel.deleteStep(null)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if stepId is undefined', async () => {
      await expect(TaxFilingProcessModel.deleteStep(undefined)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if stepId is not a string', async () => {
      await expect(TaxFilingProcessModel.deleteStep(123)).rejects.toThrow('Invalid stepId provided.');
      expect(db.query).not.toHaveBeenCalled();
    });

    test('should throw an error if the database query fails', async () => {
      const mockError = new Error('Database delete failed');
      db.query.mockRejectedValue(mockError);

      await expect(TaxFilingProcessModel.deleteStep(mockStepId)).rejects.toThrow(`Failed to delete tax filing process step with ID ${mockStepId}.`);
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });
});