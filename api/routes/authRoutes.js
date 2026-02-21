const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const pool = require('../../db/pool');

const LOCKOUT_THRESHOLD = 3;
const LOCKOUT_DURATION_MINUTES = 30;

const rateLimiterStore = {};

const rateLimiter = (req, res, next) => {
	const ip = req.ip || req.connection.remoteAddress || 'unknown';
	const now = Date.now();
	const windowMs = 15 * 60 * 1000;
	const maxRequests = 20;

	if (!rateLimiterStore[ip]) {
		rateLimiterStore[ip] = { count: 1, resetAt: now + windowMs };
		return next();
	}

	if (now > rateLimiterStore[ip].resetAt) {
		rateLimiterStore[ip] = { count: 1, resetAt: now + windowMs };
		return next();
	}

	rateLimiterStore[ip].count += 1;

	if (rateLimiterStore[ip].count > maxRequests) {
		return res.status(429).json({ error: 'Too many requests. Please try again later.' });
	}

	next();
};

const auditLogger = async (req, res, next) => {
	req.auditLog = async ({ userId, action, details }) => {
		try {
			const ip = req.ip || req.connection.remoteAddress || 'unknown';
			await pool.query(
				`INSERT INTO audit_logs (id, user_id, action, ip_address, details, created_at)
				 VALUES ($1, $2, $3, $4, $5, NOW())`,
				[uuidv4(), userId || null, action, ip, details || null]
			);
		} catch (err) {
			console.error('Audit log error:', err.message);
		}
	};
	next();
};

router.use(auditLogger);

router.post('/login', rateLimiter, async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: 'Email and password are required.' });
	}

	const normalizedEmail = email.trim().toLowerCase();

	let user;
	try {
		const result = await pool.query(
			'SELECT id, email, password_hash, failed_login_attempts, locked_until FROM users WHERE LOWER(email) = $1',
			[normalizedEmail]
		);
		user = result.rows[0];
	} catch (err) {
		console.error('Login DB error:', err.message);
		return res.status(500).json({ error: 'Internal server error.' });
	}

	if (!user) {
		await req.auditLog({
			userId: null,
			action: 'LOGIN_FAIL',
			details: `User Not Found: ${normalizedEmail}`
		});
		return res.status(401).json({ error: 'Invalid email or password.' });
	}

	if (user.locked_until && new Date(user.locked_until) > new Date()) {
		await req.auditLog({
			userId: user.id,
			action: 'LOGIN_FAIL',
			details: 'Login Attempt While Locked'
		});
		return res.status(403).json({
			error: 'Your account is temporarily locked due to multiple failed login attempts. Please try again later.'
		});
	}

	let passwordMatch;
	try {
		passwordMatch = await bcrypt.compare(password, user.password_hash);
	} catch (err) {
		console.error('bcrypt error:', err.message);
		return res.status(500).json({ error: 'Internal server error.' });
	}

	if (!passwordMatch) {
		const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
		let lockedUntil = null;

		if (newFailedAttempts >= LOCKOUT_THRESHOLD) {
			const lockoutTime = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
			lockedUntil = lockoutTime;
		}

		try {
			await pool.query(
				'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
				[newFailedAttempts, lockedUntil, user.id]
			);
		} catch (err) {
			console.error('Failed attempt update error:', err.message);
		}

		const details = lockedUntil ? 'Account Locked' : 'Invalid Password';
		await req.auditLog({
			userId: user.id,
			action: 'LOGIN_FAIL',
			details
		});

		return res.status(401).json({ error: 'Invalid email or password.' });
	}

	const mfaToken = uuidv4();
	const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
	const mfaExpiry = new Date(Date.now() + 10 * 60 * 1000);

	try {
		await pool.query(
			`INSERT INTO mfa_challenges (id, user_id, mfa_token, mfa_code, expires_at, created_at)
			 VALUES ($1, $2, $3, $4, $5, NOW())
			 ON CONFLICT (user_id) DO UPDATE
			 SET id = EXCLUDED.id, mfa_token = EXCLUDED.mfa_token, mfa_code = EXCLUDED.mfa_code, expires_at = EXCLUDED.expires_at, created_at = EXCLUDED.created_at`,
			[uuidv4(), user.id, mfaToken, mfaCode, mfaExpiry]
		);
	} catch (err) {
		console.error('MFA challenge insert error:', err.message);
		return res.status(500).json({ error: 'Internal server error.' });
	}

	console.info(`[MFA] Code for user ${user.id}: ${mfaCode}`);

	return res.status(200).json({
		message: 'Primary authentication successful. MFA required.',
		mfaToken
	});
});

router.post('/mfa/verify', rateLimiter, async (req, res) => {
	const { mfaToken, mfaCode } = req.body;

	if (!mfaToken || !mfaCode) {
		return res.status(400).json({ error: 'MFA token and code are required.' });
	}

	let challenge;
	try {
		const result = await pool.query(
			'SELECT id, user_id, mfa_code, expires_at FROM mfa_challenges WHERE mfa_token = $1',
			[mfaToken]
		);
		challenge = result.rows[0];
	} catch (err) {
		console.error('MFA lookup error:', err.message);
		return res.status(500).json({ error: 'Internal server error.' });
	}

	if (!challenge) {
		return res.status(401).json({ error: 'Invalid or expired MFA session.' });
	}

	if (new Date(challenge.expires_at) < new Date()) {
		await req.auditLog({
			userId: challenge.user_id,
			action: 'LOGIN_FAIL',
			details: 'MFA Failed: Code Expired'
		});
		return res.status(401).json({ error: 'MFA code has expired. Please log in again.' });
	}

	if (challenge.mfa_code !== String(mfaCode).trim()) {
		await req.auditLog({
			userId: challenge.user_id,
			action: 'LOGIN_FAIL',
			details: 'MFA Failed'
		});
		return res.status(401).json({ error: 'Invalid MFA code.' });
	}

	try {
		await pool.query(
			'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
			[challenge.user_id]
		);
	} catch (err) {
		console.error('Reset failed attempts error:', err.message);
	}

	try {
		await pool.query('DELETE FROM mfa_challenges WHERE mfa_token = $1', [mfaToken]);
	} catch (err) {
		console.error('MFA challenge cleanup error:', err.message);
	}

	const sessionToken = uuidv4();
	const sessionExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000);

	try {
		await pool.query(
			`INSERT INTO sessions (id, user_id, session_token, expires_at, created_at)
			 VALUES ($1, $2, $3, $4, NOW())`,
			[uuidv4(), challenge.user_id, sessionToken, sessionExpiry]
		);
	} catch (err) {
		console.error('Session creation error:', err.message);
		return res.status(500).json({ error: 'Internal server error.' });
	}

	await req.auditLog({
		userId: challenge.user_id,
		action: 'LOGIN_SUCCESS',
		details: 'Login successful after MFA validation'
	});

	return res.status(200).json({
		message: 'Authentication successful.',
		sessionToken
	});
});

router.post('/forgot-password', async (req, res) => {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ error: 'Email is required.' });
	}

	const normalizedEmail = email.trim().toLowerCase();

	let user;
	try {
		const result = await pool.query(
			'SELECT id, email FROM users WHERE LOWER(email) = $1',
			[normalizedEmail]
		);
		user = result.rows[0];
	} catch (err) {
		console.error('Forgot password DB error:', err.message);
		return res.status(500).json({ error: 'Internal server error.' });
	}

	if (!user) {
		return res.status(200).json({
			message: 'If an account with that email exists, a password reset link has been sent.'
		});
	}

	const resetToken = uuidv4();
	const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

	try {
		await pool.query(
			`INSERT INTO password_resets (id, user_id, token, expires_at, used, created_at)
			 VALUES ($1, $2, $3, $4, false, NOW())`,
			[uuidv4(), user.id, resetToken, resetExpiry]
		);
	} catch (err) {
		console.error('Password reset insert error:', err.message);
		return res.status(500).json({ error: 'Internal server error.' });
	}

	await req.auditLog({
		userId: user.id,
		action: 'PASSWORD_RESET_REQUESTED',
		details: `Password reset initiated for ${normalizedEmail}`
	});

	console.info(`[PASSWORD RESET] Token for user ${user.id}: ${resetToken}`);

	return res.status(200).json({
		message: 'If an account with that email exists, a password reset link has been sent.'
	});
});

module.exports = router;