// src/components/FoundersDirectory.jsx - UPDATED with real data from database
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../Components/Header/Header.jsx';
import { API_BASE_URL } from '../constants';
import './FoundersDirectory.css';

const FoundersDirectory = () => {
  const [founders, setFounders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFounders, setFilteredFounders] = useState([]);
  const [filters, setFilters] = useState({
    businessStage: '',
    lookingFor: '',
    hiringOnly: false
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLimitedPreview, setShowLimitedPreview] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Fetch real founders from database
  useEffect(() => {
    fetchFounders();
    
    // Simple auth check
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
    } else {
      setShowLimitedPreview(true);
      
      // Show signup prompt after 5 seconds
      setTimeout(() => {
        setShowSignupPrompt(true);
      }, 5000);
    }
  }, []);

  const fetchFounders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching real founders from API...');
      
      const response = await fetch(`${API_BASE_URL}/founders`);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API response:', data);
      
      if (data.success && data.founders && Array.isArray(data.founders)) {
        console.log(`✅ Found ${data.founders.length} founders in database`);
        
        // Transform API data to match our component structure
        const transformedFounders = data.founders.map(founder => ({
          _id: founder._id,
          fullName: founder.fullName,
          startupName: founder.startupName || `${founder.fullName}'s Startup`,
          banasthaliId: founder.banasthaliId || 'N/A',
          branch: founder.fieldOfStudy || founder.branch || 'Not specified',
          founderProfile: {
            bio: founder.bio || founder.description || 'No description available',
            businessStage: founder.businessStage || 'Not specified',
            hiring: founder.hiring || false,
            skills: founder.skills || [],
            lookingFor: founder.lookingFor || [],
            profilePhoto: founder.profilePhoto || founder.profileImage
          },
          // Additional fields for filtering
          location: founder.location || 'Banasthali Vidyapith',
          fundingStage: founder.fundingStage,
          interests: founder.interests || []
        }));
        
        console.log('🎨 Transformed founders:', transformedFounders);
        setFounders(transformedFounders);
        setFilteredFounders(transformedFounders);
      } else {
        console.error('❌ Unexpected API response:', data);
        setError('Unexpected API response format');
      }
    } catch (error) {
      console.error('❌ Error fetching founders:', error);
      setError(`Failed to load founders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterFounders();
  }, [founders, searchTerm, filters]);

  const filterFounders = () => {
    let result = [...founders];

    // For unregistered users, limit to 3 founders only
    if (showLimitedPreview && !isLoggedIn) {
      result = result.slice(0, 3);
    }

    // Search by name, startup name, or skills
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(founder => 
        founder.fullName?.toLowerCase().includes(term) ||
        founder.startupName?.toLowerCase().includes(term) ||
        founder.founderProfile?.skills?.some(skill => 
          skill.toLowerCase().includes(term)
        ) ||
        founder.branch?.toLowerCase().includes(term) ||
        founder.founderProfile?.bio?.toLowerCase().includes(term)
      );
    }

    // Filter by business stage
    if (filters.businessStage) {
      result = result.filter(founder => 
        founder.founderProfile?.businessStage === filters.businessStage
      );
    }

    // Filter by looking for
    if (filters.lookingFor) {
      result = result.filter(founder => 
        founder.founderProfile?.lookingFor?.some(item => 
          item.toLowerCase().includes(filters.lookingFor.toLowerCase())
        )
      );
    }

    // Filter by hiring status
    if (filters.hiringOnly) {
      result = result.filter(founder => 
        founder.founderProfile?.hiring === true
      );
    }

    setFilteredFounders(result);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      businessStage: '',
      lookingFor: '',
      hiringOnly: false
    });
  };

  const getUniqueBusinessStages = () => {
    const stages = founders
      .map(f => f.founderProfile?.businessStage)
      .filter(stage => stage && stage !== '');
    return [...new Set(stages)];
  };

  const getUniqueLookingFor = () => {
    const allLookingFor = founders
      .flatMap(f => f.founderProfile?.lookingFor || [])
      .filter(item => item && item !== '');
    return [...new Set(allLookingFor)];
  };

  const handleViewAll = () => {
    navigate('/login', {
      state: {
        message: 'Please login to view all founders and connect with them'
      }
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="founders-directory">
          <div className="directory-hero">
            <h1>Meet Our Startup Founders</h1>
            <p className="hero-subtitle">
              Loading founders from database...
            </p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="founders-directory">
          <div className="directory-hero">
            <h1>Meet Our Startup Founders</h1>
            <p className="error-message">⚠️ {error}</p>
            <button onClick={fetchFounders} className="retry-btn">
              🔄 Retry Loading
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header /> {/* Add Header component at the top */}
      
      <div className="founders-directory">
        {/* Hero Section */}
        <div className="directory-hero">
          <h1>Meet Our Startup Founders</h1>
          <p className="hero-subtitle">
            Discover innovative startups and entrepreneurs from Banasthali Vidyapith
          </p>
          
          <div className="stats-bar">
            <div className="stat">
              <div className="stat-number">{founders.length}</div>
              <div className="stat-label">Founders</div>
            </div>
            <div className="stat">
              <div className="stat-number">
                {founders.filter(f => f.founderProfile?.hiring).length}
              </div>
              <div className="stat-label">Currently Hiring</div>
            </div>
            <div className="stat">
              <div className="stat-number">
                {[...new Set(founders.map(f => f.branch).filter(Boolean))].length}
              </div>
              <div className="stat-label">Branches</div>
            </div>
            <div className="stat">
              <div className="stat-number">
                {getUniqueBusinessStages().length}
              </div>
              <div className="stat-label">Stages</div>
            </div>
          </div>
        </div>

        {/* Database Connection Status */}
        <div className="database-status">
          <div className="status-indicator connected"></div>
          <span>Connected to MongoDB • {founders.length} real founders loaded</span>
        </div>

        {/* Login/Signup Prompt for Unregistered Users */}
        {!isLoggedIn && showSignupPrompt && (
          <div className="signup-prompt">
            <div className="prompt-content">
              <h3>👋 Want to see more?</h3>
              <p>Sign up to view all founders, ask questions, and connect with them!</p>
              <div className="prompt-actions">
                <button 
                  className="prompt-btn primary"
                  onClick={() => navigate('/signup')}
                >
                  Sign Up Now
                </button>
                <button 
                  className="prompt-btn secondary"
                  onClick={() => setShowSignupPrompt(false)}
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* For Unregistered Users - Limited Preview Notice */}
        {showLimitedPreview && !isLoggedIn && (
          <div className="limited-preview-notice">
            <p>🔒 <strong>Preview Mode:</strong> Showing 3 founders only. Sign up to view all {founders.length} founders!</p>
            <button onClick={handleViewAll} className="view-all-btn">
              View All Founders →
            </button>
          </div>
        )}

        {/* Search and Filters (Only for logged in users) */}
        {isLoggedIn && (
          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search founders by name, startup, skills, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-options">
              <div className="filter-group">
                <label>Business Stage</label>
                <select
                  value={filters.businessStage}
                  onChange={(e) => setFilters({...filters, businessStage: e.target.value})}
                  className="filter-select"
                >
                  <option value="">All Stages</option>
                  {getUniqueBusinessStages().map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Looking For</label>
                <select
                  value={filters.lookingFor}
                  onChange={(e) => setFilters({...filters, lookingFor: e.target.value})}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  {getUniqueLookingFor().map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={filters.hiringOnly}
                    onChange={(e) => setFilters({...filters, hiringOnly: e.target.checked})}
                  />
                  <span>Currently Hiring Only</span>
                </label>
              </div>

              <button onClick={clearFilters} className="clear-filters">
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="results-summary">
          <p>
            {isLoggedIn ? (
              <>
                Showing <strong>{filteredFounders.length}</strong> of <strong>{founders.length}</strong> founders
                {searchTerm && ` matching "${searchTerm}"`}
              </>
            ) : (
              <>
                <strong>Preview:</strong> Showing {filteredFounders.length} of {founders.length} founders
                <span className="login-reminder"> (Sign up to view all)</span>
              </>
            )}
          </p>
        </div>

        {/* Founders Grid */}
        {filteredFounders.length === 0 ? (
          <div className="no-results">
            <h3>No founders found</h3>
            <p>Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="reset-btn">
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="founders-grid">
              {filteredFounders.map(founder => (
                <Link to={`/founder/${founder._id}`} key={founder._id} className="founder-card">
                  <div className="card-header">
                    <div className="founder-avatar">
                      {founder.founderProfile?.profilePhoto ? (
                        <img src={founder.founderProfile.profilePhoto} alt={founder.fullName} />
                      ) : (
                        <div className="avatar-placeholder">
                          {founder.fullName?.charAt(0) || 'F'}
                        </div>
                      )}
                    </div>
                    <div className="founder-titles">
                      <h3>{founder.startupName || 'No Startup Name'}</h3>
                      <p className="founder-name">by {founder.fullName || 'Anonymous'}</p>
                      <p className="founder-id">🎓 {founder.banasthaliId}</p>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    {founder.founderProfile?.bio && (
                      <p className="founder-bio">
                        {founder.founderProfile.bio.length > 120 
                          ? founder.founderProfile.bio.substring(0, 120) + '...' 
                          : founder.founderProfile.bio}
                      </p>
                    )}
                    
                    <div className="founder-tags">
                      {founder.founderProfile?.businessStage && (
                        <span className="tag stage">
                          {founder.founderProfile.businessStage}
                        </span>
                      )}
                      {founder.founderProfile?.hiring && (
                        <span className="tag hiring">🚀 Hiring</span>
                      )}
                      {founder.branch && (
                        <span className="tag branch">{founder.branch}</span>
                      )}
                      {founder.location && (
                        <span className="tag location">📍 {founder.location}</span>
                      )}
                    </div>
                    
                    {/* Skills */}
                    {founder.founderProfile?.skills && founder.founderProfile.skills.length > 0 && (
                      <div className="skills-section">
                        <p className="skills-label">Skills:</p>
                        <div className="skills-tags">
                          {founder.founderProfile.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          ))}
                          {founder.founderProfile.skills.length > 3 && (
                            <span className="skill-tag more">+{founder.founderProfile.skills.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Looking For */}
                    {founder.founderProfile?.lookingFor && founder.founderProfile.lookingFor.length > 0 && (
                      <div className="looking-for-section">
                        <p className="looking-for-label">Looking for:</p>
                        <div className="looking-for-tags">
                          {founder.founderProfile.lookingFor.slice(0, 3).map((item, index) => (
                            <span key={index} className="looking-tag">{item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-footer">
                    {!isLoggedIn ? (
                      <button className="view-profile-btn login-to-view" onClick={(e) => {
                        e.preventDefault();
                        navigate('/login', {
                          state: { message: 'Login to view full profile and ask questions' }
                        });
                      }}>
                        Login to View →
                      </button>
                    ) : (
                      <button className="view-profile-btn">
                        View Full Profile →
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Show "View All" button for unregistered users */}
            {!isLoggedIn && founders.length > 3 && (
              <div className="view-all-section">
                <div className="view-all-card">
                  <h3>Want to see all {founders.length} founders?</h3>
                  <p>Sign up to browse all startups, ask questions, and connect with founders!</p>
                  <div className="view-all-actions">
                    <button 
                      className="view-all-action-btn primary"
                      onClick={() => navigate('/signup')}
                    >
                      Sign Up Now
                    </button>
                    <button 
                      className="view-all-action-btn secondary"
                      onClick={handleViewAll}
                    >
                      Login to View All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State (if no founders at all) */}
        {founders.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🚀</div>
            <h2>No Founders Found</h2>
            <p>Be the first to register your startup!</p>
            <Link to="/founder/setup" className="register-btn">
              Register as Founder
            </Link>
          </div>
        )}

        {/* CTAs - Only show for unregistered users */}
        {!isLoggedIn && (
          <div className="directory-ctas">
            <div className="cta-card">
              <h3>Are you a founder?</h3>
              <p>Join our community and showcase your startup to Banasthali students</p>
              <Link to="/founder/setup" className="cta-btn primary">
                Register Your Startup
              </Link>
            </div>
            
            <div className="cta-card">
              <h3>Looking for opportunities?</h3>
              <p>Connect with founders for internships, projects, or collaborations</p>
              <Link to="/signup?type=student" className="cta-btn secondary">
                Join as Student
              </Link>
            </div>
          </div>
        )}

        {/* REMOVED: Dashboard link as requested */}
      </div>
    </>
  );
};

export default FoundersDirectory;