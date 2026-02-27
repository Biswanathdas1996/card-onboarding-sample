import createAnalyticsService, { AnalyticsProvider, GoogleAnalyticsProvider, AnalyticsService } from '../src/services/AnalyticsService';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the global gtag function and console for testing purposes
const mockGtag = jest.fn();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock document.head.appendChild and document.getElementById for script loading
const mockAppendChild = jest.fn();
const mockGetElementById = jest.fn();

Object.defineProperty(window, 'gtag', {
  writable: true,
  value: mockGtag,
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: mockAppendChild,
  },
  writable: true,
});

Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true,
});

describe('AnalyticsProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new AnalyticsProvider({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('constructor should set config', () => {
    const config = { key: 'value' };
    const instance = new AnalyticsProvider(config);
    expect(instance.config).toEqual(config);
  });

  test('initialize should throw an error if not implemented', () => {
    expect(() => provider.initialize()).toThrow("Method 'initialize()' must be implemented.");
  });

  test('updateConsent should throw an error if not implemented', () => {
    expect(() => provider.updateConsent()).toThrow("Method 'updateConsent()' must be implemented.");
  });

  test('trackPageView should throw an error if not implemented', () => {
    expect(() => provider.trackPageView()).toThrow("Method 'trackPageView()' must be implemented.");
  });

  test('trackEvent should throw an error if not implemented', () => {
    expect(() => provider.trackEvent()).toThrow("Method 'trackEvent()' must be implemented.");
  });

  test('setUserProperties should throw an error if not implemented', () => {
    expect(() => provider.setUserProperties()).toThrow("Method 'setUserProperties()' must be implemented.");
  });

  test('isInitialized getter should throw an error if not implemented', () => {
    expect(() => provider.isInitialized).toThrow("Getter 'isInitialized' must be implemented.");
  });
});

describe('GoogleAnalyticsProvider', () => {
  let provider;
  const mockConfig = {
    trackingId: 'UA-12345-1',
    enabled: true,
    debug: false,
    consentGiven: false,
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockGetElementById.mockReturnValue(null); // Assume script is not in DOM by default
    provider = new GoogleAnalyticsProvider(mockConfig);
    // Reset internal state of the provider
    provider.scriptLoaded = false;
    provider.gtagInitialized = false;
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  describe('constructor', () => {
    test('should initialize with correct config and default states', () => {
      expect(provider.config).toEqual(mockConfig);
      expect(provider.scriptLoaded).toBe(false);
      expect(provider.gtagInitialized).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should not initialize if not enabled', () => {
      provider.config.enabled = false;
      provider.initialize(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith('Google Analytics Provider: Not enabled or tracking ID is missing.');
      expect(mockAppendChild).not.toHaveBeenCalled();
      expect(mockGtag).not.toHaveBeenCalled();
    });

    test('should not initialize if trackingId is missing', () => {
      provider.config.trackingId = null;
      provider.initialize(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith('Google Analytics Provider: Not enabled or tracking ID is missing.');
      expect(mockAppendChild).not.toHaveBeenCalled();
      expect(mockGtag).not.toHaveBeenCalled();
    });

    test('should not initialize if consent is not given', () => {
      provider.config.consentGiven = false; // Ensure initial state
      provider.initialize(false);
      expect(mockConsoleLog).toHaveBeenCalledWith('Google Analytics Provider: Consent not given. Analytics will not be initialized.');
      expect(mockAppendChild).not.toHaveBeenCalled();
      expect(mockGtag).not.toHaveBeenCalled();
    });

    test('should load script and initialize gtag if enabled and consent given', () => {
      provider.initialize(true);

      expect(provider.config.consentGiven).toBe(true);
      expect(mockGetElementById).toHaveBeenCalledWith('ga-script');
      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      expect(mockAppendChild.mock.calls[0][0].tagName).toBe('SCRIPT');
      expect(mockAppendChild.mock.calls[0][0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${mockConfig.trackingId}`);
      expect(mockAppendChild.mock.calls[0][0].id).toBe('ga-script');
      expect(mockAppendChild.mock.calls[0][0].async).toBe(true);

      // Simulate script onload
      window.gtag = mockGtag; // Ensure gtag is available on window
      mockAppendChild.mock.calls[0][0].onload();

      expect(provider.scriptLoaded).toBe(true);
      expect(mockGtag).toHaveBeenCalledWith('js', expect.any(Date));
      expect(mockGtag).toHaveBeenCalledWith('config', mockConfig.trackingId, expect.objectContaining({
        send_page_view: false,
        anonymize_ip: true,
        analytics_storage: 'granted',
        ad_storage: 'granted',
      }));
      expect(provider.gtagInitialized).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(`Google Analytics Provider: Google Analytics initialized with ID: ${mockConfig.trackingId}`);
    });

    test('should handle script onload error (gtag not found)', () => {
      provider.initialize(true);
      window.gtag = undefined; // Simulate gtag not being available
      mockAppendChild.mock.calls[0][0].onload();
      expect(mockConsoleError).toHaveBeenCalledWith('Google Analytics Provider: gtag not found after script load.');
      expect(provider.scriptLoaded).toBe(true);
      expect(provider.gtagInitialized).toBe(false);
    });

    test('should handle script onerror', () => {
      provider.initialize(true);
      const mockError = new Event('error');
      mockAppendChild.mock.calls[0][0].onerror(mockError);
      expect(mockConsoleError).toHaveBeenCalledWith('Google Analytics Provider: Failed to load Google Analytics script.', mockError);
      expect(provider.scriptLoaded).toBe(false); // Script loading failed
      expect(provider.gtagInitialized).toBe(false);
    });

    test('should re-configure gtag if script already loaded and initialized', () => {
      provider.scriptLoaded = true;
      provider.gtagInitialized = true;
      provider.config.consentGiven = true; // Assume consent was given previously
      provider.config.debug = true;

      provider.initialize(true); // Call initialize again
      expect(mockConsoleLog).toHaveBeenCalledWith('Google Analytics Provider: Script already loaded and gtag configured. Updating consent.');
      expect(mockAppendChild).not.toHaveBeenCalled(); // No new script appended
      expect(mockGtag).toHaveBeenCalledTimes(1); // Only configureGtag called
      expect(mockGtag).toHaveBeenCalledWith('config', mockConfig.trackingId, expect.objectContaining({
        analytics_storage: 'granted',
        ad_storage: 'granted',
      }));
    });

    test('should configure gtag if script already in DOM but not initialized', () => {
      mockGetElementById.mockReturnValue(document.createElement('script')); // Simulate script already in DOM
      window.gtag = mockGtag; // Ensure gtag is available
      provider.config.debug = true;

      provider.initialize(true);

      expect(mockConsoleLog).toHaveBeenCalledWith('Google Analytics Provider: Google Analytics script already present in DOM.');
      expect(mockGtag).toHaveBeenCalledWith('js', expect.any(Date));
      expect(mockGtag).toHaveBeenCalledWith('config', mockConfig.trackingId, expect.objectContaining({
        analytics_storage: 'granted',
        ad_storage: 'granted',
      }));
      expect(provider.scriptLoaded).toBe(true);
      expect(provider.gtagInitialized).toBe(true);
    });

    test('should warn if script in DOM but gtag not available', () => {
      mockGetElementById.mockReturnValue(document.createElement('script'));
      window.gtag = undefined; // Simulate gtag not yet available
      provider.config.debug = true;

      provider.initialize(true);

      expect(mockConsoleLog).toHaveBeenCalledWith('Google Analytics Provider: Google Analytics script already present in DOM.');
      expect(mockConsoleWarn).toHaveBeenCalledWith('Google Analytics Provider: Script present but gtag not yet available. Waiting for gtag.');
      expect(mockGtag).not.toHaveBeenCalled();
      expect(provider.scriptLoaded).toBe(true);
      expect(provider.gtagInitialized).toBe(false);
    });
  });

  describe('configureGtag', () => {
    test('should call gtag config with correct parameters when gtag is available', () => {
      window.gtag = mockGtag;
      provider.config.consentGiven = true;
      provider.configureGtag();
      expect(mockGtag).toHaveBeenCalledWith('config', mockConfig.trackingId, {
        send_page_view: false,
        anonymize_ip: true,
        analytics_storage: 'granted',
        ad_storage: 'granted',
      });
    });

    test('should call gtag config with denied consent when consent is false', () => {
      window.gtag = mockGtag;
      provider.config.consentGiven = false;
      provider.configureGtag();
      expect(mockGtag).toHaveBeenCalledWith('config', mockConfig.trackingId, {
        send_page_view: false,
        anonymize_ip: true,
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    });

    test('should warn if gtag is not available for configuration', () => {
      window.gtag = undefined;
      provider.config.debug = true;
      provider.configureGtag();
      expect(mockConsoleWarn).toHaveBeenCalledWith('Google Analytics Provider: gtag not available for configuration.');
      expect(mockGtag).not.toHaveBeenCalled();
    });
  });

  describe('updateConsent', () => {
    test('should update consent in config and call gtag consent update', () => {
      window.gtag = mockGtag;
      provider.config.debug = true;
      provider.updateConsent(true);
      expect(provider.config.consentGiven).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('Google Analytics Provider: Consent updated to true');
      expect(mockGtag).toHaveBeenCalledWith('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('Google Analytics Provider: gtag consent updated.');
    });

    test('should call initialize if consent is given, script loaded, and not yet initialized', () => {
      window.gtag = mockGtag;
      provider.scriptLoaded = true;
      provider.gtagInitialized = false;
      const initializeSpy = jest.spyOn(provider, 'initialize');

      provider.updateConsent(true);

      expect(initializeSpy).toHaveBeenCalledWith(true);
      expect(mockGtag).toHaveBeenCalledWith('consent', 'update', expect.any(Object));
      initializeSpy.mockRestore();
    });

    test('should call configureGtag if consent is given, script loaded, and already initialized', () => {
      window.gtag = mockGtag;
      provider.scriptLoaded = true;
      provider.gtagInitialized = true;
      const configureGtagSpy = jest.spyOn(provider, 'configureGtag');

      provider.updateConsent(true);

      expect(configureGtagSpy).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('consent', 'update', expect.any(Object));
      configureGtagSpy.mockRestore();
    });
  });
});