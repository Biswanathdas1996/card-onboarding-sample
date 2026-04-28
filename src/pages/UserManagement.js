import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormValidator from '../services/FormValidator';
import './UserManagement.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

function UserManagement() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    address: ''
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
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
    const errors = {};

    // Validate name
    const nameError = FormValidator.validateField('name', formData.name);
    if (nameError) errors.name = nameError;

    // Validate date of birth
    const dobError = FormValidator.validateField('dateOfBirth', formData.dateOfBirth);
    if (dobError) errors.dateOfBirth = dobError;

    // Validate address
    const addressError = FormValidator.validateField('address', formData.address);
    if (addressError) errors.address = addressError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix the errors before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User added successfully!');
        setFormData({
          name: '',
          dateOfBirth: '',
          address: ''
        });
        setFieldErrors({});
        // Refresh the users list
        fetchUsers();
      } else {
        setError(data.message || 'Failed to add user. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting user:', err);
      setError('An error occurred while adding the user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="user-management-page">
      {/* Navigation */}
      <nav className="user-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">💳</span>
            CardOnboard
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">Home</a>
            <a href="/form" className="nav-link">Apply</a>
            <a href="/kyc" className="nav-link">KYC</a>
            <a href="/users" className="nav-link active">Users</a>
          </div>
        </div>
      </nav>

      <div className="user-management-container">
        <div className="page-header">
          <h1>User Management</h1>
          <p>Add and manage user records</p>
        </div>

        {/* User Form */}
        <div className="form-section">
          <h2>Add New User</h2>

          {success && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="name">Full Name <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className={fieldErrors.name ? 'input-error' : ''}
                disabled={submitting}
              />
              {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth <span className="required">*</span></label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={fieldErrors.dateOfBirth ? 'input-error' : ''}
                disabled={submitting}
              />
              {fieldErrors.dateOfBirth && <small className="field-error">{fieldErrors.dateOfBirth}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address <span className="required">*</span></label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full address"
                rows="3"
                className={fieldErrors.address ? 'input-error' : ''}
                disabled={submitting}
              />
              {fieldErrors.address && <small className="field-error">{fieldErrors.address}</small>}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="users-list-section">
          <h2>All Users</h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users found. Add your first user above!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date of Birth</th>
                    <th>Address</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="user-name">{user.name}</td>
                      <td>{formatDate(user.date_of_birth)}</td>
                      <td className="user-address">{user.address}</td>
                      <td>{formatDate(user.created_at)}</td>
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

export default UserManagement;
