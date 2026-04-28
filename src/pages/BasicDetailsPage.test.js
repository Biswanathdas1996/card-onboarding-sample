import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import BasicDetailsPage from './BasicDetailsPage';

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

describe('BasicDetailsPage', () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  beforeAll(() => {
    // Spy on console.error to prevent it from cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    jest.useFakeTimers(); // Mock timers for setTimeout
    global.fetch = jest.fn(); // Mock global fetch
  });

  afterEach(() => {
    jest.runOnlyPendingTimers(); // Clear any pending timers
    jest.useRealTimers(); // Restore real timers
    jest.restoreAllMocks(); // Restore console.error
  });

  const setup = () => {
    render(<BasicDetailsPage />);
  };

  const fillForm = (name, dob, address) => {
    if (name) {
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: name } });
    }
    if (dob) {
      fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: dob } });
    }
    if (address) {
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: address } });
    }
  };

  const submitForm = () => {
    fireEvent.click(screen.getByRole('button', { name: /submit details/i }));
  };

  // TC-BD-001: Test initial render and fetchUsers call
  test('TC-BD-001: should render correctly and fetch users on mount', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      }); // For the initial fetch and potential re-fetch

    setup();

    expect(screen.getByText(/basic details collection/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit details/i })).toBeInTheDocument();
    expect(screen.getByText(/no users added yet/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/basic-details`);
    });
  });

  // TC-BD-002: Test navigation links
  test('TC-BD-002: should navigate to correct routes when nav links are clicked', () => {
    setup();

    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');

    fireEvent.click(screen.getByText('Customer Form'));
    expect(mockNavigate).toHaveBeenCalledWith('/form');

    fireEvent.click(screen.getByText('KYC'));
    expect(mockNavigate).toHaveBeenCalledWith('/kyc');

    fireEvent.click(screen.getByText('Basic Details'));
    expect(mockNavigate).toHaveBeenCalledWith('/basic-details');

    fireEvent.click(screen.getByText('CardOnboard')); // Logo click
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  describe('Form Validation', () => {
    // TC-BD-003: Test form submission with empty fields
    test('TC-BD-003: should show validation errors for empty fields on submit', async () => {
      setup();
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Date of Birth is required')).toBeInTheDocument();
        expect(screen.getByText('Address is required')).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // TC-BD-004: Test name validation (too short)
    test('TC-BD-004: should show error if name is less than 2 characters', async () => {
      setup();
      fillForm('A', '2000-01-01', '123 Main St, Anytown, USA');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // TC-BD-005: Test date of birth validation (under 18)
    test('TC-BD-005: should show error if date of birth makes user under 18', async () => {
      const today = new Date();
      const futureDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate()); // 10 years ago
      const dobString = futureDate.toISOString().split('T')[0];

      setup();
      fillForm('John Doe', dobString, '123 Main St, Anytown, USA');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Must be at least 18 years old')).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // TC-BD-006: Test date of birth validation (over 120)
    test('TC-BD-006: should show error if date of birth makes user over 120', async () => {
      const futureDate = new Date(1900, 0, 1); // Over 120 years ago
      const dobString = futureDate.toISOString().split('T')[0];

      setup();
      fillForm('John Doe', dobString, '123 Main St, Anytown, USA');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Invalid date of birth')).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // TC-BD-007: Test address validation (too short)
    test('TC-BD-007: should show error if address is less than 10 characters', async () => {
      setup();
      fillForm('John Doe', '2000-01-01', 'Short Add');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Address must be at least 10 characters')).toBeInTheDocument();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // TC-BD-008: Test clearing errors on change
    test('TC-BD-008: should clear error message for a field when its value changes', async () => {
      setup();
      submitForm(); // Trigger errors

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission (handleSubmit)', () => {
    // TC-BD-009: Test successful form submission
    test('TC-BD-009: should submit form successfully and display success message', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        }) // Initial fetchUsers
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, message: 'User created', data: { id: '1', name: 'John Doe', dateOfBirth: '2000-01-01', address: '123 Main St' } }),
        }) // POST request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [{ id: '1', name: 'John Doe', dateOfBirth: '2000-01-01', address: '123 Main St' }] }),
        }); // Re-fetch users

      setup();
      fillForm('John Doe', '2000-01-01', '123 Main St, Anytown, USA');
      submitForm();

      expect(screen.getByRole('button', { name: /submitting.../i })).toBeDisabled();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/basic-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'John Doe', dateOfBirth: '2000-01-01', address: '123 Main St, Anytown, USA' }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('User details submitted successfully!')).toBeInTheDocument();
      });

      // Form should be cleared
      expect(screen.getByLabelText(/full name/i)).toHaveValue('');
      expect(screen.getByLabelText(/date of birth/i)).toHaveValue('');
      expect(screen.getByLabelText(/address/i)).toHaveValue('');

      // Success message should disappear after 3 seconds
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.queryByText('User details submitted successfully!')).not.toBeInTheDocument();
      });
    });

    // TC-BD-010: Test form submission failure (API error)
    test('TC-BD-010: should display error message on API submission failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        }) // Initial fetchUsers
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: false, message: 'Server error' }),
        }); // POST request failure

      setup();
      fillForm('John Doe', '2000-01-01', '123 Main St, Anytown, USA');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /submit details/i })).not.toBeDisabled();
    });

    // TC-BD-011: Test form submission network error
    test('TC-BD-011: should display network error message on submission network failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        }) // Initial fetchUsers
        .mockRejectedValueOnce(new Error('Network down')); // POST request network error

      setup();
      fillForm('John Doe', '2000-01-01', '123 Main St, Anytown, USA');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
      expect(console.error).toHaveBeenCalledWith('Error submitting form:', expect.any(Error));
    });
  });

  describe('User List and Deletion', () => {
    const mockUsers = [
      { id: '1', name: 'Alice Smith', dateOfBirth: '1990-05-15', address: '456 Oak Ave' },
      { id: '2', name: 'Bob Johnson', dateOfBirth: '1985-11-20', address: '789 Pine Ln' },
    ];

    // TC-BD-012: Test displaying fetched users
    test('TC-BD-012: should display fetched users in the table', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers }),
      });

      setup();

      await waitFor(() => {
        expect(screen.queryByText(/no users added yet/i)).not.toBeInTheDocument();
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.getByText('May 15, 1990')).toBeInTheDocument();
        expect(screen.getByText('November 20, 1985')).toBeInTheDocument();
        expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
        expect(screen.getByText('789 Pine Ln')).toBeInTheDocument();
      });
    });

    // TC-BD-013: Test fetchUsers error handling
    test('TC-BD-013: should log error if fetching users fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      setup();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error fetching users:', expect.any(Error));
      });
      expect(screen.getByText(/no users added yet/i)).toBeInTheDocument(); // Should still show no users
    });

    // TC-BD-014: Test successful user deletion
    test('TC-BD-014: should delete a user successfully', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        }) // Initial fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, message: 'User deleted' }),
        }) // DELETE request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [mockUsers[1]] }),
        }); // Re-fetch after deletion

      setup();

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      window.confirm = jest.fn(() => true); // Mock window.confirm to return true

      fireEvent.click(screen.getAllByText('Delete')[0]); // Click delete for Alice

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/basic-details/1`, {
          method: 'DELETE',
        });
      });

      await waitFor(() => {
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    // TC-BD-015: Test user deletion cancellation
    test('TC-BD-015: should not delete user if confirmation is cancelled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers }),
      }); // Initial fetch

      setup();

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      window.confirm = jest.fn(() => false); // Mock window.confirm to return false

      fireEvent.click(screen.getAllByText('Delete')[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');
      expect(global.fetch).not.toHaveBeenCalledWith(`${API_URL}/api/basic-details/1`, expect.any(Object)); // DELETE should not be called

      // User list should remain unchanged
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    // TC-BD-016: Test user deletion failure (API error)
    test('TC-BD-016: should show alert on user deletion API failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        }) // Initial fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: false, message: 'Deletion failed' }),
        }); // DELETE request failure

      setup();

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      window.confirm = jest.fn(() => true);
      window.alert = jest.fn(); // Mock window.alert

      fireEvent.click(screen.getAllByText('Delete')[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to delete user: Deletion failed');
      });
      expect(screen.getByText('Alice Smith')).toBeInTheDocument(); // User should still be there
    });

    // TC-BD-017: Test user deletion network error
    test('TC-BD-017: should show alert on user deletion network error', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        }) // Initial fetch
        .mockRejectedValueOnce(new Error('Network down')); // DELETE request network error

      setup();

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      window.confirm = jest.fn(() => true);
      window.alert = jest.fn(); // Mock window.alert

      fireEvent.click(screen.getAllByText('Delete')[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Network error. Please try again.');
      });
      expect(console.error).toHaveBeenCalledWith('Error deleting user:', expect.any(Error));
      expect(screen.getByText('Alice Smith')).toBeInTheDocument(); // User should still be there
    });
  });

  // TC-BD-018: Test formatDate utility function
  test('TC-BD-018: should format date correctly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [{ id: '1', name: 'Test User', dateOfBirth: '2023-01-15', address: 'Test Address' }] }),
    });

    setup();

    await waitFor(() => {
      expect(screen.getByText('January 15, 2023')).toBeInTheDocument();
    });
  });
});