import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Components/Header/Header.jsx';
import { API_BASE_URL } from '../constants.jsx';
import './FounderApplications.css';

const FounderApplications = () => {
  const { founderId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [applicationToAction, setApplicationToAction] = useState(null);
  const [applicantProfile, setApplicantProfile] = useState(null);
  const [showApplicantProfile, setShowApplicantProfile] = useState(false);

  // Load current user
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    
    loadUser();
  }, []);

  // Load applications
  useEffect(() => {
    if (founderId) {
      loadApplications();
    }
  }, [founderId]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view applications');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/applications/founder/${founderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const formattedApplications = data.applications.map(app => ({
          ...app,
          applicantName: app.applicantName || app.studentId?.fullName || 'Anonymous',
          email: app.email || app.studentId?.email || '',
          phone: app.phone || app.studentId?.phone || '',
          skills: app.skills || app.studentId?.skills || [],
          experience: app.experience || '',
          portfolio: app.portfolio || '',
          resume: app.resume || app.studentId?.resume || '',
          studentId: app.studentId?._id || app.studentId
        }));
        setApplications(formattedApplications);
      } else {
        setError(data.message || 'Failed to load applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is the founder
  const isCurrentUserFounder = () => {
    if (!currentUser || !founderId) return false;
    return currentUser._id === founderId || currentUser.userId === founderId;
  };

  // Load applicant profile
  const loadApplicantProfile = async (studentId) => {
    try {
      if (!studentId) {
        alert('No student ID found');
        return;
      }
      
      const token = localStorage.getItem('token');
      console.log('Loading profile for studentId:', studentId);
      
      const response = await fetch(`${API_BASE_URL}/users/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data:', data);
        if (data.success && data.user) {
          setApplicantProfile(data.user);
          setShowApplicantProfile(true);
        } else {
          alert('Failed to load profile: ' + (data.message || 'Unknown error'));
        }
      } else {
        const errorText = await response.text();
        alert('Error loading profile: ' + errorText);
      }
    } catch (error) {
      console.error('Error loading applicant profile:', error);
      alert('Failed to load applicant profile: ' + error.message);
    }
  };

  // Prepare action for accept/reject
  const prepareAction = (application, action) => {
    setApplicationToAction(application);
    setSelectedAction(action);
    const defaultMessage = action === 'accepted' 
      ? `Congratulations! Your application has been accepted at ${currentUser?.startupName || 'our startup'}. We will contact you soon with further details.`
      : `Thank you for your application to ${currentUser?.startupName || 'our startup'}. After careful consideration, we regret to inform you that we cannot proceed with your application at this time.`;
    
    setNotificationMessage(defaultMessage);
    setShowNotificationModal(true);
  };

  // Handle application status update with notification
  const handleUpdateStatus = async (applicationId, newStatus, customMessage = '', applicantEmail = '') => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          actionBy: currentUser._id,
          actionDate: new Date().toISOString(),
          customMessage: customMessage || notificationMessage
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const updatedApplications = applications.map(app => {
          if (app._id === applicationId) {
            return { ...app, status: newStatus };
          }
          return app;
        });
        
        setApplications(updatedApplications);
        
        if (selectedApplication && selectedApplication._id === applicationId) {
          setSelectedApplication({
            ...selectedApplication,
            status: newStatus
          });
        }

        if (newStatus === 'accepted') {
          alert(`✅ Application accepted! Email has been sent to the applicant.`);
        } else if (newStatus === 'rejected') {
          alert(`📫 Application rejected. Notification has been sent to the applicant.`);
        } else {
          alert(`✅ Application status updated to ${newStatus}`);
        }

        setShowNotificationModal(false);
        setNotificationMessage('');
        return true;
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    }
    return false;
  };

  // View application details
  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  // Filter applications by status
  const getFilteredApplications = () => {
    if (statusFilter === 'all') {
      return applications;
    }
    return applications.filter(app => app.status === statusFilter);
  };

  // Get status count
  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      all: applications.length
    };
    
    applications.forEach(app => {
      if (app.status && counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="founder-applications-container">
        <Header />
        <div className="founder-applications loading">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  if (!isCurrentUserFounder()) {
    return (
      <div className="founder-applications-container">
        <Header />
        <div className="founder-applications unauthorized">
          <h2>Access Denied</h2>
          <p>You are not authorized to view these applications.</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="founder-applications-container">
      <Header />
      <div className="founder-applications">
        {/* Header */}
        <div className="applications-header">
          <h1>📋 Manage Applications</h1>
          <p>Review and manage applications for your startup</p>
          
          {/* GAMIFIED STATS (girl-scientist removed) */}
          <div className="stats-overview gamified-stats">
            <div className="stat-card gamified mario">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/1995/1995572.png" 
                alt="Mario" 
                className="stat-image"
              />
              <div className="stat-number">{statusCounts.all}</div>
              <div className="stat-label">Total Applications</div>
            </div>

            <div className="stat-card gamified barbie">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/921/921490.png" 
                alt="Barbie" 
                className="stat-image"
              />
              <div className="stat-number">{statusCounts.pending}</div>
              <div className="stat-label">Pending</div>
            </div>

            <div className="stat-card gamified girl-coder">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/1055/1055687.png" 
                alt="Girl Coder" 
                className="stat-image"
              />
              <div className="stat-number">{statusCounts.reviewed}</div>
              <div className="stat-label">Reviewed</div>
            </div>

            <div className="stat-card gamified girl-artist">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/1995/1995572.png" 
                alt="Girl Artist" 
                className="stat-image"
              />
              <div className="stat-number">{statusCounts.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>

            <div className="stat-card gamified girl-founder">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
                alt="Girl Founder" 
                className="stat-image"
              />
              <div className="stat-number">{statusCounts.withdrawn}</div>
              <div className="stat-label">Withdrawn</div>
            </div>
          </div>
        </div>

        {/* Filter Section (unchanged) */}
        <div className="filter-section">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({statusCounts.all})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({statusCounts.pending})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'reviewed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('reviewed')}
            >
              Reviewed ({statusCounts.reviewed})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'accepted' ? 'active' : ''}`}
              onClick={() => setStatusFilter('accepted')}
            >
              Accepted ({statusCounts.accepted})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('rejected')}
            >
              Rejected ({statusCounts.rejected})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'withdrawn' ? 'active' : ''}`}
              onClick={() => setStatusFilter('withdrawn')}
            >
              Withdrawn ({statusCounts.withdrawn})
            </button>
          </div>
          
          <button className="refresh-btn" onClick={loadApplications}>
            🔄 Refresh
          </button>
        </div>

        {/* Applications List (unchanged) */}
        <div className="applications-list">
          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadApplications}>Try Again</button>
            </div>
          ) : getFilteredApplications().length === 0 ? (
            <div className="no-applications">
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <h3>No applications yet</h3>
                <p>Applications from users will appear here when they apply for your open positions.</p>
                <button onClick={() => navigate(-1)}>Back to Profile</button>
              </div>
            </div>
          ) : (
            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Position</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredApplications().map(app => (
                    <tr key={app._id} className={`application-row status-${app.status}`}>
                      <td>
                        <div className="applicant-info">
                          <div className="applicant-avatar">
                            {app.applicantName ? app.applicantName.charAt(0) : 'A'}
                          </div>
                          <div className="applicant-details">
                            <strong>{app.applicantName || 'Anonymous'}</strong>
                            <small>{app.email}</small>
                            <small>{app.applicantType || 'Student'}</small>
                          </div>
                        </div>
                      </td>
                      <td>{app.role}</td>
                      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${app.status || 'pending'}`}>
                          {app.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="view-btn"
                            onClick={() => handleViewApplication(app)}
                          >
                            View Details
                          </button>
                          
                          {app.status === 'pending' && (
                            <>
                              <button 
                                className="accept-btn"
                                onClick={() => prepareAction(app, 'accepted')}
                              >
                                Accept
                              </button>
                              <button 
                                className="reject-btn"
                                onClick={() => prepareAction(app, 'rejected')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          
                          {app.status === 'accepted' && (
                            <button className="accepted-btn disabled-btn" disabled>
                              ✅ Accepted
                            </button>
                          )}
                          
                          {app.status === 'rejected' && (
                            <button className="rejected-btn disabled-btn" disabled>
                              ❌ Rejected
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Application Details Modal (unchanged) */}
        {showApplicationModal && selectedApplication && (
          <div className="modal-overlay">
            <div className="modal-content application-details-modal">
              <div className="modal-header">
                <h2>Application Details</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowApplicationModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="application-details">
                <div className="detail-section">
                  <h3>Applicant Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedApplication.applicantName || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedApplication.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedApplication.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">User Type:</span>
                      <span className="detail-value">{selectedApplication.applicantType || 'Student'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Applied for:</span>
                      <span className="detail-value">{selectedApplication.role}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Applied on:</span>
                      <span className="detail-value">
                        {new Date(selectedApplication.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`status-badge ${selectedApplication.status || 'pending'}`}>
                        {selectedApplication.status || 'pending'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedApplication.studentId && (
                    <div className="view-profile-section">
                      <button 
                        className="view-profile-btn"
                        onClick={() => loadApplicantProfile(selectedApplication.studentId)}
                      >
                        👤 View Applicant's Profile
                      </button>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Application Message</h3>
                  <div className="message-box">
                    <p>{selectedApplication.message || 'No message provided'}</p>
                  </div>
                </div>

                {selectedApplication.experience && (
                  <div className="detail-section">
                    <h3>Experience & Background</h3>
                    <div className="message-box">
                      <p>{selectedApplication.experience}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                  <div className="detail-section">
                    <h3>Skills</h3>
                    <div className="skills-tags">
                      {Array.isArray(selectedApplication.skills) 
                        ? selectedApplication.skills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          ))
                        : selectedApplication.skills.split(',').map((skill, index) => (
                            <span key={index} className="skill-tag">{skill.trim()}</span>
                          ))
                      }
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h3>Attachments & Links</h3>
                  <div className="attachments">
                    {selectedApplication.resume && (
                      <a 
                        href={selectedApplication.resume} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        📄 View Resume
                      </a>
                    )}
                    {selectedApplication.portfolio && (
                      <a 
                        href={selectedApplication.portfolio} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        🌐 View Portfolio
                      </a>
                    )}
                    {!selectedApplication.resume && !selectedApplication.portfolio && (
                      <p className="no-attachments">No attachments provided</p>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Decision Actions</h3>
                  <div className="decision-actions">
                    {selectedApplication.status === 'pending' && (
                      <>
                        <button 
                          className="action-btn accept-btn"
                          onClick={() => prepareAction(selectedApplication, 'accepted')}
                        >
                          Accept Application
                        </button>
                        <button 
                          className="action-btn reject-btn"
                          onClick={() => prepareAction(selectedApplication, 'rejected')}
                        >
                          Reject Application
                        </button>
                        <button 
                          className="action-btn reviewed-btn"
                          onClick={() => handleUpdateStatus(selectedApplication._id, 'reviewed', '', selectedApplication.email)}
                        >
                          Mark as Reviewed
                        </button>
                      </>
                    )}
                    {selectedApplication.status === 'accepted' && (
                      <div className="status-message accepted">✅ This application has been accepted</div>
                    )}
                    {selectedApplication.status === 'rejected' && (
                      <div className="status-message rejected">❌ This application has been rejected</div>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowApplicationModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applicant Profile Modal (unchanged) */}
        {showApplicantProfile && applicantProfile && (
          <div className="modal-overlay">
            <div className="modal-content applicant-profile-modal">
              <div className="modal-header">
                <h2>Applicant Profile</h2>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowApplicantProfile(false);
                    setApplicantProfile(null);
                  }}
                >
                  ×
                </button>
              </div>
              
              <div className="applicant-profile-details">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {applicantProfile.profileImage ? (
                      <img src={applicantProfile.profileImage} alt={applicantProfile.fullName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {applicantProfile.fullName?.charAt(0) || 'A'}
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <h3>{applicantProfile.fullName || 'Unknown User'}</h3>
                    <p className="profile-email">{applicantProfile.email}</p>
                    <p className="profile-type">{applicantProfile.userType === 'student' ? 'Student' : 'Founder'}</p>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>Contact Information</h4>
                  <div className="detail-grid">
                    {applicantProfile.phone && (
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{applicantProfile.phone}</span>
                      </div>
                    )}
                    {applicantProfile.branch && (
                      <div className="detail-item">
                        <span className="detail-label">Branch:</span>
                        <span className="detail-value">{applicantProfile.branch}</span>
                      </div>
                    )}
                    {applicantProfile.year && (
                      <div className="detail-item">
                        <span className="detail-label">Year:</span>
                        <span className="detail-value">Year {applicantProfile.year}</span>
                      </div>
                    )}
                    {applicantProfile.location && (
                      <div className="detail-item">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{applicantProfile.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {applicantProfile.bio && (
                  <div className="profile-section">
                    <h4>About</h4>
                    <p className="bio-text">{applicantProfile.bio}</p>
                  </div>
                )}

                {applicantProfile.skills && applicantProfile.skills.length > 0 && (
                  <div className="profile-section">
                    <h4>Skills</h4>
                    <div className="skills-tags">
                      {applicantProfile.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {applicantProfile.resume && (
                  <div className="profile-section">
                    <h4>Resume</h4>
                    <a 
                      href={applicantProfile.resume} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="resume-link"
                    >
                      📄 View Applicant's Resume
                    </a>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    className="close-profile-btn"
                    onClick={() => {
                      setShowApplicantProfile(false);
                      setApplicantProfile(null);
                    }}
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal for Accept/Reject (unchanged) */}
        {showNotificationModal && applicationToAction && (
          <div className="modal-overlay">
            <div className="modal-content notification-modal">
              <div className="modal-header">
                <h2>{selectedAction === 'accepted' ? '🎉 Accept Application' : '😔 Reject Application'}</h2>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationMessage('');
                  }}
                >
                  ×
                </button>
              </div>
              
              <div className="notification-form">
                <div className="form-group">
                  <label>Notification Message to Applicant:</label>
                  <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    className="notification-textarea"
                    placeholder="Customize the message that will be sent to the applicant..."
                    rows="6"
                  />
                  <small className="hint">
                    This message will be sent to the applicant via email.
                  </small>
                </div>

                <div className="applicant-preview">
                  <h4>Applicant: {applicationToAction.applicantName || 'Anonymous'}</h4>
                  <p><strong>Role:</strong> {applicationToAction.role}</p>
                  <p><strong>Email:</strong> {applicationToAction.email}</p>
                  <p><strong>Current Status:</strong> <span className={`status-badge ${applicationToAction.status}`}>{applicationToAction.status}</span></p>
                </div>

                <div className="notification-actions">
                  <button 
                    className="confirm-btn"
                    onClick={() => {
                      handleUpdateStatus(
                        applicationToAction._id, 
                        selectedAction, 
                        notificationMessage,
                        applicationToAction.email
                      );
                    }}
                  >
                    {selectedAction === 'accepted' ? 'Accept & Send Email Notification' : 'Reject & Send Email Notification'}
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowNotificationModal(false);
                      setNotificationMessage('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FounderApplications;