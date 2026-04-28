import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import BasicDetailsPage from './BasicDetailsPage';

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockUsers = [
  { id: '1', name: 'John Doe', dateOfBirth: '1990-01-01', address: '123 Main St, Anytown' },
  { id: '2', name: 'Jane Smith', dateOfBirth: '1985-05-15', address: '456 Oak Ave, Otherville' },
];

describe('BasicDetailsPage', () => {
  let navigateMock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);

    // Reset fetch mock before each test
    mockFetch.mockClear();
    // Default successful fetch for users
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockUsers }),
    });

    // Mock setTimeout for clearing success messages
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Helper function to fill the form
  const fillForm = (name, dateOfBirth, address) => {
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: name } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: dateOfBirth } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: address } });
  };

  // Helper function to submit the form
  const submitForm = () => {
    fireEvent.click(screen.getByRole('button', { name: /Submit Details/i }));
  };

  test('TC-001: should render the component and fetch users on mount', async () => {
    render(<BasicDetailsPage />);

    expect(screen.getByText(/Basic Details Collection/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Details/i })).toBeInTheDocument();

    // Expect fetchUsers to be called
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/basic-details');

    // Expect users to be displayed in the table
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('TC-002: should handle input changes correctly', () => {
    render(<BasicDetailsPage />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const dobInput = screen.getByLabelText(/Date of Birth/i);
    const addressInput = screen.getByLabelText(/Address/i);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    expect(nameInput).toHaveValue('Test User');

    fireEvent.change(dobInput, { target: { value: '2000-10-20' } });
    expect(dobInput).toHaveValue('2000-10-20');

    fireEvent.change(addressInput, { target: { value: '123 Test St' } });
    expect(addressInput).toHaveValue('123 Test St');
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      // Ensure fetchUsers is mocked for initial render but doesn't interfere with form submission tests
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }), // No users initially for validation tests
      });
      render(<BasicDetailsPage />);
    });

    test('TC-003: should show error for empty name', async () => {
      fillForm('', '2000-01-01', '123 Test Address, City');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
    });

    test('TC-004: should show error for name less than 2 characters', async () => {
      fillForm('A', '2000-01-01', '123 Test Address, City');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
    });

    test('TC-005: should show error for empty date of birth', async () => {
      fillForm('Valid Name', '', '123 Test Address, City');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Date of Birth is required')).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
    });

    test('TC-006: should show error for age less than 18', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dob = `${year - 10}-${month}-${day}`; // 10 years old

      fillForm('Valid Name', dob, '123 Test Address, City');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Must be at least 18 years old')).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
    });

    test('TC-007: should show error for age greater than 120', async () => {
      fillForm('Valid Name', '1890-01-01', '123 Test Address, City'); // 130+ years old
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Invalid date of birth')).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
    });

    test('TC-008: should show error for empty address', async () => {
      fillForm('Valid Name', '2000-01-01', '');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Address is required')).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
    });

    test('TC-009: should show error for address less than 10 characters', async () => {
      fillForm('Valid Name', '2000-01-01', 'Short Add');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Address must be at least 10 characters')).toBeInTheDocument();
      });
      expect(mockFetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
    });

    test('TC-010: should clear error message on input change', async () => {
      fillForm('', '2000-01-01', '123 Test Address, City');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Valid Name' } });
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('TC-011: should submit form with valid data and show success message', async () => {
      // Mock fetch for initial user load (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      // Mock fetch for POST request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'User created' }),
      });
      // Mock fetch for refreshing user list after submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [{ id: '3', name: 'New User', dateOfBirth: '1995-03-20', address: '789 New St' }] }),
      });

      render(<BasicDetailsPage />);

      const dob = '1995-03-20'; // Valid age
      fillForm('New User', dob, '789 New Street, New City');
      submitForm();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/basic-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New User', dateOfBirth: dob, address: '789 New Street, New City' }),
        });
      });

      expect(screen.getByText('User details submitted successfully!')).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Name/i)).toHaveValue(''); // Form cleared
      expect(screen.getByText('New User')).toBeInTheDocument(); // New user in table

      // Check if success message disappears after 3 seconds
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.queryByText('User details submitted successfully!')).not.toBeInTheDocument();
      });
    });

    test('TC-012: should show error message on failed submission', async () => {
      // Mock fetch for initial user load (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      // Mock fetch for POST request failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, message: 'Submission failed' }),
      });

      render(<BasicDetailsPage />);

      fillForm('Valid User', '1990-01-01', '123 Valid Address, City');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
      });
      expect(screen.queryByText('User details submitted successfully!')).not.toBeInTheDocument();
    });

    test('TC-013: should show network error message on submission failure', async () => {
      // Mock fetch for initial user load (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      // Mock fetch for POST request network error
      mockFetch.mockRejectedValueOnce(new Error('Network down'));

      render(<BasicDetailsPage />);

      fillForm('Valid User', '1990-01-01', '123 Valid Address, City');
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });

    test('TC-014: should disable submit button while loading', async () => {
      // Mock fetch for initial user load (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      // Mock fetch for POST request to be pending
      mockFetch.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ success: true }) }), 100))
      );
      // Mock fetch for refreshing user list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      render(<BasicDetailsPage />);

      fillForm('Valid User', '1990-01-01', '123 Valid Address, City');
      submitForm();

      expect(screen.getByRole('button', { name: /Submitting.../i })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Submit Details/i })).not.toBeDisabled();
      });
    });
  });

  describe('User Deletion', () => {
    beforeEach(() => {
      // Mock initial fetch for users
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers }),
      });
      render(<BasicDetailsPage />);
    });

    test('TC-015: should delete a user successfully', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn(() => true);
      // Mock fetch for DELETE request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'User deleted' }),
      });
      // Mock fetch for refreshing user list after deletion
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockUsers[1]] }), // John Doe deleted
      });

      await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

      fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]); // Click delete for John Doe

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/api/basic-details/1', {
          method: 'DELETE',
        });
      });

      // John Doe should be removed from the document
      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('TC-016: should not delete user if confirmation is cancelled', async () => {
      window.confirm = jest.fn(() => false); // User cancels deletion

      await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

      fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');
      expect(mockFetch).not.toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }));
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // User still present
    });

    test('TC-017: should show alert on failed deletion', async () => {
      window.confirm = jest.fn(() => true);
      window.alert = jest.fn(); // Mock alert

      // Mock fetch for DELETE request failure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, message: 'Deletion failed' }),
      });
      // Mock fetch for refreshing user list (should still contain original users)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers }),
      });

      await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

      fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to delete user: Deletion failed');
      });
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // User still present
    });

    test('TC-018: should show network error alert on deletion failure', async () => {
      window.confirm = jest.fn(() => true);
      window.alert = jest.fn(); // Mock alert

      // Mock fetch for DELETE request network error
      mockFetch.mockRejectedValueOnce(new Error('Network down'));
      // Mock fetch for refreshing user list (should still contain original users)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUsers }),
      });

      await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

      fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Network error. Please try again.');
      });
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // User still present
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Mock initial fetch for users
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      render(<BasicDetailsPage />);
    });

    test('TC-019: should navigate to home on logo click', () => {
      fireEvent.click(screen.getByText('CardOnboard'));
      expect(navigateMock).toHaveBeenCalledWith('/');
    });

    test('TC-020: should navigate to home on "Home" link click', () => {
      fireEvent.click(screen.getByRole('link', { name: 'Home' }));
      expect(navigateMock).toHaveBeenCalledWith('/');
    });

    test('TC-021: should navigate to customer form on "Customer Form" link click', () => {
      fireEvent.click(screen.getByRole('link', { name: 'Customer Form' }));
      expect(navigateMock).toHaveBeenCalledWith('/form');
    });

    test('TC-022: should navigate to KYC on "KYC" link click', () => {
      fireEvent.click(screen.getByRole('link', { name: 'KYC' }));
      expect(navigateMock).toHaveBeenCalledWith('/kyc');
    });

    test('TC-023: should navigate to basic details on "Basic Details" link click', () => {
      fireEvent.click(screen.getByRole('link', { name: 'Basic Details' }));
      expect(navigateMock).toHaveBeenCalledWith('/basic-details');
    });
  });

  test('TC-024: should display "No users added yet" when user list is empty', async () => {
    // Mock initial fetch for users to return empty array
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });
    render(<BasicDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('No users added yet')).toBeInTheDocument();
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('TC-025: should format date correctly in the table', async () => {
    // Mock initial fetch for users
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [{ id: '1', name: 'Test User', dateOfBirth: '2000-01-01', address: 'Test Address' }] }),
    });
    render(<BasicDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('January 1, 2000')).toBeInTheDocument();
    });
  });
});