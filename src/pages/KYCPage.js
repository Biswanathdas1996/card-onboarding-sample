import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FormValidator from '../services/FormValidator';
import CustomerDataSubmission from '../api/CustomerDataSubmission_DB';
import './KYCPage.css';

/**
 * Debounce utility for performance optimization
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

function KYCPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customerId, setCustomerId] = useState(location.state?.customerId || null);

  const [formData, setFormData] = useState({
    govID: '',
    kycAddress: '',
    kycDob: '',
    pan: '',
    aadhaarNumber: '',
    govIDType: 'passport',
    nationality: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    occupation: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Calculate form progress
  const filledFields = useMemo(() => {
    return Object.values(formData).filter((val) => String(val).trim() !== '').length;
  }, [formData]);

  const totalFields = Object.keys(formData).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  // Debounced validation for performance
  const debouncedValidate = useCallback(
    debounce((fieldName, value) => {
      const validationError = FormValidator.validateField(fieldName, value);
      setErrors((prevErrors) => ({
        ...prevErrors,
        [fieldName]: validationError
      }));
    }, 300),
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value
    }));

    // Clear API errors when user starts typing
    if (apiError) setApiError('');
    if (apiSuccess) setApiSuccess('');

    // Perform debounced validation
    debouncedValidate(name, value);
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return FormValidator.validateForm(formData, 'kyc');
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setApiError('Please fix the errors before submitting.');
      return;
    }

    if (!customerId) {
      setApiError('Customer ID is missing. Please complete the customer form first.');
      return;
    }

    setSubmitting(true);
    setApiError('');
    setApiSuccess('');

    try {
      const response = await CustomerDataSubmission.submitKYCData(formData, customerId);

      if (response.success) {
        setApiSuccess(response.message);
        setSubmitted(true);

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setApiError(response.message || 'Failed to submit KYC data.');
        if (response.errors) {
          setErrors(response.errors);
        }
      }
    } catch (error) {
      console.error('Error submitting KYC data:', error);
      setApiError('An error occurred while submitting the data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kyc-page">
      <div className="kyc-container">
        <div className="kyc-header">
          <h1>Identity Verification (KYC)</h1>
          <p>Please provide your government-issued ID details to complete the onboarding process.</p>
        </div>

        {/* Progress Bar */}
        <div className="kyc-progress-section">
          <div className="progress-header">
            <label>Form Completion</label>
            <span className="progress-percentage">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Success Message */}
        {apiSuccess && (
          <div className="alert alert-success" role="alert">
            <span className="alert-icon">✓</span>
            {apiSuccess}
          </div>
        )}

        {/* Error Message */}
        {apiError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">✕</span>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="kyc-form">
          {/* Government ID Field */}
          <div className="form-group">
            <label htmlFor="govID" className="form-label">
              Government ID <span className="required-asterisk">*</span>
            </label>
            <p className="field-hint">
              Enter your government-issued ID number (Passport, Driver's License, or National ID)
            </p>
            <input
              id="govID"
              type="text"
              name="govID"
              value={formData.govID}
              onChange={handleChange}
              placeholder="e.g., A12B34C56"
              className={`form-input ${errors.govID ? 'input-error' : ''}`}
              disabled={submitting || submitted}
              maxLength={20}
            />
            {errors.govID && <span className="error-message">{errors.govID}</span>}
          </div>

          {/* Address Field */}
          <div className="form-group">
            <label htmlFor="kycAddress" className="form-label">
              Address <span className="required-asterisk">*</span>
            </label>
            <p className="field-hint">
              Enter your full residential address as shown on your government ID
            </p>
            <textarea
              id="kycAddress"
              name="kycAddress"
              value={formData.kycAddress}
              onChange={handleChange}
              placeholder="Street Address, City, State, ZIP Code"
              className={`form-input form-textarea ${errors.kycAddress ? 'input-error' : ''}`}
              rows={4}
              disabled={submitting || submitted}
              maxLength={500}
            />
            {errors.kycAddress && <span className="error-message">{errors.kycAddress}</span>}
            <span className="character-count">{formData.kycAddress.length}/500</span>
          </div>

          {/* Date of Birth Field */}
          <div className="form-group">
            <label htmlFor="kycDob" className="form-label">
              Date of Birth <span className="required-asterisk">*</span>
            </label>
            <p className="field-hint">Must be 18 years or older to apply</p>
            <input
              id="kycDob"
              type="date"
              name="kycDob"
              value={formData.kycDob}
              onChange={handleChange}
              className={`form-input ${errors.kycDob ? 'input-error' : ''}`}
              disabled={submitting || submitted}
            />
            {errors.kycDob && <span className="error-message">{errors.kycDob}</span>}
          </div>

          {/* PAN Field */}
          <div className="form-group">
            <label htmlFor="pan" className="form-label">
              PAN (Permanent Account Number) <span className="required-asterisk">*</span>
            </label>
            <p className="field-hint">
              Enter your 10-character alphanumeric PAN
            </p>
            <input
              id="pan"
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              placeholder="e.g., ABCD1234EF"
              className={`form-input ${errors.pan ? 'input-error' : ''}`}
              disabled={submitting || submitted}
              maxLength={10}
              pattern="[A-Za-z0-9]{10}"
            />
            {errors.pan && <span className="error-message">{errors.pan}</span>}
            <span className="character-count">{formData.pan.length}/10</span>
          </div>

          {/* Aadhaar Number Field */}
          <div className="form-group">
            <label htmlFor="aadhaarNumber" className="form-label">
              Aadhaar Number <span className="required-asterisk">*</span>
            </label>
            <p className="field-hint">
              Enter your 12-digit Aadhaar Number (numeric only)
            </p>
            <input
              id="aadhaarNumber"
              type="text"
              name="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={handleChange}
              placeholder="e.g., 123456789012"
              className={`form-input ${errors.aadhaarNumber ? 'input-error' : ''}`}
              disabled={submitting || submitted}
              maxLength={12}
              pattern="\d{12}"
              inputMode="numeric"
            />
            {errors.aadhaarNumber && <span className="error-message">{errors.aadhaarNumber}</span>}
            <span className="character-count">{formData.aadhaarNumber.length}/12</span>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={!isFormValid || submitting || submitted}
              className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : submitted ? (
                'Submitted Successfully'
              ) : (
                'Submit KYC Information'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Back
            </button>
          </div>

          {/* Security Notice */}
          <div className="security-notice">
            <span className="security-icon">🔒</span>
            <p>
              Your information is encrypted and securely transmitted. We comply with all applicable
              data protection regulations.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KYCPage;
