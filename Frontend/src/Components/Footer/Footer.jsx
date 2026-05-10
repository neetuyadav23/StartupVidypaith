import React from 'react';
import { MapPin, Phone, Mail, Clock, ArrowUp, Heart, Rocket, Users, Search, Book, Target, Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Platform links with icons
  const platformLinks = [
    { label: 'Browse Startups', href: '/founders', icon: Search },
    { label: 'Register Startup', href: '/founder/setup', icon: Rocket },
    { label: 'Find Contributors', href: '/network', icon: Users },
    { label: 'Startup Resources', href: '/founderKit', icon: Book },
    { label: 'Mentorship Program', href: '/mentorship', icon: Target },
  ];

  // Social media links
  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  // Description points with checkmarks
  const descriptionPoints = [
    'Empowering women entrepreneurs at Banasthali Vidyapith',
    'Connect, collaborate, and build the future together',
    'Bridge between academia and entrepreneurship',
    'Fostering innovation and startup culture'
  ];

  // Checkmark icon component
  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="currentColor"/>
    </svg>
  );

  return (
    <footer className="footer-main">
      {/* Full width background container */}
      <div className="footer-full-width-bg">
        <div className="footer-content">
          
          {/* Top Section: Logo & Brand Info */}
          <div className="footer-top-area">
            <div className="footer-brand-section">
              <div className="footer-logo-container">
                <div className="footer-logo-symbol">
                  <span className="footer-logo-letters">BV</span>
                </div>
                <div className="footer-logo-text">
                  <h1 className="footer-logo-main">Banasthali</h1>
                  <p className="footer-logo-sub">StartupVidyapith</p>
                </div>
              </div>
              <p className="footer-mission">
                Empowering the next generation of women entrepreneurs through innovation, collaboration, and technology.
              </p>
              
              {/* Description with Checkmarks */}
              <div className="footer-features">
                <ul className="footer-feature-list">
                  {descriptionPoints.map((point, index) => (
                    <li key={index} className="footer-feature-item">
                      <span className="footer-check">
                        <CheckIcon />
                      </span>
                      <span className="footer-feature-text">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social Media Links */}
              <div className="footer-social-section">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-social-item"
                      aria-label={social.label}
                    >
                      <Icon className="footer-social-svg" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Section: Platform & Contact */}
          <div className="footer-middle-area">
            {/* Platform Links Column */}
            <div className="footer-links-section">
              <h4 className="footer-section-title">Platform</h4>
              <div className="footer-nav-links">
                {platformLinks.map((link, index) => {
                  const IconComponent = link.icon;
                  return (
                    <a key={index} href={link.href} className="footer-nav-link">
                      <IconComponent className="footer-nav-icon" />
                      <span className="footer-nav-text">{link.label}</span>
                      <span className="footer-nav-arrow">→</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Contact Column */}
            <div className="footer-contact-section">
              <h4 className="footer-section-title">Contact Us</h4>
              <div className="footer-contact-details">
                <div className="footer-contact-detail">
                  <MapPin className="footer-contact-svg" />
                  <span className="footer-contact-info">Banasthali Vidyapith, Rajasthan, India - 304022</span>
                </div>
                <div className="footer-contact-detail">
                  <Phone className="footer-contact-svg" />
                  <span className="footer-contact-info">+91 123 456 7890</span>
                </div>
                <div className="footer-contact-detail">
                  <Mail className="footer-contact-svg" />
                  <span className="footer-contact-info">startups@banasthali.ac.in</span>
                </div>
                <div className="footer-contact-detail">
                  <Clock className="footer-contact-svg" />
                  <span className="footer-contact-info">Monday - Friday: 9:00 AM - 6:00 PM</span>
                </div>
              </div>
              
              <div className="footer-map-section">
                <div className="footer-map-text">
                  <MapPin className="footer-map-icon" />
                  <span>Banasthali Vidyapith Campus</span>
                </div>
                <a 
                  href="https://maps.google.com/?q=Banasthali+Vidyapith"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-map-btn"
                >
                  View on Map
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section: Copyright, Love, Back to Top */}
          <div className="footer-bottom-area">
            {/* Copyright Information */}
            <div className="footer-copyright">
              <p className="footer-copyright-main">
                © 2025 StartupVidyapith. All rights reserved.
              </p>
              <p className="footer-university">
                An official initiative of Banasthali Vidyapith, Rajasthan
              </p>
              <p className="footer-built">
                🚀 Built by students, for students. Part of Banasthali Vidyapith's Innovation & Entrepreneurship Cell.
              </p>
            </div>

            {/* Made with Love */}
            <div className="footer-love-section">
              <Heart className="footer-heart" />
              <span>Made with love for the entrepreneurial community</span>
            </div>

            {/* Back to Top */}
            <div className="footer-top-section">
              <button 
                onClick={scrollToTop}
                className="footer-top-btn"
                aria-label="Back to top"
              >
                <ArrowUp className="footer-arrow" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;