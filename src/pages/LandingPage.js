import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '⚡',
      title: 'Instant Approval',
      description: 'Get approved in minutes with our streamlined application process'
    },
    {
      icon: '🎁',
      title: 'Exclusive Rewards',
      description: 'Earn points on every purchase and redeem for travel, cashback, and more'
    },
    {
      icon: '💎',
      title: 'No Annual Fee',
      description: 'Enjoy all premium benefits without paying yearly membership fees'
    },
    {
      icon: '🛡️',
      title: '24/7 Support',
      description: 'Our dedicated team is always ready to assist you anytime, anywhere'
    }
  ];

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="logo-badge">
          <span></span>
          Now accepting applications
        </div>

        <h1>The Card That Works<br />As Hard As You Do</h1>
        
        <p className="subtitle">
          Apply for your premium credit card in minutes. Unlock exclusive rewards, 
          zero annual fees, and a seamless financial experience.
        </p>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="cta-section">
          <button className="cta-button" onClick={() => navigate('/form')}>
            Get Started
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <p className="cta-note">No credit check required to apply</p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
