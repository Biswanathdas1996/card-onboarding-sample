import React from 'react';
import { useNavigate } from 'react-router-dom';

function ViewTimesheets() {
	const navigate = useNavigate();

	return (
		<div>
			<h1>View Timesheets</h1>
			<p>This page will display the employee's submitted timesheets.</p>
			<button onClick={() => navigate('/')}>Back to Home</button>
		</div>
	);
}

export default ViewTimesheets;