const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const MFAModel = require('../models/MFAModel');
const auditLogger = require('../middleware/auditLogger');

const OTP_EXPIRY_MINUTES = 10;
const MAX_MFA_ATTEMPTS = 3;
const OTP_LENGTH = 6;
const BCRYPT_SALT_ROUNDS = 10;

const generateOTP = () => {
	const digits = '0123456789';
	let otp = '';
	for (let i = 0; i < OTP_LENGTH; i++) {
		otp += digits[Math.floor(Math.random() * digits.length)];
	}
	return otp;
};

const generateChallenge = async (userId, ipAddress) => {
	if (!userId) {
		return {
			success: false,
			error: 'User ID is required to generate MFA challenge',
		};
	}

	let plainOtp = null;
	let sessionToken = null;

	try {
		plainOtp = generateOTP();
		sessionToken = uuidv4();

		const otpHash = await bcrypt.hash(plainOtp, BCRYPT_SALT_ROUNDS);

		const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

		await MFAModel.createChallenge({
			userId,
			sessionToken,
			otpHash,
			expiresAt,
			ipAddress: ipAddress || null,
		});

		return {
			success: true,
			sessionToken,
			otp: plainOtp,
			expiresAt,
		};
	} catch (err) {
		await auditLogger.log({
			userId: userId || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA challenge generation error',
		});

		return {
			success: false,
			error: 'An unexpected error occurred while generating MFA challenge. Please try again.',
		};
	}
};

const verifyChallenge = async (sessionToken, providedCode, ipAddress) => {
	if (!sessionToken || !providedCode) {
		return {
			success: false,
			attemptsExceeded: false,
			error: 'Session token and MFA code are required',
		};
	}

	let challenge = null;

	try {
		challenge = await MFAModel.findBySessionToken(sessionToken);
	} catch (err) {
		await auditLogger.log({
			userId: null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA challenge lookup error',
		});

		return {
			success: false,
			attemptsExceeded: false,
			error: 'An unexpected error occurred. Please try again.',
		};
	}

	if (!challenge) {
		await auditLogger.log({
			userId: null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA challenge not found for session token',
		});

		return {
			success: false,
			attemptsExceeded: false,
			error: 'Invalid or expired MFA session. Please log in again.',
		};
	}

	if (challenge.used) {
		await auditLogger.log({
			userId: challenge.user_id || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA challenge already used',
		});

		return {
			success: false,
			attemptsExceeded: false,
			error: 'This MFA session has already been used. Please log in again.',
		};
	}

	const now = new Date();
	const expiresAt = new Date(challenge.expires_at);

	if (now > expiresAt) {
		await auditLogger.log({
			userId: challenge.user_id || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA challenge expired',
		});

		return {
			success: false,
			attemptsExceeded: false,
			error: 'MFA code has expired. Please log in again.',
		};
	}

	const currentAttempts = challenge.attempts || 0;

	if (currentAttempts >= MAX_MFA_ATTEMPTS) {
		await auditLogger.log({
			userId: challenge.user_id || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA Failed - attempt limit exceeded',
		});

		return {
			success: false,
			attemptsExceeded: true,
			error: 'Maximum MFA attempts exceeded. Please log in again.',
		};
	}

	let codeValid = false;

	try {
		codeValid = await bcrypt.compare(String(providedCode), challenge.otp_hash);
	} catch (err) {
		await auditLogger.log({
			userId: challenge.user_id || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA code comparison error',
		});

		return {
			success: false,
			attemptsExceeded: false,
			error: 'An unexpected error occurred. Please try again.',
		};
	}

	if (!codeValid) {
		let updatedAttempts = currentAttempts;

		try {
			updatedAttempts = await MFAModel.incrementAttempts(sessionToken);
		} catch (err) {
			// non-fatal, continue to return failure
		}

		const attemptsExceeded = updatedAttempts >= MAX_MFA_ATTEMPTS;

		await auditLogger.log({
			userId: challenge.user_id || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA Failed',
		});

		return {
			success: false,
			attemptsExceeded,
			error: attemptsExceeded
				? 'Maximum MFA attempts exceeded. Please log in again.'
				: 'Invalid MFA code. Please try again.',
		};
	}

	try {
		await MFAModel.markUsed(sessionToken);
	} catch (err) {
		await auditLogger.log({
			userId: challenge.user_id || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA challenge mark-used error',
		});

		return {
			success: false,
			attemptsExceeded: false,
			error: 'An unexpected error occurred. Please try again.',
		};
	}

	let session = null;

	try {
		const sessionService = require('./sessionService');
		session = await sessionService.createSession(challenge.user_id, ipAddress);
	} catch (err) {
		await auditLogger.log({
			userId: challenge.user_id || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'Session creation error after MFA success',
		});

		return {
			success: false,
			attemptsExceeded: false,
			error: 'An unexpected error occurred while creating your session. Please try again.',
		};
	}

	await auditLogger.log({
		userId: challenge.user_id || null,
		action: 'LOGIN_SUCCESS',
		ipAddress: ipAddress || null,
		details: 'MFA verification successful',
	});

	return {
		success: true,
		attemptsExceeded: false,
		userId: challenge.user_id,
		session,
	};
};

module.exports = {
	generateChallenge,
	verifyChallenge,
};