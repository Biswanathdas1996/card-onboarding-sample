/**
 * TaxFilingProcessModel
 * Database operations for interacting with the `tax_filing_process_steps` table.
 * Includes methods for retrieving all steps, ordered by sequence, and potentially for future content management.
 * Implements data integrity checks and query optimization.
 */

const db = require('../../db/config'); // Adjust path as per your project structure
const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {object} TaxFilingProcessStep
 * @property {string} step_id - Unique identifier for the step (UUID).
 * @property {number} step_number - The numerical order of the step within the process.
 * @property {string} title - The title of the process step.
 * @property {string} description - A detailed description of the step.
 * @property {number} order_sequence - The sequence in which the steps should be displayed.
 * @property {string | null} image_url - URL to an image associated with the step, if any.
 * @property {string | null} svg_data - SVG data for visual elements, if any.
 * @property {Date} created_at - Timestamp when the record was created.
 * @property {Date} updated_at - Timestamp when the record was last updated.
 */

const TaxFilingProcessModel = {
  /**
   * Retrieves all tax filing process steps, ordered by their sequence.
   * This method is optimized for quick retrieval of static content.
   * @returns {Promise<TaxFilingProcessStep[]>} - An array of tax filing process steps.
   * @throws {Error} If there is a database query error.
   */
  getAllStepsOrdered: async () => {
    try {
      const query = `
        SELECT
          step_id,
          step_number,
          title,
          description,
          order_sequence,
          image_url,
          svg_data,
          created_at,
          updated_at
        FROM
          tax_filing_process_steps
        ORDER BY
          order_sequence ASC;
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error retrieving all tax filing process steps:', error);
      throw new Error('Failed to retrieve tax filing process steps.');
    }
  },

  /**
   * Retrieves a single tax filing process step by its ID.
   * @param {string} stepId - The UUID of the step to retrieve.
   * @returns {Promise<TaxFilingProcessStep | null>} - The tax filing process step, or null if not found.
   * @throws {Error} If there is a database query error.
   */
  getStepById: async (stepId) => {
    if (!stepId || typeof stepId !== 'string') {
      throw new Error('Invalid stepId provided.');
    }
    try {
      const query = `
        SELECT
          step_id,
          step_number,
          title,
          description,
          order_sequence,
          image_url,
          svg_data,
          created_at,
          updated_at
        FROM
          tax_filing_process_steps
        WHERE
          step_id = $1;
      `;
      // Assuming db.query returns a standard pg result object,
      // we'll get the first row from the rows array.
      const result = await db.query(query, [stepId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error retrieving tax filing process step with ID ${stepId}:`, error);
      throw new Error(`Failed to retrieve tax filing process step with ID ${stepId}.`);
    }
  },

  /**
   * Creates a new tax filing process step.
   * This method is intended for content management and requires appropriate authorization.
   * @param {object} stepData - The data for the new step.
   * @param {number} stepData.step_number - The numerical order of the step.
   * @param {string} stepData.title - The title of the step.
   * @param {string} stepData.description - The description of the step.
   * @param {number} stepData.order_sequence - The display order of the step.
   * @param {string | null} [stepData.image_url] - Optional URL to an image.
   * @param {string | null} [stepData.svg_data] - Optional SVG data.
   * @returns {Promise<TaxFilingProcessStep>} - The newly created step.
   * @throws {Error} If data validation fails or there is a database error.
   */
  createStep: async (stepData) => {
    const { step_number, title, description, order_sequence, image_url = null, svg_data = null } = stepData;

    if (typeof step_number !== 'number' || step_number <= 0) {
      throw new Error('Invalid step_number: Must be a positive number.');
    }
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Invalid title: Cannot be empty.');
    }
    if (typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('Invalid description: Cannot be empty.');
    }
    if (typeof order_sequence !== 'number' || order_sequence <= 0) {
      throw new Error('Invalid order_sequence: Must be a positive number.');
    }

    const step_id = uuidv4();
    try {
      const query = `
        INSERT INTO tax_filing_process_steps (
          step_id,
          step_number,
          title,
          description,
          order_sequence,
          image_url,
          svg_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          step_id,
          step_number,
          title,
          description,
          order_sequence,
          image_url,
          svg_data,
          created_at,
          updated_at;
      `;
      // Assuming db.query returns a standard pg result object
      const result = await db.query(query, [
        step_id,
        step_number,
        title,
        description,
        order_sequence,
        image_url,
        svg_data,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating tax filing process step:', error);
      if (error instanceof Error && error.code === '23505') {
        // Assuming 'order_sequence' has a unique constraint.
        // If 'step_number' also has a unique constraint, the message might need refinement.
        throw new Error('A step with the same order sequence or step number already exists.');
      }
      throw new Error('Failed to create tax filing process step.');
    }
  },

  /**
   * Updates an existing tax filing process step.
   * This method is intended for content management and requires appropriate authorization.
   * @param {string} stepId - The UUID of the step to update.
   * @param {object} updateData - The data to update.
   * @param {number} [updateData.step_number] - Optional new numerical order.
   * @param {string} [updateData.title] - Optional new title.
   * @param {string} [updateData.description] - Optional new description.
   * @param {number} [updateData.order_sequence] - Optional new display order.
   * @param {string | null} [updateData.image_url] - Optional new image URL.
   * @param {string | null} [updateData.svg_data] - Optional new SVG data.
   * @returns {Promise<TaxFilingProcessStep | null>} - The updated step, or null if not found.
   * @throws {Error} If data validation fails or there is a database error.
   */
  updateStep: async (
    stepId,
    updateData
  ) => {
    if (!stepId || typeof stepId !== 'string') {
      throw new Error('Invalid stepId provided for update.');
    }
    if (Object.keys(updateData).length === 0) {
      throw new Error('No update data provided.');
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updateData.step_number !== undefined) {
      if (typeof updateData.step_number !== 'number' || updateData.step_number <= 0) {
        throw new Error('Invalid step_number: Must be a positive number.');
      }
      fields.push(`step_number = $${paramIndex++}`);
      values.push(updateData.step_number);
    }
    if (updateData.title !== undefined) {
      if (typeof updateData.title !== 'string' || updateData.title.trim().length === 0) {
        throw new Error('Invalid title: Cannot be empty.');
      }
      fields.push(`title = $${paramIndex++}`);
      values.push(updateData.title);
    }
    if (updateData.description !== undefined) {
      if (typeof updateData.description !== 'string' || updateData.description.trim().length === 0) {
        throw new Error('Invalid description: Cannot be empty.');
      }
      fields.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }
    if (updateData.order_sequence !== undefined) {
      if (typeof updateData.order_sequence !== 'number' || updateData.order_sequence <= 0) {
        throw new Error('Invalid order_sequence: Must be a positive number.');
      }
      fields.push(`order_sequence = $${paramIndex++}`);
      values.push(updateData.order_sequence);
    }
    if (updateData.image_url !== undefined) {
      fields.push(`image_url = $${paramIndex++}`);
      values.push(updateData.image_url);
    }
    if (updateData.svg_data !== undefined) {
      fields.push(`svg_data = $${paramIndex++}`);
      values.push(updateData.svg_data);
    }

    if (fields.length === 0) {
      return null; // No valid fields to update
    }

    values.push(stepId); // Add stepId for WHERE clause

    try {
      const query = `
        UPDATE tax_filing_process_steps
        SET
          ${fields.join(', ')},
          updated_at = NOW()
        WHERE
          step_id = $${paramIndex}
        RETURNING
          step_id,
          step_number,
          title,
          description,
          order_sequence,
          image_url,
          svg_data,
          created_at,
          updated_at;
      `;
      // Assuming db.query returns a standard pg result object
      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error updating tax filing process step with ID ${stepId}:`, error);
      if (error instanceof Error && error.code === '23505') {
        // Assuming 'order_sequence' has a unique constraint.
        // If 'step_number' also has a unique constraint, the message might need refinement.
        throw new Error('A step with the same order sequence or step number already exists.');
      }
      throw new Error(`Failed to update tax filing process step with ID ${stepId}.`);
    }
  },

  /**
   * Deletes a tax filing process step by its ID.
   * This method is intended for content management and requires appropriate authorization.
   * @param {string} stepId - The UUID of the step to delete.
   * @returns {Promise<boolean>} - True if the step was deleted, false if not found.
   * @throws {Error} If there is a database query error.
   */
  deleteStep: async (stepId) => {
    if (!stepId || typeof stepId !== 'string') {
      throw new Error('Invalid stepId provided for deletion.');
    }
    try {
      const query = `
        DELETE FROM
          tax_filing_process_steps
        WHERE
          step_id = $1
        RETURNING
          step_id;
      `;
      // Assuming db.query returns a standard pg result object
      const result = await db.query(query, [stepId]);
      return (result && result.rows && result.rows.length > 0);
    } catch (error) {
      console.error(`Error deleting tax filing process step with ID ${stepId}:`, error);
      throw new Error(`Failed to delete tax filing process step with ID ${stepId}.`);
    }
  },
};

module.exports = TaxFilingProcessModel;