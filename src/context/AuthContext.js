import React, { createContext, useState, useCallback, useContext } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(null);
	const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const isAuthenticated = Boolean(authToken && currentUser);

	const login = useCallback(async (email, password) => {
		setLoading(true);
		setError(null);
		try {
			const result = await AuthService.login(email, password);
			return result;
		} catch (err) {
			const message = err.message || 'Invalid email or password';
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	const verifyMFA = useCallback(async (sessionToken, code) => {
		setLoading(true);
		setError(null);
		try {
			const result = await AuthService.verifyMFA(sessionToken, code);
			if (result && result.token) {
				setAuthToken(result.token);
				localStorage.setItem('authToken', result.token);
			}
			if (result && result.user) {
				setCurrentUser(result.user);
			}
			return result;
		} catch (err) {
			const message = err.message || 'MFA verification failed';
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			if (authToken) {
				await AuthService.logout(authToken);
			}
		} catch (err) {
			// Silently handle logout errors to ensure local state is always cleared
		} finally {
			setCurrentUser(null);
			setAuthToken(null);
			localStorage.removeItem('authToken');
			setLoading(false);
		}
	}, [authToken]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const value = {
		currentUser,
		authToken,
		isAuthenticated,
		loading,
		error,
		login,
		verifyMFA,
		logout,
		clearError,
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

export default AuthContext;