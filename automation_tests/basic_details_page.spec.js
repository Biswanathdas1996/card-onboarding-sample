const { test, expect } = require('@playwright/test');

test.describe('Basic Details Page Tests', () => {

  // Helper function to add a user - Moved outside beforeEach for proper scope
  const addUser = async (page, name, dob, address) => {
    await page.fill('#name', name);
    await page.fill('#dateOfBirth', dob);
    await page.fill('#address', address);
    await page.click('button:has-text("Add User")');
  };

  test.beforeEach(async ({ page }) => {
    // Ensure the database is clean before each test if possible, or mock API calls.
    // For now, we assume a clean state or handle idempotency in tests.
    await page.goto('http://localhost:3000/basic-details');
    // Clear any existing messages by clicking a close button if available, or ensuring they are not present.
    // If there's no explicit close, we assume navigation clears them.
    // await expect(page.locator('.message')).not.toBeVisible(); // This assertion doesn't 'clear' messages
  });

  // TC-001: Successfully add a new user with all valid details
  test('TC-001: Successfully add a new user with all valid details', async ({ page }) => {
    await addUser(page, 'John Doe', '1990-01-15', '123 Main Street, New York, NY 10001');

    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toHaveText('User added successfully!');

    await expect(page.locator('#name')).toHaveValue('');
    await expect(page.locator('#dateOfBirth')).toHaveValue('');
    await expect(page.locator('#address')).toHaveValue('');

    const tableRow = page.locator('.users-table tbody tr').first();
    await expect(tableRow.locator('.user-name')).toHaveText('John Doe');
    await expect(tableRow.locator('td:nth-child(3)')).toHaveText('Jan 15, 1990'); // Formatted date
    await expect(tableRow.locator('.user-address')).toHaveText('123 Main Street, New York, NY 10001');

    const userCountText = await page.locator('.user-count').textContent();
    expect(parseInt(userCountText.split(' ')[0])).toBeGreaterThanOrEqual(1);
  });

  // TC-002: Complete user journey from landing page to adding basic details and viewing in table
  test('TC-002: Complete user journey from landing page to adding basic details and viewing in table', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.click('text=Basic Details');
    await expect(page).toHaveURL('http://localhost:3000/basic-details');

    await addUser(page, 'Jane Smith', '1985-06-20', '456 Park Avenue, Brooklyn, NY 11201');

    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toHaveText('User added successfully!');

    const tableRow = page.locator('.users-table tbody tr').first();
    await expect(tableRow.locator('.user-name')).toHaveText('Jane Smith');
    await expect(tableRow.locator('td:nth-child(3)')).toHaveText('Jun 20, 1985');
    await expect(tableRow.locator('.user-address')).toHaveText('456 Park Avenue, Brooklyn, NY 11201');

    await page.click('.back-button');
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  // TC-003: Submit form with special characters in name and address
  test('TC-003: Submit form with special characters in name and address', async ({ page }) => {
    await addUser(page, "O'Brien-Smith Jr.", '1975-03-10', "789 St. Mary's Road, Apt #5B, Queens, NY 11375");

    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toHaveText('User added successfully!');

    const tableRow = page.locator('.users-table tbody tr').first();
    await expect(tableRow.locator('.user-name')).toHaveText("O'Brien-Smith Jr.");
    await expect(tableRow.locator('td:nth-child(3)')).toHaveText('Mar 10, 1975');
    await expect(tableRow.locator('.user-address')).toHaveText("789 St. Mary's Road, Apt #5B, Queens, NY 11375");
  });

  // TC-004: Submit form with very long address
  test('TC-004: Submit form with very long address', async ({ page }) => {
    const longAddress = '1234 Very Long Street Name That Goes On And On, Building Complex Name, Floor 15, Suite 2500, Some Very Long City Name, State With Long Name, ZIP 12345-6789, Additional Address Line Information Here That Makes It Even Longer';
    await addUser(page, 'Michael Johnson', '1992-11-25', longAddress);

    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toHaveText('User added successfully!');

    const tableRow = page.locator('.users-table tbody tr').first();
    await expect(tableRow.locator('.user-name')).toHaveText('Michael Johnson');
    await expect(tableRow.locator('td:nth-child(3)')).toHaveText('Nov 25, 1992');
    // The address might be truncated with ellipsis in UI, but the full text should be present in the element's title or accessible text.
    // For now, we'll check for the visible part or the full text if not truncated.
    await expect(tableRow.locator('.user-address')).toHaveAttribute('title', longAddress); // Assuming title attribute for full text
  });

  // TC-005: Add multiple users and verify table displays all correctly
  test('TC-005: Add multiple users and verify table displays all correctly', async ({ page }) => {
    // Ensure a clean state before adding multiple users to avoid interference from previous tests.
    // This could involve a page reload or a specific API call to clear data.
    await page.reload(); // Reload to ensure a fresh state for this test

    await addUser(page, 'User One', '2000-01-01', 'Address 1');
    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toHaveText('User added successfully!');

    await addUser(page, 'User Two', '2000-02-02', 'Address 2');
    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toHaveText('User added successfully!');

    await addUser(page, 'User Three', '2000-03-03', 'Address 3');
    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toHaveText('User added successfully!');

    const rows = page.locator('.users-table tbody tr');
    await expect(rows).toHaveCount(3); // Assuming a clean state or enough users to make this count valid

    // Verify order (newest first)
    await expect(rows.nth(0).locator('.user-name')).toHaveText('User Three');
    await expect(rows.nth(1).locator('.user-name')).toHaveText('User Two');
    await expect(rows.nth(2).locator('.user-name')).toHaveText('User One');

    const userCountText = await page.locator('.user-count').textContent();
    expect(parseInt(userCountText.split(' ')[0])).toBeGreaterThanOrEqual(3);
  });

  // TC-006: View existing users when page loads with pre-populated data
  test('TC-006: View existing users when page loads with pre-populated data', async ({ page }) => {
    // Precondition: Mock the API to return pre-populated data for this test.
    await page.route('**/api/basic-details', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { name: 'Existing User 3', dob: '1997-07-03', address: 'Existing Address 3' },
            { name: 'Existing User 2', dob: '1996-06-02', address: 'Existing Address 2' },
            { name: 'Existing User 1', dob: '1995-05-01', address: 'Existing Address 1' }
          ],
          count: 3
        }),
      });
    });

    await page.reload(); // Reload the page to simulate loading with existing data

    await expect(page.locator('.loading-state')).not.toBeVisible(); // Loading spinner should disappear
    const rows = page.locator('.users-table tbody tr');
    await expect(rows).toHaveCount(3); // Expecting 3 users from the setup

    await expect(rows.nth(0).locator('.user-name')).toHaveText('Existing User 3');
    await expect(rows.nth(1).locator('.user-name')).toHaveText('Existing User 2');
    await expect(rows.nth(2).locator('.user-name')).toHaveText('Existing User 1');

    const userCountText = await page.locator('.user-count').textContent();
    expect(parseInt(userCountText.split(' ')[0])).toBeGreaterThanOrEqual(3);
  });

  // TC-007: Navigate to Basic Details page from landing page using navigation link
  test('TC-007: Navigate to Basic Details page from landing page using navigation link', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.click('text=Basic Details');
    await expect(page).toHaveURL('http://localhost:3000/basic-details');
    await expect(page.locator('h1')).toHaveText('Basic Details Collection');
    await expect(page.locator('.form-card')).toBeVisible();
    await expect(page.locator('.table-card')).toBeVisible();
  });

  // TC-008: Submit form with empty name field
  test('TC-008: Submit form with empty name field', async ({ page }) => {
    await addUser(page, '', '1990-05-15', '123 Test St');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toHaveText('Name is required');
    await expect(page.locator('#name')).toHaveValue('');
    await expect(page.locator('#dateOfBirth')).toHaveValue('1990-05-15');
    await expect(page.locator('#address')).toHaveValue('123 Test St');
    await expect(page.locator('.users-table tbody tr')).not.toBeVisible(); // No user added
  });

  // TC-009: Submit form with empty date of birth
  test('TC-009: Submit form with empty date of birth', async ({ page }) => {
    await addUser(page, 'Test User', '', '123 Test St');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toHaveText('Date of Birth is required');
    await expect(page.locator('#name')).toHaveValue('Test User');
    await expect(page.locator('#dateOfBirth')).toHaveValue('');
    await expect(page.locator('#address')).toHaveValue('123 Test St');
    await expect(page.locator('.users-table tbody tr')).not.toBeVisible(); // No user added
  });

  // TC-010: Submit form with empty address field
  test('TC-010: Submit form with empty address field', async ({ page }) => {
    await addUser(page, 'Test User', '1990-05-15', '');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toHaveText('Address is required');
    await expect(page.locator('#name')).toHaveValue('Test User');
    await expect(page.locator('#dateOfBirth')).toHaveValue('1990-05-15');
    await expect(page.locator('#address')).toHaveValue('');
    await expect(page.locator('.users-table tbody tr')).not.toBeVisible(); // No user added
  });

  // TC-011: Submit completely empty form
  test('TC-011: Submit completely empty form', async ({ page }) => {
    await page.click('button:has-text("Add User")');

    await expect(page.locator('.message.error')).toBeVisible();
    // Expecting a specific error message might be brittle if multiple validations trigger.
    // Better to check for the presence of error messages or a specific one if it's the primary.
    await expect(page.locator('.message.error')).toHaveText('Name is required'); // First validation error
    await expect(page.locator('#name')).toHaveValue('');
    await expect(page.locator('#dateOfBirth')).toHaveValue('');
    await expect(page.locator('#address')).toHaveValue('');
    await expect(page.locator('.users-table tbody tr')).not.toBeVisible(); // No user added
  });

  // TC-012: Test API endpoint failure handling
  test('TC-012: Test API endpoint failure handling', async ({ page }) => {
    // Mock API response for failure
    await page.route('**/api/basic-details', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'An error occurred while adding user' }),
      });
    });

    await addUser(page, 'Error Test', '1990-01-01', '123 Error St');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toHaveText('An error occurred while adding user');
    // Form data should be retained
    await expect(page.locator('#name')).toHaveValue('Error Test');
    await expect(page.locator('#dateOfBirth')).toHaveValue('1990-01-01');
    await expect(page.locator('#address')).toHaveValue('123 Error St');
    await expect(page.locator('.users-table tbody tr')).not.toBeVisible(); // No user added
  });

  // TC-013: Test database table not initialized
  test('TC-013: Test database table not initialized', async ({ page }) => {
    // Mock API response for TABLE_NOT_FOUND error
    await page.route('**/api/basic-details', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Database table not initialized. Please run database migrations.', code: 'TABLE_NOT_FOUND' }),
      });
    });

    await addUser(page, 'DB Error Test', '1990-01-01', '123 DB Error St');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toHaveText('Database table not initialized. Please run database migrations.');
    await expect(page.locator('.users-table tbody tr')).not.toBeVisible(); // No user added
  });

  // TC-014: Add user with future date of birth
  test('TC-014: Add user with future date of birth', async ({ page }) => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10);
    const futureDateString = futureDate.toISOString().split('T')[0];

    await addUser(page, 'Future Person', futureDateString, 'Future Address');

    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toHaveText('User added successfully!');

    const tableRow = page.locator('.users-table tbody tr').first();
    await expect(tableRow.locator('.user-name')).toHaveText('Future Person');
    // Verify the date is displayed correctly, assuming the system accepts future dates.
    // The exact format might vary, so we check for a partial match or a specific format.
    // It's better to get the text content and then parse/format it for comparison if the format is dynamic.
    const displayedDate = await tableRow.locator('td:nth-child(3)').textContent();
    const expectedFormattedDate = new Date(futureDateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    expect(displayedDate).toBe(expectedFormattedDate); // Direct comparison after formatting
    await expect(tableRow.locator('.user-address')).toHaveText('Future Address');
  });

  // TC-015: Verify table behavior with no users (empty state)
  test('TC-015: Verify table behavior with no users (empty state)', async ({ page }) => {
    // Precondition: Ensure the database is empty for basic_details table.
    // This would typically involve a database cleanup script or mocking the API to return an empty array.
    await page.route('**/api/basic-details', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], count: 0 }),
      });
    });

    await page.reload(); // Reload to ensure the mocked empty state is active

    await expect(page.locator('.loading-state')).not.toBeVisible();
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state p')).toHaveText('No users added yet');
    await expect(page.locator('.empty-state small')).toHaveText('Add your first user using the form above');
    const userCountText = await page.locator('.user-count').textContent();
    expect(userCountText).toBe('0 users');
    await expect(page.locator('.users-table tbody tr')).not.toBeVisible(); // Check for no rows in tbody
  });

});
