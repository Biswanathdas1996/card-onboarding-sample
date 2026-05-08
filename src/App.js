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
      background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        animation: 'pulseGlow 6s ease-in-out infinite'
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
        zIndex: 1,
        position: 'relative'
      }}>
        {/* Modern.Loader Container */}
        <div style={{
          width: '60px',
          height: '60px',
          position: 'relative'
        }}>
          {/* Outer glowing circle */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '4px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '50%',
            animation: 'outerSpin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }} />
          {/* Inner circle */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            border: '4px solid transparent',
            borderTop: '4px solid #6366f1',
            borderRight: '4px solid #a855f7',
            borderRadius: '50%',
            animation: 'innerSpin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }} />
          {/* Center dot */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '8px',
            height: '8px',
            transform: 'translate(-50%, -50%)',
            background: '#ffffff',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)'
          }} />
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem',
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}>Loading...</p>
          <div style={{
            display: 'flex',
            gap: '4px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#6366f1',
              borderRadius: '50%',
              animation: 'bounce 1s ease-in-out infinite'
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              background: '#8b5cf6',
              borderRadius: '50%',
              animation: 'bounce 1s ease-in-out 0.2s infinite'
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              background: '#d946ef',
              borderRadius: '50%',
              animation: 'bounce 1s ease-in-out 0.4s infinite'
            }} />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes outerSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes innerSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
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
