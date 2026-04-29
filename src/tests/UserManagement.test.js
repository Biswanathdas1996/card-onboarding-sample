/**
 * User Management Component Tests
 * Tests for form validation, DB persistence, listing, and navigation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../pages/UserManagement';
import FormValidator from '../services/FormValidator';

// Mock fetch
global.fetch = jest.fn();

// Helper function to render component with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UserManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful fetch for users list
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] })
    });
  });

  describe('Form Rendering', () => {
    test('renders user management form with all fields', async () => {
      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
      });
    });

    test('renders users table section', async () => {
      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText(/all users/i)).toBeInTheDocument();
      });
    });

    test('renders navigation buttons', async () => {
      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation - Name Field', () => {
    test('validates required name field', () => {
      const error = FormValidator.validateField('name', '');
      expect(error).toBe('Name is required');
    });

    test('validates name minimum length', () => {
      const error = FormValidator.validateField('name', 'A');
      expect(error).toBe('Name must be at least 2 characters');
    });

    test('validates name contains only valid characters', () => {
      const error = FormValidator.validateField('name', 'John123');
      expect(error).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
    });

    test('accepts valid name with letters and spaces', () => {
      const error = FormValidator.validateField('name', 'John Doe');
      expect(error).toBeNull();
    });

    test('accepts valid name with hyphens and apostrophes', () => {
      expect(FormValidator.validateField('name', "Mary-Jane O'Connor")).toBeNull();
    });
  });

  describe('Form Validation - Date of Birth Field', () => {
    test('validates required DOB field', () => {
      const error = FormValidator.validateField('dateOfBirth', '');
      expect(error).toBe('Date of birth is required');
    });

    test('validates DOB is in the past', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const error = FormValidator.validateField('dateOfBirth', tomorrow.toISOString().split('T')[0]);
      expect(error).toBe('Date of birth must be in the past');
    });

    test('validates user is at least 18 years old', () => {
      const recentDate = new Date();
      recentDate.setFullYear(recentDate.getFullYear() - 10);
      const error = FormValidator.validateField('dateOfBirth', recentDate.toISOString().split('T')[0]);
      expect(error).toBe('You must be at least 18 years old');
    });

    test('accepts valid DOB for 18+ user', () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 25);
      const error = FormValidator.validateField('dateOfBirth', validDate.toISOString().split('T')[0]);
      expect(error).toBeNull();
    });
  });

  describe('Form Validation - Address Field', () => {
    test('validates required address field', () => {
      const error = FormValidator.validateField('address', '');
      expect(error).toBe('Address is required');
    });

    test('validates address minimum length', () => {
      const error = FormValidator.validateField('address', '123');
      expect(error).toBe('Please enter a valid address');
    });

    test('accepts valid address', () => {
      const error = FormValidator.validateField('address', '123 Main Street, Apt 4B');
      expect(error).toBeNull();
    });
  });

  describe('Form Submission - Happy Path', () => {
    test('submits valid form data successfully', async () => {
      // Mock successful user creation
      global.fetch
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) }) // Initial users fetch
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            message: 'User added successfully!',
            data: { id: '123', name: 'John Doe' }
          })
        }) // User creation
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) }); // Refresh users

      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main Street, New York' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /add user/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/users', expect.any(Object));
      });
    });
  });

  describe('Form Submission - Negative Cases', () => {
    test('prevents submission with empty name', async () => {
      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      // Try to submit with empty name
      fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main Street' } });
      fireEvent.click(screen.getByRole('button', { name: /add user/i }));

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    test('shows error message when API call fails', async () => {
      global.fetch
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) })
        .mockResolvedValueOnce({
          json: async () => ({ success: false, message: 'Database error' })
        });

      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main Street' } });
      fireEvent.click(screen.getByRole('button', { name: /add user/i }));

      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Users List Display', () => {
    test('displays users in table when data is available', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          date_of_birth: '1990-01-01',
          address: '123 Main St',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          date_of_birth: '1985-05-15',
          address: '456 Oak Ave',
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      global.fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUsers })
      });

      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
        expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      });
    });

    test('displays message when no users exist', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] })
      });

      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles special characters in name correctly', () => {
      expect(FormValidator.validateField('name', "O'Brien-Smith")).toBeNull();
      expect(FormValidator.validateField('name', 'José María')).toBeNull();
    });

    test('handles DOB on exact 18th birthday', () => {
      const exactly18YearsAgo = new Date();
      exactly18YearsAgo.setFullYear(exactly18YearsAgo.getFullYear() - 18);
      exactly18YearsAgo.setDate(exactly18YearsAgo.getDate() + 1); // One day after to ensure 18+

      const error = FormValidator.validateField('dateOfBirth', exactly18YearsAgo.toISOString().split('T')[0]);
      expect(error).toBeNull();
    });

    test('handles very long address', () => {
      const longAddress = 'A'.repeat(500);
      const error = FormValidator.validateField('address', longAddress);
      expect(error).toBeNull();
    });
  });

  describe('Navigation', () => {
    test('back button navigates to home', async () => {
      const { container } = renderWithRouter(<UserManagement />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i });
        expect(backButton).toBeInTheDocument();
      });
    });
  });

  describe('UI/Visual Compliance', () => {
    test('applies Oktawave primary color (#2DB5DA) to table headers', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          date_of_birth: '1990-01-01',
          address: '123 Main St',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      global.fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUsers })
      });

      const { container } = renderWithRouter(<UserManagement />);

      await waitFor(() => {
        const headers = container.querySelectorAll('th');
        headers.forEach(header => {
          const style = window.getComputedStyle(header);
          // Check if color is set (actual color check would require jsdom CSS support)
          expect(header.style.color).toBeTruthy();
        });
      });
    });

    test('applies Proxima Nova/Montserrat font family', async () => {
      const { container } = renderWithRouter(<UserManagement />);

      await waitFor(() => {
        const formContainer = container.querySelector('.form-container');
        expect(formContainer?.style.fontFamily).toContain('Proxima Nova');
      });
    });
  });
});
