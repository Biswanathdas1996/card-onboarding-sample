const { test, expect } = require('@playwright/test');

test.describe('User Management Page', () => {
  const BASE_URL = 'http://localhost:3000';
  const API_URL = 'http://localhost:5000/api/users';

  test.beforeEach(async ({ page }) => {
    // Ensure the database is clean before each test if possible, or seed with known data
    // For now, we'll assume a clean state or handle cleanup within tests.
    await page.goto(`${BASE_URL}/users`);
    await expect(page.locator('h1')).toHaveText('User Management');
  });

  // Helper function to clear all users (for cleanup)
  async function deleteAllUsers(page) {
    await page.goto(`${BASE_URL}/users`); // Ensure on the user management page
    // Set up dialog handler once BEFORE clicking any delete buttons
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this user?');
      await dialog.accept();
    });

    let deleteButtons = await page.locator('.delete-btn').all();
    while (deleteButtons.length > 0) {
      await deleteButtons[0].click();
      await expect(page.locator('.message.success')).toBeVisible();
      // Reload the page or wait for the table to update after deletion
      // This is crucial because the success message might disappear on reload
      // and the list of delete buttons needs to be re-evaluated.
      await page.waitForSelector('.message.success', { state: 'hidden' }); // Wait for success message to disappear
      await page.reload(); // Reload to get updated user list
      deleteButtons = await page.locator('.delete-btn').all(); // Re-fetch buttons
    }
    await expect(page.locator('.empty-state')).toBeVisible();
  }

  test('TC-001: Successfully add a new user through the form', async ({ page }) => {
    await deleteAllUsers(page);
    const name = 'Rajesh Kumar';
    const dob = '1990-05-15';
    const address = '123 MG Road, Bangalore, Karnataka 560001';

    await page.fill('#name', name);
    await page.fill('#dateOfBirth', dob);
    await page.fill('#address', address);

    await page.click('button:has-text("Add User")');

    await expect(page.locator('.message.success')).toHaveText('✓ User added successfully!');
    await expect(page.locator('#name')).toHaveValue('');
    await expect(page.locator('#dateOfBirth')).toHaveValue('');
    await expect(page.locator('#address')).toHaveValue('');

    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.users-table tbody tr:first-child td').nth(0)).toHaveText(name);
    await expect(page.locator('.users-table tbody tr:first-child td').nth(1)).toHaveText('May 15, 1990');
    await expect(page.locator('.users-table tbody tr:first-child td').nth(2)).toHaveText(address);
    await expect(page.locator('.user-count')).toHaveText('1 user(s)');
  });

  test('TC-002: View all users in the table', async ({ page }) => {
    await deleteAllUsers(page);
    // Seed data directly via API for consistent test setup
    await page.request.post(API_URL, { data: { name: 'Priya Sharma', dateOfBirth: '1985-03-20', address: '45 Park Street, Mumbai' } });
    await page.request.post(API_URL, { data: { name: 'Amit Singh', dateOfBirth: '1992-11-10', address: '78 Gandhi Nagar, Delhi' } });
    await page.request.post(API_URL, { data: { name: 'Sunita Patel', dateOfBirth: '1988-07-25', address: '22 Lake View, Pune' } });

    await page.reload(); // Reload page to fetch new data

    await expect(page.locator('.users-table')).toBeVisible();
    const rows = page.locator('.users-table tbody tr');
    await expect(rows).toHaveCount(3);

    await expect(page.locator('.users-table th').nth(0)).toHaveText('Name');
    await expect(page.locator('.users-table th').nth(1)).toHaveText('Date of Birth');
    await expect(page.locator('.users-table th').nth(2)).toHaveText('Address');
    await expect(page.locator('.users-table th').nth(3)).toHaveText('Added On');
    await expect(page.locator('.users-table th').nth(4)).toHaveText('Actions');

    await expect(page.locator('.user-count')).toHaveText('3 user(s)');

    // The order of users from the API might not be guaranteed without explicit sorting.
    // It's safer to find users by their name or a unique identifier.
    await expect(page.locator('.users-table tbody tr:has-text("Sunita Patel")').locator('td').nth(1)).toHaveText('Jul 25, 1988');
    await expect(page.locator('.users-table tbody tr:has-text("Sunita Patel")').locator('td').nth(2)).toHaveText('22 Lake View, Pune');

    await expect(page.locator('.users-table tbody tr:has-text("Amit Singh")').locator('td').nth(1)).toHaveText('Nov 10, 1992');

    await expect(page.locator('.users-table tbody tr:has-text("Priya Sharma")').locator('td').nth(1)).toHaveText('Mar 20, 1985');
  });

  test('TC-003: Delete a user from the table', async ({ page }) => {
    await deleteAllUsers(page);
    await page.request.post(API_URL, { data: { name: 'Test User', dateOfBirth: '1990-01-01', address: '123 Delete St' } });
    await page.reload();
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.user-count')).toHaveText('1 user(s)');

    // Set up dialog handler BEFORE clicking the button that triggers it
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this user?');
      await dialog.accept();
    });

    await page.locator('.delete-btn').first().click();

    await expect(page.locator('.message.success')).toHaveText('✓ User deleted successfully!');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(0);
    await expect(page.locator('.user-count')).toHaveText('0 user(s)');
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('TC-004: Complete user management workflow from landing page', async ({ page }) => {
    await deleteAllUsers(page);
    await page.goto(BASE_URL);
    await page.click('text=User Management');
    await expect(page).toHaveURL(`${BASE_URL}/users`);

    const name = 'End-to-End Test User';
    const dob = '1995-01-01';
    const address = 'E2E Test Address, Bangalore 560001';

    await page.fill('#name', name);
    await page.fill('#dateOfBirth', dob);
    await page.fill('#address', address);
    await page.click('button:has-text("Add User")');
    await expect(page.locator('.message.success')).toHaveText('✓ User added successfully!');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.users-table tbody tr:first-child td').nth(0)).toHaveText(name);

    // Set up dialog handler BEFORE clicking the button that triggers it
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this user?');
      await dialog.accept();
    });

    await page.locator('.delete-btn').first().click();
    await expect(page.locator('.message.success')).toHaveText('✓ User deleted successfully!');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('TC-005: Navigation between pages maintains state', async ({ page }) => {
    await deleteAllUsers(page);
    const name = 'State Test User';
    const dob = '1999-09-09';
    const address = 'State Test Address';

    await page.fill('#name', name);
    await page.fill('#dateOfBirth', dob);
    await page.fill('#address', address);
    await page.click('button:has-text("Add User")');
    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);

    await page.click('nav a:has-text("Home")');
    await expect(page).toHaveURL(BASE_URL + '/');

    await page.click('nav a:has-text("User Management")');
    await expect(page).toHaveURL(`${BASE_URL}/users`);

    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.users-table tbody tr:first-child td').nth(0)).toHaveText(name);
    await expect(page.locator('.user-count')).toHaveText('1 user(s)');
  });

  test('TC-006: Submit form with missing required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`); // Ensure on the user management page
    // Attempt to submit with empty name
    await page.fill('#dateOfBirth', '2000-01-01');
    await page.fill('#address', 'Some Address');
    await page.click('button:has-text("Add User")');

    // Playwright doesn't directly assert browser's native validation messages.
    // We can check that the form does NOT submit and no success message appears.
    await expect(page.locator('.message.success')).not.toBeVisible();
    await expect(page.locator('.users-table tbody tr')).toHaveCount(0);
    // Instead of toBeFocused, check if the form fields retain their values or if an app-specific error is shown.
    // If the app doesn't show an error, the test might need to be adjusted to check for no new user added.
    // If the browser's native validation prevents submission, the field might retain its value.
    // Assuming the application doesn't clear valid fields on failed submission.
    await expect(page.locator('#name')).toHaveValue(''); // Assuming it remains empty if required and not filled
    await expect(page.locator('#dateOfBirth')).toHaveValue('2000-01-01');
    await expect(page.locator('#address')).toHaveValue('Some Address');
  });

  test('TC-007: Submit form with invalid date format (client-side)', async ({ page }) => {
    // The HTML5 date input type prevents invalid date formats from being entered directly.
    // This test verifies that the date picker functionality works as expected.
    await page.fill('#name', 'Test User');
    // Attempting to set an invalid date string to a type='date' input will result in an empty value
    await page.evaluate(() => document.getElementById('dateOfBirth').value = '99/99/9999');
    await page.fill('#address', 'Test Address');
    await page.click('button:has-text("Add User")');

    // Expect form not to submit due to invalid date (empty value)
    await expect(page.locator('.message.success')).not.toBeVisible();
    await expect(page.locator('.users-table tbody tr')).toHaveCount(0);
    // Similar to TC-006, check for no user added and form state.
    await expect(page.locator('#name')).toHaveValue('Test User');
    await expect(page.locator('#dateOfBirth')).toHaveValue(''); // Should be empty if invalid date was set
    await expect(page.locator('#address')).toHaveValue('Test Address');
  });

  test('TC-008: Very long address text', async ({ page }) => {
    await deleteAllUsers(page);
    const name = 'Long Address User';
    const dob = '1990-01-01';
    const longAddress = "This is a very long address that contains more than 500 characters repeating multiple times to test the system's handling of large text inputs in the address field. It should test both the frontend display in the table and the database TEXT field storage. This is a very long address that contains more than 500 characters repeating multiple times to test the system's handling of large text inputs in the address field. It should test both the frontend display in the table and the database TEXT field storage. This is a very long address that continues....";

    await page.fill('#name', name);
    await page.fill('#dateOfBirth', dob);
    await page.fill('#address', longAddress);
    await page.click('button:has-text("Add User")');

    await expect(page.locator('.message.success')).toHaveText('✓ User added successfully!');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.users-table tbody tr:first-child td').nth(0)).toHaveText(name);
    // Verify address is displayed, potentially truncated by CSS (we can't directly check CSS truncation easily)
    // But we can check that the beginning of the address is present.
    const displayedAddress = await page.locator('.users-table tbody tr:first-child td').nth(2).textContent();
    expect(displayedAddress).toContain(longAddress.substring(0, 50)); // Check first part of address
  });

  test('TC-009: Empty database scenario', async ({ page }) => {
    await deleteAllUsers(page);
    await page.reload(); // Ensure page reflects empty state

    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state')).toHaveText('No users added yet. Add your first user using the form above.');
    await expect(page.locator('.user-count')).toHaveText('0 user(s)');
    await expect(page.locator('.users-table')).not.toBeVisible(); // Table itself might not be visible, or just tbody is empty
    await expect(page.locator('button:has-text("Add User")')).toBeEnabled(); // Form should be functional
  });

  test('TC-010: Special characters in name field', async ({ page }) => {
    await deleteAllUsers(page);
    const name = 'Rajesh Kumar-Gupta (Sr.) & Family';
    const dob = '1985-06-15';
    const address = 'Plot #45, Sector-12, Noida';

    await page.fill('#name', name);
    await page.fill('#dateOfBirth', dob);
    await page.fill('#address', address);
    await page.click('button:has-text("Add User")');

    await expect(page.locator('.message.success')).toHaveText('✓ User added successfully!');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.users-table tbody tr:first-child td').nth(0)).toHaveText(name);
  });

  test('TC-011: Multiple rapid user additions', async ({ page }) => {
    await deleteAllUsers(page);

    const usersToAdd = [
      { name: 'Rapid Test 1', dob: '2000-01-01', address: 'Address 1' },
      { name: 'Rapid Test 2', dob: '2000-01-02', address: 'Address 2' },
      { name: 'Rapid Test 3', dob: '2000-01-03', address: 'Address 3' },
    ];

    for (const user of usersToAdd) {
      await page.fill('#name', user.name);
      await page.fill('#dateOfBirth', user.dob);
      await page.fill('#address', user.address);
      await page.click('button:has-text("Add User")');
      await expect(page.locator('.message.success')).toHaveText('✓ User added successfully!');
    }

    await expect(page.locator('.users-table tbody tr')).toHaveCount(3);
    await expect(page.locator('.user-count')).toHaveText('3 user(s)');

    // Verify order (newest first) - assuming the application sorts by 'Added On' descending
    await expect(page.locator('.users-table tbody tr').nth(0).locator('td').nth(0)).toHaveText('Rapid Test 3');
    await expect(page.locator('.users-table tbody tr').nth(1).locator('td').nth(0)).toHaveText('Rapid Test 2');
    await expect(page.locator('.users-table tbody tr').nth(2).locator('td').nth(0)).toHaveText('Rapid Test 1');
  });

  test('TC-012: Form auto-clears after successful submission', async ({ page }) => {
    await deleteAllUsers(page);
    await page.fill('#name', 'Auto Clear Test');
    await page.fill('#dateOfBirth', '1993-08-20');
    await page.fill('#address', 'Auto Clear Address');
    await page.click('button:has-text("Add User")');

    await expect(page.locator('.message.success')).toHaveText('✓ User added successfully!');
    await expect(page.locator('#name')).toHaveValue('');
    await expect(page.locator('#dateOfBirth')).toHaveValue('');
    await expect(page.locator('#address')).toHaveValue('');
  });

  test('TC-013: Submit with future date of birth', async ({ page }) => {
    await deleteAllUsers(page);
    const name = 'Future DOB User';
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10); // 10 years in the future
    const dob = futureDate.toISOString().split('T')[0];
    const address = 'Test Address';

    await page.fill('#name', name);
    await page.fill('#dateOfBirth', dob);
    await page.fill('#address', address);
    await page.click('button:has-text("Add User")');

    await expect(page.locator('.message.success')).toHaveText('✓ User added successfully!');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.users-table tbody tr:first-child td').nth(0)).toHaveText(name);
    // This test highlights a potential bug as per the expected result, so we assert success.
  });

  test('TC-014: Delete user with cancelled confirmation', async ({ page }) => {
    await deleteAllUsers(page);
    await page.request.post(API_URL, { data: { name: 'Cancel Delete Test', dateOfBirth: '1980-01-01', address: '123 Cancel St' } });
    await page.reload();
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);

    // Set up dialog handler BEFORE clicking the button that triggers it
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this user?');
      await dialog.cancel();
    });

    await page.locator('.delete-btn').first().click();

    await expect(page.locator('.message.success')).not.toBeVisible();
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.user-count')).toHaveText('1 user(s)');
  });

  test('TC-015: Backend server down scenario', async ({ page }) => {
    // This test requires stopping the backend server, which is outside Playwright's scope.
    // We can simulate a failed API call by intercepting it.
    // Use test.step to ensure the route is active only for this test and reset afterwards.
    await test.step('Simulate server down for API_URL', async () => {
      await page.route(API_URL, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Simulated server error' }),
        });
      });
    });

    await page.reload(); // Attempt to load users with server down
    await expect(page.locator('.message.error')).toHaveText('⚠ Error connecting to server');

    // Attempt to submit a new user with server down
    await page.fill('#name', 'Offline User');
    await page.fill('#dateOfBirth', '2000-01-01');
    await page.fill('#address', 'Offline Address');
    await page.click('button:has-text("Add User")');
    await expect(page.locator('.message.error')).toHaveText('⚠ Error connecting to server');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(0);
  });

  test('TC-016: Database constraint violation', async ({ page }) => {
    await deleteAllUsers(page);
    // This test assumes a unique constraint on 'name' for demonstration, though not in current schema.
    // We'll simulate an API error for constraint violation.
    // Use test.step to ensure the route is active only for this test and reset afterwards.
    await test.step('Simulate constraint violation for API_URL', async () => {
      await page.route(API_URL, route => {
        route.fulfill({
          status: 409, // Conflict
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'User with this name already exists' }),
        });
      });
    });

    await page.fill('#name', 'Duplicate User');
    await page.fill('#dateOfBirth', '1990-01-01');
    await page.fill('#address', 'Address');
    await page.click('button:has-text("Add User")');

    await expect(page.locator('.message.error')).toHaveText('⚠ User with this name already exists');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(0);
    await expect(page.locator('#name')).toHaveValue('Duplicate User'); // Form remains populated
  });

  test('TC-017: Date formatting in different locales', async ({ page }) => {
    await deleteAllUsers(page);
    const name = 'Locale Test User';
    const dob = '1990-05-15';
    const address = 'Locale Address';

    await page.fill('#name', name);
    await page.fill('#dateOfBirth', dob);
    await page.fill('#address', address);
    await page.click('button:has-text("Add User")');

    await expect(page.locator('.message.success')).toHaveText('✓ User added successfully!');
    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    // Assuming 'en-IN' locale formatting for 'May 15, 1990'
    await expect(page.locator('.users-table tbody tr:first-child td').nth(1)).toHaveText('May 15, 1990');
    // For 'Added On', we can only check it's a valid date string, specific format might vary slightly
    const addedOnText = await page.locator('.users-table tbody tr:first-child td').nth(3).textContent();
    expect(addedOnText).toMatch(/\w{3} \d{1,2}, \d{4}/); // e.g., 'May 15, 2023'
  });

  test('TC-018: Page refresh preserves data', async ({ page }) => {
    await deleteAllUsers(page);
    await page.request.post(API_URL, { data: { name: 'Refresh Test User', dateOfBirth: '1988-02-29', address: 'Refresh Address' } });
    await page.reload();

    await expect(page.locator('.users-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.users-table tbody tr:first-child td').nth(0)).toHaveText('Refresh Test User');
    await expect(page.locator('.user-count')).toHaveText('1 user(s)');
  });
});
