import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormValidator from '../services/FormValidator';

function UserManagement() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    userDob: '',
    userAddress: ''
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      } else {
        setError(data.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');

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
    const errors = FormValidator.validateAll(formData, 'user');
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

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          dateOfBirth: formData.userDob,
          address: formData.userAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User added successfully!');
        setFormData({ name: '', userDob: '', userAddress: '' });
        setFieldErrors({});
        // Refresh the user list
        fetchUsers();
      } else {
        setError(data.message || 'Failed to add user');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An error occurred while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="user-management-page" style={styles.page}>
      {/* Navigation Bar */}
      <nav className="navbar" style={styles.navbar}>
        <div className="nav-container" style={styles.navContainer}>
          <div className="nav-logo" style={styles.navLogo}>
            <span className="logo-icon">💳</span>
            CardOnboard
          </div>
          <div className="nav-links" style={styles.navLinks}>
            <a href="/" style={styles.navLink}>Home</a>
            <a href="/form" style={styles.navLink}>Apply</a>
            <a href="/kyc" style={styles.navLink}>KYC</a>
            <a href="/users" style={{...styles.navLink, ...styles.navLinkActive}}>Users</a>
          </div>
        </div>
      </nav>

      <div className="user-management-container" style={styles.container}>
        <div className="page-header" style={styles.header}>
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.subtitle}>Add and manage user information</p>
        </div>

        {/* User Form */}
        <div className="form-section" style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Add New User</h2>

          {success && (
            <div className="success-message" style={styles.successMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          {error && (
            <div className="error-message" style={styles.errorMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group" style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                style={{...styles.input, ...(fieldErrors.name ? styles.inputError : {})}}
              />
              {fieldErrors.name && <small style={styles.fieldError}>{fieldErrors.name}</small>}
            </div>

            <div className="form-group" style={styles.formGroup}>
              <label htmlFor="userDob" style={styles.label}>Date of Birth</label>
              <input
                type="date"
                id="userDob"
                name="userDob"
                value={formData.userDob}
                onChange={handleChange}
                style={{...styles.input, ...(fieldErrors.userDob ? styles.inputError : {})}}
              />
              {fieldErrors.userDob && <small style={styles.fieldError}>{fieldErrors.userDob}</small>}
            </div>

            <div className="form-group" style={styles.formGroup}>
              <label htmlFor="userAddress" style={styles.label}>Address</label>
              <textarea
                id="userAddress"
                name="userAddress"
                value={formData.userAddress}
                onChange={handleChange}
                placeholder="123 Main Street, City, State, ZIP"
                rows="3"
                style={{...styles.textarea, ...(fieldErrors.userAddress ? styles.inputError : {})}}
              />
              {fieldErrors.userAddress && <small style={styles.fieldError}>{fieldErrors.userAddress}</small>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{...styles.submitButton, ...(submitting ? styles.submitButtonDisabled : {})}}
            >
              {submitting ? 'Adding User...' : 'Add User'}
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="table-section" style={styles.tableSection}>
          <h2 style={styles.sectionTitle}>All Users</h2>

          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No users found. Add your first user above!</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Date of Birth</th>
                    <th style={styles.th}>Address</th>
                    <th style={styles.th}>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>{user.name}</td>
                      <td style={styles.td}>{formatDate(user.date_of_birth)}</td>
                      <td style={styles.td}>{user.address}</td>
                      <td style={styles.td}>{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline styles with Oktawave brand colors
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
    fontFamily: '"Proxima Nova", "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    paddingTop: '80px',
    color: '#ffffff'
  },
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'rgba(10, 10, 15, 0.9)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '16px 0'
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  navLinks: {
    display: 'flex',
    gap: '32px'
  },
  navLink: {
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'color 0.2s'
  },
  navLinkActive: {
    color: '#2DB5DA',
    fontWeight: 600
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #2DB5DA 0%, #939598 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  formSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '48px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: '24px',
    color: '#2DB5DA'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.9)'
  },
  input: {
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    transition: 'all 0.2s'
  },
  textarea: {
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'all 0.2s'
  },
  inputError: {
    borderColor: '#ef4444'
  },
  fieldError: {
    color: '#ef4444',
    fontSize: '0.875rem'
  },
  submitButton: {
    padding: '14px 28px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #2DB5DA 0%, #1a9bba 100%)',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px'
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '8px',
    color: '#22c55e',
    marginBottom: '20px'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    marginBottom: '20px'
  },
  tableSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '40px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    borderTop: '3px solid #2DB5DA',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: 'rgba(255, 255, 255, 0.5)'
  },
  emptyText: {
    fontSize: '1.1rem'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#2DB5DA',
    borderBottom: '2px solid rgba(45, 181, 218, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  td: {
    padding: '12px 16px',
    fontSize: '0.95rem',
    color: 'rgba(255, 255, 255, 0.85)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  trEven: {
    background: 'rgba(255, 255, 255, 0.02)'
  },
  trOdd: {
    background: 'transparent'
  }
};

export default UserManagement;
