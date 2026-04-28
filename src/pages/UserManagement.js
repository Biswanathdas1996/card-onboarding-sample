import React, { useState, useEffect } from 'react';
import FormValidator from '../services/FormValidator';
import './UserManagement.css';

function UserManagement() {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    address: ''
  });

  const [users, setUsers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

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
    const errors = {};

    // Validate name
    const nameError = FormValidator.validateField('name', formData.name);
    if (nameError) errors.name = nameError;

    // Validate date of birth
    const dobError = FormValidator.validateField('userDob', formData.dateOfBirth);
    if (dobError) errors.dateOfBirth = dobError;

    // Validate address
    const addressError = FormValidator.validateField('userAddress', formData.address);
    if (addressError) errors.address = addressError;

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

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setFormData({
          name: '',
          dateOfBirth: '',
          address: ''
        });

        // Refresh user list
        await fetchUsers();

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      } else {
        setError(data.message || 'Failed to add user. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting user:', err);
      setError('An error occurred while adding the user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="user-management-page">
      <div className="user-management-container">
        <div className="page-header">
          <h1>User Management</h1>
          <p className="page-description">Manage user information and view all registered users</p>
        </div>

        {/* Form Section */}
        <div className="form-section">
          <h2>Add New User</h2>

          {submitted && (
            <div className="success-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              User added successfully!
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
            <div className="form-group">
              <label htmlFor="name">
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className={fieldErrors.name ? 'input-error' : ''}
              />
              {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">
                Date of Birth <span className="required">*</span>
              </label>
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

            <div className="form-group">
              <label htmlFor="address">
                Address <span className="required">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter complete address"
                rows="3"
                className={fieldErrors.address ? 'input-error' : ''}
              />
              {fieldErrors.address && <small className="field-error">{fieldErrors.address}</small>}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </div>

        {/* Table Section */}
        <div className="table-section">
          <h2>All Users ({users.length})</h2>

          {users.length === 0 ? (
            <div className="no-users">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p>No users added yet</p>
              <small>Add your first user using the form above</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date of Birth</th>
                    <th>Address</th>
                    <th>Added On</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="user-name">{user.name}</td>
                      <td>{formatDate(user.date_of_birth)}</td>
                      <td className="user-address">{user.address}</td>
                      <td className="user-date">{formatDate(user.created_at)}</td>
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
