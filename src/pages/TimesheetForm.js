import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FormValidator from '../services/FormValidator';

function TimesheetForm() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		employeeId: '',
		weekEnding: '',
		mondayHours: '',
		tuesdayHours: '',
		wednesdayHours: '',
		thursdayHours: '',
		fridayHours: '',
		saturdayHours: '',
		sundayHours: '',
		notes: ''
	});

	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState('');
	const [fieldErrors, setFieldErrors] = useState({});

	const filledFields = useMemo(() => {
		return Object.values(formData).filter(val => val.trim() !== '').length;
	}, [formData]);

	const totalFields = Object.keys(formData).length;
	const progress = Math.round((filledFields / totalFields) * 100);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		setError('');

		// Clear field-specific error when user starts typing
		if (fieldErrors[name]) {
			const validationError = FormValidator.validateField(name, value);
			setFieldErrors(prev => ({
				...prev,
				[name]: validationError
			}));
		}
	};

	const validateForm = () => {
		const errors = FormValidator.validateAll(formData, 'timesheet');
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			const firstError = Object.values(errors)[0];
			setError(firstError);
			return false;
		}
		setFieldErrors({});
		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setSubmitted(true);
		setError('');

		try {
			// Submit timesheet form data
			//const response = await TimesheetDataSubmission.submitTimesheetForm(formData);
			const response = { success: true, message: 'Timesheet submitted successfully!' }; // Mock response

			if (response.success) {
				console.log('Timesheet form submitted successfully:', response);
				// Navigate to confirmation page after successful submission
				setTimeout(() => {
					navigate('/confirmation', { state: { message: response.message } });
				}, 1500);
			} else {
				setSubmitted(false);
				setError(response.message || 'Failed to submit timesheet. Please try again.');
				if (response.errors) {
					setFieldErrors(response.errors);
				}
			}
		} catch (err) {
			console.error('Error submitting timesheet form:', err);
			setSubmitted(false);
			setError('An error occurred while submitting your timesheet. Please try again.');
		}
	};

	return (
		<div className="form-container">
			<div className="form-wrapper">
				<button className="back-button" onClick={() => navigate('/')}>
					Back
				</button>
				<h2>Timesheet Submission</h2>
				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="employeeId">Employee ID</label>
						<input
							type="text"
							id="employeeId"
							name="employeeId"
							value={formData.employeeId}
							onChange={handleChange}
						/>
						{fieldErrors.employeeId && <div className="error-message">{fieldErrors.employeeId}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="weekEnding">Week Ending</label>
						<input
							type="date"
							id="weekEnding"
							name="weekEnding"
							value={formData.weekEnding}
							onChange={handleChange}
						/>
						{fieldErrors.weekEnding && <div className="error-message">{fieldErrors.weekEnding}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="mondayHours">Monday Hours</label>
						<input
							type="number"
							id="mondayHours"
							name="mondayHours"
							value={formData.mondayHours}
							onChange={handleChange}
							step="0.5"
						/>
						{fieldErrors.mondayHours && <div className="error-message">{fieldErrors.mondayHours}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="tuesdayHours">Tuesday Hours</label>
						<input
							type="number"
							id="tuesdayHours"
							name="tuesdayHours"
							value={formData.tuesdayHours}
							onChange={handleChange}
							step="0.5"
						/>
						{fieldErrors.tuesdayHours && <div className="error-message">{fieldErrors.tuesdayHours}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="wednesdayHours">Wednesday Hours</label>
						<input
							type="number"
							id="wednesdayHours"
							name="wednesdayHours"
							value={formData.wednesdayHours}
							onChange={handleChange}
							step="0.5"
						/>
						{fieldErrors.wednesdayHours && <div className="error-message">{fieldErrors.wednesdayHours}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="thursdayHours">Thursday Hours</label>
						<input
							type="number"
							id="thursdayHours"
							name="thursdayHours"
							value={formData.thursdayHours}
							onChange={handleChange}
							step="0.5"
						/>
						{fieldErrors.thursdayHours && <div className="error-message">{fieldErrors.thursdayHours}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="fridayHours">Friday Hours</label>
						<input
							type="number"
							id="fridayHours"
							name="fridayHours"
							value={formData.fridayHours}
							onChange={handleChange}
							step="0.5"
						/>
						{fieldErrors.fridayHours && <div className="error-message">{fieldErrors.fridayHours}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="saturdayHours">Saturday Hours</label>
						<input
							type="number"
							id="saturdayHours"
							name="saturdayHours"
							value={formData.saturdayHours}
							onChange={handleChange}
							step="0.5"
						/>
						{fieldErrors.saturdayHours && <div className="error-message">{fieldErrors.saturdayHours}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="sundayHours">Sunday Hours</label>
						<input
							type="number"
							id="sundayHours"
							name="sundayHours"
							value={formData.sundayHours}
							onChange={handleChange}
							step="0.5"
						/>
						{fieldErrors.sundayHours && <div className="error-message">{fieldErrors.sundayHours}</div>}
					</div>

					<div className="form-group">
						<label htmlFor="notes">Notes</label>
						<textarea
							id="notes"
							name="notes"
							value={formData.notes}
							onChange={handleChange}
						/>
						{fieldErrors.notes && <div className="error-message">{fieldErrors.notes}</div>}
					</div>

					{error && <div className="error-message">{error}</div>}

					<button type="submit" disabled={submitted}>
						{submitted ? 'Submitting...' : 'Submit Timesheet'}
					</button>
				</form>
			</div>
		</div>
	);
}

export default TimesheetForm;