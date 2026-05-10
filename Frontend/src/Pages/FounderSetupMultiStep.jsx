// FounderSetupMultiStep.js - COMPLETELY CORRECTED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './FounderSetup.css';
import { API_BASE_URL } from '../constants';

const FounderSetupMultiStep = () => {
  const { founderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [founderDataFromBackend, setFounderDataFromBackend] = useState(null);
  
  // Get user data from signup or location state
  const userFromSignup = location.state?.user || JSON.parse(localStorage.getItem('founderSignupData'));
  
  // Form state
  const [profileData, setProfileData] = useState({
    // From signup (pre-filled)
    fullName: userFromSignup?.fullName || '',
    startupName: userFromSignup?.startupName || '',
    email: userFromSignup?.email || '',
    banasthaliId: userFromSignup?.banasthaliId || '',
    
    // Step 1: Basic Info
    bio: '',
    profilePhoto: '',
    location: 'Banasthali Vidyapith',
    
    // Step 2: Looking For
    lookingFor: [],
    lookingForOptions: [
      'Technical Co-Founder',
      'Business Co-Founder', 
      'Team Member',
      'Intern',
      'Advisor/Mentor',
      'Investor',
      'Development Partner',
      'Marketing Partner'
    ],
    
    // Step 3: Business Stage
    businessStage: '',
    businessStageOptions: [
      'Ideation (Just an idea)',
      'Concept & Research',
      'Pre-revenue (Building product)',
      'Launch (Ready to launch)',
      'Early Traction (First customers)',
      'Growth (Scaling up)',
      'Scale (Established, growing)'
    ],
    
    // Step 4: Skills
    skills: [],
    suggestedSkills: [
      'Web Development', 'Mobile App', 'UI/UX Design',
      'Machine Learning', 'AI', 'Blockchain',
      'Digital Marketing', 'Content Creation', 'SEO',
      'Business Development', 'Sales', 'Finance',
      'Product Management', 'Project Management'
    ],
    
    // Step 5: Interests
    interests: [],
    interestsOptions: [
      'Technology Startups',
      'Social Impact',
      'Education Tech',
      'Healthcare',
      'E-commerce',
      'Sustainability',
      'FinTech',
      'Artificial Intelligence'
    ],
    
    // Step 5 Additional (Optional)
    linkedinProfile: '',
    website: '',
    hiring: false,
    hiringDetails: '',
    fundingStage: 'Bootstrapped'
  });

  // Auto-fill from user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user from multiple sources
        let user = userFromSignup;
        
        if (!user) {
          // Check localStorage
          const storedUser = JSON.parse(localStorage.getItem('user'));
          const storedFounderData = JSON.parse(localStorage.getItem('founderSignupData'));
          user = storedUser || storedFounderData;
        }
        
        if (user) {
          setProfileData(prev => ({
            ...prev,
            fullName: user.fullName || '',
            startupName: user.startupName || '',
            email: user.email || '',
            banasthaliId: user.banasthaliId || ''
          }));
          
          // Store user in localStorage for later use
          if (!localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
        }
        
        // Check backend connection
        await checkBackendConnection();
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, [userFromSignup]);

  // Check backend connection
  const checkBackendConnection = async () => {
    try {
      console.log('🔍 Checking backend connection...');
      const response = await fetch(`${API_BASE_URL}/founders/test/connection`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setBackendStatus('connected');
        console.log('✅ Backend is connected and ready');
        
        // Load existing founder data
        await loadExistingFounderData();
      } else {
        setBackendStatus('error');
        console.log('⚠️ Backend returned error status');
      }
    } catch (error) {
      setBackendStatus('disconnected');
      console.log('❌ Backend is not reachable');
    }
  };

  // Load existing founder data
  const loadExistingFounderData = async () => {
    try {
      // Get user ID from localStorage or state
      const userId = getUserId();
      
      if (userId && backendStatus === 'connected') {
        console.log('🔄 Loading existing founder data for user:', userId);
        
        try {
          const response = await fetch(`${API_BASE_URL}/founders/user/${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.founder) {
              console.log('✅ Found existing founder data:', data.founder);
              setFounderDataFromBackend(data.founder);
              
              // Pre-fill form with existing data
              setProfileData(prev => ({
                ...prev,
                bio: data.founder.bio || '',
                profilePhoto: data.founder.profilePhoto || '',
                location: data.founder.location || 'Banasthali Vidyapith',
                lookingFor: data.founder.lookingFor || [],
                businessStage: data.founder.businessStage || '',
                skills: data.founder.skills || [],
                interests: data.founder.interests || [],
                linkedinProfile: data.founder.linkedin || '',
                website: data.founder.website || '',
                hiring: data.founder.hiring || false,
                hiringDetails: data.founder.hiringDetails || '',
                fundingStage: data.founder.fundingStage || 'Bootstrapped'
              }));
              
              if (data.founder.profilePhoto) {
                setImagePreview(data.founder.profilePhoto);
              }
            }
          }
        } catch (error) {
          console.log('⚠️ No existing founder data found or error loading:', error.message);
        }
      }
    } catch (error) {
      console.error('Error loading existing founder data:', error);
    }
  };

  // Helper function to get user ID
  const getUserId = () => {
    if (userFromSignup?._id) return userFromSignup._id;
    
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser?._id) return storedUser._id;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser?._id) return currentUser._id;
    
    return founderId;
  };

// Add this function to compress images
const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
      img.onerror = reject;
    };
    
    reader.onerror = reject;
  });
};




  // Handle image upload - now uses compressed image
  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      // Check file size (optional)
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image is too large. Please select an image smaller than 5MB.');
        return;
      }
      
      // Compress the image
      const compressedBase64 = await compressImage(file, 400, 400, 0.7);
      
      setImagePreview(compressedBase64);
      setProfileData(prev => ({
        ...prev,
        profilePhoto: compressedBase64
      }));
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try another image.');
    }
  }
};

  // Handle Looking For selection
  const handleLookingForToggle = (option) => {
    setProfileData(prev => {
      const newLookingFor = prev.lookingFor.includes(option)
        ? prev.lookingFor.filter(item => item !== option)
        : [...prev.lookingFor, option];
      return { ...prev, lookingFor: newLookingFor };
    });
  };

  // Handle Skills
  const [newSkill, setNewSkill] = useState('');
  
  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleAddSuggestedSkill = (skill) => {
    if (!profileData.skills.includes(skill)) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  // Handle Interests
  const handleInterestToggle = (interest) => {
    setProfileData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(item => item !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  // Validate current step
  const validateCurrentStep = () => {
    switch(currentStep) {
      case 1:
        if (!profileData.bio.trim()) {
          alert('Please add a bio about your startup');
          return false;
        }
        break;
      case 2:
        if (profileData.lookingFor.length === 0) {
          alert('Please select at least one option for "What are you looking for?"');
          return false;
        }
        break;
      case 3:
        if (!profileData.businessStage) {
          alert('Please select your current business stage');
          return false;
        }
        break;
      case 4:
        if (profileData.skills.length < 3) {
          alert('Please add at least 3 skills');
          return false;
        }
        break;
      case 5:
        if (profileData.interests.length === 0) {
          alert('Please select at least one interest');
          return false;
        }
        break;
    }
    return true;
  };

  // Handle next step
  const handleNext = async () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ✅ FIXED: Save profile to backend
  const saveProfile = async () => {
    setLoading(true);
    console.log('🚀 Starting saveProfile function...');
    
    // Get the user ID
    const userId = getUserId();
    
    if (!userId) {
      alert('User ID not found. Please login or sign up first.');
      setLoading(false);
      return false;
    }
    
    console.log('👤 User ID for profile:', userId);
    console.log('📊 Profile data to save:', profileData);
    
    try {
      // ✅ TRY TO SAVE TO BACKEND FIRST
      console.log('🔄 Attempting to save to backend at /api/founders/profile...');
      
      const response = await fetch(`${API_BASE_URL}/founders/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          userId: userId,
          fullName: profileData.fullName,
          startupName: profileData.startupName,
          email: profileData.email,
          banasthaliId: profileData.banasthaliId,
          bio: profileData.bio,
          profilePhoto: profileData.profilePhoto,
          location: profileData.location,
          linkedin: profileData.linkedinProfile,
          website: profileData.website,
          hiring: profileData.hiring,
          hiringDetails: profileData.hiringDetails,
          lookingFor: profileData.lookingFor,
          businessStage: profileData.businessStage,
          skills: profileData.skills,
          interests: profileData.interests,
          fundingStage: profileData.fundingStage,
          profileComplete: true
        })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend response:', data);
        
        if (data.success && data.founder) {
          // Save to localStorage as backup
          localStorage.setItem('founderProfile', JSON.stringify(data.founder));
          localStorage.setItem('founderId', data.founder._id);
          localStorage.removeItem('founderSignupData');
          
          console.log('✅ Successfully saved to MongoDB with ID:', data.founder._id);
          return data.founder;
        } else {
          throw new Error(data.message || 'Backend save failed');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error saving to backend:', error);
      
      // Only use localStorage if backend fails AND it's not a validation error
      if (!error.message.includes('User ID') && !error.message.includes('required')) {
        console.log('🔄 Using localStorage fallback temporarily...');
        const fallbackFounderId = `founder_${Date.now()}`;
        const completeProfile = {
          ...profileData,
          _id: fallbackFounderId,
          userId: userId,  // Now userId is accessible here
          profileComplete: true,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('founderProfile', JSON.stringify(completeProfile));
        localStorage.setItem('founderId', fallbackFounderId);
        localStorage.removeItem('founderSignupData');
        
        alert('⚠️ Backend unavailable. Profile saved locally. Please try again later.');
        return completeProfile;
      } else {
        alert(`❌ ${error.message}`);
        return false;
      }
    } finally {
      setLoading(false);
      console.log('✅ saveProfile function completed');
    }
  };

  // Handle finish button
  const handleFinish = async () => {
    console.log('🎯 Finish button clicked');
    console.log('📊 Current step:', currentStep);
    
    // Validate step 5 before finishing
    if (!validateCurrentStep()) {
      console.log('❌ Validation failed');
      return;
    }
    
    console.log('✅ Step 5 validated successfully');
    const saved = await saveProfile();
    
    if (saved) {
      console.log('✅ Profile saved, moving to step 6');
      setCurrentStep(6);
    } else {
      console.log('❌ Profile save failed');
      alert('Failed to save profile. Please try again.');
    }
  };

  // Navigate to FounderProfile page
  const goToFounderProfile = () => {
    console.log('📍 Navigating to FounderProfile page');
    
    // Get data from localStorage
    const founderProfile = localStorage.getItem('founderProfile');
    const founderIdFromStorage = localStorage.getItem('founderId');
    
    console.log('📂 Founder profile from localStorage:', founderProfile);
    console.log('🆔 Founder ID from localStorage:', founderIdFromStorage);
    
    let profileDataToSend = null;
    let founderIdToUse = null;
    
    if (founderProfile) {
      try {
        profileDataToSend = JSON.parse(founderProfile);
        founderIdToUse = profileDataToSend._id || founderIdFromStorage;
      } catch (error) {
        console.error('❌ Error parsing founderProfile:', error);
      }
    }
    
    // If no data found, use current profile data
    if (!founderIdToUse) {
      founderIdToUse = founderDataFromBackend?._id || `founder_${Date.now()}`;
      profileDataToSend = {
        ...profileData,
        _id: founderIdToUse,
        userId: getUserId(),
        profileComplete: true
      };
      
      console.log('⚠️ Using fallback data for navigation:', profileDataToSend);
    }
    
    console.log('📍 Navigating to:', `/founder/${founderIdToUse}`);
    
    // Navigate to FounderProfile page
    navigate(`/founder/${founderIdToUse}`, {
      state: { 
        profile: profileDataToSend,
        justCompletedSetup: true 
      }
    });
  };

  // Steps configuration
  const steps = [
    { number: 1, title: 'Basic Info', icon: '👤' },
    { number: 2, title: 'Looking For', icon: '🔍' },
    { number: 3, title: 'Business Stage', icon: '📈' },
    { number: 4, title: 'Skills', icon: '🛠️' },
    { number: 5, title: 'Interests', icon: '🎯' },
    { number: 6, title: 'Complete', icon: '✅' }
  ];

  return (
    <div className="cofounderslab-style-setup">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Saving your profile...</p>
          <p className="backend-status">
            Backend status: {backendStatus === 'connected' ? '✅ Connected' : '⚠️ Using local storage'}
          </p>
        </div>
      )}
      
      <div className="setup-header">
        <h1>Complete Your Founder Profile</h1>
        <p>Your profile helps us match you with the right connections at Banasthali</p>
        <div className="backend-indicator">
          Status: 
          <span className={`status-dot ${backendStatus}`}>
            {backendStatus === 'connected' ? '✅ Backend Connected' : 
             backendStatus === 'disconnected' ? '⚠️ Using Local Storage' : 
             '🔍 Checking...'}
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="progress-container">
        {steps.map(step => (
          <div 
            key={step.number} 
            className={`progress-step ${currentStep >= step.number ? 'active' : ''}`}
          >
            <span className="step-icon">{step.icon}</span>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      <div className="step-content">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="step basic-info">
            <h2>Tell us about yourself</h2>
            <p className="step-description">Add basic information that will appear on your profile</p>
            
            <div className="form-group">
              <label>Profile Photo</label>
              <div className="photo-upload">
                <div className="avatar-preview">
                  {imagePreview || profileData.profilePhoto ? (
                    <img src={imagePreview || profileData.profilePhoto} alt="Preview" />
                  ) : (
                    <div className="avatar-placeholder">
                      {profileData.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="profile-photo"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profile-photo" className="upload-btn">
                    Upload Photo
                  </label>
                  <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                    Recommended: 400x400px, JPG or PNG
                  </p>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Short Bio *</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                placeholder="Describe yourself and your startup in 2-3 sentences..."
                rows={4}
                maxLength={250}
              />
              <div className="char-counter">{250 - profileData.bio.length} characters left</div>
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={profileData.location}
                readOnly
                className="read-only"
              />
              <small>Based on your Banasthali ID</small>
            </div>
          </div>
        )}
        
        {/* Step 2: Looking For */}
        {currentStep === 2 && (
          <div className="step looking-for">
            <h2>What are you looking for? *</h2>
            <p className="step-description">Select all that apply</p>
            
            <div className="options-grid">
              {profileData.lookingForOptions.map(option => (
                <div
                  key={option}
                  className={`option-card ${
                    profileData.lookingFor.includes(option) ? 'selected' : ''
                  }`}
                  onClick={() => handleLookingForToggle(option)}
                >
                  <div className="option-icon">
                    {option === 'Technical Co-Founder' && '💻'}
                    {option === 'Business Co-Founder' && '📊'}
                    {option === 'Team Member' && '👥'}
                    {option === 'Intern' && '🎓'}
                    {option === 'Advisor/Mentor' && '🧠'}
                    {option === 'Investor' && '💰'}
                    {option === 'Development Partner' && '🤝'}
                    {option === 'Marketing Partner' && '📢'}
                  </div>
                  <h4>{option}</h4>
                </div>
              ))}
            </div>
            
            {profileData.lookingFor.length > 0 && (
              <div className="selected-summary">
                <strong>You're looking for:</strong> {profileData.lookingFor.join(', ')}
              </div>
            )}
          </div>
        )}
        
        {/* Step 3: Business Stage */}
        {currentStep === 3 && (
          <div className="step business-stage">
            <h2>What is your current business stage? *</h2>
            <p className="step-description">Select the stage that best describes your startup</p>
            
            <div className="stage-options">
              {profileData.businessStageOptions.map(stage => (
                <div
                  key={stage}
                  className={`stage-card ${
                    profileData.businessStage === stage ? 'selected' : ''
                  }`}
                  onClick={() => setProfileData({...profileData, businessStage: stage})}
                >
                  <div className="stage-icon">
                    {stage.includes('Ideation') && '💡'}
                    {stage.includes('Concept') && '🔬'}
                    {stage.includes('Pre-revenue') && '🚧'}
                    {stage.includes('Launch') && '🚀'}
                    {stage.includes('Early') && '📈'}
                    {stage.includes('Growth') && '🌱'}
                    {stage.includes('Scale') && '🏢'}
                  </div>
                  <h4>{stage.split(' (')[0]}</h4>
                  <p className="stage-description">
                    {stage.includes('(') ? stage.split('(')[1].replace(')', '') : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 4: Skills */}
        {currentStep === 4 && (
          <div className="step skills">
            <h2>What specific skills do you have? *</h2>
            <p className="step-description">Add at least 3 skills that describe your expertise</p>
            
            <div className="skills-input-container">
              <div className="skills-search">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Type a skill and press Enter..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <button onClick={handleAddSkill} className="add-btn">Add</button>
              </div>
              
              <div className="suggested-skills">
                <p>Popular skills at Banasthali:</p>
                <div className="suggestions">
                  {profileData.suggestedSkills.map(skill => (
                    <button
                      key={skill}
                      className="suggestion-tag"
                      onClick={() => handleAddSuggestedSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="selected-skills">
                <h4>Your Skills ({profileData.skills.length})</h4>
                {profileData.skills.length === 0 ? (
                  <p className="no-skills">No skills added yet</p>
                ) : (
                  <div className="skills-tags">
                    {profileData.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 5: Interests */}
        {currentStep === 5 && (
          <div className="step interests">
            <h2>What are your interests? *</h2>
            <p className="step-description">Select industries and areas you're passionate about</p>
            
            <div className="interests-grid">
              {profileData.interestsOptions.map(interest => (
                <div
                  key={interest}
                  className={`interest-card ${
                    profileData.interests.includes(interest) ? 'selected' : ''
                  }`}
                  onClick={() => handleInterestToggle(interest)}
                >
                  <div className="interest-icon">
                    {interest === 'Technology Startups' && '🚀'}
                    {interest === 'Social Impact' && '🌍'}
                    {interest === 'Education Tech' && '🎓'}
                    {interest === 'Healthcare' && '🏥'}
                    {interest === 'E-commerce' && '🛒'}
                    {interest === 'Sustainability' && '🌱'}
                    {interest === 'FinTech' && '💳'}
                    {interest === 'Artificial Intelligence' && '🤖'}
                  </div>
                  <h4>{interest}</h4>
                </div>
              ))}
            </div>
            
            {profileData.interests.length > 0 && (
              <div className="selected-summary">
                <strong>Your interests:</strong> {profileData.interests.join(', ')}
              </div>
            )}
            
            {/* Additional optional fields */}
            <div className="optional-fields">
              <h3>Additional Information (Optional)</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>LinkedIn Profile</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={profileData.linkedinProfile}
                    onChange={(e) => setProfileData({...profileData, linkedinProfile: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Website/Portfolio</label>
                  <input
                    type="url"
                    placeholder="https://yourstartup.com"
                    value={profileData.website}
                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={profileData.hiring}
                    onChange={(e) => setProfileData({...profileData, hiring: e.target.checked})}
                  />
                  I'm currently hiring for my startup
                </label>
              </div>
              
              {profileData.hiring && (
                <div className="form-group">
                  <label>Hiring Details</label>
                  <textarea
                    placeholder="What positions are you hiring for? (e.g., Frontend Developer, Marketing Intern)"
                    value={profileData.hiringDetails}
                    onChange={(e) => setProfileData({...profileData, hiringDetails: e.target.value})}
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Step 6: Completion */}
        {currentStep === 6 && (
          <div className="step completion">
            <div className="success-icon">🎉</div>
            <h2>Profile Complete!</h2>
            <p className="success-message">
              Your founder profile is now {backendStatus === 'connected' ? 'live on' : 'saved locally for'} Startup Vidyapith
            </p>
            
            {/* Debug Info */}
            <div className="debug-info">
              <h4>Profile Information:</h4>
              <div className="debug-details">
                <p><strong>Backend Status:</strong> {backendStatus === 'connected' ? '✅ Connected' : '⚠️ Local Storage'}</p>
                <p><strong>Profile ID:</strong> {localStorage.getItem('founderId') || 'Not saved yet'}</p>
                <p><strong>Data in localStorage:</strong> {localStorage.getItem('founderProfile') ? '✅ Present' : '❌ Missing'}</p>
              </div>
            </div>
            
            <div className="profile-preview">
              <h3>Your Profile Preview:</h3>
              <div className="preview-card">
                <h4>{profileData.startupName}</h4>
                <p>by {profileData.fullName} • {profileData.banasthaliId}</p>
                
                <div className="preview-tags">
                  <span className="tag">{profileData.businessStage.split(' (')[0]}</span>
                  {profileData.lookingFor.slice(0, 2).map(item => (
                    <span key={item} className="tag">{item}</span>
                  ))}
                  {profileData.interests.slice(0, 2).map(interest => (
                    <span key={interest} className="tag">{interest}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="next-steps">
              <h3>What's next?</h3>
              <ul>
                <li>Your profile is {backendStatus === 'connected' ? 'visible to all Banasthali students' : 'saved locally'}</li>
                <li>Students can now ask you questions</li>
                <li>Add products/services to showcase your work</li>
                <li>Connect with other founders in the directory</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <div className="step-navigation">
        {currentStep > 1 && currentStep < 6 && (
          <button
            className="nav-btn prev"
            onClick={handlePrev}
            disabled={loading}
          >
            ← Back
          </button>
        )}
        
        {currentStep < 5 && (
          <button
            className="nav-btn next"
            onClick={handleNext}
            disabled={loading}
          >
            Continue →
          </button>
        )}
        
        {currentStep === 5 && (
          <button
            className="nav-btn finish"
            onClick={handleFinish}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Finish & Save Profile'}
          </button>
        )}
        
        {currentStep === 6 && (
          <button
            className="nav-btn view-profile"
            onClick={goToFounderProfile}
            disabled={loading}
          >
            View Your Founder Profile →
          </button>
        )}
        
        {/* Debug button - visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <button
            className="nav-btn debug-btn"
            onClick={async () => {
              console.log('🔍 Debug Information:');
              console.log('Founder ID from URL:', founderId);
              console.log('User from signup:', userFromSignup);
              console.log('Profile data:', profileData);
              console.log('Backend status:', backendStatus);
              console.log('localStorage founderProfile:', localStorage.getItem('founderProfile'));
              console.log('localStorage founderId:', localStorage.getItem('founderId'));
              console.log('Current user ID:', getUserId());
              
              // Test backend connection
              try {
                const response = await fetch(`${API_BASE_URL}/founders/test/connection`);
                const data = await response.json();
                console.log('Backend test response:', data);
                
                // Test POST endpoint
                const testData = {
                  userId: getUserId(),
                  fullName: 'Test User',
                  startupName: 'Test Startup',
                  email: 'test@test.com',
                  banasthaliId: 'BTBTC12345',
                  bio: 'Test bio',
                  location: 'Banasthali Vidyapith',
                  lookingFor: ['Technical Co-Founder'],
                  businessStage: 'Ideation (Just an idea)',
                  skills: ['JavaScript', 'React'],
                  interests: ['Technology Startups'],
                  profileComplete: true
                };
                
                console.log('Testing POST with data:', testData);
              } catch (error) {
                console.error('Backend test failed:', error);
              }
            }}
          >
            🐛 Debug
          </button>
        )}
      </div>
      
      {/* Step indicator */}
      <div className="step-indicator">
        Step {currentStep} of 6 • {Math.round((currentStep / 6) * 100)}% Complete
      </div>
    </div>
  );
};

export default FounderSetupMultiStep;