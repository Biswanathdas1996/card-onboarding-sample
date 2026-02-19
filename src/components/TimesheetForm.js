import React, { useState } from 'react';

function TimesheetForm() {
	const [hoursWorked, setHoursWorked] = useState('');
	const [projectCode, setProjectCode] = useState('');
	const [notes, setNotes] = useState('');

	const handleSubmit = (event) => {
		event.preventDefault();
		// TODO: Implement data validation and submission logic here
		console.log('Hours Worked:', hoursWorked);
		console.log('Project Code:', projectCode);
		console.log('Notes:', notes);
		// Reset form fields after submission
		setHoursWorked('');
		setProjectCode('');
		setNotes('');
	};

	return (
		<form onSubmit={handleSubmit}>
			<div>
				<label htmlFor="hoursWorked">Hours Worked:</label>
				<input
					type="number"
					id="hoursWorked"
					value={hoursWorked}
					onChange={(e) => setHoursWorked(e.target.value)}
					required
				/>
			</div>
			<div>
				<label htmlFor="projectCode">Project Code:</label>
				<input
					type="text"
					id="projectCode"
					value={projectCode}
					onChange={(e) => setProjectCode(e.target.value)}
					required
				/>
			</div>
			<div>
				<label htmlFor="notes">Notes:</label>
				<textarea
					id="notes"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
				/>
			</div>
			<button type="submit">Submit Timesheet</button>
		</form>
	);
}

export default TimesheetForm;