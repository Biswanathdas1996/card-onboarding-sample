const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

let authService;
let mfaService;
let auditLogger;
let PasswordResetModel;

try {
	authService = require('../services/authService');
} catch (e) {
	authService = null;
}

try {
	mfaService = require('../services/mfaService');
} catch (e) {
	mfaService = null;
}

try {
	auditLogger = require('../services/auditLogger');
} catch (e) {
	auditLogger = null;
}

try {
	PasswordResetModel = require('../models/PasswordResetModel');
} catch (e) {
	PasswordResetModel = null;
}

const getClientIp = (req) => {
	return (
		req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
		req.headers['x-real-ip'] ||
		req.connection?.remoteAddress ||
		req.socket?.remoteAddress ||
		req.ip ||
		'unknown'
	);
};

const safeAuditLog = async (params) => {
	if (!auditLogger) return;
	try {
		await auditLogger.log(params);
	} catch (err) {
		console.error('[authController] auditLogger error:', err.message);
	}
};

const postLogin = async (req, res) => {
	const ipAddress = getClientIp(req);

	try {
		const { email, password } = req.body || {};

		if (!email || typeof email !== 'string' || !email.trim()) {
			await safeAuditLog({
				userId: null,
				action: 'LOGIN_FAIL',
				ipAddress,
				details: 'Missing email field',
			});
			return res.status(400).json({
				success: false,
				error: 'Invalid email or password',
			});
		}

		if (!password || typeof password !== 'string') {
			await safeAuditLog({
				userId: null,
				action: 'LOGIN_FAIL',
				ipAddress,
				details: 'Missing password field',
			});
			return res.status(400).json({
				success: false,
				error: 'Invalid email or password',
			});
		}

		const normalizedEmail = email.trim().toLowerCase();

		if (!authService) {
			return res.status(503).json({
				success: false,
				error: 'Authentication service unavailable',
			});
		}

		let result;
		try {
			result = await authService.loginWithCredentials({
				email: normalizedEmail,
				password,
				ipAddress,
			});
		} catch (serviceErr) {
			console.error('[authController] authService.loginWithCredentials error:', serviceErr.message);

			await safeAuditLog({
				userId: null,
				action: 'LOGIN_FAIL',
				ipAddress,
				details: serviceErr.message || 'Authentication service error',
			});

			if (serviceErr.code === 'ACCOUNT_LOCKED') {
				return res.status(403).json({
					success: false,
					error: 'Your account has been locked due to multiple failed login attempts. Please try again after 30 minutes.',
					code: 'ACCOUNT_LOCKED',
				});
			}

			return res.status(401).json({
				success: false,
				error: 'Invalid email or password',
			});
		}

		if (!result || !result.success) {
			const failDetails = result?.details || 'Invalid credentials';
			const failCode = result?.code || null;

			await safeAuditLog({
				userId: result?.userId || null,
				action: 'LOGIN_FAIL',
				ipAddress,
				details: failDetails,
			});

			if (failCode === 'ACCOUNT_LOCKED') {
				return res.status(403).json({
					success: false,
					error: 'Your account has been locked due to multiple failed login attempts. Please try again after 30 minutes.',
					code: 'ACCOUNT_LOCKED',
				});
			}

			return res.status(401).json({
				success: false,
				error: 'Invalid email or password',
			});
		}

		await safeAuditLog({
			userId: result.userId || null,
			action: 'LOGIN_FAIL',
			ipAddress,
			details: 'Primary credentials accepted; MFA pending',
		});

		return res.status(200).json({
			success: true,
			mfaPending: true,
			sessionToken: result.sessionToken || null,
			message: 'Primary authentication successful. MFA verification required.',
		});
	} catch (err) {
		console.error('[authController] postLogin unexpected error:', err);
		await safeAuditLog({
			userId: null,
			action: 'LOGIN_FAIL',
			ipAddress,
			details: 'Unexpected server error during login',
		});
		return res.status(500).json({
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		});
	}
};

const postMFAVerify = async (req, res) => {
	const ipAddress = getClientIp(req);

	try {
		const { sessionToken, code } = req.body || {};

		if (!sessionToken || typeof sessionToken !== 'string' || !sessionToken.trim()) {
			return res.status(400).json({
				success: false,
				error: 'Session token is required.',
			});
		}

		if (!code || typeof code !== 'string' || !code.trim()) {
			await safeAuditLog({
				userId: null,
				action: 'LOGIN_FAIL',
				ipAddress,
				details: 'MFA Failed: Missing MFA code',
			});
			return res.status(400).json({
				success: false,
				error: 'MFA code is required.',
			});
		}

		if (!mfaService) {
			return res.status(503).json({
				success: false,
				error: 'MFA service unavailable',
			});
		}

		let mfaResult;
		try {
			mfaResult = await mfaService.verifyChallenge({
				sessionToken: sessionToken.trim(),
				code: code.trim(),
				ipAddress,
			});
		} catch (mfaErr) {
			console.error('[authController] mfaService.verifyChallenge error:', mfaErr.message);

			await safeAuditLog({
				userId: mfaErr.userId || null,
				action: 'LOGIN_FAIL',
				ipAddress,
				details: 'MFA Failed: ' + (mfaErr.message || 'MFA verification error'),
			});

			return res.status(401).json({
				success: false,
				error: 'MFA verification failed.',
			});
		}

		if (!mfaResult || !mfaResult.success) {
			await safeAuditLog({
				userId: mfaResult?.userId || null,
				action: 'LOGIN_FAIL',
				ipAddress,
				details: 'MFA Failed: ' + (mfaResult?.details || 'Invalid MFA code'),
			});

			return res.status(401).json({
				success: false,
				error: 'MFA verification failed.',
			});
		}

		await safeAuditLog({
			userId: mfaResult.userId || null,
			action: 'LOGIN_SUCCESS',
			ipAddress,
			details: 'Login successful after MFA verification',
		});

		if (mfaResult.sessionCookie) {
			const cookieOptions = {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 8 * 60 * 60 * 1000,
			};
			res.cookie('session', mfaResult.sessionCookie, cookieOptions);
		}

		const responsePayload = {
			success: true,
			message: 'Authentication successful.',
		};

		if (mfaResult.authToken) {
			responsePayload.authToken = mfaResult.authToken;
		}

		if (mfaResult.user) {
			const { password_hash, secret, mfa_secret, ...safeUser } = mfaResult.user;
			responsePayload.user = safeUser;
		}

		return res.status(200).json(responsePayload);
	} catch (err) {
		console.error('[authController] postMFAVerify unexpected error:', err);
		await safeAuditLog({
			userId: null,
			action: 'LOGIN_FAIL',
			ipAddress,
			details: 'MFA Failed: Unexpected server error',
		});
		return res.status(500).json({
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		});
	}
};

const postForgotPassword = async (req, res) => {
	const ipAddress = getClientIp(req);

	try {
		const { email } = req.body || {};

		if (!email || typeof email !== 'string' || !email.trim()) {
			return res.status(400).json({
				success: false,
				error: 'A valid email address is required.',
			});
		}

		const normalizedEmail = email.trim().toLowerCase();

		const genericResponse = {
			success: true,
			message: 'If an account with that email exists, a password reset link has been sent.',
		};

		if (!PasswordResetModel) {
			console.warn('[authController] PasswordResetModel not available');
			return res.status(200).json(genericResponse);
		}

		let resetResult;
		try {
			resetResult = await PasswordResetModel.createResetToken({ email: normalizedEmail });
		} catch (modelErr) {
			console.error('[authController] PasswordResetModel.createResetToken error:', modelErr.message);
			return res.status(200).json(genericResponse);
		}

		if (resetResult && resetResult.userId) {
			await safeAuditLog({
				userId: resetResult.userId,
				action: 'PASSWORD_RESET_REQUESTED',
				ipAddress,
				details: 'Password reset token created',
			});
		}

		return res.status(200).json(genericResponse);
	} catch (err) {
		console.error('[authController] postForgotPassword unexpected error:', err);
		return res.status(500).json({
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		});
	}
};

module.exports = {
	postLogin,
	postMFAVerify,
	postForgotPassword,
};