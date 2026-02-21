import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './KYCPage.css';

function MFAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMFA } = useAuth();

  const sessionToken = location.state?.sessionToken || null;

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCode(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter your verification code.');
      return;
    }

    if (!sessionToken) {
      setError('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await verifyMFA(sessionToken, code.trim());

      if (result && result.success) {
        navigate('/');
      } else {
        setError('MFA verification failed.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('MFA verification error:', err);
      setError('MFA verification failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="kyc-page">
      <div className="kyc-container">
        <div className="kyc-header">
          <h1>Two-Factor Authentication</h1>
          <p>Enter the verification code to complete your login.</p>
        </div>

        <form className="kyc-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="mfa-code">
              Verification Code <span className="required-asterisk">*</span>
            </label>
            <p className="field-hint">
              Enter the one-time code from your authenticator app or SMS.
            </p>
            <input
              id="mfa-code"
              type="text"
              name="code"
              className={`form-input${error ? ' input-error' : ''}`}
              value={code}
              onChange={handleChange}
              placeholder="Enter your verification code"
              autoComplete="one-time-code"
              inputMode="numeric"
              disabled={submitting}
              maxLength={8}
            />
            {error && (
              <p className="field-error" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={submitting || !code.trim()}
            style={{ width: '100%' }}
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ marginRight: '8px' }} />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MFAPage;