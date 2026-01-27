import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FormValidator from '../services/FormValidator';
import CustomerDataSubmission from '../api/CustomerDataSubmission_DB';

function CustomerForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    zipCode: '',
    state: '',
    income: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const filledFields = useMemo(() => {
    return Object.values(formData).filter(val => val.trim() !== '').length;
  }, [formData]);

  const totalFields = Object.keys(formData).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      const validationError = FormValidator.validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: validationError
      }));
    }
  };

  const validateForm = () => {
    const errors = FormValidator.validateAll(formData, 'customer');
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      setError(firstError);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitted(true);
    setError('');

    try {
      // Submit customer form data
      const response = await CustomerDataSubmission.submitCustomerForm(formData);

      if (response.success) {
        console.log('Customer form submitted successfully:', response);
        // Navigate to KYC page after successful submission with customer ID
        setTimeout(() => {
          navigate('/kyc', { state: { customerId: response.data.customerId } });
        }, 1500);
      } else {
        setSubmitted(false);
        setError(response.message || 'Failed to submit application. Please try again.');
        if (response.errors) {
          setFieldErrors(response.errors);
        }
      }
    } catch (err) {
      console.error('Error submitting customer form:', err);
      setSubmitted(false);
      setError('An error occurred while submitting your application. Please try again.');
    }
  };

  return (
    <div className="form-container">
      <div className="form-wrapper">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <div className="form-header">
          <h2>Apply Now</h2>
          <p className="form-description">Complete your application in just a few steps</p>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        {submitted && (
          <div className="success-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Application submitted successfully! Redirecting to KYC verification...
          </div>
        )}

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="section-title">Personal Information</div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className={fieldErrors.firstName ? 'input-error' : ''}
              />
              {fieldErrors.firstName && <small className="field-error">{fieldErrors.firstName}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className={fieldErrors.lastName ? 'input-error' : ''}
              />
              {fieldErrors.lastName && <small className="field-error">{fieldErrors.lastName}</small>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              className={fieldErrors.email ? 'input-error' : ''}
            />
            {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className={fieldErrors.phone ? 'input-error' : ''}
              />
              {fieldErrors.phone && <small className="field-error">{fieldErrors.phone}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={fieldErrors.dateOfBirth ? 'input-error' : ''}
              />
              {fieldErrors.dateOfBirth && <small className="field-error">{fieldErrors.dateOfBirth}</small>}
            </div>
          </div>

          <div className="section-title">Address Details</div>

          <div className="form-group">
            <label htmlFor="address">Street Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street"
              className={fieldErrors.address ? 'input-error' : ''}
            />
            {fieldErrors.address && <small className="field-error">{fieldErrors.address}</small>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
                className={fieldErrors.city ? 'input-error' : ''}
              />
              {fieldErrors.city && <small className="field-error">{fieldErrors.city}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={fieldErrors.state ? 'input-error' : ''}
              >
                <option value="">Select State</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                <option value="FL">Florida</option>
                <option value="PA">Pennsylvania</option>
                <option value="IL">Illinois</option>
                <option value="OH">Ohio</option>
                <option value="GA">Georgia</option>
                <option value="NC">North Carolina</option>
                <option value="MI">Michigan</option>
              </select>
              {fieldErrors.state && <small className="field-error">{fieldErrors.state}</small>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="zipCode">Zip Code</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="10001"
              className={fieldErrors.zipCode ? 'input-error' : ''}
            />
            {fieldErrors.zipCode && <small className="field-error">{fieldErrors.zipCode}</small>}
          </div>

          <div className="section-title">Financial Information</div>

          <div className="form-group">
            <label htmlFor="income">Annual Income</label>
            <select
              id="income"
              name="income"
              value={formData.income}
              onChange={handleChange}
              className={fieldErrors.income ? 'input-error' : ''}
            >
              <option value="">Select Income Range</option>
              <option value="25-50k">$25,000 - $50,000</option>
              <option value="50-75k">$50,000 - $75,000</option>
              <option value="75-100k">$75,000 - $100,000</option>
              <option value="100-150k">$100,000 - $150,000</option>
              <option value="150k+">$150,000+</option>
            </select>
            {fieldErrors.income && <small className="field-error">{fieldErrors.income}</small>}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={submitted}
          >
            {submitted ? 'Processing...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustomerForm;


