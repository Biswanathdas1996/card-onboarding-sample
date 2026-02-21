import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const validateEmail = (value) => {
    if (!value || value.trim() === '') {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await AuthService.forgotPassword(email.trim().toLowerCase());
    } catch (err) {
      console.error('Error during forgot password request:', err);
    } finally {
      setLoading(false);
      // Always show generic confirmation to prevent user enumeration
      setSubmitted(true);
    }
  };

  return (
    <div className="form-container">
      <div className="form-wrapper">
        <button className="back-button" onClick={() => navigate('/login')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Login
        </button>

        <div className="form-header">
          <div className="form-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1>Reset Your Password</h1>
          <p>Enter the email address associated with your account and we'll send you a link to reset your password.</p>
        </div>

        {submitted ? (
          <div className="success-container">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Check Your Email</h2>
            <p>
              If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly. Please check your inbox and spam folder.
            </p>
            <button
              className="submit-button"
              onClick={() => navigate('/login')}
              style={{ marginTop: '24px' }}
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form className="customer-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address <span className="required-asterisk">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className={`form-input${error ? ' input-error' : ''}`}
                placeholder="Enter your email address"
                value={email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              {error && (
                <span className="field-error" role="alert">
                  {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="form-footer">
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;