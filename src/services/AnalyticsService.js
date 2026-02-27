/**
 * Analytics Service
 * Provides functions for tracking page views, button clicks, and other custom events,
 * adhering to privacy regulations (e.g., GDPR, CCPA).
 * Integrates with a third-party analytics provider (e.g., Google Analytics).
 */

/**
 * Configuration for the analytics service.
 * In a real application, this might be loaded from environment variables or a config file.
 */

/**
 * Abstract interface for an analytics provider.
 * This allows the AnalyticsService to be agnostic to the specific analytics platform.
 */
class AnalyticsProvider {
  constructor(config) {
    this.config = config;
  }

  // eslint-disable-next-line no-unused-vars
  initialize(consentGiven) {
    throw new Error("Method 'initialize()' must be implemented.");
  }

  // eslint-disable-next-line no-unused-vars
  updateConsent(consentGiven) {
    throw new Error("Method 'updateConsent()' must be implemented.");
  }

  // eslint-disable-next-line no-unused-vars
  trackPageView(pagePath, pageTitle) {
    throw new Error("Method 'trackPageView()' must be implemented.");
  }

  // eslint-disable-next-line no-unused-vars
  trackEvent(eventName, eventParams) {
    throw new Error("Method 'trackEvent()' must be implemented.");
  }

  // eslint-disable-next-line no-unused-vars
  setUserProperties(userProperties) {
    throw new Error("Method 'setUserProperties()' must be implemented.");
  }

  // eslint-disable-next-line no-unused-vars
  get isInitialized() {
    throw new Error("Getter 'isInitialized' must be implemented.");
  }
}

/**
 * Google Analytics Provider implementation.
 */
class GoogleAnalyticsProvider extends AnalyticsProvider {
  constructor(config) {
    super(config);
    this.scriptLoaded = false;
    this.gtagInitialized = false; // Track if gtag 'js' and 'config' have been called
  }

  initialize(initialConsentGiven) {
    this.config.consentGiven = initialConsentGiven;

    if (!this.config.enabled || !this.config.trackingId) {
      if (this.config.debug) {
        console.warn('Google Analytics Provider: Not enabled or tracking ID is missing.');
      }
      return;
    }

    if (!this.config.consentGiven) {
      if (this.config.debug) {
        console.log('Google Analytics Provider: Consent not given. Analytics will not be initialized.');
      }
      return;
    }

    if (this.scriptLoaded && this.gtagInitialized) {
      if (this.config.debug) {
        console.log('Google Analytics Provider: Script already loaded and gtag configured. Updating consent.');
      }
      this.configureGtag(); // Re-configure gtag to update consent status
      return;
    }

    // Load Google Analytics script dynamically
    const scriptId = 'ga-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.trackingId}`;
      document.head.appendChild(script);

      script.onload = () => {
        this.scriptLoaded = true;
        if (window.gtag) {
          window.gtag('js', new Date());
          this.configureGtag();
          this.gtagInitialized = true;
          if (this.config.debug) {
            console.log(`Google Analytics Provider: Google Analytics initialized with ID: ${this.config.trackingId}`);
          }
        } else {
          console.error('Google Analytics Provider: gtag not found after script load.');
        }
      };

      script.onerror = (error) => {
        console.error('Google Analytics Provider: Failed to load Google Analytics script.', error);
      };
    } else {
      this.scriptLoaded = true;
      if (this.config.debug) {
        console.log('Google Analytics Provider: Google Analytics script already present in DOM.');
      }
      // If script is already in DOM, check if gtag is available and configure
      if (window.gtag) {
        if (!this.gtagInitialized) {
          window.gtag('js', new Date());
          this.configureGtag();
          this.gtagInitialized = true;
          if (this.config.debug) {
            console.log(`Google Analytics Provider: gtag configured from existing script with ID: ${this.config.trackingId}`);
          }
        } else {
          this.configureGtag(); // Update consent if already initialized
        }
      } else {
        console.warn('Google Analytics Provider: Script present but gtag not yet available. Waiting for gtag.');
        // Potentially add a retry mechanism or listen for gtag availability if needed
      }
    }
  }

  configureGtag() {
    if (window.gtag && this.config.trackingId) {
      window.gtag('config', this.config.trackingId, {
        send_page_view: false, // We will manually track page views
        anonymize_ip: true, // Privacy enhancement
        'analytics_storage': this.config.consentGiven ? 'granted' : 'denied',
        'ad_storage': this.config.consentGiven ? 'granted' : 'denied',
      });
      if (this.config.debug) {
        console.log(`Google Analytics Provider: gtag config updated. Consent: ${this.config.consentGiven}`);
      }
    } else if (this.config.debug) {
      console.warn('Google Analytics Provider: gtag not available for configuration.');
    }
  }

  updateConsent(consentGiven) {
    this.config.consentGiven = consentGiven;
    if (this.config.debug) {
      console.log(`Google Analytics Provider: Consent updated to ${consentGiven}`);
    }

    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': consentGiven ? 'granted' : 'denied',
        'ad_storage': consentGiven ? 'granted' : 'denied'
      });
      if (this.config.debug) {
        console.log('Google Analytics Provider: gtag consent updated.');
      }
      // If consent is now given and script is loaded, ensure gtag is configured
      if (consentGiven && this.scriptLoaded && !this.gtagInitialized) {
        this.initialize(true); // Re-attempt full initialization if not yet configured
      } else if (consentGiven && this.scriptLoaded && this.gtagInitialized) {
        this.configureGtag(); // Re-configure to ensure settings are applied
      }
    } else if (consentGiven && this.scriptLoaded) {
      // If consent is given and script is loaded but gtag not ready, try to initialize
      this.initialize(true);
    } else if (this.config.debug) {
      console.warn('Google Analytics Provider: gtag not available to update consent.');
    }
  }

  trackPageView(pagePath, pageTitle) {
    if (!this.config.enabled || !this.config.consentGiven || !this.config.trackingId || !window.gtag || !this.gtagInitialized) {
      if (this.config.debug) {
        console.log(`Google Analytics Provider: Page view for "${pageTitle}" not tracked (disabled/no consent/no gtag/not initialized).`);
      }
      return;
    }

    try {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
      });
      if (this.config.debug) {
        console.log(`Google Analytics Provider: Tracked page view: ${pageTitle} (${pagePath})`);
      }
    } catch (error) {
      console.error('Google Analytics Provider: Error tracking page view:', error);
    }
  }

  trackEvent(eventName, eventParams = {}) {
    if (!this.config.enabled || !this.config.consentGiven || !this.config.trackingId || !window.gtag || !this.gtagInitialized) {
      if (this.config.debug) {
        console.log(`Google Analytics Provider: Event "${eventName}" not tracked (disabled/no consent/no gtag/not initialized).`);
      }
      return;
    }

    try {
      window.gtag('event', eventName, eventParams);
      if (this.config.debug) {
        console.log(`Google Analytics Provider: Tracked event: ${eventName}`, eventParams);
      }
    } catch (error) {
      console.error('Google Analytics Provider: Error tracking event:', error);
    }
  }

  setUserProperties(userProperties) {
    if (!this.config.enabled || !this.config.consentGiven || !this.config.trackingId || !window.gtag || !this.gtagInitialized) {
      if (this.config.debug) {
        console.log('Google Analytics Provider: User properties not set (disabled/no consent/no gtag/not initialized).');
      }
      return;
    }

    try {
      window.gtag('set', 'user_properties', userProperties);
      if (this.config.debug) {
        console.log('Google Analytics Provider: Set user properties:', userProperties);
      }
    } catch (error) {
      console.error('Google Analytics Provider: Error setting user properties:', error);
    }
  }

  get isInitialized() {
    return this.scriptLoaded && this.gtagInitialized && this.config.consentGiven;
  }
}

class AnalyticsService {
  /**
   * @private
   * @type {object}
   */
  config = {
    trackingId: null,
    enabled: false,
    debug: false,
    consentGiven: false,
  };

  /**
   * @private
   * @type {AnalyticsProvider | null}
   */
  provider = null;

  /**
   * @param {AnalyticsProvider} providerInstance - An instance of an analytics provider (e.g., GoogleAnalyticsProvider).
   */
  constructor(providerInstance) {
    // Default configuration, can be overridden by provider's config if needed
    this.config = {
      trackingId: process.env.REACT_APP_GA_TRACKING_ID || null, // Example for Google Analytics
      enabled: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
      debug: process.env.NODE_ENV === 'development',
      consentGiven: false, // Default to false, should be updated based on user consent
    };

    if (providerInstance instanceof AnalyticsProvider) {
      this.provider = providerInstance;
      // Merge service config into provider's config, provider's config takes precedence for its own settings
      this.provider.config = { ...this.config, ...this.provider.config };
    } else {
      console.error('AnalyticsService: A valid AnalyticsProvider instance must be provided.');
      // Fallback to a no-op provider or throw an error
      this.provider = new (class NoOpProvider extends AnalyticsProvider {
        initialize() {}
        updateConsent() {}
        trackPageView() {}
        trackEvent() {}
        setUserProperties() {}
        get isInitialized() { return false; }
      })(this.config);
    }
  }

  /**
   * Initializes the analytics service.
   * This should be called once when the application starts.
   * It dynamically loads the analytics script if enabled and consent is given.
   * @param {boolean} initialConsentGiven - Indicates if user has given consent for analytics tracking.
   */
  initializeAnalytics(initialConsentGiven) {
    this.config.consentGiven = initialConsentGiven;
    if (this.provider) {
      this.provider.config.consentGiven = initialConsentGiven; // Ensure provider's config is updated
      this.provider.initialize(initialConsentGiven);
    }
  }

  /**
   * Updates the user's consent status for analytics tracking.
   * If consent is given, it will initialize analytics if not already.
   * If consent is revoked, it will disable further tracking.
   * @param {boolean} consentGiven - The new consent status.
   */
  updateConsent(consentGiven) {
    this.config.consentGiven = consentGiven;
    if (this.provider) {
      this.provider.config.consentGiven = consentGiven; // Ensure provider's config is updated
      this.provider.updateConsent(consentGiven);
    }
  }

  /**
   * Tracks a page view.
   * @param {string} pagePath - The path of the page (e.g., '/tax-filing-process').
   * @param {string} pageTitle - The title of the page.
   */
  trackPageView(pagePath, pageTitle) {
    if (this.provider) {
      this.provider.trackPageView(pagePath, pageTitle);
    }
  }

  /**
   * Tracks a custom event.
   * @param {string} eventName - The name of the event (e.g., 'button_click', 'form_submission').
   * @param {object} eventParams - An object containing event parameters.
   */
  trackEvent(eventName, eventParams = {}) {
    if (this.provider) {
      this.provider.trackEvent(eventName, eventParams);
    }
  }

  /**
   * Tracks a button click event.
   * @param {string} buttonName - The name or identifier of the button.
   * @param {string} pageName - The name of the page where the button was clicked.
   */
  trackButtonClick(buttonName, pageName) {
    this.trackEvent('button_click', {
      button_name: buttonName,
      page_name: pageName,
    });
  }

  /**
   * Tracks a custom timing event (e.g., time on page, load times).
   * @param {string} name - A name for the timing event (e.g., 'time_on_page').
   * @param {number} value - The time value in milliseconds.
   * @param {string} category - The category of the timing event (e.g., 'engagement', 'performance').
   * @param {string} [label] - An optional label for the timing event.
   */
  trackTiming(name, value, category, label) {
    this.trackEvent('timing_complete', {
      name,
      value,
      event_category: category,
      event_label: label,
    });
  }

  /**
   * Sets user properties for analytics.
   * @param {object} userProperties - An object containing user properties.
   */
  setUserProperties(userProperties) {
    if (this.provider) {
      this.provider.setUserProperties(userProperties);
    }
  }

  /**
   * @returns {Readonly<object>}
   */
  get currentConfig() {
    return { ...this.config }; // Return a copy to prevent direct modification
  }
}

// Factory function to create an AnalyticsService instance with a specific provider
function createAnalyticsService(providerType = 'google') {
  const config = {
    trackingId: process.env.REACT_APP_GA_TRACKING_ID || null,
    enabled: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
    debug: process.env.NODE_ENV === 'development',
    consentGiven: false,
  };

  let provider;
  switch (providerType.toLowerCase()) {
    case 'google':
      provider = new GoogleAnalyticsProvider(config);
      break;
    // case 'mixpanel':
    //   provider = new MixpanelAnalyticsProvider(config); // Future Mixpanel implementation
    //   break;
    default:
      console.warn(`AnalyticsService: Unknown provider type "${providerType}". Using Google Analytics as default.`);
      provider = new GoogleAnalyticsProvider(config);
      break;
  }
  return new AnalyticsService(provider);
}

// Export the factory function or the class itself for more flexible instantiation
export default createAnalyticsService;

// Example of how to use it as a singleton (if desired, but now testable)
// const analyticsService = createAnalyticsService('google');
// export default analyticsService;