import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartupShowcase.css';

const StartupShowcase = () => {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(40); // Variable animation speed
  
  const navigate = useNavigate();
  
  // Fetch real startups from backend
  useEffect(() => {
    fetchStartups();
  }, []);
  
  const fetchStartups = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching real startups from API...');
      
      const response = await fetch('http://localhost:5000/api/founders');
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API response:', data);
      
      if (data.success && data.founders && Array.isArray(data.founders)) {
        console.log(`✅ Found ${data.founders.length} founders in database`);
        
        // Transform your actual founder data
        const formattedStartups = data.founders.map(founder => ({
          id: founder._id,
          name: founder.startupName || `${founder.fullName}'s Startup`,
          category: getCategory(founder),
          description: founder.bio || 'No description available',
          founder: founder.fullName,
          image: founder.profilePhoto || founder.profileImage,
          tags: getTags(founder),
          status: getStatus(founder.businessStage),
          funding: getFundingStatus(founder.fundingStage),
          team: getTeamInfo(founder),
          founderId: founder._id, // Founder document ID
          userId: founder.userId, // User ID
          location: founder.location || 'Banasthali Vidyapith',
          banasthaliId: founder.banasthaliId,
          lookingFor: founder.lookingFor || [],
          hiring: founder.hiring || false
        }));
        
        console.log('🎨 Formatted startups:', formattedStartups);
        setStartups(formattedStartups);
        
        // Adjust animation speed based on number of startups
        if (formattedStartups.length < 3) {
          setAnimationSpeed(60); // Slower for few cards
        } else {
          setAnimationSpeed(40); // Normal speed
        }
      } else {
        console.error('❌ Unexpected API response:', data);
        setError('Unexpected API response format');
      }
    } catch (error) {
      console.error('❌ Error fetching startups:', error);
      setError(`Failed to load startups: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine category
  const getCategory = (founder) => {
    // Try to extract category from startup name or skills
    if (founder.startupName) {
      const name = founder.startupName.toLowerCase();
      if (name.includes('tech') || name.includes('software') || name.includes('app')) return 'Technology';
      if (name.includes('eco') || name.includes('green') || name.includes('sustain')) return 'Sustainability';
      if (name.includes('edu') || name.includes('learn') || name.includes('teach')) return 'Education';
      if (name.includes('health') || name.includes('med') || name.includes('care')) return 'Healthcare';
      if (name.includes('fashion') || name.includes('wear') || name.includes('style')) return 'Fashion';
      if (name.includes('fin') || name.includes('money') || name.includes('bank')) return 'Finance';
      if (name.includes('food') || name.includes('grocery') || name.includes('eat')) return 'Food';
    }
    
    // Check skills for category
    if (founder.skills && founder.skills.length > 0) {
      const firstSkill = founder.skills[0];
      if (firstSkill.includes('Tech') || firstSkill.includes('Computer')) return 'Technology';
      if (firstSkill.includes('Business') || firstSkill.includes('Marketing')) return 'Business';
      if (firstSkill.includes('Design') || firstSkill.includes('Art')) return 'Design';
      return firstSkill;
    }
    
    // Check interests for category
    if (founder.interests && founder.interests.length > 0) {
      return founder.interests[0];
    }
    
    return 'Startup';
  };
  
  // Helper function to get tags
  const getTags = (founder) => {
    const tags = [];
    
    // Add business stage as first tag
    if (founder.businessStage) {
      tags.push(founder.businessStage.split('(')[0].trim()); // Remove text in parentheses
    }
    
    // Add skills as tags (max 2)
    if (founder.skills && founder.skills.length > 0) {
      const skillTags = founder.skills.slice(0, 2);
      tags.push(...skillTags);
    }
    
    // Add interests if we need more tags
    if (founder.interests && founder.interests.length > 0 && tags.length < 4) {
      const remaining = 4 - tags.length;
      const interestTags = founder.interests.slice(0, remaining);
      tags.push(...interestTags);
    }
    
    // Add funding stage if not already included
    if (founder.fundingStage && founder.fundingStage !== 'Bootstrapped' && tags.length < 4) {
      tags.push(founder.fundingStage);
    }
    
    // Ensure we have at least 2 tags
    if (tags.length < 2) {
      tags.push('Innovation', 'Banasthali');
    }
    
    return tags.slice(0, 4);
  };
  
  // Helper function to determine status
  const getStatus = (businessStage) => {
    if (!businessStage) return 'Early Stage';
    
    const stage = businessStage.toLowerCase();
    
    if (stage.includes('scale') || stage.includes('established')) return 'Active';
    if (stage.includes('growth') || stage.includes('growing') || stage.includes('scaling')) return 'Growing';
    if (stage.includes('early') || stage.includes('traction') || stage.includes('idea')) return 'Early Stage';
    if (stage.includes('seed') || stage.includes('prototype')) return 'Seed Stage';
    
    return businessStage;
  };
  
  // Helper function for funding status
  const getFundingStatus = (fundingStage) => {
    if (!fundingStage) return 'Bootstrapped';
    
    const stage = fundingStage.toLowerCase();
    
    if (stage.includes('seed')) return 'Seed Funded';
    if (stage.includes('series')) return 'Series Funded';
    if (stage.includes('vc') || stage.includes('venture')) return 'VC Backed';
    if (stage.includes('angel')) return 'Angel Funded';
    if (stage.includes('bootstrapped')) return 'Bootstrapped';
    
    return fundingStage;
  };
  
  // Helper function for team info
  const getTeamInfo = (founder) => {
    if (founder.lookingFor && founder.lookingFor.length > 0) {
      return `${founder.lookingFor.length} roles open`;
    }
    
    if (founder.hiring) {
      return 'Hiring now';
    }
    
    return 'Small team';
  };
  
  // Handle card click - navigate to founder profile
  const handleCardClick = (founderId) => {
    console.log('🎯 Navigating to founder:', founderId);
    if (founderId) {
      navigate(`/founder/${founderId}`);
    }
  };
  
  // Duplicate startups for seamless loop
  const duplicatedStartups = startups.length > 0 ? [...startups, ...startups] : [];

  if (loading) {
    return (
      <section className="startup-showcase-section">
        <div className="showcase-bg-gradient"></div>
        <div className="floating-particles"></div>
        <div className="startup-showcase-container">
          <div className="showcase-header">
            <h2 className="section-title">Loading Startups...</h2>
            <div className="loading-spinner"></div>
            <p className="loading-text">
              Fetching data from database...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="startup-showcase-section">
        <div className="showcase-bg-gradient"></div>
        <div className="floating-particles"></div>
        <div className="startup-showcase-container">
          <div className="showcase-header">
            <h2 className="section-title">Startup Showcase</h2>
            <p className="error-message">⚠️ {error}</p>
            
            <div className="debug-info">
              <h3>🛠️ Debug Information:</h3>
              <ul>
                <li>API Endpoint: GET http://localhost:5000/api/founders</li>
                <li>Expected response: {"{success: true, founders: [...]}"}</li>
                <li>Open browser console (F12) for more details</li>
                <li>Try accessing the API directly in your browser</li>
              </ul>
            </div>
            
            <button onClick={fetchStartups} className="retry-btn">
              🔄 Retry Loading
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (startups.length === 0) {
    return (
      <section className="startup-showcase-section">
        <div className="showcase-bg-gradient"></div>
        <div className="floating-particles"></div>
        <div className="startup-showcase-container">
          <div className="showcase-header">
            <h2 className="section-title">Startup Showcase</h2>
            <p className="no-data">No startups found in the database.</p>
            <button 
              onClick={() => navigate('/founder/setup')}
              className="create-btn"
            >
              🚀 Create First Startup
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="startup-showcase-section">
      <div className="showcase-bg-gradient"></div>
      <div className="floating-particles"></div>
      
      <div className="startup-showcase-container">
        {/* Header */}
        <div className="showcase-header">
          <div className="header-top">
            <span className="badge">Live Database</span>
            <h2 className="section-title">Startup Showcase</h2>
          </div>
          <p className="section-subtitle">
            Showing {startups.length} real startups from our founders collection
          </p>
          
          <div className="showcase-stats">
            <div className="stat">
              <span className="stat-number">{startups.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {startups.filter(s => s.hiring).length}
              </span>
              <span className="stat-label">Hiring</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {startups.filter(s => s.funding !== 'Bootstrapped').length}
              </span>
              <span className="stat-label">Funded</span>
            </div>
          </div>
        </div>

        {/* Slider Track */}
        <div className="slider-container">
          <div 
            className="slider-track"
            onMouseEnter={() => {
              const track = document.querySelector('.slider-track');
              if (track) {
                track.style.animationPlayState = 'paused';
                track.style.transition = 'transform 0.3s ease-out';
              }
            }}
            onMouseLeave={() => {
              const track = document.querySelector('.slider-track');
              if (track) {
                track.style.animationPlayState = 'running';
                track.style.transition = 'transform 0.3s ease-out';
              }
            }}
            style={{ animationDuration: `${animationSpeed}s` }}
          >
            {duplicatedStartups.map((startup, index) => (
              <div 
                key={`${startup.id}-${index}`}
                className={`startup-card ${hoveredCard === startup.id ? 'hovered' : ''}`}
                onClick={() => handleCardClick(startup.founderId)}
                onMouseEnter={() => setHoveredCard(startup.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="card-glow"></div>
                
                {/* Status Badge */}
                <div className={`status-badge ${startup.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {startup.status}
                </div>
                
                {/* Banasthali ID */}
                <div className="id-badge">
                  🎓 {startup.banasthaliId}
                </div>
                
                {/* Card Image */}
                <div className="card-image">
                  {startup.image ? (
                    <img 
                      src={startup.image} 
                      alt={startup.name}
                      className="startup-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="image-placeholder">
                            <span class="placeholder-text">${startup.name.charAt(0)}</span>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="image-placeholder">
                      <span className="placeholder-text">{startup.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="image-overlay">
                    <span className="founder-badge">👩‍💼 {startup.founder}</span>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="card-content">
                  <div className="card-header">
                    <h3 className="startup-name">{startup.name}</h3>
                    <span className="category-tag">{startup.category}</span>
                  </div>
                  
                  <p className="startup-description">
                    {startup.description.length > 100 
                      ? startup.description.substring(0, 100) + '...' 
                      : startup.description}
                  </p>
                  
                  <div className="tags-container">
                    {startup.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">{tag}</span>
                    ))}
                  </div>
                  
                  <div className="startup-metrics">
                    <div className="metric">
                      <span className="metric-icon">💰</span>
                      <span className="metric-value">{startup.funding}</span>
                      <span className="metric-label">Funding</span>
                    </div>
                    <div className="metric">
                      <span className="metric-icon">👥</span>
                      <span className="metric-value">{startup.team}</span>
                      <span className="metric-label">Team</span>
                    </div>
                    <div className="metric">
                      <span className="metric-icon">📍</span>
                      <span className="metric-value">{startup.location}</span>
                      <span className="metric-label">Location</span>
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="view-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(startup.founderId);
                      }}
                    >
                      <span className="btn-icon">👁️</span>
                      <span className="btn-text">View Founder Profile</span>
                    </button>
                  </div>
                </div>
                
                <div className="card-border"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="slider-controls">
          <div className="slider-dots">
            {startups.slice(0, Math.min(6, startups.length)).map((startup, index) => (
              <button 
                key={index}
                className={`slider-dot ${hoveredCard === startup.id ? 'active' : ''}`}
                onMouseEnter={() => setHoveredCard(startup.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(startup.founderId)}
              />
            ))}
          </div>
          <div className="slider-info">
            <p>🎓 Real Banasthali startups • Click to view founder profiles</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartupShowcase;