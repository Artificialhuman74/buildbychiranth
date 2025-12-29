import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingHTML.css';

const Landing: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [zoomIn, setZoomIn] = useState(false);

  useEffect(() => {
    // Auto-enter after 5 seconds if user doesn't click
    const timer = setTimeout(() => {
      handleIntroClick();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleIntroClick = () => {
    setZoomIn(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 1500);
  };

  return (
    <div className="landing-container">
      {/* Intro Animation Overlay */}
      {showIntro && (
        <div className={`intro-overlay ${zoomIn ? 'zoom-in' : ''}`}>
          <div className="floating-element intro-float-1">🌸</div>
          <div className="floating-element intro-float-2">🌿</div>
          <div className="floating-element intro-float-3">✨</div>
          <div className="floating-element intro-float-4">🦋</div>
          
          <div className="loading-ring"></div>
          <div className="intro-circle" onClick={handleIntroClick}>
            <div className="intro-content">
              <div className="intro-logo">Brew</div>
              <div className="intro-subtitle">Your Sanctuary</div>
            </div>
          </div>
          <div className="intro-hint">Click to enter →</div>
        </div>
      )}

      {/* Pastel Sanctuary Hero Section */}
      <section className="hero-sanctuary">
        <div className="floral-accent top-left">🌸</div>
        <div className="floral-accent bottom-right">🌿</div>
        <div className="hero-content fade-in-up">
          <h1 className="hero-title">Where Safety<br/>Feels Like Home.</h1>
          
          <p className="hero-subtitle">
            A gentle, secure sanctuary where you can share, heal, and find support. 
            You're not alone — we're here for you, always.
          </p>
          
          <div className="d-flex gap-4 justify-content-center flex-wrap mt-5">
            <Link to="/report" className="btn btn-primary btn-lg">
              Share Your Story
            </Link>
            
            <Link to="/safe-routes" className="btn btn-lavender btn-lg">
              Find Safe Routes
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-5">
            How We Support You
          </h2>
          
          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-4">
              <div className="card feature-card">
                <div className="feature-icon">
                  <i className="fas fa-heart"></i>
                </div>
                <h3 className="feature-title">Anonymous & Safe</h3>
                <p className="feature-description">Share your experiences privately, without judgment or pressure.</p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="col-md-4">
              <div className="card feature-card">
                <div className="feature-icon">
                  <i className="fas fa-hands-helping"></i>
                </div>
                <h3 className="feature-title">Community Support</h3>
                <p className="feature-description">Connect with a caring community of women who understand and uplift.</p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="col-md-4">
              <div className="card feature-card">
                <div className="feature-icon">
                  <i className="fas fa-map-marked-alt"></i>
                </div>
                <h3 className="feature-title">Safe Navigation</h3>
                <p className="feature-description">Find the safest routes home, day or night, with smart guidance.</p>
              </div>
            </div>
            
            {/* Feature 4 */}
            <div className="col-md-4">
              <div className="card feature-card">
                <div className="feature-icon">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <h3 className="feature-title">Instant SOS</h3>
                <p className="feature-description">Quick access to emergency contacts and support when you need it most.</p>
              </div>
            </div>
            
            {/* Feature 5 */}
            <div className="col-md-4">
              <div className="card feature-card">
                <div className="feature-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h3 className="feature-title">Your Privacy Protected</h3>
                <p className="feature-description">Your information stays secure and confidential, always.</p>
              </div>
            </div>
            
            {/* Feature 6 */}
            <div className="col-md-4">
              <div className="card feature-card">
                <div className="feature-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <h3 className="feature-title">Caring Conversations</h3>
                <p className="feature-description">Talk to someone who listens and understands what you're going through.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-sanctuary">
        <div className="container">
          <h2 className="text-center mb-5">
            You're Never Alone
          </h2>
          
          <div className="row text-center g-4">
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h3 className="stat-number">24/7</h3>
                  <p className="stat-label">Always Here</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h3 className="stat-number">100%</h3>
                  <p className="stat-label">Confidential</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h3 className="stat-number">∞</h3>
                  <p className="stat-label">Support</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h3 className="stat-number">0</h3>
                  <p className="stat-label">Judgment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Banner */}
      <section className="py-5">
        <div className="container text-center">
          <h2 className="mb-4">Need Immediate Help?</h2>
          <p className="lead mb-4" style={{color: 'var(--text-secondary)'}}>We're here for you, right now.</p>
          
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/sos" className="btn btn-primary btn-lg">
              <i className="fas fa-exclamation-triangle me-2"></i> SOS Center
            </Link>
            
            <Link to="/emergency-contacts" className="btn btn-lavender btn-lg">
              <i className="fas fa-phone me-2"></i> Emergency Contacts
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
