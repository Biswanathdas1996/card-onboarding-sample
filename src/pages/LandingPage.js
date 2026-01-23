import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1>Welcome to CardOnboard</h1>
        <p>Apply for your premium credit card in just a few minutes</p>
        
        <ul className="feature-list">
          <li>Instant approval</li>
          <li>Exclusive rewards</li>
          <li>No annual fee</li>
          <li>24/7 customer support</li>
        </ul>

        <p>
          Start your journey towards financial freedom and unlock amazing benefits with our premium credit card.
        </p>

        <button className="cta-button" onClick={() => navigate('/form')}>
          Get Started Now
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
