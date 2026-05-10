import React, { useEffect, useRef } from 'react';
import './HeroBanner.css';

const HeroBanner = () => {
  const heroRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          } else {
            entry.target.classList.remove('in-view');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  return (
    <section ref={heroRef} className="hero-banner">
      <div className="hero-content">
        
        {/* University Badge */}
        <div className="university-badge">
          <span className="badge-icon">🎓</span>
          <span className="badge-text">Banasthali Vidyapith Initiative</span>
        </div>

        {/* Main Logo & Title */}
        <div className="hero-logo">
          <div className="logo-symbol">BV</div>
          <div className="logo-text">
            <h1 className="logo-title">Startup<span className="highlight">Vidyapith</span></h1>
            <p className="logo-subtitle">Where Ideas Meet Talent</p>
          </div>
        </div>

        {/* Tagline */}
        <p className="hero-tagline">
          Empowering women entrepreneurs at Banasthali Vidyapith
        </p>

        {/* Description */}
        <p className="hero-description">
          A platform for Banasthali students to share startup ideas, 
          find team members from campus, and build innovative solutions together.
        </p>

        {/* Call to Action Buttons */}
        <div className="hero-actions">
          <button className="cta-btn primary">
            <span className="btn-icon">🚀</span>
            <span className="btn-text">Browse Startups</span>
          </button>
          <button className="cta-btn secondary">
            <span className="btn-icon">💡</span>
            <span className="btn-text">Share Your Idea</span>
          </button>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Ideas Shared</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">300+</span>
            <span className="stat-label">Students Connected</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15</span>
            <span className="stat-label">Active Teams</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-line"></div>
          <span className="scroll-text">Scroll to explore</span>
        </div>

      </div>
    </section>
  );
};

export default HeroBanner;