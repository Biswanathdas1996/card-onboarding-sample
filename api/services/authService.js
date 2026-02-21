const bcrypt = require('bcryptjs');

const UserModel = require('../models/UserModel');
const mfaService = require('./mfaService');
const auditLogger = require('../middleware/auditLogger');

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MINUTES = 30;

const normalizeEmail = (email) => {
	if (!email || typeof email !== 'string') return '';
	return email.trim().toLowerCase();
};

const isAccountLocked = (user) => {
	if (!user.is_locked) return false;
	if (!user.locked_at) return false;

	const lockedAt = new Date(user.locked_at);
	const lockoutExpiry = new Date(lockedAt.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
	const now = new Date();

	if (now >= lockoutExpiry) {
		return false;
	}

	return true;
};

const getLockoutRemainingMinutes = (user) => {
	if (!user.locked_at) return 0;

	const lockedAt = new Date(user.locked_at);
	const lockoutExpiry = new Date(lockedAt.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
	const now = new Date();
	const remainingMs = lockoutExpiry - now;

	if (remainingMs <= 0) return 0;

	return Math.ceil(remainingMs / 60000);
};

const loginWithCredentials = async (email, password, ipAddress) => {
	const normalizedEmail = normalizeEmail(email);

	if (!normalizedEmail || !password) {
		await auditLogger.log({
			userId: null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'Missing email or password',
		});

		return {
			success: false,
			mfaPending: false,
			locked: false,
			error: 'Invalid email or password',
		};
	}

	let user = null;

	try {
		user = await UserModel.findByEmail(normalizedEmail);
	} catch (err) {
		await auditLogger.log({
			userId: null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'Database error during user lookup',
		});

		return {
			success: false,
			mfaPending: false,
			locked: false,
			error: 'An unexpected error occurred. Please try again.',
		};
	}

	if (!user) {
		await auditLogger.log({
			userId: null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: `Unknown Email: ${normalizedEmail}`,
		});

		return {
			success: false,
			mfaPending: false,
			locked: false,
			error: 'Invalid email or password',
		};
	}

	if (isAccountLocked(user)) {
		const remainingMinutes = getLockoutRemainingMinutes(user);

		await auditLogger.log({
			userId: user.id,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'Login Attempt While Locked',
		});

		return {
			success: false,
			mfaPending: false,
			locked: true,
			remainingMinutes,
			error: `Your account is locked. Please try again in ${remainingMinutes} minute(s).`,
		};
	}

	let passwordValid = false;

	try {
		passwordValid = await bcrypt.compare(password, user.password_hash);
	} catch (err) {
		await auditLogger.log({
			userId: user.id,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'Password comparison error',
		});

		return {
			success: false,
			mfaPending: false,
			locked: false,
			error: 'An unexpected error occurred. Please try again.',
		};
	}

	if (!passwordValid) {
		let updatedUser = null;

		try {
			updatedUser = await UserModel.incrementFailedAttempts(user.id);
		} catch (err) {
			await auditLogger.log({
				userId: user.id,
				action: 'LOGIN_FAIL',
				ipAddress: ipAddress || null,
				details: 'Invalid Password',
			});

			return {
				success: false,
				mfaPending: false,
				locked: false,
				error: 'Invalid email or password',
			};
		}

		const newFailedAttempts = updatedUser
			? updatedUser.failed_login_attempts
			: (user.failed_login_attempts || 0) + 1;

		if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
			try {
				await UserModel.lockAccount(user.id);
			} catch (err) {
				// best effort lock
			}

			await auditLogger.log({
				userId: user.id,
				action: 'LOGIN_FAIL',
				ipAddress: ipAddress || null,
				details: 'Account Locked',
			});

			return {
				success: false,
				mfaPending: false,
				locked: true,
				remainingMinutes: LOCKOUT_DURATION_MINUTES,
				error: `Your account has been locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
			};
		}

		await auditLogger.log({
			userId: user.id,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'Invalid Password',
		});

		return {
			success: false,
			mfaPending: false,
			locked: false,
			error: 'Invalid email or password',
		};
	}

	let mfaResult = null;

	try {
		mfaResult = await mfaService.initiateMfaChallenge(user.id);
	} catch (err) {
		await auditLogger.log({
			userId: user.id,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA initiation error',
		});

		return {
			success: false,
			mfaPending: false,
			locked: false,
			error: 'An unexpected error occurred during MFA setup. Please try again.',
		};
	}

	return {
		success: true,
		mfaPending: true,
		locked: false,
		userId: user.id,
		mfaChallengeToken: mfaResult ? mfaResult.challengeToken : null,
		error: null,
	};
};

const completeMfaAndLogin = async (userId, mfaCode, challengeToken, ipAddress) => {
	let user = null;

	try {
		user = await UserModel.findById(userId);
	} catch (err) {
		await auditLogger.log({
			userId: userId || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA Failed - user lookup error',
		});

		return {
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		};
	}

	if (!user) {
		await auditLogger.log({
			userId: userId || null,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA Failed - user not found',
		});

		return {
			success: false,
			error: 'Invalid session. Please log in again.',
		};
	}

	if (isAccountLocked(user)) {
		const remainingMinutes = getLockoutRemainingMinutes(user);

		await auditLogger.log({
			userId: user.id,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'Login Attempt While Locked',
		});

		return {
			success: false,
			locked: true,
			remainingMinutes,
			error: `Your account is locked. Please try again in ${remainingMinutes} minute(s).`,
		};
	}

	let mfaValid = false;

	try {
		mfaValid = await mfaService.verifyMfaChallenge(userId, mfaCode, challengeToken);
	} catch (err) {
		await auditLogger.log({
			userId: user.id,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA Failed',
		});

		return {
			success: false,
			error: 'MFA validation failed. Please try again.',
		};
	}

	if (!mfaValid) {
		await auditLogger.log({
			userId: user.id,
			action: 'LOGIN_FAIL',
			ipAddress: ipAddress || null,
			details: 'MFA Failed',
		});

		return {
			success: false,
			error: 'Invalid MFA code. Please try again.',
		};
	}

	try {
		await UserModel.resetFailedAttempts(user.id);
	} catch (err) {
		// best effort reset
	}

	await auditLogger.log({
		userId: user.id,
		action: 'LOGIN_SUCCESS',
		ipAddress: ipAddress || null,
		details: 'Login successful after MFA validation',
	});

	return {
		success: true,
		userId: user.id,
		email: user.email,
		error: null,
	};
};

module.exports = {
	loginWithCredentials,
	completeMfaAndLogin,
	normalizeEmail,
	isAccountLocked,
	getLockoutRemainingMinutes,
	MAX_FAILED_ATTEMPTS,
	LOCKOUT_DURATION_MINUTES,
};