/**
 * TaxFlowController.js
 *
 * Express controller to handle requests for tax flow content.
 * Uses `TaxFilingProcessModel` to fetch data and formats it for the frontend.
 * Includes logging and placeholder for secure endpoints.
 */

const express = require('express');
const router = express.Router();
const TaxFilingProcessModel = require('../db/models/TaxFilingProcessModel'); // This model will now abstract CMS interaction
const logger = require('../utils/logger'); // Assuming a logger utility exists
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // Assuming auth middleware exists
const analyticsService = require('../services/analyticsService'); // New service for analytics integration

// Placeholder for a CMS service, which TaxFilingProcessModel would ideally use
// const cmsService = require('../services/cmsService');

/**
 * @typedef {object} TaxFlowStep
 * @property {string} step_id - Unique identifier for the step.
 * @property {number} step_number - The sequential number of the step.
 * @property {string} title - The title of the step.
 * @property {string} description - A detailed description of the step.
 * @property {number} order_sequence - The order in which the step should appear.
 * @property {string | null} image_url - Optional URL for an image associated with the step.
 * @property {string | null} svg_data - Optional SVG data for a visual element.
 */

/**
 * GET /api/tax-flow-content
 *
 * Retrieves the individual tax filing process flow content.
 * This endpoint is accessible without authentication for public-facing content.
 *
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @returns {Promise<void>}
 */
router.get('/tax-flow-content', async (req, res) => {
  const sessionId = req.sessionID || 'N/A'; // Assuming session middleware is used
  const userId = req.user ? req.user.id : 'Guest'; // Assuming user object from auth middleware if authenticated

  logger.info(`Accessing /api/tax-flow-content. Session ID: ${sessionId}, User ID: ${userId}`);

  try {
    // TaxFilingProcessModel is now assumed to abstract the data source,
    // whether it's a database or a CMS API.
    const steps = await TaxFilingProcessModel.getAllStepsOrdered();

    if (!steps || steps.length === 0) {
      logger.warn(`No tax flow content found. Session ID: ${sessionId}`);
      return res.status(404).json({
        success: false,
        message: 'No tax filing process flow content available.',
        timestamp: new Date().toISOString(),
      });
    }

    // Format the data for the frontend
    const formattedContent = {
      pageTitle: 'Individual Tax Filing Process Flow',
      introduction: 'Understand the steps involved in filing your individual taxes.',
      flowchartSteps: steps.map((step) => ({
        stepId: step.step_id,
        stepNumber: step.step_number,
        title: step.title,
        description: step.description,
        imageUrl: step.image_url,
        svgData: step.svg_data,
      })),
      // The backend provides the URL; frontend will handle the viewer integration.
      policyDocumentUrl: '/documents/Finance_Policy_document.pdf', // Removed hash for cleaner URL, frontend viewer can handle page
    };

    // Add caching headers as per Story 11 acceptance criteria
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.set('Expires', new Date(Date.now() + 3600000).toUTCString()); // 1 hour from now
    // ETag and Last-Modified would typically be generated based on content hash or last update timestamp
    // For simplicity, we'll omit dynamic ETag/Last-Modified generation here, but in a real app:
    // res.set('ETag', `"${crypto.createHash('md5').update(JSON.stringify(formattedContent)).digest('hex')}"`);
    // res.set('Last-Modified', new Date(lastUpdateTime).toUTCString());

    res.status(200).json({
      success: true,
      data: formattedContent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error retrieving tax flow content: ${error.message}. Session ID: ${sessionId}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tax filing process flow content due to an internal server error.',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/analytics/event
 *
 * Endpoint for the frontend to send analytics events.
 * This addresses Story 1 (Integrate Analytics).
 *
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @returns {Promise<void>}
 */
router.post('/api/analytics/event', async (req, res) => {
  const sessionId = req.sessionID || 'N/A';
  const userId = req.user ? req.user.id : 'Guest';
  const { eventName, eventData } = req.body;

  logger.info(`Analytics Event: ${eventName} from User ID: ${userId}, Session ID: ${sessionId}`, { eventData });

  try {
    // Forward the event to the third-party analytics service
    await analyticsService.trackEvent(eventName, { userId, sessionId, ...eventData });
    logger.info(`Analytics event "${eventName}" successfully forwarded to external service.`);
  } catch (analyticsError) {
    logger.error(`Failed to forward analytics event "${eventName}" to external service: ${analyticsError.message}`, { analyticsError });
    // Do not block the user's request if analytics fails, but log the error.
  }

  // Respond immediately, as analytics tracking is often non-critical for user experience
  res.status(200).json({
    success: true,
    message: 'Analytics event received.',
    timestamp: new Date().toISOString(),
  });
});


/**
 * PUT /api/admin/tax-flow-content
 *
 * Placeholder API endpoint for future content updates.
 * Requires authentication and authorization (e.g., 'admin' or 'content_manager' role).
 *
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @returns {Promise<void>}
 */
router.put('/admin/tax-flow-content', authenticateToken, authorizeRoles(['admin', 'content_manager']), async (req, res) => {
  const userId = req.user ? req.user.id : 'N/A';
  logger.info(`Attempting to update tax flow content by User ID: ${userId}`);

  try {
    const { pageTitle, introduction, flowchartSteps } = req.body;

    if (!flowchartSteps || !Array.isArray(flowchartSteps)) {
      logger.warn(`Invalid request body for tax flow content update. User ID: ${userId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid request: flowchartSteps array is required.',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate each step in flowchartSteps
    for (const step of flowchartSteps) {
      if (!step.stepId || !step.title || !step.description || typeof step.stepNumber !== 'number') {
        logger.warn(`Invalid step data in flowchartSteps for update. User ID: ${userId}, Step: ${JSON.stringify(step)}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid request: Each flowchart step must have stepId, stepNumber, title, and description.',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Call TaxFilingProcessModel to update content, which will interact with the CMS
    await TaxFilingProcessModel.updateContent({ pageTitle, introduction, flowchartSteps });

    logger.info(`Tax flow content updated successfully by User ID: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Tax flow content updated successfully.',
      receivedData: { pageTitle, introduction, flowchartStepsCount: flowchartSteps.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error updating tax flow content by User ID: ${userId}: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to update tax flow content due to an internal server error.',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;