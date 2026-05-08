import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleCardTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  };

  const handleCardLeave = (e) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  };

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      title: 'Instant Approval',
      description: 'Get approved in minutes with Aadhaar-based e-KYC verification'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      title: 'Welcome Bonus',
      description: 'Earn 5,000 reward points on your first transaction worth Rs. 500'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Zero Joining Fee',
      description: 'No annual fee for the first year. Waived on spending Rs. 1 lakh/year'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
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

  const sectionClass = (id) => visibleSections.has(id) ? 'section-visible' : 'section-hidden';

  return (
    <div className="landing-page">
      {/* Animated background mesh */}
      <div className="bg-mesh" style={{
        '--mx': `${mousePos.x}%`,
        '--my': `${mousePos.y}%`
      }} />

      {/* Floating particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${6 + Math.random() * 8}s`
          }} />
        ))}
      </div>

      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </span>
            CardOnboard
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#benefits">Benefits</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#testimonials">Reviews</a>
          </div>
          <button className="nav-cta" onClick={() => navigate('/form')}>
            Apply Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </nav>

      <section className="hero-section" ref={heroRef}>
        <div className="hero-container">
          <div className="hero-content">
            <div className={`logo-badge ${sectionClass('hero') ? 'animate-in' : ''}`} style={{animationDelay: '0.1s'}}>
              <span className="badge-dot"></span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              RBI Licensed | 100% Secure
            </div>
            <h1 className={`hero-title ${sectionClass('hero') ? 'animate-in' : ''}`}>
              India's Most{' '}
              <span className="gradient-text">Rewarding</span>{' '}
              Credit Card
            </h1>
            <p className={`subtitle ${sectionClass('hero') ? 'animate-in' : ''}`} style={{animationDelay: '0.3s'}}>
              Earn up to 10X rewards on everyday spends. Zero joining fee, instant approval
              with Aadhaar e-KYC, and exclusive benefits on 500+ partner brands.
            </p>
            <div className={`hero-cta ${sectionClass('hero') ? 'animate-in' : ''}`} style={{animationDelay: '0.4s'}}>
              <button className="cta-button primary" onClick={() => navigate('/form')}>
                <span>Apply Now — It's Free</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                <span className="cta-shimmer"></span>
              </button>
              <div className="cta-badges">
                <span className="cta-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  No impact on CIBIL score
                </span>
                <span className="cta-badge urgency">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Limited: 500 bonus points this week
                </span>
              </div>
            </div>
          </div>
          <div className={`hero-image ${sectionClass('hero') ? 'animate-in' : ''}`}>
            <div className="card-showcase" onMouseMove={handleCardTilt} onMouseLeave={handleCardLeave}>
              <div className="card-glow" style={{
                background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(99,102,241,0.3) 0%, transparent 50%)`
              }} />
              <div className="credit-card">
                <div className="card-top">
                  <div className="card-chip">
                    <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
                      <rect width="36" height="28" rx="4" fill="url(#chipGrad)"/>
                      <rect x="4" y="8" width="8" height="12" rx="1" fill="rgba(255,255,255,0.3)"/>
                      <rect x="14" y="8" width="8" height="12" rx="1" fill="rgba(255,255,255,0.3)"/>
                      <rect x="24" y="8" width="8" height="12" rx="1" fill="rgba(255,255,255,0.3)"/>
                      <rect x="4" y="4" width="28" height="4" rx="1" fill="rgba(255,255,255,0.2)"/>
                      <defs>
                        <linearGradient id="chipGrad" x1="0" y1="0" x2="36" y2="28">
                          <stop stopColor="#f0c040"/>
                          <stop offset="0.5" stopColor="#e8a020"/>
                          <stop offset="1" stopColor="#c87810"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card contactless">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M6.5 6.5c3-3 8-3 11 0M9.5 9.5c2-2 5-2 7 0M12.5 12.5c1-1 2-1 3 0"/>
                    </svg>
                  </div>
                </div>
                <div className="card-number">•••• •••• •••• 4521</div>
                <div className="card-bottom">
                  <div className="card-holder">
                    <div className="card-label">Card Holder</div>
                    <div className="card-name">ALEX THOMPSON</div>
                  </div>
                  <div className="card-expiry">
                    <div className="card-label">Valid Thru</div>
                    <div className="card-date">12/28</div>
                  </div>
                  <div className="card-logo">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="14" cy="20" r="12" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1"/>
                      <circle cx="26" cy="20" r="12" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1"/>
                    </svg>
                  </div>
                </div>
                <div className="card-brand">
                  <span className="brand-text">CARDONBOARD</span>
                  <span className="brand-tier">PLATINUM</span>
                </div>
              </div>
              <div className="card-features">
                <div className="card-feature">
                  <span className="cf-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <span>Contactless Payments</span>
                </div>
                <div className="card-feature">
                  <span className="cf-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <span>UPI Enabled</span>
                </div>
                <div className="card-feature">
                  <span className="cf-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
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
            <div key={index} className={`stat-card ${sectionClass('stats') ? 'animate-in' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
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
            <span className="partner-name highlight">+500 more</span>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-container">
          <div className={`section-header ${sectionClass('features') ? 'animate-in' : ''}`}>
            <span className="section-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Why Choose Us
            </span>
            <h2>Designed for the Modern Indian</h2>
            <p>Features that make everyday spending more rewarding</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className={`feature-card ${sectionClass('features') ? 'animate-in' : ''}`} style={{animationDelay: `${index * 0.15}s`}}>
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
            <div className={`benefit-content ${sectionClass('benefits') ? 'animate-in' : ''}`}>
              <span className="section-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Exclusive Benefits
              </span>
              <h2>Save More on What You Love</h2>
              <ul className="benefit-list">
                <li>
                  <span className="benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                  </span>
                  <div>
                    <strong>5% Cashback on Groceries</strong>
                    <p>Instant cashback on BigBasket, Zepto, Blinkit, DMart & more</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Flat 20% Off on Food Orders</strong>
                    <p>Valid on Swiggy, Zomato up to ₹150 per order</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 2L2 22M17 7l-4 4 4 4M3 15l4 4-4 4M14 7l7 7-7 7"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Free Airport Lounge Access</strong>
                    <p>4 complimentary visits per year at domestic airports</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                      <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
                      <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="22" y2="7"/><line x1="2" y1="17" x2="22" y2="17"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Buy 1 Get 1 Movie Tickets</strong>
                    <p>Every Friday on BookMyShow, PVR & INOX</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className={`benefit-visual ${sectionClass('benefits') ? 'animate-in' : ''}`}>
              <div className="benefit-card-stack">
                <div className="benefit-mock mock-1">
                  <div className="mock-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                      <polyline points="17 6 23 6 23 12"/>
                    </svg>
                  </div>
                  <div className="mock-text">
                    <div className="mock-label">Cashback Earned</div>
                    <div className="mock-value">₹1,250</div>
                  </div>
                  <div className="mock-badge">+5%</div>
                </div>
                <div className="benefit-mock mock-2">
                  <div className="mock-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <div className="mock-text">
                    <div className="mock-label">Reward Points</div>
                    <div className="mock-value">8,430</div>
                  </div>
                  <div className="mock-badge">10X</div>
                </div>
                <div className="benefit-mock mock-3">
                  <div className="mock-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="mock-text">
                    <div className="mock-label">Fuel Waiver</div>
                    <div className="mock-value">₹500</div>
                  </div>
                  <div className="mock-badge">0%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="steps-section">
        <div className="section-container">
          <div className={`section-header ${sectionClass('how-it-works') ? 'animate-in' : ''}`}>
            <span className="section-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Simple Process
            </span>
            <h2>Get Your Card in 4 Easy Steps</h2>
            <p>100% digital process — no paperwork, no branch visits</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className={`step-card ${sectionClass('how-it-works') ? 'animate-in' : ''}`} style={{animationDelay: `${index * 0.15}s`}}>
                <div className="step-num">{step.num}</div>
                <div className="step-icon">
                  {index === 0 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                  {index === 1 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
                  {index === 2 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                  {index === 3 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {index < 3 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <div className={`section-header ${sectionClass('testimonials') ? 'animate-in' : ''}`}>
            <span className="section-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Customer Stories
            </span>
            <h2>Loved by 10 Lakh+ Indians</h2>
            <p>See what our cardholders have to say</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`testimonial-card ${sectionClass('testimonials') ? 'animate-in' : ''}`} style={{animationDelay: `${index * 0.15}s`}}>
                <div className="testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <p className="testimonial-text">{testimonial.text}</p>
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
            <span className="trust-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.85M19 21V10.85M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
              </svg>
            </span>
            <span>RBI Licensed</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <span>256-bit Encryption</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </span>
            <span>PCI DSS Compliant</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <span>Zero Liability Protection</span>
          </div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className={`cta-container ${sectionClass('final-cta') ? 'animate-in' : ''}`}>
          <div className="cta-glow" />
          <span className="section-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Offer ends May 31
          </span>
          <h2>Ready to Start Earning Rewards?</h2>
          <p>Join 10 lakh+ Indians who are saving more every day</p>
          <button className="cta-button primary large" onClick={() => navigate('/form')}>
            <span>Apply Now — Get Instant Approval</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <span className="cta-shimmer"></span>
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
              <span className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </span>
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