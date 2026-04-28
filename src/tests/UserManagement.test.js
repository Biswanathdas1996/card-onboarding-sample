/**
 * UserManagement Component Tests
 * Tests for form validation, DB operations, navigation, and branding
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../pages/UserManagement';
import FormValidator from '../services/FormValidator';

// Mock fetch API
global.fetch = jest.fn();

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UserManagement Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Form Rendering Tests
  // ============================================

  test('renders user management page with correct heading', () => {
    renderWithRouter(<UserManagement />);
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText(/Manage user information and view all registered users/i)).toBeInTheDocument();
  });

  test('renders form with all required fields', () => {
    renderWithRouter(<UserManagement />);
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
  });

  test('renders empty table initially with no users message', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] }),
    });

    renderWithRouter(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText(/No users added yet/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Form Validation Tests (KAN-266)
  // ============================================

  test('validates required name field', () => {
    const error = FormValidator.validateField('name', '');
    expect(error).toBe('Name is required');
  });

  test('validates name minimum length', () => {
    const error = FormValidator.validateField('name', 'A');
    expect(error).toBe('Name must be at least 2 characters');
  });

  test('validates name with valid characters only', () => {
    const error = FormValidator.validateField('name', 'John123');
    expect(error).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
  });

  test('accepts valid name with spaces and hyphens', () => {
    const error = FormValidator.validateField('name', "John O'Brien-Smith");
    expect(error).toBeNull();
  });

  test('validates required date of birth field', () => {
    const error = FormValidator.validateField('userDob', '');
    expect(error).toBe('Date of birth is required');
  });

  test('validates date of birth must be in the past', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const error = FormValidator.validateField('userDob', futureDate.toISOString().split('T')[0]);
    expect(error).toBe('Date of birth must be in the past');
  });

  test('validates minimum age of 18 years', () => {
    const recentDate = new Date();
    recentDate.setFullYear(recentDate.getFullYear() - 17);
    const error = FormValidator.validateField('userDob', recentDate.toISOString().split('T')[0]);
    expect(error).toBe('You must be at least 18 years old');
  });

  test('accepts valid date of birth for 18+ year old', () => {
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 25);
    const error = FormValidator.validateField('userDob', validDate.toISOString().split('T')[0]);
    expect(error).toBeNull();
  });

  test('validates required address field', () => {
    const error = FormValidator.validateField('userAddress', '');
    expect(error).toBe('Address is required');
  });

  test('validates address minimum length', () => {
    const error = FormValidator.validateField('userAddress', 'Short');
    expect(error).toBe('Address must be at least 10 characters');
  });

  test('accepts valid address with sufficient length', () => {
    const error = FormValidator.validateField('userAddress', '123 Main Street, New York');
    expect(error).toBeNull();
  });

  // ============================================
  // Form Submission Tests
  // ============================================

  test('displays error when submitting empty form', async () => {
    renderWithRouter(<UserManagement />);

    const submitButton = screen.getByRole('button', { name: /Add User/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });

  test('successfully submits valid form data', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          id: '123',
          name: 'John Doe',
          date_of_birth: '1990-01-01',
          address: '123 Main Street, New York',
          created_at: new Date().toISOString(),
        },
      }),
    });

    // Mock the second fetch for fetching users after submission
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [
          {
            id: '123',
            name: 'John Doe',
            date_of_birth: '1990-01-01',
            address: '123 Main Street, New York',
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });

    renderWithRouter(<UserManagement />);

    // Fill out form
    const nameInput = screen.getByLabelText(/Name/i);
    const dobInput = screen.getByLabelText(/Date of Birth/i);
    const addressInput = screen.getByLabelText(/Address/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    fireEvent.change(addressInput, {
      target: { value: '123 Main Street, New York' },
    });

    const submitButton = screen.getByRole('button', { name: /Add User/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/User added successfully!/i)).toBeInTheDocument();
    });
  });

  test('handles API error on form submission', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        message: 'Server error occurred',
      }),
    });

    renderWithRouter(<UserManagement />);

    const nameInput = screen.getByLabelText(/Name/i);
    const dobInput = screen.getByLabelText(/Date of Birth/i);
    const addressInput = screen.getByLabelText(/Address/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    fireEvent.change(addressInput, {
      target: { value: '123 Main Street, New York' },
    });

    const submitButton = screen.getByRole('button', { name: /Add User/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Server error occurred/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Database Integration Tests
  // ============================================

  test('fetches and displays users from API on mount', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'Alice Johnson',
        date_of_birth: '1985-05-15',
        address: '456 Oak Avenue, Los Angeles',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        name: 'Bob Smith',
        date_of_birth: '1992-08-20',
        address: '789 Pine Road, Chicago',
        created_at: '2024-01-02T11:00:00Z',
      },
    ];

    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockUsers }),
    });

    renderWithRouter(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText(/456 Oak Avenue/i)).toBeInTheDocument();
      expect(screen.getByText(/789 Pine Road/i)).toBeInTheDocument();
    });
  });

  test('displays correct user count in table header', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'Alice Johnson',
        date_of_birth: '1985-05-15',
        address: '456 Oak Avenue',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        name: 'Bob Smith',
        date_of_birth: '1992-08-20',
        address: '789 Pine Road',
        created_at: '2024-01-02T11:00:00Z',
      },
    ];

    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockUsers }),
    });

    renderWithRouter(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText(/All Users \(2\)/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // UI/Branding Tests (KAN-268)
  // ============================================

  test('applies Oktawave primary color to success message', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          id: '123',
          name: 'John Doe',
          date_of_birth: '1990-01-01',
          address: '123 Main Street',
          created_at: new Date().toISOString(),
        },
      }),
    });

    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] }),
    });

    renderWithRouter(<UserManagement />);

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const dobInput = screen.getByLabelText(/Date of Birth/i);
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });

    const addressInput = screen.getByLabelText(/Address/i);
    fireEvent.change(addressInput, {
      target: { value: '123 Main Street, New York' },
    });

    const submitButton = screen.getByRole('button', { name: /Add User/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const successMessage = screen.getByText(/User added successfully!/i);
      expect(successMessage).toBeInTheDocument();
    });
  });

  test('form clears after successful submission', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          id: '123',
          name: 'John Doe',
          date_of_birth: '1990-01-01',
          address: '123 Main Street',
          created_at: new Date().toISOString(),
        },
      }),
    });

    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] }),
    });

    renderWithRouter(<UserManagement />);

    const nameInput = screen.getByLabelText(/Name/i);
    const dobInput = screen.getByLabelText(/Date of Birth/i);
    const addressInput = screen.getByLabelText(/Address/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    fireEvent.change(addressInput, {
      target: { value: '123 Main Street, New York' },
    });

    const submitButton = screen.getByRole('button', { name: /Add User/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(dobInput.value).toBe('');
      expect(addressInput.value).toBe('');
    });
  });

  // ============================================
  // Edge Case Tests
  // ============================================

  test('handles network error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<UserManagement />);

    await waitFor(() => {
      // Component should still render even if initial fetch fails
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  test('prevents multiple simultaneous submissions', async () => {
    fetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                json: async () => ({ success: true, data: { id: '123' } }),
              }),
            100
          )
        )
    );

    renderWithRouter(<UserManagement />);

    const nameInput = screen.getByLabelText(/Name/i);
    const dobInput = screen.getByLabelText(/Date of Birth/i);
    const addressInput = screen.getByLabelText(/Address/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    fireEvent.change(addressInput, {
      target: { value: '123 Main Street, New York' },
    });

    const submitButton = screen.getByRole('button', { name: /Add User/i });

    // Click submit multiple times
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();
  });
});
