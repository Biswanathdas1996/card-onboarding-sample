import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '⚡',
      title: 'Instant Approval',
      description: 'Get approved in minutes with Aadhaar-based e-KYC verification'
    },
    {
      icon: '🎁',
      title: 'Welcome Bonus',
      description: 'Earn 5,000 reward points on your first transaction worth Rs. 500'
    },
    {
      icon: '💎',
      title: 'Zero Joining Fee',
      description: 'No annual fee for the first year. Waived on spending Rs. 1 lakh/year'
    },
    {
      icon: '🛡️',
      title: '24/7 Support',
      description: 'Dedicated customer support available in Hindi, English & regional languages'
    }
  ];

  const stats = [
    { value: '5%', label: 'Cashback on Groceries', sublabel: 'BigBasket, Zepto, Blinkit' },
    { value: '10X', label: 'Reward Points', sublabel: 'On Dining & Movies' },
    { value: '₹500', label: 'Fuel Surcharge Waiver', sublabel: 'Per month at all pumps' },
    { value: '0%', label: 'Forex Markup', sublabel: 'On international spends' }
  ];

  const partners = [
    'Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'BookMyShow', 'MakeMyTrip'
  ];

  const steps = [
    { num: '01', title: 'Apply Online', desc: 'Fill the form in just 2 minutes with basic details' },
    { num: '02', title: 'Verify with Aadhaar', desc: 'Quick e-KYC verification using your Aadhaar & PAN' },
    { num: '03', title: 'Get Approved', desc: 'Instant approval with credit limit up to ₹5 lakhs' },
    { num: '04', title: 'Start Using', desc: 'Virtual card activated instantly, physical card in 3-5 days' }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      location: 'Mumbai',
      text: 'The rewards on dining are amazing! I save almost ₹2,000 every month on Swiggy and Zomato orders.',
      rating: 5
    },
    {
      name: 'Rahul Verma',
      location: 'Bengaluru',
      text: 'Got approved in just 10 minutes. The fuel surcharge waiver alone saves me ₹500 monthly.',
      rating: 5
    },
    {
      name: 'Anita Desai',
      location: 'Delhi',
      text: 'Best card for online shopping! The cashback on Amazon and Flipkart is unbeatable.',
      rating: 5
    }
  ];

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">💳</span>
            CardOnboard
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#benefits">Benefits</a>
            <a href="#how-it-works">How it Works</a>
          </div>
          <button className="nav-cta" onClick={() => navigate('/form')}>Apply Now</button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="logo-badge">
              <span></span>
              RBI Licensed | 100% Secure
            </div>
            <h1>India's Most Rewarding Credit Card</h1>
            <p className="subtitle">
              Earn up to 10X rewards on everyday spends. Zero joining fee, instant approval 
              with Aadhaar e-KYC, and exclusive benefits on 500+ partner brands.
            </p>
            <div className="hero-cta">
              <button className="cta-button primary" onClick={() => navigate('/form')}>
                Apply Now - It's Free
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <p className="cta-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                No impact on CIBIL score
              </p>
            </div>
          </div>
          <div className="hero-image">
            <div className="card-showcase">
              <img src="/images/credit-card.jpg" alt="Premium Credit Card" className="card-img" />
              <div className="card-features">
                <div className="card-feature">
                  <span className="cf-icon">✓</span>
                  <span>Contactless Payments</span>
                </div>
                <div className="card-feature">
                  <span className="cf-icon">✓</span>
                  <span>UPI Enabled</span>
                </div>
                <div className="card-feature">
                  <span className="cf-icon">✓</span>
                  <span>International Usage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-sublabel">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="partners-section">
        <div className="partners-container">
          <p className="partners-label">Exclusive rewards with</p>
          <div className="partners-list">
            {partners.map((partner, index) => (
              <span key={index} className="partner-name">{partner}</span>
            ))}
            <span className="partner-name">+500 more</span>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Why Choose Us</span>
            <h2>Designed for the Modern Indian</h2>
            <p>Features that make everyday spending more rewarding</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="benefits-section">
        <div className="section-container">
          <div className="benefits-grid">
            <div className="benefit-content">
              <span className="section-tag">Exclusive Benefits</span>
              <h2>Save More on What You Love</h2>
              <ul className="benefit-list">
                <li>
                  <span className="benefit-icon">🛒</span>
                  <div>
                    <strong>5% Cashback on Groceries</strong>
                    <p>Instant cashback on BigBasket, Zepto, Blinkit, DMart & more</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">🍕</span>
                  <div>
                    <strong>Flat 20% Off on Food Orders</strong>
                    <p>Valid on Swiggy, Zomato up to ₹150 per order</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">✈️</span>
                  <div>
                    <strong>Free Airport Lounge Access</strong>
                    <p>4 complimentary visits per year at domestic airports</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">🎬</span>
                  <div>
                    <strong>Buy 1 Get 1 Movie Tickets</strong>
                    <p>Every Friday on BookMyShow, PVR & INOX</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="benefit-image">
              <img src="/images/family-shopping.jpg" alt="Happy family shopping" />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="steps-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Simple Process</span>
            <h2>Get Your Card in 4 Easy Steps</h2>
            <p>100% digital process - no paperwork, no branch visits</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Customer Stories</span>
            <h2>Loved by 10 Lakh+ Indians</h2>
            <p>See what our cardholders have to say</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-stars">
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.name[0]}</div>
                  <div>
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-location">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div className="trust-container">
          <div className="trust-item">
            <span className="trust-icon">🏦</span>
            <span>RBI Licensed</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <span>256-bit Encryption</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">📱</span>
            <span>PCI DSS Compliant</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🛡️</span>
            <span>Zero Liability Protection</span>
          </div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="cta-container">
          <h2>Ready to Start Earning Rewards?</h2>
          <p>Join 10 lakh+ Indians who are saving more every day</p>
          <button className="cta-button primary large" onClick={() => navigate('/form')}>
            Apply Now - Get Instant Approval
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <div className="cta-trust">
            <span>✓ No joining fee</span>
            <span>✓ Instant virtual card</span>
            <span>✓ No CIBIL impact</span>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-info">
            <div className="footer-logo">
              <span className="logo-icon">💳</span>
              CardOnboard
            </div>
            <p>India's most rewarding credit card platform. Regulated by RBI.</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#benefits">Benefits</a>
            <a href="#how-it-works">How it Works</a>
          </div>
          <div className="footer-legal">
            <p>© 2024 CardOnboard. All rights reserved.</p>
            <p>Terms & Conditions | Privacy Policy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
