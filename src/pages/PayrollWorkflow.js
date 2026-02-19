import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PayrollWorkflow() {
	const navigate = useNavigate();
	const [timesheetData, setTimesheetData] = useState({
		employeeId: '',
		hoursWorked: '',
		projectCode: '',
		notes: ''
	});

	const [grossPay, setGrossPay] = useState(0);
	const [taxDeductions, setTaxDeductions] = useState(0);
	const [netPay, setNetPay] = useState(0);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setTimesheetData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const calculatePayroll = () => {
		// Placeholder logic for payroll calculation
		const hourlyRate = 50; // Example hourly rate
		const hours = parseFloat(timesheetData.hoursWorked) || 0;
		const calculatedGrossPay = hourlyRate * hours;
		const calculatedTaxDeductions = calculatedGrossPay * 0.3; // Example tax rate
		const calculatedNetPay = calculatedGrossPay - calculatedTaxDeductions;

		setGrossPay(calculatedGrossPay);
		setTaxDeductions(calculatedTaxDeductions);
		setNetPay(calculatedNetPay);
	};

	const generatePayslip = () => {
		// Placeholder logic for generating payslip
		alert('Payslip generated!');
	};

	const transferSalary = () => {
		// Placeholder logic for transferring salary
		alert('Salary transferred!');
	};

	return (
		<div className="form-container">
			<div className="form-wrapper">
				<button className="back-button" onClick={() => navigate('/')}>
					Back
				</button>
				<h2>Payroll Processing Workflow</h2>

				{/* Timesheet Data Collection */}
				<h3>Timesheet Data</h3>
				<input
					type="text"
					name="employeeId"
					placeholder="Employee ID"
					value={timesheetData.employeeId}
					onChange={handleChange}
				/>
				<input
					type="number"
					name="hoursWorked"
					placeholder="Hours Worked"
					value={timesheetData.hoursWorked}
					onChange={handleChange}
				/>
				<input
					type="text"
					name="projectCode"
					placeholder="Project Code"
					value={timesheetData.projectCode}
					onChange={handleChange}
				/>
				<textarea
					name="notes"
					placeholder="Notes"
					value={timesheetData.notes}
					onChange={handleChange}
				/>

				{/* Payroll Calculation */}
				<h3>Payroll Calculation</h3>
				<button onClick={calculatePayroll}>Calculate Payroll</button>
				<p>Gross Pay: ${grossPay.toFixed(2)}</p>
				<p>Tax Deductions: ${taxDeductions.toFixed(2)}</p>
				<p>Net Pay: ${netPay.toFixed(2)}</p>

				{/* Payslip Generation */}
				<h3>Payslip Generation</h3>
				<button onClick={generatePayslip}>Generate Payslip</button>

				{/* Salary Transfer */}
				<h3>Salary Transfer</h3>
				<button onClick={transferSalary}>Transfer Salary</button>
			</div>
		</div>
	);
}

export default PayrollWorkflow;