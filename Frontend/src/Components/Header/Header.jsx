import React, { useState, useEffect } from 'react';
import './Header.css';
import { Menu, X, User, Bell, LogOut } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from "../../Pages/AuthContext";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [overlayLink, setOverlayLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close mobile menu
      if (isMobileMenuOpen && !e.target.closest('.mobile-nav') && !e.target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
      
      // Close user dropdown
      if (showUserDropdown && !e.target.closest('.user-profile') && !e.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen, showUserDropdown]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Function to handle login navigation
  const handleLoginClick = () => {
    navigate('/login');
    closeOverlay();
  };

  // Function to handle signup navigation
  const handleSignupClick = () => {
    navigate('/signup');
    closeOverlay();
  };

  // Function to handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserDropdown(false);
  };

  // Function to handle profile click
  const handleProfileClick = () => {
    if (!user) return;
    
    // For founders - go to founder profile page
    if (user.type === 'founder' || user.userType === 'founder') {
      if (user.founderProfileId) {
        navigate(`/founder/${user.founderProfileId}`);
      } else if (user._id) {
        navigate(`/founder/${user._id}`);
      } else {
        navigate('/dashboard');
      }
    } else {
      // For other users - go to dashboard
      navigate('/dashboard');
    }
    
    setShowUserDropdown(false);
    setIsMobileMenuOpen(false);
  };

  // Function to handle link clicks
  const handleLinkClick = (href, label) => {
    // Links that are always accessible
    const alwaysAccessible = ['/', '/founders'];
    
    // If user is authenticated OR it's an always accessible link, navigate normally
    if (isAuthenticated || alwaysAccessible.includes(href)) {
      navigate(href);
      return;
    }
    
    // If guest user clicks on restricted link, show overlay
    if (!isAuthenticated) {
      setOverlayLink(href);
      setLinkLabel(label);
      setShowAuthOverlay(true);
      setIsMobileMenuOpen(false); // Close mobile menu if open
    }
  };

  // Function to close overlay
  const closeOverlay = () => {
    setShowAuthOverlay(false);
    setOverlayLink('');
    setLinkLabel('');
  };

  const navLinks = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'startups', label: 'Startups', href: '/founders' },
    { id: 'events', label: 'Events', href: '/events' },
    { id: 'blog', label: 'Blog', href: '/blogs' }, 
    { id: 'founderKit', label: 'Community', href: '/founderKit' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'success', label: 'Success', href: '/success' },
    { id: 'explore', label: 'Explore', href: '/explore' }


  ];

  // Check if a link is active based on current route
  const isLinkActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // Get user's first name
  const getUserFirstName = () => {
    if (!user) return '';
    if (user.fullName) return user.fullName.split(' ')[0];
    if (user.name) return user.name.split(' ')[0];
    return 'User';
  };

  // Get user type/role
  const getUserRole = () => {
    if (!user) return 'Guest';
    if (user.userType) return user.userType.charAt(0).toUpperCase() + user.userType.slice(1);
    if (user.type) return user.type.charAt(0).toUpperCase() + user.type.slice(1);
    return 'User';
  };

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo */}
          <div className="logo" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <span className="logo-icon-text">BV</span>
            </div>
            <div className="logo-text">
              <span className="logo-primary">Startup Vidyapith</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <ul className="nav-list">
              {navLinks.map((link) => (
                <li key={link.id} className="nav-item">
                  <button
                    onClick={() => handleLinkClick(link.href, link.label)}
                    className={`nav-link ${isLinkActive(link.href) ? 'active' : ''}`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Actions */}
          <div className="header-actions">
            {/* Notifications - Only show when authenticated */}
            {isAuthenticated && (
              <button className="notification-btn" aria-label="Notifications">
                <Bell size={18} />
                <span className="notification-badge">3</span>
              </button>
            )}

            {/* User Profile Section */}
            <div className="user-section">
              {isAuthenticated && user ? (
                <div 
                  className="user-profile clickable"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="avatar">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-info">
                    <span className="user-name">Welcome, {getUserFirstName()}</span>
                    <span className="user-role">{getUserRole()}</span>
                  </div>
                  
                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="dropdown-user-info">
                          <strong>{user.fullName || user.name}</strong>
                          <small>{getUserRole()} • {user.banasthaliId || user.id}</small>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      
                      {/* Profile Item */}
                      <button 
                        className="dropdown-item" 
                        onClick={handleProfileClick}
                      >
                        <User size={16} /> 
                        My Profile
                      </button>
                      
                      <div className="dropdown-divider"></div>
                      
                      {/* Logout Item */}
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="guest-section">
                  <div 
                    className="user-profile clickable guest"
                    onClick={handleLoginClick}
                  >
                    <div className="avatar">
                      <User size={18} />
                    </div>
                    <div className="user-info">
                      <span className="user-name">Welcome</span>
                      <span className="user-role">Guest</span>
                    </div>
                  </div>
                  
                  {/* Get Started Button */}
                  <button className="cta-button" onClick={handleLoginClick}>
                    <span className="cta-text">Get Started</span>
                    <span className="cta-icon">→</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-container">
          {/* Mobile Navigation Links */}
          <ul className="mobile-nav-list">
            {navLinks.map((link) => (
              <li key={link.id} className="mobile-nav-item">
                <button
                  onClick={() => handleLinkClick(link.href, link.label)}
                  className={`mobile-nav-link ${isLinkActive(link.href) ? 'active' : ''}`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Mobile Actions */}
          <div className="mobile-actions">
            {isAuthenticated && user ? (
              <>
                <div className="mobile-user-info">
                  <div className="mobile-avatar">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="mobile-user-details">
                    <strong>{user.fullName || user.name}</strong>
                    <small>{getUserRole()} • {user.banasthaliId || user.id}</small>
                  </div>
                </div>
                <div className="mobile-user-links">
                  {/* Profile Link */}
                  <button 
                    className="mobile-user-link" 
                    onClick={handleProfileClick}
                  >
                    <User size={16} /> 
                    <span>My Profile</span>
                  </button>
                  
                  {/* Logout Link */}
                  <button className="mobile-user-link logout" onClick={handleLogout}>
                    <LogOut size={16} /> 
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="mobile-guest-section">
                <div className="mobile-guest-info">
                  <User size={24} />
                  <div>
                    <strong>Welcome Guest</strong>
                    <p>Login to access all features</p>
                  </div>
                </div>
                <button 
                  className="mobile-cta-button"
                  onClick={() => {
                    handleLoginClick();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>Get Started</span>
                  <span>→</span>
                </button>
              </div>
            )}
            
            <div className="mobile-footer">
              <p className="copyright">
                © 2024 Startup Vidyapith. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Overlay for Guest Users */}
      {showAuthOverlay && (
        <div className="auth-overlay">
          <div className="auth-overlay-backdrop" onClick={closeOverlay}></div>
          <div className="auth-overlay-content">
            <button className="auth-overlay-close" onClick={closeOverlay}>
              <X size={20} />
            </button>
            
            <div className="auth-overlay-icon">
              <User size={48} />
            </div>
            
            <h2 className="auth-overlay-title">
              Access Restricted
            </h2>
            
            <p className="auth-overlay-message">
              {linkLabel ? `To access ${linkLabel}, you need to be a member of the Banasthali Vidyapith community.` : 'This content is only accessible to registered members of Banasthali Vidyapith.'}
            </p>
            
            <div className="auth-overlay-buttons">
              <button 
                className="auth-overlay-btn primary"
                onClick={handleLoginClick}
              >
                Login to Continue
              </button>
              
              <button 
                className="auth-overlay-btn secondary"
                onClick={handleSignupClick}
              >
                Create Account
              </button>
            </div>
            
            <p className="auth-overlay-note">
              <strong>Note:</strong> Banasthali ID is required for registration
            </p>
          </div>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Header;