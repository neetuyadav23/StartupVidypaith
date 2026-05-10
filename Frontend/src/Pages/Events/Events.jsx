import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../AuthContext";
import Header from "../../Components/Header/Header.jsx";
import Footer from "../../Components/Footer/Footer.jsx";
import TTSButton from '../../Components/TTS/TTSButton';
import { API_BASE_URL } from "../../constants";
import { 
  Search, Calendar, Tag, ExternalLink, Filter, 
  Trash2, Plus, Edit2, Clock, MapPin, Users, ChevronRight, X,
  Globe, Building, Link, Headphones
} from 'lucide-react';
import './Events.css';

const Events = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Events');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Hiring',
    date: '',
    mode: 'Online',
    time: '',
    location: '',
    applyLink: '',
    startupName: '',
    registrationDeadline: '',
    maxParticipants: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching events from API:', `${API_BASE_URL}/events`);
      
      const response = await fetch(`${API_BASE_URL}/events`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('API Response:', data);
      
      // Handle different response structures
      let eventsData = [];
      
      if (data.success && data.events) {
        eventsData = data.events;
      } else if (data.data) {
        eventsData = data.data;
      } else if (data.docs) {
        eventsData = data.docs;
      } else if (Array.isArray(data)) {
        eventsData = data;
      } else if (data.success && Array.isArray(data)) {
        eventsData = data;
      }
      
      console.log('Events to display:', eventsData);
      setEvents(eventsData || []);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can add events
  const canAddEvents = () => {
    if (!isAuthenticated) return false;
    
    const userRole = user?.role || user?.type || user?.userType;
    return userRole === 'founder' || userRole === 'admin';
  };

  // Check if user can edit specific event
  const canEditEvent = (event) => {
    if (!isAuthenticated) return false;
    
    const userRole = user?.role || user?.type || user?.userType;
    const isAdmin = userRole === 'admin';
    const isCreator = event.createdBy === user?._id || event.createdBy?._id === user?._id;
    
    return isAdmin || isCreator;
  };

  // Check if user can delete specific event
  const canDeleteEvent = (event) => {
    if (!isAuthenticated) return false;
    
    const userRole = user?.role || user?.type || user?.userType;
    const isAdmin = userRole === 'admin';
    const isCreator = event.createdBy === user?._id || event.createdBy?._id === user?._id;
    
    // Admin can delete any event, creators can only delete their own events
    return isAdmin || isCreator;
  };

  const handleAddEvent = () => {
    if (!canAddEvents()) {
      alert('Only founders and admins can create events');
      return;
    }
    
    setIsEditMode(false);
    setCurrentEventId(null);
    setFormData({
      title: '',
      description: '',
      category: 'Hiring',
      date: '',
      mode: 'Online',
      time: '',
      location: '',
      applyLink: '',
      startupName: user?.startupName || user?.company || user?.name || '',
      registrationDeadline: '',
      maxParticipants: '',
      tags: []
    });
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    if (!canEditEvent(event)) {
      alert('You are not authorized to edit this event');
      return;
    }
    
    setIsEditMode(true);
    setCurrentEventId(event._id);
    
    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        return '';
      }
    };
    
    // Determine mode from location
    const getModeFromLocation = (location) => {
      if (!location) return 'Online';
      const loc = location.toLowerCase();
      return loc.includes('online') || loc === 'online' ? 'Online' : 'Offline';
    };
    
    setFormData({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'Hiring',
      date: formatDateForInput(event.date),
      mode: getModeFromLocation(event.location),
      time: event.time || '',
      location: event.location && !event.location.toLowerCase().includes('online') ? event.location : '',
      applyLink: event.applyLink || '',
      startupName: event.startupName || '',
      registrationDeadline: formatDateForInput(event.registrationDeadline),
      maxParticipants: event.maxParticipants || '',
      tags: event.tags || []
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }

      // Remove event from state
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      alert('Event deleted successfully');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please login to create events');
      navigate('/login');
      return;
    }

    // Validation - Only require title, date, and startupName
    if (!formData.title.trim() || !formData.date || !formData.startupName.trim()) {
      alert('Please fill in Title, Date, and Startup Name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare location based on mode
      const location = formData.mode === 'Online' 
        ? 'Online' 
        : (formData.location || 'Physical Location');

      // Prepare data for API
      const eventData = {
        title: formData.title,
        description: formData.description || '',
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        time: formData.time || '',
        location: location,
        applyLink: formData.applyLink || '',
        startupName: formData.startupName,
        tags: formData.tags || []
      };

      // Add optional fields if they exist
      if (formData.registrationDeadline) {
        eventData.registrationDeadline = new Date(formData.registrationDeadline).toISOString();
      }
      if (formData.maxParticipants) {
        eventData.maxParticipants = parseInt(formData.maxParticipants);
      }

      console.log('Submitting event:', eventData);

      const url = isEditMode ? 
        `${API_BASE_URL}/events/${currentEventId}` : 
        `${API_BASE_URL}/events`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();
      console.log('Submit response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
      }

      alert(`Event ${isEditMode ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      
      // Refresh events immediately
      fetchEvents();
      
    } catch (err) {
      console.error('Error submitting event:', err);
      alert(err.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Time not specified';
    return timeString;
  };

  const getLocationIcon = (location) => {
    if (!location) return <Globe size={16} />;
    const loc = location.toLowerCase();
    return loc.includes('online') ? <Globe size={16} /> : <Building size={16} />;
  };

  const getLocationText = (location) => {
    if (!location) return 'Location not specified';
    return location;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Hiring': 'category-hiring',
      'Hackathon': 'category-hackathon',
      'Workshop': 'category-workshop',
      'Competition': 'category-competition',
      'Networking': 'category-networking',
      'Conference': 'category-conference',
      'Webinar': 'category-webinar',
      'Other': 'category-other'
    };
    return colors[category] || colors.Other;
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    // Apply category filter
    const categoryMatch = selectedCategory === 'All Events' || event.category === selectedCategory;
    
    // Apply search filter
    const searchMatch = searchQuery === '' || 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.startupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="events-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="events-page">
      <Header />
      
      {/* Hero Section */}
      <div className="events-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Upcoming Opportunities</h1>
            <p className="hero-subtitle">
              Discover hackathons, workshops, hiring events, and connect with the startup community
            </p>
            
            {/* TTS Feature Announcement */}
            <div className="tts-feature-announcement">
              <Headphones size={18} />
              <span>New: Listen to event details in multiple languages!</span>
            </div>
            
            {/* Add Event Button */}
            {canAddEvents() && (
              <button 
                className="create-event-btn"
                onClick={handleAddEvent}
              >
                <Plus size={20} />
                Create New Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="events-filter">
        <div className="container">
          <div className="filter-container">
            <div className="search-form">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="filter-controls">
              <div className="filter-group">
                <Filter size={18} />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="All Events">All Categories</option>
                  <option value="Hiring">Hiring</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Competition">Competition</option>
                  <option value="Networking">Networking</option>
                  <option value="Conference">Conference</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="events-grid-section">
        <div className="container">
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={fetchEvents} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          <div className="events-header">
            <h2>Upcoming Events</h2>
            <div className="events-count">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <div className="no-events-icon">📅</div>
              <h3>No Events Found</h3>
              <p>
                {events.length === 0 
                  ? "No events have been created yet." 
                  : "No events match your current filters."}
              </p>
              <div className="no-events-actions">
                <button 
                  onClick={() => {
                    setSelectedCategory('All Events');
                    setSearchQuery('');
                  }}
                  className="view-all-btn"
                >
                  View All Events
                </button>
                {canAddEvents() && (
                  <button onClick={handleAddEvent} className="create-event-btn">
                    <Plus size={18} />
                    Create New Event
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map((event, index) => (
                <div 
                  key={event._id || index} 
                  className="event-card"
                >
                  <div className="event-card-content">
                    <div className="event-header">
                      <div className="event-category-badges">
                        <span className={`event-category ${getCategoryColor(event.category)}`}>
                          {event.category || 'Other'}
                        </span>
                        {event.isFeatured && (
                          <span className="featured-badge">
                            Featured
                          </span>
                        )}
                      </div>
                      
                      {/* TTS Button and Admin Actions Container */}
                      <div className="event-utility-buttons">
                        <TTSButton event={event} />
                        
                        {/* Admin/Founder Actions */}
                        {(canEditEvent(event) || canDeleteEvent(event)) && (
                          <div className="event-admin-actions">
                            {canEditEvent(event) && (
                              <button 
                                onClick={() => handleEditEvent(event)}
                                className="edit-btn"
                                title="Edit Event"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDeleteEvent(event) && (
                              <button 
                                onClick={() => handleDeleteEvent(event._id)}
                                className="delete-btn"
                                title="Delete Event"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="event-title">{event.title || 'Untitled Event'}</h3>
                    
                    <p className="event-description">
                      {event.description 
                        ? (event.description.length > 120 
                            ? `${event.description.substring(0, 120)}...` 
                            : event.description)
                        : 'No description provided'}
                    </p>
                    
                    <div className="event-details">
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      
                      {event.time && (
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{formatTime(event.time)}</span>
                        </div>
                      )}
                      
                      <div className="detail-item">
                        {getLocationIcon(event.location)}
                        <span>{getLocationText(event.location)}</span>
                      </div>
                      
                      <div className="detail-item">
                        <Tag size={16} />
                        <span>{event.startupName || 'Unknown Startup'}</span>
                      </div>
                      
                      {event.applyLink && (
                        <div className="detail-item">
                          <Link size={16} />
                          <span>Registration Link Available</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="event-tags">
                        {event.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="event-tag">
                            #{tag}
                          </span>
                        ))}
                        {event.tags.length > 3 && (
                          <span className="event-tag-more">
                            +{event.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="event-actions">
                      {event.applyLink ? (
                        <a 
                          href={event.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="register-btn"
                        >
                          Register Now
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <button 
                          className="details-btn"
                          onClick={() => alert('No registration link provided. Please contact the organizer.')}
                        >
                          View Details
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      {canAddEvents() && (
        <button 
          className="floating-action-btn"
          onClick={handleAddEvent}
          title="Add New Event"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create/Edit Event Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitEvent} className="modal-form">
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter event title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="Hiring">Hiring</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Competition">Competition</option>
                  <option value="Networking">Networking</option>
                  <option value="Conference">Conference</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label>Mode (Optional)</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({...formData, mode: e.target.value})}
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              
              {formData.mode === 'Offline' && (
                <div className="form-group">
                  <label>Physical Location (Optional for Offline)</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter physical address"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Time (Optional)</label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  placeholder="e.g., 10:00 AM or 2:00 PM - 4:00 PM"
                />
              </div>
              
              <div className="form-group">
                <label>Registration Link (Optional)</label>
                <input
                  type="url"
                  value={formData.applyLink}
                  onChange={(e) => setFormData({...formData, applyLink: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              
              <div className="form-group">
                <label>Startup Name *</label>
                <input
                  type="text"
                  value={formData.startupName}
                  onChange={(e) => setFormData({...formData, startupName: e.target.value})}
                  placeholder="Your startup name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your event..."
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Registration Deadline (Optional)</label>
                <input
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label>Max Participants (Optional)</label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label>Tags (Optional)</label>
                <div className="tags-input-container">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="tags-input"
                  />
                  <button 
                    type="button" 
                    onClick={addTag}
                    className="add-tag-btn"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="tags-list">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                        <button 
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
       
      <Footer />
    </div>
  );
};

export default Events;