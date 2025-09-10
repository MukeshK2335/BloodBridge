import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function LandingPage() {
  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo">LinkerEdge</div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="auth-buttons">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/register" className="register-btn">Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <h1>Connect. Donate. Save Lives.</h1>
          <p>Join our community of blood donors and help save lives in your area.</p>
          <div className="hero-buttons">
            <button className="donate-btn">Donate Now</button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <h2>Why Donate Blood?</h2>
        <div className="benefits-container">
          <div className="benefit-card">
            <div className="benefit-icon">❤️</div>
            <h3>Save Lives</h3>
            <p>One donation can save up to three lives and help patients in emergency situations.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🤝</div>
            <h3>Community Impact</h3>
            <p>Be part of a community that directly contributes to healthcare and emergency preparedness.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Ready to Make a Difference?</h2>
        <p>Join thousands of donors who are saving lives every day.</p>
        <Link to="/register" className="register-cta-btn">Register Now</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">BloodBridge</div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>About</h4>
              <a href="#">Our Mission</a>
              <a href="#">Team</a>
              <a href="#">Partners</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Donation Guide</a>
              <a href="#">FAQs</a>
              <a href="#">Blog</a>
            </div>
            <div className="footer-column">
              <h4>Contact</h4>
              <a href="#">Support</a>
              <a href="#">Locations</a>
              <a href="#">Feedback</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <h3>Connect.Donate.Save Life</h3>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
