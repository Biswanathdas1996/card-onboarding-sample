import React, { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CustomerForm from './pages/CustomerForm';
import './App.css';

// Lazy load KYC component for performance optimization
const KYCPage = lazy(() => import('./pages/KYCPage'));
const LoginPage = lazy(() => import('./pages/LoginPage')); // Lazy load Login page

// Loading component for lazy-loaded routes
function LoadingSpinner() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>Loading...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState(null);
  const sessionTimeout = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
      if (storedLoginStatus === 'true') {
          setIsLoggedIn(true);
      }
    const checkSession = () => {
      if (!lastActivity) return;
      const now = Date.now();
      if (now - lastActivity > sessionTimeout) {
        logout();
      }
    };

    const activityListener = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', activityListener);
    window.addEventListener('keydown', activityListener);

    let interval = setInterval(checkSession, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', activityListener);
      window.removeEventListener('keydown', activityListener);
    };
  }, [lastActivity, navigate]);

  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    setLastActivity(Date.now());
    navigate('/form');
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/form" element={<CustomerForm />} />
        <Route 
          path="/kyc" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <KYCPage />
            </Suspense>
          } 
        />
        <Route 
          path="/login" 
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <LoginPage onLogin={login} />
            </Suspense>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;