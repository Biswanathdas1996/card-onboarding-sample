CREATE TABLE IF NOT EXISTS tax_filing_process_steps (
    step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    order_sequence INTEGER NOT NULL UNIQUE,
    image_url VARCHAR(255),
    svg_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_filing_process_steps_order_sequence ON tax_filing_process_steps (order_sequence);

-- Seed data for initial tax filing process steps
INSERT INTO tax_filing_process_steps (step_number, title, description, order_sequence, image_url, svg_data) VALUES
(1, 'Gather Your Documents', 'Collect all necessary financial documents, including W-2s, 1099s, receipts, and other income statements.', 1, NULL, NULL),
(2, 'Determine Your Filing Status', 'Identify your correct filing status: Single, Married Filing Jointly, Married Filing Separately, Head of Household, or Qualifying Widow(er).', 2, NULL, NULL),
(3, 'Calculate Income & Deductions', 'Compute your total income, then identify and calculate all eligible deductions and credits to reduce your taxable income.', 3, NULL, NULL),
(4, 'Complete Tax Forms', 'Fill out the appropriate federal and state tax forms accurately based on your income, deductions, and credits.', 4, NULL, NULL),
(5, 'Review and Submit', 'Carefully review all information for accuracy, then submit your tax return electronically or by mail.', 5, NULL, NULL)
ON CONFLICT (order_sequence) DO UPDATE SET
    step_number = EXCLUDED.step_number,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    svg_data = EXCLUDED.svg_data,
    updated_at = CURRENT_TIMESTAMP;