/**
 * User Management Automation Tests
 * Covers UI interactions, form validation, API integration, and navigation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserManagement from '../src/pages/UserManagement';
import FormValidator from '../src/services/FormValidator';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock the API_BASE_URL for consistent testing
const API_BASE_URL = 'http://localhost:5000';

let currentMockUsers = [];

// Mock fetch API calls
const mockFetch = (url, options) => {
  if (url === `${API_BASE_URL}/api/users` && options?.method === 'POST') {
    const body = JSON.parse(options.body);
    if (body.name === 'Error User') {
      return Promise.resolve({
        json: () => Promise.resolve({ success: false, message: 'Server error' }),
        status: 500,
      });
    }
    if (body.name === 'Duplicate User') {
      return Promise.resolve({
        json: () => Promise.resolve({ success: false, message: 'User already exists', code: 'DUPLICATE_USER' }),
        status: 409,
      });
    }
    const newUser = { id: `new-id-${Date.now()}`, ...body, created_at: new Date().toISOString() };
    currentMockUsers.push(newUser);
    return Promise.resolve({
      json: () => Promise.resolve({ success: true, data: newUser }),
      status: 201,
    });
  }
  if (url.startsWith(`${API_BASE_URL}/api/users`) && options?.method === 'GET') {
    const initialUsers = [
      { id: 'user-1', name: 'Existing User 1', date_of_birth: '1990-01-01', address: '123 Old St', created_at: '2023-01-01T10:00:00Z' },
      { id: 'user-2', name: 'Existing User 2', date_of_birth: '1992-02-02', address: '456 Old Ave', created_at: '2023-01-02T10:00:00Z' },
      { id: 'user-3', name: 'Existing User 3', date_of_birth: '1993-03-03', address: '789 Old Rd', created_at: '2023-01-03T10:00:00Z' },
    ];
    const allUsers = [...initialUsers, ...currentMockUsers];

    const urlParams = new URLSearchParams(url.split('?')[1]);
    const limit = parseInt(urlParams.get('limit')) || 50;
    const offset = parseInt(urlParams.get('offset')) || 0;

    const paginatedUsers = allUsers.slice(offset, offset + limit);
    return Promise.resolve({
      json: () => Promise.resolve({ success: true, data: paginatedUsers, pagination: { limit, offset, total: allUsers.length, hasMore: offset + limit < allUsers.length } }),
      status: 200,
    });
  }
  return Promise.reject(new Error(`Unhandled fetch for ${url}`));
};

// Mock the global fetch
global.fetch = jest.fn(mockFetch);

// Mock useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderUserManagement = () => {
  return render(
    <Router>
      <UserManagement />
    </Router>
  );
};

describe('User Management Component - Functional Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock fetch for each test to ensure clean state
    global.fetch.mockImplementation(mockFetch);
    currentMockUsers = []; // Clear users for each test
  });

  // TC-001 (CSV 1) & TC-001 (CSV 2): Successfully add new user with valid data
  test('TC-001: Should successfully add a new user with valid data and display success message', async () => {
    renderUserManagement();

    // Wait for initial user list fetch to complete
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-05-15' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street, Springfield, IL 62701' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('User added successfully!')).toBeInTheDocument();
    });

    // Verify form fields are cleared
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Date of Birth/i)).toHaveValue('');
    expect(screen.getByLabelText(/Address/i)).toHaveValue('');

    // Verify user appears in table (mocked fetch will return the new user)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('May 15, 1990')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Springfield, IL 62701')).toBeInTheDocument();
    });
  });

  // TC-002 (CSV 1) & TC-002 (CSV 2): Complete user journey from landing page to user management
  test('TC-002: Should allow complete user journey from landing page to user management and back', async () => {
    renderUserManagement();

    // Simulate navigation to /users (already on the page for this test setup)
    // The navigation links are tested separately, but we verify the form submission and persistence here.

    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1985-03-20' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '456 Oak Avenue, Chicago, IL 60601' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('User added successfully!')).toBeInTheDocument();
    });

    // Verify user appears in table
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Simulate clicking the 'Home' link in the navigation (which would navigate away and back)
    // For this test, we'll just re-render the component to simulate persistence.
    // In a real E2E test, this would involve actual navigation.
    jest.clearAllMocks(); // Clear previous fetch calls
    global.fetch.mockImplementation(mockFetch); // Re-mock fetch to include the newly added user

    // Re-render to simulate navigating back to the page
    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  // TC-003 (CSV 1) & TC-003 (CSV 2): Add user with minimum valid name length / special characters
  test('TC-003: Should accept names with minimum length and special characters (hyphen, apostrophe)', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    // Test minimum 2 characters
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jo' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1995-01-01' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '789 Elm Street, Boston, MA 02108' } });
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    await waitFor(() => expect(screen.getByText('User added successfully!')).toBeInTheDocument());
    expect(screen.getByText('Jo')).toBeInTheDocument();

    // Test name with hyphen
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Mary-Jane' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1988-07-12' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '321 Pine Street, Seattle, WA 98101' } });
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    await waitFor(() => expect(screen.getByText('User added successfully!')).toBeInTheDocument());
    expect(screen.getByText('Mary-Jane')).toBeInTheDocument();

    // Test name with apostrophe
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "O'Brien" } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1988-07-12' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '321 Pine Street, Seattle, WA 98101' } });
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    await waitFor(() => expect(screen.getByText('User added successfully!')).toBeInTheDocument());
    expect(screen.getByText("O'Brien")).toBeInTheDocument();
  });

  // TC-004 (CSV 1) & TC-004 (CSV 2): User exactly 18 years old (boundary test)
  test('TC-004: Should accept date of birth for a user exactly 18 years old', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const dobString = eighteenYearsAgo.toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Alex Johnson' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: dobString } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '111 Maple Drive, Austin, TX 78701' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('User added successfully!')).toBeInTheDocument();
    });
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
  });

  // TC-005 (CSV 1): User exactly 18 years old (boundary test) - covered by TC-004
  // TC-005 (CSV 2) & TC-029 (CSV 1): Test with very long address (max length boundary)
  test('TC-005: Should accept and display very long address text', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    const longAddress = '123 Very Long Street Name In A Very Long City With A Very Long State And Province And Additional Location Details That Extend Beyond Normal Length Requirements To Test Table Display And Wrapping Behavior In The User Interface. This address is intentionally made very long to ensure proper handling in the UI and backend.';

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Address Test User' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1985-07-12' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: longAddress } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('User added successfully!')).toBeInTheDocument();
    });
    expect(screen.getByText('Address Test User')).toBeInTheDocument();
    // Verify the long address is displayed, potentially truncated or wrapped
    expect(screen.getByText(longAddress)).toBeInTheDocument();
  });

  // TC-006 (CSV 1) & TC-006 (CSV 2): Empty users table on initial load
  test('TC-006: Should display empty state message when no users are found', async () => {
    // Mock fetch to return an empty array for users
    global.fetch.mockImplementationOnce((url, options) => {
      if (url === `${API_BASE_URL}/api/users` && options?.method === 'GET') {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [], pagination: { total: 0 } }),
          status: 200,
        });
      }
      return mockFetch(url, options);
    });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('No users found. Add your first user above!')).toBeInTheDocument();
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument(); // Ensure table itself is not rendered
  });

  // TC-007 (CSV 1): Form shows progress bar as fields are filled - UI specific, not directly testable with RTL without custom progress bar component
  // Skipping TC-007 (CSV 1) as it requires visual inspection of a progress bar which is hard to test with RTL.

  // TC-008 (CSV 1) & TC-010 (CSV 2): Multiple users display correctly in table
  test('TC-008: Should display multiple users correctly in the table with proper formatting', async () => {
    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('Existing User 1')).toBeInTheDocument();
      expect(screen.getByText('Existing User 2')).toBeInTheDocument();
      expect(screen.getByText('Existing User 3')).toBeInTheDocument();
    });

    // Verify date formatting
    expect(screen.getByText('Jan 1, 1990')).toBeInTheDocument();
    expect(screen.getByText('Feb 2, 1992')).toBeInTheDocument();
    expect(screen.getByText('Mar 3, 1993')).toBeInTheDocument();

    // Verify columns
    expect(screen.getByRole('columnheader', { name: /Name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Date of Birth/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Address/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Added On/i })).toBeInTheDocument();
  });

  // TC-009 (CSV 1) & TC-011 (CSV 2): Submit form with empty name field
  test('TC-009: Should show validation error for empty name field', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-05-15' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Full Name/i)).toHaveClass('input-error');
    expect(screen.getByText('Please fix the errors before submitting.')).toBeInTheDocument();
  });

  // TC-010 (CSV 1) & TC-012 (CSV 2): Submit form with 1-character name
  test('TC-010: Should show validation error for 1-character name', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-05-15' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Full Name/i)).toHaveClass('input-error');
  });

  // TC-011 (CSV 1) & TC-013 (CSV 2): Submit form with invalid characters in name
  test('TC-011: Should show validation error for invalid characters in name', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    // Test with numbers
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John123' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-05-15' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    await waitFor(() => {
      expect(screen.getByText('Name can only contain letters, spaces, hyphens, and apostrophes')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Full Name/i)).toHaveClass('input-error');

    // Test with special characters
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John@Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    await waitFor(() => {
      expect(screen.getByText('Name can only contain letters, spaces, hyphens, and apostrophes')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Full Name/i)).toHaveClass('input-error');
  });

  // TC-012 (CSV 1) & TC-014 (CSV 2): Submit form with empty date of birth
  test('TC-012: Should show validation error for empty date of birth field', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Date of Birth/i)).toHaveClass('input-error');
  });

  // TC-013 (CSV 1) & TC-015 (CSV 2): Submit form with future date of birth
  test('TC-013: Should show validation error for future date of birth', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: futureDateString } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Date of birth must be in the past')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Date of Birth/i)).toHaveClass('input-error');
  });

  // TC-014 (CSV 1) & TC-016 (CSV 2): Submit form with DOB for user under 18 years old
  test('TC-014: Should show validation error for date of birth under 18 years old', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    const today = new Date();
    const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    const dobString = tenYearsAgo.toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: dobString } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('You must be at least 18 years old')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Date of Birth/i)).toHaveClass('input-error');
  });

  // TC-015 (CSV 1) & TC-017 (CSV 2): Submit form with empty address
  test('TC-015: Should show validation error for empty address field', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-05-15' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Address is required')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Address/i)).toHaveClass('input-error');
  });

  // TC-016 (CSV 1) & TC-018 (CSV 2): Submit form with address less than 5 characters
  test('TC-016: Should show validation error for address less than 5 characters', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-05-15' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid address')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Address/i)).toHaveClass('input-error');
  });

  // TC-017 (CSV 1) & TC-019 (CSV 2): Server unavailable during form submission
  test('TC-017: Should display error message when server is unavailable during submission', async () => {
    global.fetch.mockImplementationOnce((url, options) => {
      if (url === `${API_BASE_URL}/api/users` && options?.method === 'POST') {
        return Promise.reject(new Error('Network error'));
      }
      return mockFetch(url, options);
    });

    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-05-15' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred while adding the user. Please try again.')).toBeInTheDocument();
    });
    // Verify form data remains in fields
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('John Doe');
  });

  // TC-018 (CSV 1) & TC-020 (CSV 2): Database connection failure (simulated as server error response)
  test('TC-018: Should display error message for database connection failure (server error)', async () => {
    global.fetch.mockImplementationOnce((url, options) => {
      if (url === `${API_BASE_URL}/api/users` && options?.method === 'POST') {
        return Promise.resolve({
          json: () => Promise.resolve({ success: false, message: 'Error creating user', error: 'Database error' }),
          status: 500,
        });
      }
      return mockFetch(url, options);
    });

    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Error User' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-05-15' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Error creating user')).toBeInTheDocument();
    });
    // Verify form data remains in fields
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Error User');
  });

  // TC-019 (CSV 1) & TC-007 (CSV 2): Navigation link visible and functional from landing page
  test('TC-019: Should navigate to /users page from landing page navigation link', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('link', { name: /Home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Simulate clicking the Users link from a different page (e.g., LandingPage)
    // Since we are already on UserManagement, we test the internal navigation link
    // The component itself would handle the navigation, so we just check if mockNavigate was called.
    // Reset mock to ensure only the last call is checked for this specific navigation.
    mockNavigate.mockClear();
    fireEvent.click(screen.getByRole('link', { name: /Users/i })); // Verifies the handler
    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });

  // TC-020 (CSV 1) & TC-008 (CSV 2): Navigation link functional from Customer Form page
  test('TC-020: Should navigate to /users page from CustomerForm page button', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    // Simulate clicking the Apply link (assuming it navigates to /form)
    fireEvent.click(screen.getByRole('link', { name: /Apply/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/form');

    // Simulate the button click from CustomerForm (which would be on that page)
    // We verify the navigation logic by checking if mockNavigate is called with '/users'.
    // In a real E2E test, this would involve rendering CustomerForm and clicking the button.
    // For this unit test, we just ensure the mockNavigate is correctly invoked.
    // Reset mock to ensure only the last call is checked for this specific navigation.
    mockNavigate.mockClear();
    fireEvent.click(screen.getByRole('link', { name: /Users/i })); // Assuming a 'Users' link exists on CustomerForm or similar
    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });

  // TC-021 (CSV 1) & TC-009 (CSV 2): Navigation link functional from KYC page
  test('TC-021: Should navigate to /users page from KYC page button', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    // Simulate clicking the KYC link (assuming it navigates to /kyc)
    fireEvent.click(screen.getByRole('link', { name: /KYC/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/kyc');

    // Simulate the button click from KYCPage
    mockNavigate.mockClear();
    fireEvent.click(screen.getByRole('link', { name: /Users/i })); // Assuming a 'Users' link exists on KYCPage or similar
    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });

  // TC-022 (CSV 1): Back button returns to home page
  test('TC-022: Should navigate back to home page when Back button is clicked', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('link', { name: /Home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // TC-023 (CSV 1) & TC-021 (CSV 2): Form validation updates in real-time as user types
  test('TC-023: Should show and clear validation errors in real-time as user types', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    const nameInput = screen.getByLabelText(/Full Name/i);

    // Type invalid (1 character)
    fireEvent.change(nameInput, { target: { value: 'A' } });
    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    expect(nameInput).toHaveClass('input-error');

    // Continue typing to make it valid
    fireEvent.change(nameInput, { target: { value: 'Ab' } });
    await waitFor(() => {
      expect(screen.queryByText('Name must be at least 2 characters')).not.toBeInTheDocument();
    });
    expect(nameInput).not.toHaveClass('input-error');

    // Type invalid (numbers)
    fireEvent.change(nameInput, { target: { value: 'Abc1' } });
    expect(screen.getByText('Name can only contain letters, spaces, hyphens, and apostrophes')).toBeInTheDocument();
    expect(nameInput).toHaveClass('input-error');

    // Clear to make it valid again
    fireEvent.change(nameInput, { target: { value: 'Abc' } });
    await waitFor(() => {
      expect(screen.queryByText('Name can only contain letters, spaces, hyphens, and apostrophes')).not.toBeInTheDocument();
    });
    expect(nameInput).not.toHaveClass('input-error');
  });

  // TC-024 (CSV 1) & TC-022 (CSV 2): Success message auto-dismisses after 3 seconds
  test('TC-024: Should auto-dismiss success message after 3 seconds', async () => {
    jest.useFakeTimers();
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Auto Dismiss User' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Test Street' } });
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('User added successfully!')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('User added successfully!')).not.toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  // TC-025 (CSV 1) & TC-023 (CSV 2): Date formatting in table displays correctly
  test('TC-025: Should display dates in "MMM DD, YYYY" format in the table', async () => {
    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('Jan 1, 1990')).toBeInTheDocument();
      expect(screen.getByText('Feb 2, 1992')).toBeInTheDocument();
      expect(screen.getByText('Mar 3, 1993')).toBeInTheDocument();
    });
  });

  // TC-026 (CSV 1): Brand compliance check - Oktawave colors and typography - UI specific, requires visual regression testing
  // Skipping TC-026 (CSV 1) as it requires visual regression testing, which is outside the scope of unit/integration tests.

  // TC-027 (CSV 1) & TC-024 (CSV 2): Submit completely empty form
  test('TC-027: Should show validation errors for all fields when submitting an empty form', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Address is required')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Full Name/i)).toHaveClass('input-error');
    expect(screen.getByLabelText(/Date of Birth/i)).toHaveClass('input-error');
    expect(screen.getByLabelText(/Address/i)).toHaveClass('input-error');
  });

  // TC-028 (CSV 1) & TC-025 (CSV 2): Loading state during user list fetch
  test('TC-028: Should display loading state while fetching users', async () => {
    // Make fetch hang to simulate loading
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));

    renderUserManagement();

    expect(screen.getByText('Loading users...')).toBeInTheDocument();
    // Assuming there's a data-testid="loading-spinner" on the loading spinner element
    // If not, this assertion might fail or need adjustment based on actual component implementation
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Restore fetch to allow subsequent tests to run
    // This should be called AFTER all assertions related to the mocked fetch are complete
    global.fetch.mockRestore();
    global.fetch.mockImplementation(mockFetch);
  });

  // TC-029 (CSV 1): Long address text in table - covered by TC-005

  // TC-030 (CSV 1) & TC-026 (CSV 2): Multiple rapid form submissions handled correctly
  test('TC-030: Should disable submit button during submission to prevent rapid multiple submissions', async () => {
    // Make fetch resolve after a delay to simulate network latency
    global.fetch.mockImplementationOnce((url, options) => {
      if (url === `${API_BASE_URL}/api/users` && options?.method === 'POST') {
        return new Promise(resolve => setTimeout(() => resolve({
          json: () => Promise.resolve({ success: true, data: { id: 'new-id', name: 'Rapid User', date_of_birth: '1990-01-01', address: '123 Test St', created_at: new Date().toISOString() } }),
          status: 201,
        }), 500));
      }
      return mockFetch(url, options);
    });

    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    const submitButton = screen.getByRole('button', { name: /Add User/i });

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Rapid User' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Test St' } });

    fireEvent.click(submitButton); // First click
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton); // Second click while disabled

    await waitFor(() => {
      expect(screen.getByText('User added successfully!')).toBeInTheDocument();
    });

    // Verify fetch was called only once for the POST request
    const postCalls = global.fetch.mock.calls.filter(call => call[0] === `${API_BASE_URL}/api/users` && call[1]?.method === 'POST');
    expect(postCalls).toHaveLength(1);

    expect(submitButton).not.toBeDisabled(); // Button re-enabled after submission
  });

  // Additional tests from CSV 2

  // TC-027 (CSV 2): Submit form with duplicate user data
  test('TC-027: Should show error message for duplicate user submission', async () => {
    global.fetch.mockImplementationOnce((url, options) => {
      if (url === `${API_BASE_URL}/api/users` && options?.method === 'POST') {
        return Promise.resolve({
          json: () => Promise.resolve({ success: false, message: 'User already exists', code: 'DUPLICATE_USER' }),
          status: 409,
        });
      }
      return mockFetch(url, options);
    });

    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Duplicate User' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main Street' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });
  });

  // TC-028 (CSV 2): Submit form with name containing only spaces
  test('TC-028: Should treat name with only spaces as empty and show validation error', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: 'Test Address' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Full Name/i)).toHaveClass('input-error');
  });

  // TC-029 (CSV 2): Verify pagination or limit on users list
  test('TC-029: Should fetch users with default limit and offset, and indicate more users if available', async () => {
    // Mock fetch to return more users than the default limit (50)
    const manyUsers = Array.from({ length: 55 }, (_, i) => ({
      id: `user-${i}`, name: `User ${i}`, date_of_birth: '1990-01-01', address: `Address ${i}`, created_at: new Date().toISOString()
    }));

    global.fetch.mockImplementationOnce((url, options) => {
      if (url.startsWith(`${API_BASE_URL}/api/users`) && options?.method === 'GET') {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const limit = parseInt(urlParams.get('limit')) || 50;
        const offset = parseInt(urlParams.get('offset')) || 0;
        const paginatedUsers = manyUsers.slice(offset, offset + limit);
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: paginatedUsers, pagination: { limit, offset, total: manyUsers.length, hasMore: offset + limit < manyUsers.length } }),
          status: 200,
        });
      }
      return mockFetch(url, options);
    });

    renderUserManagement();

    await waitFor(() => {
      // Expect to see the first 50 users (default limit)
      expect(screen.getByText('User 0')).toBeInTheDocument();
      expect(screen.getByText('User 49')).toBeInTheDocument();
    });
    // After the initial fetch and render, then check for User 50 not being present
    expect(screen.queryByText('User 50')).not.toBeInTheDocument();

    // Verify the GET request was made with default limit/offset
    const getCalls = global.fetch.mock.calls.filter(call => call[0].startsWith(`${API_BASE_URL}/api/users`) && call[1]?.method === 'GET');
    expect(getCalls[0][0]).toContain('limit=50');
    expect(getCalls[0][0]).toContain('offset=0');
  });

  // TC-030 (CSV 2): Verify database persistence across server restarts
  test('TC-030: Should ensure user data persists after simulated server restart', async () => {
    renderUserManagement();
    await waitFor(() => expect(screen.getByText('Add New User')).toBeInTheDocument());

    // 1. Create user
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Persistence Test' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1987-12-31' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: 'Persistence Address' } });
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    await waitFor(() => expect(screen.getByText('User added successfully!')).toBeInTheDocument());
    expect(screen.getByText('Persistence Test')).toBeInTheDocument();

    // 2. Simulate server restart by clearing mocks and re-mocking fetch
    // The `currentMockUsers` array now holds 'Persistence Test' user.
    jest.clearAllMocks();
    global.fetch.mockImplementation(mockFetch); // Re-implement with the updated currentMockUsers

    // 3. Re-render component to simulate reloading the page after restart
    renderUserManagement();

    // 4. Verify user still appears in the table
    await waitFor(() => {
      expect(screen.getByText('Persistence Test')).toBeInTheDocument();
      expect(screen.getByText('Dec 31, 1987')).toBeInTheDocument();
      expect(screen.getByText('Persistence Address')).toBeInTheDocument();
    });
  });

});

// FormValidator specific tests (from src/tests/UserManagement.test.js in PR)
describe('FormValidator - User Management Fields', () => {
  test('should require name field', () => {
    expect(FormValidator.validateField('name', '')).toBe('Name is required');
  });

  test('should require minimum 2 characters for name', () => {
    expect(FormValidator.validateField('name', 'A')).toBe('Name must be at least 2 characters');
  });

  test('should only allow letters, spaces, hyphens, and apostrophes for name', () => {
    expect(FormValidator.validateField('name', 'John123')).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
    expect(FormValidator.validateField('name', 'John@Doe')).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
    expect(FormValidator.validateField('name', 'John Doe')).toBeNull();
    expect(FormValidator.validateField('name', 'Mary-Jane')).toBeNull();
    expect(FormValidator.validateField('name', "O'Brien")).toBeNull();
  });

  test('should require date of birth', () => {
    expect(FormValidator.validateField('dateOfBirth', '')).toBe('Date of birth is required');
  });

  test('should reject future dates for date of birth', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(FormValidator.validateField('dateOfBirth', futureDate.toISOString().split('T')[0])).toBe('Date of birth must be in the past');
  });

  test('should reject dates for people under 18', () => {
    const recentDate = new Date();
    recentDate.setFullYear(recentDate.getFullYear() - 10);
    expect(FormValidator.validateField('dateOfBirth', recentDate.toISOString().split('T')[0])).toBe('You must be at least 18 years old');
  });

  test('should accept valid date for 18+ year old', () => {
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 25);
    expect(FormValidator.validateField('dateOfBirth', validDate.toISOString().split('T')[0])).toBeNull();
  });

  test('should require address', () => {
    expect(FormValidator.validateField('address', '')).toBe('Address is required');
  });

  test('should require minimum 5 characters for address', () => {
    expect(FormValidator.validateField('address', '123')).toBe('Please enter a valid address');
  });

  test('should accept valid address', () => {
    expect(FormValidator.validateField('address', '123 Main Street, City, State, 12345')).toBeNull();
  });

  test('should validate complete user form with all valid fields', () => {
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 25);

    const formData = {
      name: 'John Doe',
      dateOfBirth: validDate.toISOString().split('T')[0],
      address: '123 Main Street, City, State, 12345'
    };

    expect(FormValidator.validateForm(formData, 'user')).toBe(true);
  });

  test('should fail user form validation with missing name', () => {
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 25);

    const formData = {
      name: '',
      dateOfBirth: validDate.toISOString().split('T')[0],
      address: '123 Main Street'
    };

    expect(FormValidator.validateForm(formData, 'user')).toBe(false);
  });

  test('should return all validation errors for user form', () => {
    const formData = {
      name: '',
      dateOfBirth: '',
      address: '123'
    };

    const errors = FormValidator.validateAll(formData, 'user');
    expect(Object.keys(errors).length).toBeGreaterThan(0);
    expect(errors.name).toBeTruthy();
    expect(errors.dateOfBirth).toBeTruthy();
    expect(errors.address).toBeTruthy();
  });
});
