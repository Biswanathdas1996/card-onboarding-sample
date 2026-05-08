import React, { useState, useEffect, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Calculate form progress
  const filledFields = useMemo(() => {
    return Object.values(formData).filter((val) => String(val).trim() !== '').length;
  }, [formData]);

  const totalFields = Object.keys(formData).length;
  const progress = Math.round((filledFields / totalFields) * 100);

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

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.address?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const userStats = useMemo(() => {
    return {
      total: users.length,
      today: users.filter((u) => {
        const created = new Date(u.created_at);
        return created.toDateString() === new Date().toDateString();
      }).length,
    };
  }, [users]);

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
            <span className="logo-icon">👤</span>
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
        {/* Header with Stats */}
        <div className="page-header">
          <div className="header-content">
            <div>
              <h1>User Management</h1>
              <p className="header-subtitle">Add and manage user records</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{userStats.total}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{userStats.today}</span>
              <span className="stat-label">Added Today</span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-header">
            <label>Form Completion</label>
            <span className="progress-value">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* User Form */}
        <div className="form-section">
          <div className="section-header">
            <h2>Add New User</h2>
            <span className="form-badge">{filledFields}/{totalFields} fields filled</span>
          </div>

          {success && (
            <div className="alert alert-success" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="name">Full Name <span className="required">*</span></label>
              <div className="input-wrapper">
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
                <span className="input-hint">Enter the user's complete name</span>
              </div>
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth <span className="required">*</span></label>
              <div className="input-wrapper">
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={fieldErrors.dateOfBirth ? 'input-error' : ''}
                  disabled={submitting}
                />
                <span className="input-hint">Must be 18 years or older</span>
              </div>
              {fieldErrors.dateOfBirth && <span className="field-error">{fieldErrors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address <span className="required">*</span></label>
              <div className="input-wrapper">
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
                <span className="input-hint">Street, city, and zip code</span>
              </div>
              {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || progress < 100}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Adding...
                  </>
                ) : (
                  'Add User'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Users List Section */}
        <div className="users-list-section">
          <div className="section-header">
            <h2>All Users</h2>
            <div className="search-container">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="clear-search"
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loader-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>No users found</h3>
              <p>{searchQuery ? `No results matching "${searchQuery}"` : 'Add your first user above!'}</p>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-card-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-id">ID: #{user.id}</span>
                    </div>
                  </div>
                  <div className="user-card-details">
                    <div className="detail-item">
                      <span className="detail-label">DOB</span>
                      <span className="detail-value">{formatDate(user.date_of_birth)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Address</span>
                      <span className="detail-value address-truncate">{user.address}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Added</span>
                      <span className="detail-value">{formatDate(user.created_at)}</span>
                    </div>
                  </div>
                  <div className="user-card-footer">
                    <span className="status-badge">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
