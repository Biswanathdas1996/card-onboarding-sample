import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FormValidator from '../services/FormValidator';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');

    if (fieldErrors[name]) {
      const validationError = FormValidator.validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: validationError
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'Email is required';
    } else {
      const emailError = FormValidator.validateField('email', formData.email.trim());
      if (emailError) {
        errors.email = emailError;
      }
    }

    if (!formData.password || formData.password.trim() === '') {
      errors.password = 'Password is required';
    }

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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.mfaPending && data.sessionToken) {
        navigate('/mfa', { state: { sessionToken: data.sessionToken } });
        return;
      }

      if (data.success) {
        navigate('/');
        return;
      }

      setSubmitted(false);

      if (data.locked) {
        setError('Your account has been locked due to multiple failed login attempts. Please try again after 30 minutes.');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setSubmitted(false);
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        padding: '48px',
        borderRadius: '24px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            margin: 0
          }}>
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#ef4444',
            fontSize: '0.875rem',
            lineHeight: 1.5
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              Email <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={submitted}
              autoComplete="email"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: fieldErrors.email
                  ? 'rgba(239, 68, 68, 0.05)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: fieldErrors.email
                  ? '1px solid rgba(239, 68, 68, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '1rem',
                color: '#ffffff',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                outline: 'none',
                opacity: submitted ? 0.6 : 1,
                cursor: submitted ? 'not-allowed' : 'text'
              }}
              onFocus={e => {
                if (!fieldErrors.email) {
                  e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                  e.target.style.background = 'rgba(99, 102, 241, 0.05)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                }
              }}
              onBlur={e => {
                if (!fieldErrors.email) {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {fieldErrors.email && (
              <p style={{
                color: '#ef4444',
                fontSize: '0.8rem',
                marginTop: '6px',
                marginBottom: 0,
                lineHeight: 1.4
              }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              Password <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={submitted}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: fieldErrors.password
                  ? 'rgba(239, 68, 68, 0.05)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: fieldErrors.password
                  ? '1px solid rgba(239, 68, 68, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '1rem',
                color: '#ffffff',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                outline: 'none',
                opacity: submitted ? 0.6 : 1,
                cursor: submitted ? 'not-allowed' : 'text'
              }}
              onFocus={e => {
                if (!fieldErrors.password) {
                  e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                  e.target.style.background = 'rgba(99, 102, 241, 0.05)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                }
              }}
              onBlur={e => {
                if (!fieldErrors.password) {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {fieldErrors.password && (
              <p style={{
                color: '#ef4444',
                fontSize: '0.8rem',
                marginTop: '6px',
                marginBottom: 0,
                lineHeight: 1.4
              }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '32px'
          }}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#6366f1',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                fontFamily: 'inherit',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => { e.target.style.color = '#818cf8'; }}
              onMouseLeave={e => { e.target.style.color = '#6366f1'; }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitted}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: submitted
                ? 'rgba(99, 102, 241, 0.5)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#ffffff',
              cursor: submitted ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              boxShadow: submitted ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              if (!submitted) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
              }
            }}
            onMouseLeave={e => {
              if (!submitted) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
              }
            }}
          >
            {submitted ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Signing in...
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default LoginPage;