import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../src/pages/UserManagement';
import FormValidator from '../src/services/FormValidator';

// Mock fetch globally
global.fetch = jest.fn();

// Helper function to wrap component with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UserManagement Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock initial fetch for users list to return empty array for most tests
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: [] })
    });
  });

  // TC-001, TC-006, TC-009, TC-010, TC-011, TC-012, TC-014, TC-018
  describe('Form Interaction and Submission', () => {
    // TC-001: Successfully add a new user with valid data
    test('TC-001: Successfully adds a new user with valid data', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        date_of_birth: '1990-05-15',
        address: '123 Main Street, New York, NY 10001',
        created_at: new Date().toISOString()
      };

      // Mock submission response
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: mockUser.id, data: mockUser, message: 'User added successfully!' })
      });
      // Mock fetch for users list after submission
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser] })
      });

      renderWithRouter(<UserManagement />);

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: mockUser.name } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: mockUser.date_of_birth } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: mockUser.address } });

      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledTimes(2); // Initial fetch + post + refresh fetch
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users', expect.any(Object));
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText('May 15, 1990')).toBeInTheDocument();
      expect(screen.getByText(mockUser.address)).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Name/i)).toHaveValue('');
      expect(screen.getByLabelText(/Date of Birth/i)).toHaveValue('');
      expect(screen.getByLabelText(/Address/i)).toHaveValue('');
    });

    // TC-003: Submit form with minimum valid data requirements
    test('TC-003: Submits form with minimum valid data requirements', async () => {
      const today = new Date();
      const eighteenYearsAgo = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      const dobString = eighteenYearsAgo.toISOString().split('T')[0];

      const mockUser = {
        id: 'some-uuid',
        name: 'Jo',
        date_of_birth: dobString,
        address: '1234567890',
        created_at: new Date().toISOString()
      };

      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: mockUser.id, data: mockUser, message: 'User added successfully!' })
      });
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser] })
      });

      renderWithRouter(<UserManagement />);

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: mockUser.name } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: mockUser.date_of_birth } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: mockUser.address } });

      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
      });
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser.address)).toBeInTheDocument();
    });

    // TC-006: Form validation provides immediate feedback
    test('TC-006: Form validation provides immediate feedback for invalid inputs', async () => {
      renderWithRouter(<UserManagement />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const dobInput = screen.getByLabelText(/Date of Birth/i);
      const addressInput = screen.getByLabelText(/Address/i);

      // Invalid Name (1 character)
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput); // Trigger validation on blur
      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      });

      // Future Date of Birth
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];
      fireEvent.change(dobInput, { target: { value: futureDate } });
      fireEvent.blur(dobInput);
      await waitFor(() => {
        expect(screen.getByText(/Date of birth must be in the past/i)).toBeInTheDocument();
      });

      // Short Address (5 characters)
      fireEvent.change(addressInput, { target: { value: '12345' } });
      fireEvent.blur(addressInput);
      await waitFor(() => {
        expect(screen.getByText(/Please enter a complete address \(minimum 10 characters\)/i)).toBeInTheDocument();
      });

      // Correct all fields and verify errors clear
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });
      fireEvent.blur(nameInput);
      expect(screen.queryByText(/Name must be at least 2 characters/i)).not.toBeInTheDocument();

      const validDob = '1992-08-15';
      fireEvent.change(dobInput, { target: { value: validDob } });
      fireEvent.blur(dobInput);
      expect(screen.queryByText(/Date of birth must be in the past/i)).not.toBeInTheDocument();

      const validAddress = '789 Elm St, City, State 12345';
      fireEvent.change(addressInput, { target: { value: validAddress } });
      fireEvent.blur(addressInput);
      expect(screen.queryByText(/Please enter a complete address \(minimum 10 characters\)/i)).not.toBeInTheDocument();

      // Submit button should be enabled (implicitly tested by successful submission in other tests)
    });

    // TC-009: Attempt to submit form with empty fields
    test('TC-009: Displays validation errors for empty fields on submit', async () => {
      renderWithRouter(<UserManagement />);

      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Date of birth is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Address is required/i)).toBeInTheDocument();
      });
      expect(fetch).toHaveBeenCalledTimes(1); // Only initial fetch
      expect(fetch).not.toHaveBeenCalledWith('http://localhost:5000/api/users', expect.objectContaining({ method: 'POST' }));
    });

    // TC-010: Submit form with name containing invalid characters
    test('TC-010: Rejects name with invalid characters', async () => {
      renderWithRouter(<UserManagement />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const dobInput = screen.getByLabelText(/Date of Birth/i);
      const addressInput = screen.getByLabelText(/Address/i);
      const submitButton = screen.getByRole('button', { name: /Add User/i });

      fireEvent.change(nameInput, { target: { value: 'John123' } });
      fireEvent.change(dobInput, { target: { value: '1990-05-15' } });
      fireEvent.change(addressInput, { target: { value: '123 Main St' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name can only contain letters, spaces, hyphens, and apostrophes/i)).toBeInTheDocument();
      });
      expect(fetch).toHaveBeenCalledTimes(1); // Only initial fetch

      // Test valid special characters
      fireEvent.change(nameInput, { target: { value: "Mary-Jane O'Brien" } });
      fireEvent.click(submitButton);
      // Mock successful submission for this valid case
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: 'valid-id', data: { name: "Mary-Jane O'Brien", date_of_birth: '1990-05-15', address: '123 Main St' }, message: 'User added successfully!' })
      });
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [{ name: "Mary-Jane O'Brien", date_of_birth: '1990-05-15', address: '123 Main St' }] })
      });
      await waitFor(() => {
        expect(screen.queryByText(/Name can only contain letters, spaces, hyphens, and apostrophes/i)).not.toBeInTheDocument();
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
      });
    });

    // TC-011: Attempt to register user under 18 years old
    test('TC-011: Rejects user under 18 years old', async () => {
      renderWithRouter(<UserManagement />);

      const today = new Date();
      const seventeenYearsAgo = new Date(
        today.getFullYear() - 17,
        today.getMonth(),
        today.getDate()
      );
      const dobString = seventeenYearsAgo.toISOString().split('T')[0];

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Teen User' } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: dobString } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Youth Street' } });

      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText(/You must be at least 18 years old/i)).toBeInTheDocument();
      });
      expect(fetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });

    // TC-012: Submit form with incomplete address (less than 10 characters)
    test('TC-012: Rejects address less than 10 characters', async () => {
      renderWithRouter(<UserManagement />);

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Valid Name' } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-01-01' } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: 'Main St 1' } }); // 9 chars

      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText(/Please enter a complete address \(minimum 10 characters\)/i)).toBeInTheDocument();
      });
      expect(fetch).toHaveBeenCalledTimes(1); // Only initial fetch

      // Test with exactly 10 characters (should pass validation)
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '1234567890' } });
      // Mock successful submission for this valid case
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: 'valid-id-2', data: { name: 'Valid Name', date_of_birth: '1990-01-01', address: '1234567890' }, message: 'User added successfully!' })
      });
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [{ name: 'Valid Name', date_of_birth: '1990-01-01', address: '1234567890' }] })
      });
      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
      await waitFor(() => {
        expect(screen.queryByText(/Please enter a complete address \(minimum 10 characters\)/i)).not.toBeInTheDocument();
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
      });
    });

    // TC-014: Attempt to submit form while a submission is in progress
    test('TC-014: Disables submit button during submission', async () => {
      jest.useFakeTimers();
      renderWithRouter(<UserManagement />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const dobInput = screen.getByLabelText(/Date of Birth/i);
      const addressInput = screen.getByLabelText(/Address/i);
      const submitButton = screen.getByRole('button', { name: /Add User/i });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(dobInput, { target: { value: '1990-05-15' } });
      fireEvent.change(addressInput, { target: { value: '123 Duplicate Test Street' } });

      // Mock a slow fetch response
      fetch.mockResolvedValueOnce(new Promise(resolve =>
        setTimeout(() => resolve({ json: async () => ({ success: true, userId: 'slow-id', data: {}, message: 'User added successfully!' }) }), 500)
      ));
      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) }); // For refresh

      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Adding User...');

      // Attempt to click again while submitting
      fireEvent.click(submitButton);
      expect(fetch).toHaveBeenCalledTimes(2); // Initial fetch + one POST request

      act(() => {
        jest.runAllTimers(); // Resolve the slow fetch
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent('Add User');
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
      });
      jest.useRealTimers();
    });

    // TC-018: Form reset after successful submission
    test('TC-018: Clears form fields and messages after successful submission', async () => {
      const mockUser1 = {
        id: 'id-1', name: 'User One', date_of_birth: '1990-01-01', address: '123 First St', created_at: new Date().toISOString()
      };
      const mockUser2 = {
        id: 'id-2', name: 'User Two', date_of_birth: '1995-02-02', address: '456 Second Ave', created_at: new Date().toISOString()
      };

      renderWithRouter(<UserManagement />);

      // First submission
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: mockUser1.id, data: mockUser1, message: 'User added successfully!' })
      });
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser1] })
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: mockUser1.name } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: mockUser1.date_of_birth } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: mockUser1.address } });
      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/Full Name/i)).toHaveValue('');
      expect(screen.getByLabelText(/Date of Birth/i)).toHaveValue('');
      expect(screen.getByLabelText(/Address/i)).toHaveValue('');
      expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument(); // No validation errors persist

      // Second submission
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: mockUser2.id, data: mockUser2, message: 'User added successfully!' })
      });
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser2, mockUser1] }) // Newest first
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: mockUser2.name } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: mockUser2.date_of_birth } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: mockUser2.address } });
      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
        expect(screen.getByText(mockUser1.name)).toBeInTheDocument();
        expect(screen.getByText(mockUser2.name)).toBeInTheDocument();
      });
    });

    // TC-019: Verify future date is rejected for Date of Birth
    test('TC-019: Rejects future dates for Date of Birth', async () => {
      renderWithRouter(<UserManagement />);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Future User' } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: futureDate } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Future St' } });

      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText(/Date of birth must be in the past/i)).toBeInTheDocument();
      });
      expect(fetch).toHaveBeenCalledTimes(1); // Only initial fetch

      // Try today's date (should also be rejected as 'in the past' implies strictly before today)
      const today = new Date().toISOString().split('T')[0];
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: today } });
      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
      await waitFor(() => {
        expect(screen.getByText(/Date of birth must be in the past/i)).toBeInTheDocument();
      });

      // Try yesterday's date (should pass validation for 'in the past', but might fail 18+ if too recent)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: yesterdayString } });
      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
      // This will still fail 18+ check, but the 'in the past' error should be gone
      await waitFor(() => {
        expect(screen.queryByText(/Date of birth must be in the past/i)).not.toBeInTheDocument();
        expect(screen.getByText(/You must be at least 18 years old/i)).toBeInTheDocument();
      });
    });
  });

  // TC-002, TC-007
  describe('Navigation and E2E Flow', () => {
    // TC-002: Complete user management workflow from navigation to data persistence
    test('TC-002: User persists after navigation and refresh', async () => {
      const mockUser = {
        id: 'e2e-uuid', name: 'Alice Smith', date_of_birth: '1985-12-20', address: '456 Oak Avenue, Los Angeles, CA 90001', created_at: new Date().toISOString()
      };

      // Initial fetch (empty)
      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) });
      renderWithRouter(<UserManagement />);

      // Submit user
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: mockUser.id, data: mockUser, message: 'User added successfully!' })
      });
      // Refresh after submit
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser] })
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: mockUser.name } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: mockUser.date_of_birth } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: mockUser.address } });
      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      });

      // Simulate refresh (re-render component, which will trigger fetchUsers)
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser] })
      });
      act(() => {
        renderWithRouter(<UserManagement />);
      });

      await waitFor(() => {
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      });

      // Simulate navigating away and back (re-render component)
      // In a real E2E test, this would involve clicking navigation links.
      // Here, we simulate the component remounting and fetching data again.
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser] })
      });
      act(() => {
        renderWithRouter(<UserManagement />);
      });

      await waitFor(() => {
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      });
    });

    // TC-007: Navigation links work from all pages
    test('TC-007: Navigation links route correctly', async () => {
      renderWithRouter(<UserManagement />);

      // Check 'Home' link
      const homeLink = screen.getByRole('link', { name: /Home/i });
      expect(homeLink).toHaveAttribute('href', '/');

      // Check 'Apply' link
      const applyLink = screen.getByRole('link', { name: /Apply/i });
      expect(applyLink).toHaveAttribute('href', '/form');

      // Check 'KYC' link
      const kycLink = screen.getByRole('link', { name: /KYC/i });
      expect(kycLink).toHaveAttribute('href', '/kyc');

      // Check 'Users' link (should be active)
      const usersLink = screen.getByRole('link', { name: /Users/i });
      expect(usersLink).toHaveAttribute('href', '/users');
      // Further checks for active state would require inspecting styles, which is harder in Jest/RTL
    });
  });

  // TC-004, TC-005, TC-008, TC-015, TC-017
  describe('User List Display and Edge Cases', () => {
    // TC-004: Verify date formatting and timezone handling
    test('TC-004: Displays dates in consistent format', async () => {
      const usersWithVariousDOB = [
        { id: 'id1', name: 'User 1', date_of_birth: '1955-03-10', address: 'Addr 1', created_at: '2023-01-01T10:00:00.000Z' },
        { id: 'id2', name: 'User 2', date_of_birth: '1988-11-22', address: 'Addr 2', created_at: '2023-01-01T11:00:00.000Z' },
        { id: 'id3', name: 'User 3', date_of_birth: '2005-06-30', address: 'Addr 3', created_at: '2023-01-01T12:00:00.000Z' },
      ];

      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: usersWithVariousDOB }) });

      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('March 10, 1955')).toBeInTheDocument();
        expect(screen.getByText('November 22, 1988')).toBeInTheDocument();
        expect(screen.getByText('June 30, 2005')).toBeInTheDocument();
        // Check created_at format (will vary based on locale, but should be present)
        expect(screen.getByText(/January 1, 2023 at \d{1,2}:\d{2}:\d{2} (AM|PM)/i)).toBeInTheDocument();
      });
    });

    // TC-005: Handle empty user list on initial load
    test('TC-005: Displays empty state message when no users exist', async () => {
      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) });

      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found. Add your first user above!')).toBeInTheDocument();
      });
      expect(screen.queryByRole('table')).toBeInTheDocument(); // Table structure should still be present

      // Add a user and verify table populates
      const mockUser = {
        id: 'first-user-id', name: 'First User', date_of_birth: '1990-01-01', address: '123 First St', created_at: new Date().toISOString()
      };
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: mockUser.id, data: mockUser, message: 'User added successfully!' })
      });
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser] })
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: mockUser.name } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: mockUser.date_of_birth } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: mockUser.address } });
      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.queryByText('No users found. Add your first user above!')).not.toBeInTheDocument();
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      });
    });

    // TC-008: Users table displays data correctly with multiple entries
    test('TC-008: Displays multiple users with correct formatting and sorting', async () => {
      const user1 = { id: 'u1', name: 'Jo Bo', date_of_birth: '1990-01-01', address: '12 Main St', created_at: '2023-01-01T10:00:00.000Z' };
      const user2 = { id: 'u2', name: 'Christopher Alexander Montgomery', date_of_birth: '1985-03-15', address: '789 Westminster Boulevard, Apartment 15B, San Francisco, CA 94102', created_at: '2023-01-02T10:00:00.000Z' };
      const user3 = { id: 'u3', name: "Mary-Jane O'Brien", date_of_birth: '1992-11-30', address: '456 Oak Avenue, Boston, MA', created_at: '2023-01-03T10:00:00.000Z' };

      // Users should be displayed newest first
      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: [user3, user2, user1] }) });

      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // Header row + 3 user rows
        expect(rows).toHaveLength(4);

        // Check order (newest first)
        expect(rows[1]).toHaveTextContent(user3.name);
        expect(rows[2]).toHaveTextContent(user2.name);
        expect(rows[3]).toHaveTextContent(user1.name);

        // Check content for long name/address and special characters
        expect(screen.getByText(user2.name)).toBeInTheDocument();
        expect(screen.getByText(user2.address)).toBeInTheDocument();
        expect(screen.getByText(user3.name)).toBeInTheDocument();
        expect(screen.getByText(user3.address)).toBeInTheDocument();

        // Check date formatting
        expect(screen.getByText('January 1, 1990')).toBeInTheDocument();
        expect(screen.getByText('March 15, 1985')).toBeInTheDocument();
        expect(screen.getByText('November 30, 1992')).toBeInTheDocument();
      });
    });

    // TC-015: Long address text handling and display
    test('TC-015: Handles and displays long address text', async () => {
      const longAddress = "This is a very long address with full details including apartment number, building name, street, landmark, city, state, country, postal code, and additional location details to test how the table handles extensive text wrapping or truncation.";
      const mockUser = {
        id: 'long-addr-id', name: 'Long Address User', date_of_birth: '1990-01-01', address: longAddress, created_at: new Date().toISOString()
      };

      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: [mockUser] }) });

      renderWithRouter(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText(longAddress)).toBeInTheDocument();
        // Further checks for truncation/wrapping would require inspecting computed styles, which is complex.
        // For now, verifying presence is sufficient.
      });
    });

    // TC-017: Page loading state displays correctly
    test('TC-017: Displays loading state when fetching users', async () => {
      // Mock fetch to be pending for a moment
      fetch.mockResolvedValueOnce(new Promise(resolve => setTimeout(() => resolve({
        json: async () => ({ success: true, data: [] })
      }), 100)));

      renderWithRouter(<UserManagement />);

      expect(screen.getByText('Loading users...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  // TC-013, TC-016, TC-020
  describe('Error Handling and Brand Compliance', () => {
    // TC-013: Verify server error handling when database is unavailable
    test('TC-013: Displays error message on server/network failure', async () => {
      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) }); // Initial fetch
      renderWithRouter(<UserManagement />);

      // Mock fetch to throw an error for submission
      fetch.mockRejectedValueOnce(new Error('Network error'));

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-01-01' } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Test Street' } });

      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText(/An error occurred while submitting. Please try again./i)).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Test User'); // Form data preserved
    });

    // TC-016: Brand compliance verification for Oktawave guidelines
    test('TC-016: Applies correct brand styling (visual inspection proxy)', async () => {
      // This test can only do a proxy for visual inspection. Real visual testing requires tools like Storybook/Chromatic or Percy.
      // We can check for presence of specific classes or inline styles if they are explicitly defined.
      // For now, we'll check for the presence of the navigation bar which has some inline styles.

      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) });
      renderWithRouter(<UserManagement />);

      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
      // Check for specific inline styles that represent brand colors/fonts
      // This is a weak check, but better than nothing without a visual regression tool.
      expect(navbar).toHaveStyle('background: linear-gradient(to right, #0a0a0f, #12121a)');
      expect(screen.getByText('CardOnboard')).toHaveStyle('color: #2DB5DA'); // Primary color for logo
      expect(screen.getByRole('link', { name: 'Users' })).toHaveStyle('color: #2DB5DA'); // Active link color

      // Check for font family (can be tricky with fallbacks, but we can check for primary)
      // This would typically be on a global stylesheet, so checking a specific element might not be accurate.
      // For this example, we'll assume the body or a top-level container would have it.
      // expect(document.body).toHaveStyle('font-family: "Proxima Nova", "Montserrat", sans-serif');
    });

    // TC-020: Verify database persistence and audit trail
    test('TC-020: Verifies database persistence and audit trail (via API response)', async () => {
      const mockUser = {
        id: 'db-test-uuid', name: 'Database Test User', date_of_birth: '1990-12-31', address: '999 Persistence Lane, DB City, State 00000', created_at: new Date().toISOString()
      };

      fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) }); // Initial fetch
      renderWithRouter(<UserManagement />);

      // Mock submission response with audit fields
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, userId: mockUser.id, data: mockUser, message: 'User added successfully!' })
      });
      // Mock refresh fetch
      fetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: [mockUser] })
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: mockUser.name } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: mockUser.date_of_birth } });
      fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: mockUser.address } });
      fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

      await waitFor(() => {
        expect(screen.getByText('User added successfully!')).toBeInTheDocument();
      });

      // Verify the API call payload includes the correct data
      const postCall = fetch.mock.calls.find(call => call[0] === 'http://localhost:5000/api/users' && call[1].method === 'POST');
      expect(postCall).toBeDefined();
      const requestBody = JSON.parse(postCall[1].body);
      expect(requestBody).toEqual({
        name: mockUser.name,
        dateOfBirth: mockUser.date_of_birth,
        address: mockUser.address
      });

      // Verify the displayed data includes the created_at timestamp (formatted)
      const createdAtDate = new Date(mockUser.created_at);
      const formattedCreatedAt = createdAtDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
      expect(screen.getByText(formattedCreatedAt.replace(/ at/, ''))).toBeInTheDocument(); // Remove 'at' for partial match
    });
  });
});
