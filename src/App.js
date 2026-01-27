import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CustomerForm from './pages/CustomerForm';
import './App.css';

// Lazy load KYC component for performance optimization
const KYCPage = lazy(() => import('./pages/KYCPage'));

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
  return (
    <Router>
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
