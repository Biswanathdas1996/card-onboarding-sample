const { test, expect } = require('@playwright/test');

// Helper function to fill the form - Moved to global scope
const fillForm = async (page, name, dob, address) => {
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="dateOfBirth"]', dob);
  await page.fill('textarea[name="address"]', address);
};

// Helper function to get current date minus years for DOB - Moved to global scope
const getDateMinusYears = (years) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
};

test.describe('Basic Details Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/basic-details');
    await expect(page.locator('h1', { hasText: 'Basic Details Collection' })).toBeVisible();
  });

  test('TC-001: Submit basic details with valid data', async ({ page }) => {
    await fillForm(page, 'John Doe', '1990-05-15', '123 Main Street, Apartment 4B, New York, NY 10001');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('User details submitted successfully!');
    await expect(page.locator('input[name="name"]')).toHaveValue('');
    await expect(page.locator('input[name="dateOfBirth"]')).toHaveValue('');
    await expect(page.locator('textarea[name="address"]')).toHaveValue('');
    await expect(page.locator('table tbody tr:has-text("John Doe")')).toBeVisible();
  });

  test('TC-003: Submit form with minimum valid address length (exactly 10 characters)', async ({ page }) => {
    await fillForm(page, 'Bob Lee', '1995-03-10', '12 Main St');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('table tbody tr:has-text("Bob Lee")')).toBeVisible();
    await expect(page.locator('table tbody tr:has-text("12 Main St")')).toBeVisible();
  });

  test('TC-004: Submit form with user exactly 18 years old (minimum age)', async ({ page }) => {
    const dob18YearsAgo = getDateMinusYears(18);
    await fillForm(page, 'Alice Young', dob18YearsAgo, '789 Elm Street, Boston, MA 02101');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('table tbody tr:has-text("Alice Young")')).toBeVisible();
  });

  test('TC-005: Delete user from table', async ({ page }) => {
    // First, add a user to delete
    await fillForm(page, 'User To Delete', '1980-01-01', '123 Delete St');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await page.waitForSelector('table tbody tr:has-text("User To Delete")'); // Replaced waitForTimeout

    const userRow = page.locator('table tbody tr:has-text("User To Delete")');
    await expect(userRow).toBeVisible();

    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this user?');
      await dialog.accept();
    });

    await userRow.locator('button.delete-button').click();
    await expect(userRow).not.toBeVisible();
  });

  test('TC-006: Submit multiple users in sequence', async ({ page }) => {
    await fillForm(page, 'John A', '1990-01-01', 'Address A');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await page.waitForSelector('table tbody tr:has-text("John A")'); // Replaced waitForTimeout

    await fillForm(page, 'Jane B', '1991-02-02', 'Address B');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await page.waitForSelector('table tbody tr:has-text("Jane B")'); // Replaced waitForTimeout

    await fillForm(page, 'Bob C', '1992-03-03', 'Address C');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await page.waitForSelector('table tbody tr:has-text("Bob C")'); // Replaced waitForTimeout

    const tableRows = page.locator('table tbody tr');
    await expect(tableRows).toHaveCount(3);
    await expect(tableRows.nth(0)).toContainText('Bob C');
    await expect(tableRows.nth(1)).toContainText('Jane B');
    await expect(tableRows.nth(2)).toContainText('John A');
  });

  test('TC-007: View user list after page refresh', async ({ page }) => {
    // First, add users
    await fillForm(page, 'Refresh User 1', '1985-01-01', 'Address R1');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await page.waitForSelector('table tbody tr:has-text("Refresh User 1")'); // Replaced waitForTimeout

    await fillForm(page, 'Refresh User 2', '1986-02-02', 'Address R2');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await page.waitForSelector('table tbody tr:has-text("Refresh User 2")'); // Replaced waitForTimeout

    await page.reload();
    await expect(page.locator('h1', { hasText: 'Basic Details Collection' })).toBeVisible();
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows).toHaveCount(2);
    await expect(tableRows.nth(0)).toContainText('Refresh User 2');
    await expect(tableRows.nth(1)).toContainText('Refresh User 1');
  });

  test('TC-008: Submit form with empty name field', async ({ page }) => {
    await fillForm(page, '', '1990-01-01', '123 Test Street, City');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.error-text:has-text("Name is required")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveClass(/error/);
    await expect(page.locator('.success-message')).not.toBeVisible();
  });

  test('TC-009: Submit form with name less than 2 characters', async ({ page }) => {
    await fillForm(page, 'X', '1990-01-01', '123 Test Street, City');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.error-text:has-text("Name must be at least 2 characters")')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveClass(/error/);
    await expect(page.locator('.success-message')).not.toBeVisible();
  });

  test('TC-010: Submit form without selecting date of birth', async ({ page }) => {
    await fillForm(page, 'John Doe', '', '123 Test Street');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.error-text:has-text("Date of Birth is required")')).toBeVisible();
    await expect(page.locator('input[name="dateOfBirth"]')).toHaveClass(/error/);
    await expect(page.locator('.success-message')).not.toBeVisible();
  });

  test('TC-011: Submit form with age less than 18 years', async ({ page }) => {
    const dob17YearsAgo = getDateMinusYears(17);
    await fillForm(page, 'Minor User', dob17YearsAgo, '123 Test Street');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.error-text:has-text("Must be at least 18 years old")')).toBeVisible();
    await expect(page.locator('input[name="dateOfBirth"]')).toHaveClass(/error/);
    await expect(page.locator('.success-message')).not.toBeVisible();
  });

  test('TC-012: Submit form with empty address field', async ({ page }) => {
    await fillForm(page, 'John Doe', '1990-01-01', '');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.error-text:has-text("Address is required")')).toBeVisible();
    await expect(page.locator('textarea[name="address"]')).toHaveClass(/error/);
    await expect(page.locator('.success-message')).not.toBeVisible();
  });

  test('TC-013: Submit form with address less than 10 characters', async ({ page }) => {
    await fillForm(page, 'John Doe', '1990-01-01', '123 St');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.error-text:has-text("Address must be at least 10 characters")')).toBeVisible();
    await expect(page.locator('textarea[name="address"]')).toHaveClass(/error/);
    await expect(page.locator('.success-message')).not.toBeVisible();
  });

  test('TC-014: Submit form with all empty fields', async ({ page }) => {
    await fillForm(page, '', '', '');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.error-text:has-text("Name is required")')).toBeVisible();
    await expect(page.locator('.error-text:has-text("Date of Birth is required")')).toBeVisible();
    await expect(page.locator('.error-text:has-text("Address is required")')).toBeVisible();
    await expect(page.locator('.success-message')).not.toBeVisible();
  });

  test('TC-015: Attempt to delete user but cancel confirmation', async ({ page }) => {
    // First, add a user to attempt deleting
    await fillForm(page, 'User To Cancel Delete', '1980-01-01', '123 Cancel St');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await page.waitForSelector('table tbody tr:has-text("User To Cancel Delete")'); // Replaced waitForTimeout

    const userRow = page.locator('table tbody tr:has-text("User To Cancel Delete")');
    await expect(userRow).toBeVisible();

    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to delete this user?');
      await dialog.dismiss();
    });

    await userRow.locator('button.delete-button').click();
    await expect(userRow).toBeVisible(); // User should still be visible
  });

  test('TC-017: Submit form with very long name (255 characters)', async ({ page }) => {
    const longName = 'a'.repeat(255);
    await fillForm(page, longName, '1990-01-01', 'Valid Address for Long Name Test');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    // Assert against the actual displayed text, which might be truncated or full
    // A more robust assertion would be to check the input field's value if it's still present
    // or to check the table cell's exact text if it's not truncated.
    // For now, assuming the table displays the full name or a predictable truncation.
    await expect(page.locator(`table tbody tr:has-text("${longName}")`).first()).toBeVisible();
  });

  test('TC-018: Submit form with special characters in name', async ({ page }) => {
    const specialName = "Mary-Jane O'Connor";
    await fillForm(page, specialName, '1992-12-12', 'Valid Address for Special Name Test');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator(`table tbody tr:has-text("${specialName}")`)).toBeVisible();
  });
});

test.describe('Navigation Tests', () => {
  test('TC-002: Complete user journey from landing page to basic details submission', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1', { hasText: 'Welcome to CardOnboard' })).toBeVisible();
    await page.click('nav a:has-text("Basic Details")');
    await expect(page.url()).toContain('/basic-details');
    await expect(page.locator('h1', { hasText: 'Basic Details Collection' })).toBeVisible();

    await fillForm(page, 'Jane Smith', '1985-08-22', '456 Oak Avenue, Building C, Los Angeles, CA 90001');
    await page.click('button:has-text("Submit Details")');
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('table tbody tr:has-text("Jane Smith")')).toBeVisible();

    await page.click('nav a:has-text("Home")');
    await expect(page.url()).toContain('/');
    await expect(page.locator('h1', { hasText: 'Welcome to CardOnboard' })).toBeVisible();

    await page.click('nav a:has-text("Basic Details")');
    await expect(page.url()).toContain('/basic-details');
    await expect(page.locator('table tbody tr:has-text("Jane Smith")')).toBeVisible();
  });

  test('TC-019: Navigate using "Basic Details" link in navbar', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1', { hasText: 'Welcome to CardOnboard' })).toBeVisible();
    await page.click('nav a:has-text("Basic Details")');
    await expect(page.url()).toContain('/basic-details');
    await expect(page.locator('h1', { hasText: 'Basic Details Collection' })).toBeVisible();
    await expect(page.locator('.form-section')).toBeVisible();
    await expect(page.locator('.table-section')).toBeVisible();
  });
});

// API tests (TC-020, TC-021) would typically be in a separate backend test suite
// or integrated into E2E tests where the UI interaction triggers the API calls.
// For this request, focusing on UI-driven automation based on the provided CSVs.
