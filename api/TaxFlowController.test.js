const request = require('supertest');
const express = require('express');
const router = require('../api/TaxFlowController');
const TaxFilingProcessModel = require('../db/models/TaxFilingProcessModel');
const logger = require('../utils/logger');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const analyticsService = require('../services/analyticsService');

// Mock external dependencies
jest.mock('../db/models/TaxFilingProcessModel');
jest.mock('../utils/logger');
jest.mock('../middleware/authMiddleware');
jest.mock('../services/analyticsService');

// Create a mock Express app to test the router
const app = express();
app.use(express.json()); // Enable JSON body parsing
app.use((req, res, next) => {
  // Mock sessionID for requests
  req.sessionID = 'mockSessionId123';
  next();
});
app.use('/', router);

describe('TaxFlowController - Backend API Tests', () => {
  // This test file specifically covers backend API endpoints and their interactions with services and models.
  // It does NOT cover frontend-specific user stories (e.g., React component rendering, user interface interactions)
  // which should be covered in separate frontend test files (e.g., TaxFilingProcessFlowPage.test.js).

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock implementations for middleware
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: 'mockUserId', roles: ['user'] }; // Default authenticated user
      next();
    });
    authorizeRoles.mockImplementation((roles) => (req, res, next) => {
      if (req.user && roles.some(role => req.user.roles.includes(role))) {
        next();
      } else {
        res.status(403).json({ success: false, message: 'Forbidden' });
      }
    });
  });

  describe('GET /api/tax-flow-content (User Story 10: Display Tax Filing Process Flow)', () => {
    it('should return 200 and formatted tax flow content when steps are found', async () => {
      const mockSteps = [
        {
          step_id: 'step1',
          step_number: 1,
          title: 'Gather Documents',
          description: 'Collect all necessary financial documents.',
          order_sequence: 1,
          image_url: 'http://example.com/image1.png',
          svg_data: '<svg>...</svg>',
        },
        {
          step_id: 'step2',
          step_number: 2,
          title: 'File Online',
          description: 'Submit your tax return electronically.',
          order_sequence: 2,
          image_url: null,
          svg_data: null,
        },
      ];
      TaxFilingProcessModel.getAllStepsOrdered.mockResolvedValue(mockSteps);

      const res = await request(app).get('/api/tax-flow-content');

      expect(res.statusCode).toEqual(200);
      expect(res.headers['cache-control']).toEqual('public, max-age=3600');
      expect(res.headers['expires']).toBeDefined();
      expect(res.body).toEqual({
        success: true,
        data: {
          pageTitle: 'Individual Tax Filing Process Flow',
          introduction: 'Understand the steps involved in filing your individual taxes.',
          flowchartSteps: [
            {
              stepId: 'step1',
              stepNumber: 1,
              title: 'Gather Documents',
              description: 'Collect all necessary financial documents.',
              imageUrl: 'http://example.com/image1.png',
              svgData: '<svg>...</svg>',
            },
            {
              stepId: 'step2',
              stepNumber: 2,
              title: 'File Online',
              description: 'Submit your tax return electronically.',
              imageUrl: null,
              svgData: null,
            },
          ],
          policyDocumentUrl: '/documents/Finance_Policy_document.pdf',
        },
        timestamp: expect.any(String),
      });
      expect(TaxFilingProcessModel.getAllStepsOrdered).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        'Accessing /api/tax-flow-content. Session ID: mockSessionId123, User ID: Guest'
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return 404 when no tax flow content is found', async () => {
      TaxFilingProcessModel.getAllStepsOrdered.mockResolvedValue([]);

      const res = await request(app).get('/api/tax-flow-content');

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({
        success: false,
        message: 'No tax filing process flow content available.',
        timestamp: expect.any(String),
      });
      expect(TaxFilingProcessModel.getAllStepsOrdered).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'No tax flow content found. Session ID: mockSessionId123'
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return 500 when an internal server error occurs', async () => {
      const errorMessage = 'Database connection failed';
      TaxFilingProcessModel.getAllStepsOrdered.mockRejectedValue(new Error(errorMessage));

      const res = await request(app).get('/api/tax-flow-content');

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Failed to retrieve tax filing process flow content due to an internal server error.',
        error: errorMessage,
        timestamp: expect.any(String),
      });
      expect(TaxFilingProcessModel.getAllStepsOrdered).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        `Error retrieving tax flow content: ${errorMessage}. Session ID: mockSessionId123`,
        { error: expect.any(Error) }
      );
    });

    it('should log user ID if authenticated', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'authenticatedUser123', roles: ['user'] };
        next();
      });
      TaxFilingProcessModel.getAllStepsOrdered.mockResolvedValue([]);

      await request(app).get('/api/tax-flow-content');

      expect(logger.info).toHaveBeenCalledWith(
        'Accessing /api/tax-flow-content. Session ID: mockSessionId123, User ID: authenticatedUser123'
      );
    });
  });

  describe('POST /api/analytics/event (User Story 11: Track User Interactions for Analytics)', () => {
    it('should return 200 and track the event successfully', async () => {
      const eventPayload = {
        eventName: 'page_view',
        eventData: { page: '/tax-flow-content', duration: 1000 },
      };
      analyticsService.trackEvent.mockResolvedValue(true);

      const res = await request(app).post('/api/analytics/event').send(eventPayload);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Analytics event received.',
        timestamp: expect.any(String),
      });
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(eventPayload.eventName, {
        userId: 'Guest',
        sessionId: 'mockSessionId123',
        ...eventPayload.eventData,
      });
      expect(logger.info).toHaveBeenCalledWith(
        `Analytics Event: ${eventPayload.eventName} from User ID: Guest, Session ID: mockSessionId123`,
        { eventData: eventPayload.eventData }
      );
      expect(logger.info).toHaveBeenCalledWith(
        `Analytics event "${eventPayload.eventName}" successfully forwarded to external service.`
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log an error but still return 200 if analytics service fails', async () => {
      const eventPayload = {
        eventName: 'button_click',
        eventData: { button: 'continue' },
      };
      const analyticsError = new Error('Analytics service unreachable');
      analyticsService.trackEvent.mockRejectedValue(analyticsError);

      const res = await request(app).post('/api/analytics/event').send(eventPayload);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Analytics event received.',
        timestamp: expect.any(String),
      });
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(eventPayload.eventName, {
        userId: 'Guest',
        sessionId: 'mockSessionId123',
        ...eventPayload.eventData,
      });
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to forward analytics event "${eventPayload.eventName}" to external service: ${analyticsError.message}`,
        { analyticsError }
      );
    });

    it('should include authenticated user ID in analytics event', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'authAnalyticsUser', roles: ['user'] };
        next();
      });
      const eventPayload = { eventName: 'user_action', eventData: { action: 'hover' } };
      analyticsService.trackEvent.mockResolvedValue(true);

      await request(app).post('/api/analytics/event').send(eventPayload);

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(eventPayload.eventName, {
        userId: 'authAnalyticsUser',
        sessionId: 'mockSessionId123',
        ...eventPayload.eventData,
      });
      expect(logger.info).toHaveBeenCalledWith(
        `Analytics Event: ${eventPayload.eventName} from User ID: authAnalyticsUser, Session ID: mockSessionId123`,
        { eventData: eventPayload.eventData }
      );
    });
  });

  describe('PUT /api/admin/tax-flow-content (User Story 9: Secure API Endpoints for Future Dynamic Content)', () => {
    // This endpoint is designed as an internal administrative interface for managing tax flow content.
    // It is NOT intended to be a direct integration point for an *external* Content Management System (CMS).
    // If an external CMS were to be integrated, a separate webhook or API layer would be needed to
    // translate CMS events into calls to this internal endpoint or directly update the database.
    // User Story 7 (Migration Script for Initial Tax Process Flow Data) would be a separate backend script,
    // not covered by this API endpoint's tests.

    const validUpdatePayload = {
      pageTitle: 'Updated Tax Flow',
      introduction: 'New intro text.',
      flowchartSteps: [
        { stepId: 's1', stepNumber: 1, title: 'Step One', description: 'Desc 1' },
        { stepId: 's2', stepNumber: 2, title: 'Step Two', description: 'Desc 2' },
      ],
    };

    it('should return 200 and update content for authorized admin user', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'adminUser', roles: ['admin'] };
        next();
      });
      TaxFilingProcessModel.updateContent.mockResolvedValue(true);

      const res = await request(app).put('/admin/tax-flow-content').send(validUpdatePayload);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Tax flow content updated successfully.',
        receivedData: {
          pageTitle: validUpdatePayload.pageTitle,
          introduction: validUpdatePayload.introduction,
          flowchartStepsCount: validUpdatePayload.flowchartSteps.length,
        },
        timestamp: expect.any(String),
      });
      expect(authenticateToken).toHaveBeenCalledTimes(1);
      expect(authorizeRoles).toHaveBeenCalledWith(['admin', 'content_manager']);
      expect(TaxFilingProcessModel.updateContent).toHaveBeenCalledWith(validUpdatePayload);
      expect(logger.info).toHaveBeenCalledWith(
        `Attempting to update tax flow content by User ID: adminUser`
      );
      expect(logger.info).toHaveBeenCalledWith(
        `Tax flow content updated successfully by User ID: adminUser`
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return 200 and update content for authorized content_manager user', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'contentManagerUser', roles: ['content_manager'] };
        next();
      });
      TaxFilingProcessModel.updateContent.mockResolvedValue(true);

      const res = await request(app).put('/admin/tax-flow-content').send(validUpdatePayload);

      expect(res.statusCode).toEqual(200);
      expect(TaxFilingProcessModel.updateContent).toHaveBeenCalledWith(validUpdatePayload);
      expect(logger.info).toHaveBeenCalledWith(
        `Attempting to update tax flow content by User ID: contentManagerUser`
      );
    });

    it('should return 401 if no token is provided', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ success: false, message: 'Unauthorized' });
      });

      const res = await request(app).put('/admin/tax-flow-content').send(validUpdatePayload);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
      expect(authenticateToken).toHaveBeenCalledTimes(1);
      expect(authorizeRoles).not.toHaveBeenCalled(); // authorizeRoles should not be called if authenticateToken fails
      expect(TaxFilingProcessModel.updateContent).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Unauthorized attempt to update tax flow content. Session ID: mockSessionId123`
      );
    });

    it('should return 403 if user is authenticated but not authorized', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'unauthorizedUser', roles: ['user'] }; // Authenticated but not admin/content_manager
        next();
      });
      authorizeRoles.mockImplementationOnce((roles) => (req, res, next) => {
        res.status(403).json({ success: false, message: 'Forbidden' });
      });

      const res = await request(app).put('/admin/tax-flow-content').send(validUpdatePayload);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual({ success: false, message: 'Forbidden' });
      expect(authenticateToken).toHaveBeenCalledTimes(1);
      expect(authorizeRoles).toHaveBeenCalledWith(['admin', 'content_manager']);
      expect(TaxFilingProcessModel.updateContent).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Forbidden attempt to update tax flow content by User ID: unauthorizedUser. Session ID: mockSessionId123`
      );
    });

    it('should return 400 if payload is invalid (missing pageTitle)', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'adminUser', roles: ['admin'] };
        next();
      });
      const invalidPayload = { ...validUpdatePayload, pageTitle: undefined };

      const res = await request(app).put('/admin/tax-flow-content').send(invalidPayload);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid request payload: "pageTitle" is required',
        timestamp: expect.any(String),
      });
      expect(TaxFilingProcessModel.updateContent).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Invalid payload for tax flow content update from User ID: adminUser. Error: "pageTitle" is required`
      );
    });

    it('should return 500 if updateContent fails', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'adminUser', roles: ['admin'] };
        next();
      });
      const errorMessage = 'Database update failed';
      TaxFilingProcessModel.updateContent.mockRejectedValue(new Error(errorMessage));

      const res = await request(app).put('/admin/tax-flow-content').send(validUpdatePayload);

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Failed to update tax flow content due to an internal server error.',
        error: errorMessage,
        timestamp: expect.any(String),
      });
      expect(TaxFilingProcessModel.updateContent).toHaveBeenCalledWith(validUpdatePayload);
      expect(logger.error).toHaveBeenCalledWith(
        `Error updating tax flow content by User ID: adminUser: ${errorMessage}`,
        { error: expect.any(Error) }
      );
    });
  });
});