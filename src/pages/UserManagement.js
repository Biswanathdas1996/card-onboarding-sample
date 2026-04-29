import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormValidator from '../services/FormValidator';

function UserManagement() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        console.error('Failed to fetch users:', data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      const validationError = FormValidator.validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: validationError
      }));
    }

    // Clear API messages
    if (apiError) setApiError('');
    if (apiSuccess) setApiSuccess('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    const nameError = FormValidator.validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;

    // Validate date of birth
    const dobError = FormValidator.validateField('dateOfBirth', formData.dateOfBirth);
    if (dobError) newErrors.dateOfBirth = dobError;

    // Validate address
    const addressError = FormValidator.validateField('address', formData.address);
    if (addressError) newErrors.address = addressError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setApiError('Please fix the errors before submitting.');
      return;
    }

    setSubmitting(true);
    setApiError('');
    setApiSuccess('');

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
        setApiSuccess('User added successfully!');
        setFormData({ name: '', dateOfBirth: '', address: '' });
        setErrors({});
        // Refresh users list
        fetchUsers();
      } else {
        setApiError(data.message || 'Failed to add user.');
      }
    } catch (error) {
      console.error('Error submitting user:', error);
      setApiError('An error occurred while adding the user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setApiSuccess('User deleted successfully!');
        fetchUsers();
      } else {
        setApiError(data.message || 'Failed to delete user.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setApiError('An error occurred while deleting the user.');
    }
  };

  return (
    <div className="form-container" style={{ fontFamily: 'Proxima Nova, Montserrat, sans-serif' }}>
      <div className="form-wrapper" style={{ maxWidth: '1200px' }}>
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <div className="form-header">
          <h2>User Management</h2>
          <p className="form-description">Add and manage user records</p>
        </div>

        {/* Success Message */}
        {apiSuccess && (
          <div className="success-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {apiSuccess}
          </div>
        )}

        {/* Error Message */}
        {apiError && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {apiError}
          </div>
        )}

        {/* User Form Section */}
        <form onSubmit={handleSubmit}>
          <div className="section-title">Add New User</div>

          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className={errors.name ? 'input-error' : ''}
              disabled={submitting}
            />
            {errors.name && <small className="field-error">{errors.name}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={errors.dateOfBirth ? 'input-error' : ''}
              disabled={submitting}
            />
            {errors.dateOfBirth && <small className="field-error">{errors.dateOfBirth}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter full address"
              className={errors.address ? 'input-error' : ''}
              rows={3}
              disabled={submitting}
            />
            {errors.address && <small className="field-error">{errors.address}</small>}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Adding User...' : 'Add User'}
          </button>
        </form>

        {/* Users Table Section */}
        <div style={{ marginTop: '40px' }}>
          <div className="section-title">All Users</div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
              No users found. Add your first user above.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(45, 181, 218, 0.1)' }}>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#2DB5DA', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#2DB5DA', fontWeight: '600' }}>Date of Birth</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#2DB5DA', fontWeight: '600' }}>Address</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#2DB5DA', fontWeight: '600' }}>Created At</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: '#2DB5DA', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                    }}>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>{user.name}</td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {new Date(user.date_of_birth).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '300px' }}>
                        {user.address}
                      </td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(user.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          }}
                        >
                          Delete
                        </button>
                      </td>
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
