const WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const MFA_MAX_ATTEMPTS = 5;

const loginStore = new Map();
const mfaStore = new Map();

const getClientIp = (req) => {
	if (req.headers['x-forwarded-for']) {
		return req.headers['x-forwarded-for'].split(',')[0].trim();
	}
	if (req.socket && req.socket.remoteAddress) {
		return req.socket.remoteAddress;
	}
	return 'unknown';
};

const pruneExpiredEntries = (store) => {
	const now = Date.now();
	for (const [key, record] of store.entries()) {
		if (record.windowStart + WINDOW_MS < now) {
			store.delete(key);
		}
	}
};

const isRateLimited = (store, key, maxAttempts) => {
	const now = Date.now();

	pruneExpiredEntries(store);

	if (!store.has(key)) {
		store.set(key, { count: 1, windowStart: now });
		return false;
	}

	const record = store.get(key);

	if (record.windowStart + WINDOW_MS < now) {
		store.set(key, { count: 1, windowStart: now });
		return false;
	}

	record.count += 1;

	if (record.count > maxAttempts) {
		return true;
	}

	return false;
};

const loginRateLimiter = (req, res, next) => {
	const ip = getClientIp(req);
	const key = `login:${ip}`;

	if (isRateLimited(loginStore, key, LOGIN_MAX_ATTEMPTS)) {
		console.warn(`[rateLimiter] Login rate limit exceeded for IP: ${ip}`);
		return res.status(429).json({
			error: 'Too many requests. Please try again later.',
		});
	}

	next();
};

const mfaRateLimiter = (req, res, next) => {
	const sessionToken =
		req.body && req.body.session_token
			? req.body.session_token
			: req.headers['x-session-token']
			? req.headers['x-session-token']
			: null;

	const ip = getClientIp(req);
	const key = sessionToken ? `mfa:session:${sessionToken}` : `mfa:ip:${ip}`;

	if (isRateLimited(mfaStore, key, MFA_MAX_ATTEMPTS)) {
		console.warn(`[rateLimiter] MFA rate limit exceeded for key: ${key}`);
		return res.status(429).json({
			error: 'Too many requests. Please try again later.',
		});
	}

	next();
};

const resetMfaLimit = (sessionToken) => {
	if (!sessionToken) {
		return;
	}
	const key = `mfa:session:${sessionToken}`;
	mfaStore.delete(key);
};

const resetLoginLimit = (ip) => {
	if (!ip) {
		return;
	}
	const key = `login:${ip}`;
	loginStore.delete(key);
};

module.exports = {
	loginRateLimiter,
	mfaRateLimiter,
	resetMfaLimit,
	resetLoginLimit,
};