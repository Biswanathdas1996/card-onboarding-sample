const { pool } = require('../../db/config');

const SENSITIVE_KEYS = ['password', 'password_hash', 'mfa_code', 'otp', 'secret', 'token'];

const sanitizeDetails = (details) => {
	if (!details || typeof details !== 'object') {
		return details;
	}

	const sanitized = Object.assign({}, details);

	SENSITIVE_KEYS.forEach((key) => {
		if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
			delete sanitized[key];
		}
	});

	return sanitized;
};

const logAuditEvent = async (client, { userId, action, ipAddress, details }) => {
	const sanitizedDetails = sanitizeDetails(details);

	const queryText = `
		INSERT INTO audit_logs (user_id, action, ip_address, details, created_at)
		VALUES ($1, $2, $3, $4, NOW())
	`;

	const values = [
		userId || null,
		action,
		ipAddress || null,
		sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
	];

	try {
		if (client && typeof client.query === 'function') {
			await client.query(queryText, values);
		} else {
			await pool.query(queryText, values);
		}
	} catch (err) {
		console.error('[auditLogger] Failed to write audit log entry:', err.message);
	}
};

const auditLoggerMiddleware = (req, res, next) => {
	const ipAddress =
		req.headers['x-forwarded-for']
			? req.headers['x-forwarded-for'].split(',')[0].trim()
			: req.socket && req.socket.remoteAddress
			? req.socket.remoteAddress
			: null;

	req.auditLog = async ({ userId, action, details }) => {
		await logAuditEvent(null, { userId, action, ipAddress, details });
	};

	next();
};

module.exports = {
	logAuditEvent,
	auditLoggerMiddleware,
};