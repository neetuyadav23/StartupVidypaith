// FounderKit.jsx
import React, { useState } from 'react';
import './FounderKit.css';
import Header from '../../Components/Header/Header.jsx';

const FounderKit = () => {
  const [activePhase, setActivePhase] = useState('discovery');
  const [bookmarked, setBookmarked] = useState([]);
  const [userStack, setUserStack] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Entrepreneurship learning phases
  const phases = [
    { id: 'discovery', title: '💡 Discovery', color: '#6366F1' },
    { id: 'validation', title: '🎯 Validation', color: '#10B981' },
    { id: 'launch', title: '🚀 Launch', color: '#F59E0B' },
    { id: 'growth', title: '📈 Growth', color: '#8B5CF6' },
    { id: 'scale', title: '⚡ Scale', color: '#EC4899' },
  ];

  // REAL working links for resources
  const phaseResources = {
    discovery: [
      { 
        id: 1,
        type: 'video', 
        title: 'How to Start a Startup', 
        provider: 'Y Combinator', 
        duration: '58 min',
        link: 'https://www.youtube.com/watch?v=CBYhVcO4WgI',
        description: 'Complete lecture on finding startup ideas and building products',
        difficulty: 'Beginner'
      },
      { 
        id: 2,
        type: 'article', 
        title: 'The Mom Test', 
        provider: 'Rob Fitzpatrick', 
        duration: '10 min read',
        link: 'https://www.momtestbook.com/',
        description: 'How to talk to customers and learn if your business is a good idea',
        difficulty: 'Beginner'
      },
      { 
        id: 3,
        type: 'tool', 
        title: 'Business Model Canvas', 
        provider: 'Strategyzer', 
        duration: 'Interactive',
        link: 'https://www.strategyzer.com/canvas/business-model-canvas',
        description: 'Strategic management template for developing new business models',
        difficulty: 'Beginner'
      }
    ],
    validation: [
      { 
        id: 4,
        type: 'course', 
        title: 'Lean Startup Methodology', 
        provider: 'Udemy', 
        duration: '4 hours',
        link: 'https://www.udemy.com/course/lean-startup-fast-track/',
        description: 'Build-Measure-Learn feedback loop for startups',
        difficulty: 'Intermediate'
      },
      { 
        id: 5,
        type: 'template', 
        title: 'MVP Canvas', 
        provider: 'Productize', 
        duration: 'Template',
        link: 'https://www.productizefit.com/mvp-canvas',
        description: 'Template to define your Minimum Viable Product',
        difficulty: 'Beginner'
      },
      { 
        id: 6,
        type: 'case-study', 
        title: 'How Airbnb Started', 
        provider: 'Y Combinator', 
        duration: '15 min read',
        link: 'https://www.ycombinator.com/library/8F-how-airbnb-started',
        description: 'Real case study of product-market fit discovery',
        difficulty: 'Intermediate'
      }
    ],
    launch: [
      { 
        id: 7,
        type: 'guide', 
        title: 'Launch Week Playbook', 
        provider: 'Lenny\'s Newsletter', 
        duration: '25 min read',
        link: 'https://www.lennysnewsletter.com/p/launch-week-playbook',
        description: 'Complete guide to planning your product launch',
        difficulty: 'Intermediate'
      },
      { 
        id: 8,
        type: 'video', 
        title: 'Product Hunt Launch Guide', 
        provider: 'Product Hunt', 
        duration: '12 min',
        link: 'https://www.youtube.com/watch?v=HlT6t47cR1k',
        description: 'How to successfully launch on Product Hunt',
        difficulty: 'Beginner'
      }
    ],
    growth: [
      { 
        id: 9,
        type: 'video', 
        title: 'Growth Frameworks That Work', 
        provider: 'Brian Balfour', 
        duration: '45 min',
        link: 'https://www.youtube.com/watch?v=lLJvxrWlELU',
        description: 'Frameworks for sustainable growth',
        difficulty: 'Advanced'
      },
      { 
        id: 10,
        type: 'article', 
        title: 'The Growth Machine', 
        provider: 'First Round Review', 
        duration: '20 min read',
        link: 'https://review.firstround.com/the-growth-machine-how-to-build-a-system-that-drives-sustainable-growth',
        description: 'Building systems for sustainable growth',
        difficulty: 'Intermediate'
      }
    ],
    scale: [
      { 
        id: 11,
        type: 'book', 
        title: 'Scaling Up', 
        provider: 'Verne Harnish', 
        duration: 'Book',
        link: 'https://www.scalingup.com/',
        description: 'How to scale your business effectively',
        difficulty: 'Advanced'
      },
      { 
        id: 12,
        type: 'course', 
        title: 'Scaling Startups', 
        provider: 'Harvard Business School', 
        duration: '6 weeks',
        link: 'https://online.hbs.edu/courses/scaling-entrepreneurial-ventures/',
        description: 'Strategic frameworks for scaling businesses',
        difficulty: 'Advanced'
      }
    ]
  };

  // Founder stories
  const founderStories = [
    {
      name: 'Sara Blakely',
      company: 'Spanx',
      quote: 'Don\'t be intimidated by what you don\'t know. That can be your greatest strength.',
      lesson: 'Started with $5,000 savings, now billion-dollar company',
      link: 'https://www.spanx.com/about-us/sara-blakely'
    },
    {
      name: 'Brian Chesky',
      company: 'Airbnb',
      quote: 'If we tried to think of a good idea, we wouldn\'t have been able to think of a good idea.',
      lesson: 'Sold cereal boxes to fund early development',
      link: 'https://www.airbnb.com/ceo-founders'
    },
    {
      name: 'Melanie Perkins',
      company: 'Canva',
      quote: 'You don\'t need to have it all figured out to get started.',
      lesson: 'Pitched 100+ investors before getting funding',
      link: 'https://www.canva.com/company/'
    }
  ];

  // Essential tools with real links
  const tools = [
    { 
      id: 1,
      name: 'Business Model Canvas', 
      category: 'Planning', 
      free: true,
      link: 'https://www.strategyzer.com/canvas/business-model-canvas'
    },
    { 
      id: 2,
      name: 'Stripe Atlas', 
      category: 'Legal', 
      free: false,
      link: 'https://stripe.com/atlas'
    },
    { 
      id: 3,
      name: 'Notion', 
      category: 'Documentation', 
      free: true,
      link: 'https://www.notion.so/'
    },
    { 
      id: 4,
      name: 'Figma', 
      category: 'Design', 
      free: true,
      link: 'https://www.figma.com/'
    },
    { 
      id: 5,
      name: 'HubSpot CRM', 
      category: 'Sales', 
      free: true,
      link: 'https://www.hubspot.com/products/crm'
    },
    { 
      id: 6,
      name: 'Google Analytics', 
      category: 'Analytics', 
      free: true,
      link: 'https://analytics.google.com/'
    },
    { 
      id: 7,
      name: 'Trello', 
      category: 'Project Management', 
      free: true,
      link: 'https://trello.com/'
    },
    { 
      id: 8,
      name: 'Slack', 
      category: 'Communication', 
      free: true,
      link: 'https://slack.com/'
    },
  ];

  // Learning paths
  const learningPaths = [
    { title: 'Solo Founder Track', duration: '3 months', projects: 5, for: 'Individual founders' },
    { title: 'Tech Founder Track', duration: '6 months', projects: 8, for: 'Technical founders' },
    { title: 'Non-Tech Founder Track', duration: '4 months', projects: 6, for: 'Business-focused founders' },
  ];

  // Filter resources based on search query
  const filteredResources = phaseResources[activePhase]?.filter(resource => 
    searchQuery === '' || 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBookmark = (resourceId) => {
    if (bookmarked.includes(resourceId)) {
      setBookmarked(bookmarked.filter(id => id !== resourceId));
    } else {
      setBookmarked([...bookmarked, resourceId]);
    }
  };

  const toggleStackItem = (item) => {
    if (userStack.some(stackItem => stackItem.id === item.id && stackItem.type === item.type)) {
      setUserStack(userStack.filter(stackItem => 
        !(stackItem.id === item.id && stackItem.type === item.type)
      ));
    } else {
      setUserStack([...userStack, item]);
    }
  };

  const isInStack = (item) => {
    return userStack.some(stackItem => stackItem.id === item.id && stackItem.type === item.type);
  };

  const getResourceIcon = (type) => {
    const icons = {
      video: '🎬',
      article: '📄',
      course: '🎓',
      tool: '🛠️',
      template: '📋',
      'case-study': '📊',
      guide: '🗺️',
      book: '📚'
    };
    return icons[type] || '📖';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already handled by filteredResources
  };

  return (
    <div className="founder-kit">
      <Header />
      {/* Hero Section */}
      <div className="founder-hero-section">
        <div className="founder-hero-content">
          <h1 className="founder-hero-title">FounderKit</h1>
          <p className="founder-hero-subtitle">
            Everything you need to build your startup. Curated resources, guides, and tools.
          </p>
          <div className="founder-hero-stats">
            <div className="founder-stat">
              <div className="founder-stat-number">500+</div>
              <div className="founder-stat-label">Resources</div>
            </div>
            <div className="founder-stat">
              <div className="founder-stat-number">{userStack.length}</div>
              <div className="founder-stat-label">In Your Kit</div>
            </div>
            <div className="founder-stat">
              <div className="founder-stat-number">100k+</div>
              <div className="founder-stat-label">Founders</div>
            </div>
          </div>
          <form className="founder-search-box" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search resources, tools, guides..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="founder-search-btn">🔍 Search</button>
          </form>
        </div>
      </div>

      <div className="founder-hub-container">
        {/* My Kit Section */}
        {userStack.length > 0 && (
          <div className="founder-kit-section">
            <div className="founder-section-header">
              <h2 className="founder-section-title">Your FounderKit ({userStack.length})</h2>
              <button 
                className="founder-clear-kit-btn"
                onClick={() => setUserStack([])}
              >
                Clear All
              </button>
            </div>
            <div className="founder-kit-grid">
              {userStack.map((item, index) => (
                <div key={`${item.type}-${item.id}`} className="founder-kit-item">
                  <span className="founder-kit-icon">{getResourceIcon(item.type)}</span>
                  <div className="founder-kit-info">
                    <h4>{item.title || item.name}</h4>
                    <p>{item.type === 'tool' ? item.category : item.provider}</p>
                  </div>
                  <button 
                    className="founder-remove-kit-btn"
                    onClick={() => toggleStackItem(item)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase Navigation */}
        <div className="founder-phase-navigation">
          <h2 className="founder-section-title">Your Founder Journey</h2>
          <p className="founder-section-subtitle">Follow these phases to build your startup systematically</p>
          <div className="founder-phase-tabs">
            {phases.map(phase => (
              <button
                key={phase.id}
                className={`founder-phase-tab ${activePhase === phase.id ? 'founder-active' : ''}`}
                onClick={() => {
                  setActivePhase(phase.id);
                  setSearchQuery('');
                }}
                style={{ '--founder-phase-color': phase.color }}
              >
                {phase.title}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Content */}
        <div className="founder-phase-content">
          <div className="founder-phase-header">
            <h3 className="founder-phase-title">
              {phases.find(p => p.id === activePhase)?.title}
              <span className="founder-phase-badge">
                {filteredResources?.length || 0} resources
              </span>
            </h3>
            <p className="founder-phase-description">
              {activePhase === 'discovery' && 'Find and validate your startup idea'}
              {activePhase === 'validation' && 'Test your idea with real customers'}
              {activePhase === 'launch' && 'Launch your product to the market'}
              {activePhase === 'growth' && 'Grow your user base and revenue'}
              {activePhase === 'scale' && 'Scale your business operations'}
            </p>
          </div>

          {searchQuery && (
            <div className="founder-search-results">
              Showing {filteredResources?.length || 0} results for "{searchQuery}"
            </div>
          )}

          <div className="founder-resources-grid">
            {filteredResources?.map((resource, index) => (
              <div key={resource.id} className="founder-resource-card">
                <div className="founder-resource-header">
                  <span className="founder-resource-icon">{getResourceIcon(resource.type)}</span>
                  <span className="founder-resource-type">{resource.type}</span>
                  <div className="founder-resource-actions">
                    <button 
                      className={`founder-bookmark-btn ${bookmarked.includes(resource.id) ? 'founder-bookmarked' : ''}`}
                      onClick={() => toggleBookmark(resource.id)}
                      title="Bookmark"
                    >
                      {bookmarked.includes(resource.id) ? '★' : '☆'}
                    </button>
                    <button 
                      className={`founder-kit-add-btn ${isInStack({...resource, type: 'resource'}) ? 'founder-in-kit' : ''}`}
                      onClick={() => toggleStackItem({...resource, type: 'resource'})}
                      title={isInStack({...resource, type: 'resource'}) ? "Remove from kit" : "Add to kit"}
                    >
                      {isInStack({...resource, type: 'resource'}) ? '✓ In Kit' : '+ Kit'}
                    </button>
                  </div>
                </div>
                <div className="founder-resource-body">
                  <h4 className="founder-resource-title">{resource.title}</h4>
                  <p className="founder-resource-description">{resource.description}</p>
                  <div className="founder-resource-meta">
                    <span className="founder-resource-provider">By {resource.provider}</span>
                    <span className="founder-resource-duration">• {resource.duration}</span>
                    <span className={`founder-difficulty-badge founder-${resource.difficulty.toLowerCase()}`}>
                      {resource.difficulty}
                    </span>
                  </div>
                </div>
                <div className="founder-resource-footer">
                  <a href={resource.link} className="founder-resource-link" target="_blank" rel="noopener noreferrer">
                    Open Resource →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Paths */}
        <div className="founder-paths-section">
          <h2 className="founder-section-title">Structured Learning Paths</h2>
          <p className="founder-section-subtitle">Follow these curated paths based on your background</p>
          <div className="founder-paths-grid">
            {learningPaths.map((path, index) => (
              <div key={index} className="founder-path-card">
                <div className="founder-path-header">
                  <h3 className="founder-path-title">{path.title}</h3>
                  <span className="founder-path-duration">{path.duration}</span>
                </div>
                <div className="founder-path-body">
                  <div className="founder-path-meta">
                    <span>📁 {path.projects} projects</span>
                    <span>👥 {path.for}</span>
                  </div>
                  <ul className="founder-path-topics">
                    <li>Idea validation</li>
                    <li>Market research</li>
                    <li>MVP building</li>
                    <li>User acquisition</li>
                    <li>Fundraising basics</li>
                  </ul>
                </div>
                <button className="founder-path-cta">Start Learning Path →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Founder Stories */}
        <div className="founder-stories-section">
          <h2 className="founder-section-title">Learn from Founder Stories</h2>
          <p className="founder-section-subtitle">Real stories, real lessons from successful entrepreneurs</p>
          <div className="founder-stories-grid">
            {founderStories.map((story, index) => (
              <div key={index} className="founder-story-card">
                <div className="founder-story-quote">"{story.quote}"</div>
                <div className="founder-story-content">
                  <h3 className="founder-story-name">{story.name}</h3>
                  <p className="founder-story-company">{story.company}</p>
                  <p className="founder-story-lesson">{story.lesson}</p>
                </div>
                <a href={story.link} className="founder-story-link" target="_blank" rel="noopener noreferrer">
                  Read Full Story →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Essential Tools */}
        <div className="founder-tools-section">
          <div className="founder-section-header">
            <h2 className="founder-section-title">Essential Startup Tools</h2>
            <p className="founder-section-subtitle">Curated tools used by successful startups</p>
          </div>
          <div className="founder-tools-grid">
            {tools.map((tool, index) => (
              <div key={tool.id} className="founder-tool-card">
                <div className="founder-tool-header">
                  <h3 className="founder-tool-name">{tool.name}</h3>
                  <div className="founder-tool-badges">
                    <span className={`founder-tool-pricing ${tool.free ? 'founder-free' : 'founder-paid'}`}>
                      {tool.free ? 'Free' : 'Paid'}
                    </span>
                    {isInStack({...tool, type: 'tool'}) && (
                      <span className="founder-tool-kit-badge">In Your Kit</span>
                    )}
                  </div>
                </div>
                <p className="founder-tool-category">{tool.category}</p>
                <div className="founder-tool-actions">
                  <a href={tool.link} target="_blank" rel="noopener noreferrer" className="founder-tool-btn founder-view">
                    View Tool
                  </a>
                  <button 
                    className={`founder-tool-btn ${isInStack({...tool, type: 'tool'}) ? 'founder-remove' : 'founder-add'}`}
                    onClick={() => toggleStackItem({...tool, type: 'tool'})}
                  >
                    {isInStack({...tool, type: 'tool'}) ? 'Remove from Kit' : 'Add to Kit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Challenge */}
        <div className="founder-challenge-section">
          <div className="founder-challenge-card">
            <div className="founder-challenge-content">
              <span className="founder-challenge-badge">This Week's Challenge</span>
              <h2 className="founder-challenge-title">Talk to 5 Potential Customers</h2>
              <p className="founder-challenge-description">
                The single most important skill for entrepreneurs: customer discovery.
                This week, interview 5 people about the problem you're solving.
              </p>
              <div className="founder-challenge-steps">
                <div className="founder-step">
                  <span className="founder-step-number">1</span>
                  <span>Prepare 5 open-ended questions</span>
                </div>
                <div className="founder-step">
                  <span className="founder-step-number">2</span>
                  <span>Find people to interview</span>
                </div>
                <div className="founder-step">
                  <span className="founder-step-number">3</span>
                  <span>Listen more than you talk</span>
                </div>
              </div>
              <button className="founder-challenge-cta">Start Challenge →</button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="founder-quick-stats">
          <div className="founder-quick-stat">
            <div className="founder-quick-stat-icon">📚</div>
            <div>
              <div className="founder-quick-stat-number">
                {Object.values(phaseResources).flat().length}
              </div>
              <div className="founder-quick-stat-label">Total Resources</div>
            </div>
          </div>
          <div className="founder-quick-stat">
            <div className="founder-quick-stat-icon">🛠️</div>
            <div>
              <div className="founder-quick-stat-number">{tools.length}</div>
              <div className="founder-quick-stat-label">Essential Tools</div>
            </div>
          </div>
          <div className="founder-quick-stat">
            <div className="founder-quick-stat-icon">📈</div>
            <div>
              <div className="founder-quick-stat-number">{learningPaths.length}</div>
              <div className="founder-quick-stat-label">Learning Paths</div>
            </div>
          </div>
          <div className="founder-quick-stat">
            <div className="founder-quick-stat-icon">💼</div>
            <div>
              <div className="founder-quick-stat-number">{userStack.length}</div>
              <div className="founder-quick-stat-label">In Your Kit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FounderKit;