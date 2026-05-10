// src/Pages/DashboardPage.js - WITH MEDIAPIPE FACE TRACKING PHOTO ASSISTANT
import React, { useState, useEffect } from 'react';
import { useAuth } from '../Pages/AuthContext';
import Header from '../Components/Header/Header.jsx';
import { API_BASE_URL, BACKEND_URL } from '../constants.jsx';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  
  // Form states for editing
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    branch: user?.branch || '',
    year: user?.year || '',
    enrollmentNumber: user?.enrollmentNumber || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    profileImage: user?.profileImage || null,
    resume: user?.resume || null
  });
  
  // Recent applications
  const [recentApplications, setRecentApplications] = useState([]);
  
  // Pending applications for cover letter generation
  const [pendingApplications, setPendingApplications] = useState([]);
  
  // Notifications (only for accepted applications)
  const [notifications, setNotifications] = useState([]);
  
  // Application details modal
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  
  // Notification panel
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
  // AI Cover Letter Generator states
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterForm, setCoverLetterForm] = useState({
    startupName: '',
    jobRole: '',
    jobDescription: '',
    tone: 'professional',
    length: 'medium'
  });
  
  // Profile completion percentage
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  
  // Photo Assistant states
  const [showPhotoAssistant, setShowPhotoAssistant] = useState(false);
  const [photoAssistantLoading, setPhotoAssistantLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchNotifications();
    }
  }, [user]);

  // Helper to get absolute URL
  const getAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('data:image')) return url;
    if (url.startsWith('/uploads')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/uploads/profiles/${url}`;
  };

  // Fetch all dashboard data from backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Fetch student profile
      const profileResponse = await fetch(`${API_BASE_URL}/students/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (profileResponse.status === 404) {
        // Try alternative endpoint
        await fetchStudentDataAlternative(token);
        return;
      }
      
      if (!profileResponse.ok) {
        setLoading(false);
        return;
      }
      
      const profileDataFromApi = await profileResponse.json();
      
      if (profileDataFromApi.success && profileDataFromApi.user) {
        const userData = profileDataFromApi.user;
        
        // Map backend fields to frontend state
        const mappedData = {
          name: userData.fullName || userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          branch: userData.branch || '',
          year: userData.year || '',
          enrollmentNumber: userData.enrollmentNumber || '',
          bio: userData.bio || '',
          skills: userData.skills || [],
          profileImage: userData.profileImage ? getAbsoluteUrl(userData.profileImage) : null,
          resume: userData.resume ? getAbsoluteUrl(userData.resume) : null
        };
        
        setProfileData(mappedData);
        
        // Calculate profile completion
        calculateProfileCompletion(userData);
        
        // Now fetch applications
        await fetchApplications(token);
        
      } else {
        setLoading(false);
      }

    } catch (error) {
      setLoading(false);
    }
  };

  // Alternative method to fetch student data
  const fetchStudentDataAlternative = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user) {
          const userData = data.user;
          const mappedData = {
            name: userData.fullName || userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            branch: userData.branch || '',
            year: userData.year || '',
            enrollmentNumber: userData.enrollmentNumber || '',
            bio: userData.bio || '',
            skills: userData.skills || [],
            profileImage: userData.profileImage ? getAbsoluteUrl(userData.profileImage) : null,
            resume: userData.resume ? getAbsoluteUrl(userData.resume) : null
          };
          
          setProfileData(mappedData);
          calculateProfileCompletion(userData);
        }
      }
    } catch (error) {
      console.error('Error with alternative endpoint:', error);
    }
  };

  // Fetch applications separately
  const fetchApplications = async (token) => {
    try {
      // Try multiple endpoints for applications
      const endpoints = [
        `${API_BASE_URL}/students/applications`,
        `${API_BASE_URL}/applications/student`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.applications) {
              const transformedApps = data.applications.slice(0, 5).map(app => ({
                id: app._id,
                startupName: app.startupName || app.founderId?.startupName || 'Unknown Startup',
                role: app.role,
                status: app.status,
                appliedDate: new Date(app.createdAt).toLocaleDateString(),
                message: app.message,
                experience: app.experience,
                skills: app.skills || [],
                email: app.email,
                phone: app.phone,
                resume: app.resume,
                portfolio: app.portfolio
              }));
              
              setRecentApplications(transformedApps);
              
              // Set pending applications for cover letter generator
              const pendingApps = transformedApps.filter(app => app.status === 'pending');
              setPendingApplications(pendingApps);
              break;
            }
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/applications/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const acceptedNotifications = data.notifications.filter(n => 
            n.type === 'application_update' && 
            (n.message.toLowerCase().includes('accepted') || 
             n.title.toLowerCase().includes('accepted'))
          );
          setNotifications(acceptedNotifications);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/applications/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const calculateProfileCompletion = (userData) => {
    if (!userData) {
      setProfileCompletion(0);
      return;
    }
    
    let completion = 0;
    const fields = [
      userData.fullName || userData.name,
      userData.email,
      userData.branch,
      userData.year,
      userData.bio,
      (userData.skills && userData.skills.length > 0),
      userData.profileImage,
      userData.resume
    ];
    
    const completedFields = fields.filter(Boolean).length;
    completion = Math.round((completedFields / fields.length) * 100);
    setProfileCompletion(completion);
  };

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_BASE_URL}/students/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Get image URL and make it absolute
        let imageUrl = data.imageUrl || data.profileImage;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${BACKEND_URL}${imageUrl}`;
        }
        
        // Update state
        setProfileData(prev => ({
          ...prev,
          profileImage: imageUrl
        }));
        
        alert('Profile image updated successfully!');
        
        // Update localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.profileImage = imageUrl;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Refresh
        fetchDashboardData();
      } else {
        throw new Error(data.error || data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Handle resume upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingResume(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch(`${API_BASE_URL}/students/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        let resumeUrl = data.resumeUrl || data.resume;
        if (resumeUrl && !resumeUrl.startsWith('http')) {
          resumeUrl = `${BACKEND_URL}${resumeUrl}`;
        }
        
        setProfileData(prev => ({
          ...prev,
          resume: resumeUrl
        }));
        
        alert('Resume uploaded successfully!');
        
        // Update localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.resume = resumeUrl;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        fetchDashboardData();
      } else {
        throw new Error(data.error || data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert(`Failed to upload resume: ${error.message}`);
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  // Handle skill management
  const handleAddSkill = async (skill) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !profileData.skills.includes(trimmedSkill)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/students/skills`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ skill: trimmedSkill })
        });
        
        if (response.ok) {
          setProfileData(prev => ({
            ...prev,
            skills: [...prev.skills, trimmedSkill]
          }));
          alert('Skill added successfully!');
        }
      } catch (error) {
        console.error('Error adding skill:', error);
        setProfileData(prev => ({
          ...prev,
          skills: [...prev.skills, trimmedSkill]
        }));
      }
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/students/skills/${encodeURIComponent(skillToRemove)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setProfileData(prev => ({
          ...prev,
          skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
        alert('Skill removed successfully!');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      setProfileData(prev => ({
        ...prev,
        skills: prev.skills.filter(skill => skill !== skillToRemove)
      }));
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Validate
      if (!profileData.name || profileData.name.trim().length < 2) {
        alert('Full name is required (minimum 2 characters)');
        return;
      }
      
      if (!profileData.branch || profileData.branch.trim().length < 2) {
        alert('Branch is required');
        return;
      }
      
      if (!profileData.year || !['1', '2', '3', '4'].includes(profileData.year.toString())) {
        alert('Valid year is required (1-4)');
        return;
      }
      
      // Prepare data
      const updateData = {
        fullName: profileData.name.trim(),
        phone: profileData.phone ? profileData.phone.trim() : '',
        branch: profileData.branch.trim(),
        year: profileData.year.toString().trim(),
        bio: profileData.bio ? profileData.bio.trim() : '',
        skills: profileData.skills || [],
        enrollmentNumber: profileData.enrollmentNumber ? profileData.enrollmentNumber.trim() : ''
      };
      
      const response = await fetch(`${API_BASE_URL}/students/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setIsEditing(false);
        alert('Profile updated successfully!');
        
        // Update state
        if (data.user) {
          const updatedData = {
            name: data.user.fullName || profileData.name,
            phone: data.user.phone || profileData.phone,
            branch: data.user.branch || profileData.branch,
            year: data.user.year || profileData.year,
            bio: data.user.bio || profileData.bio,
            skills: data.user.skills || profileData.skills,
            enrollmentNumber: data.user.enrollmentNumber || profileData.enrollmentNumber,
            profileImage: profileData.profileImage,
            resume: profileData.resume,
            email: profileData.email
          };
          
          setProfileData(updatedData);
        }
        
        // Update localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.fullName = profileData.name;
          userData.name = profileData.name;
          userData.phone = profileData.phone;
          userData.branch = profileData.branch;
          userData.year = profileData.year;
          userData.bio = profileData.bio;
          userData.skills = profileData.skills;
          userData.enrollmentNumber = profileData.enrollmentNumber;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Refresh
        fetchDashboardData();
      } else {
        throw new Error(data.error || data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  // View Resume
  const viewResume = () => {
    if (profileData.resume) {
      window.open(profileData.resume, '_blank', 'noopener,noreferrer');
    } else {
      alert('No resume uploaded yet');
    }
  };

  // View Application Details
  const handleViewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  // Withdraw Application
  const handleWithdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/withdraw`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Application withdrawn successfully!');
          fetchDashboardData();
        }
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application. Please try again.');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // AI COVER LETTER GENERATOR FUNCTIONS
  const openCoverLetterGenerator = () => {
    // Check if user has pending applications
    if (pendingApplications.length > 0) {
      // Pre-fill with first pending application
      const firstPendingApp = pendingApplications[0];
      setCoverLetterForm({
        startupName: firstPendingApp.startupName || '',
        jobRole: firstPendingApp.role || '',
        jobDescription: firstPendingApp.message || '',
        tone: 'professional',
        length: 'medium'
      });
      setShowCoverLetterModal(true);
    } else {
      // No pending applications - user can still create custom letter
      setCoverLetterForm({
        startupName: '',
        jobRole: '',
        jobDescription: '',
        tone: 'professional',
        length: 'medium'
      });
      setShowCoverLetterModal(true);
    }
  };

  const handleCoverLetterFormChange = (e) => {
    const { name, value } = e.target;
    setCoverLetterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateCoverLetter = async () => {
    if (!coverLetterForm.startupName || !coverLetterForm.jobRole) {
      alert('Please enter company name and job role');
      return;
    }

    setIsGeneratingCoverLetter(true);
    setCoverLetter('');

    try {
      // Smart template generation - 100% FREE, no API needed
      const letter = generateSmartCoverLetter(profileData, coverLetterForm);
      
      // Simulate AI processing delay
      setTimeout(() => {
        setCoverLetter(letter);
        setIsGeneratingCoverLetter(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter. Please try again.');
      setIsGeneratingCoverLetter(false);
    }
  };

  const generateSmartCoverLetter = (student, job) => {
    const templates = {
      professional: (student, job) => `
Dear Hiring Team at ${job.startupName},

I am writing to express my interest in the ${job.jobRole} position at ${job.startupName}. As a ${student.year || 'final'}-year ${student.branch || 'Computer Science'} student at Banasthali Vidyapith, I have developed strong skills in ${student.skills?.slice(0, 3).join(', ') || 'technology'} that align well with your requirements.

${student.bio ? student.bio + ' ' : ''}I am particularly impressed by ${job.startupName}'s work${job.jobDescription ? ' in ' + job.jobDescription.substring(0, 100) + '...' : ''} and believe my background makes me a strong candidate.

${student.skills?.length > 0 ? `My skills in ${student.skills.slice(0, 3).join(', ')} would allow me to contribute immediately to your team. ` : ''}

I am eager to contribute to ${job.startupName} and would welcome the opportunity to discuss how my skills can benefit your team. Thank you for considering my application.

Sincerely,
${student.name}
${student.branch || ''} | Banasthali Vidyapith
${student.email || ''}
      `,
      
      enthusiastic: (student, job) => `
Hello ${job.startupName} Team!

I'm thrilled to apply for the ${job.jobRole} position! As a ${student.year || 'passionate'} ${student.branch || 'tech'} student at Banasthali Vidyapith, I've been following ${job.startupName}'s work and love what you're doing${job.jobDescription ? ' with ' + job.jobDescription.substring(0, 80) + '...' : ''}.

${student.skills?.length > 0 ? `I bring strong skills in ${student.skills.slice(0, 3).join(', ')}, and I'm always eager to learn more! ` : ''}

${student.bio ? student.bio.substring(0, 150) + '... ' : ''}

I'm excited about the possibility of joining ${job.startupName} and contributing to your mission. Let's build something amazing together!

Best regards,
${student.name}
🎓 ${student.branch} Student
📧 ${student.email || ''}
      `
    };

    const templateType = coverLetterForm.tone === 'enthusiastic' ? 'enthusiastic' : 'professional';
    let letter = templates[templateType](student, job);
    
    // Adjust length
    if (coverLetterForm.length === 'short') {
      letter = letter.split('\n').slice(0, 8).join('\n') + '\n\nSincerely,\n' + student.name;
    } else if (coverLetterForm.length === 'long' && student.bio) {
      // Add more bio content for longer letters
      letter = letter.replace(student.bio.substring(0, 150) + '...', student.bio.substring(0, 300) + '...');
    }

    return letter.trim();
  };

  const copyCoverLetterToClipboard = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter)
        .then(() => alert('Cover letter copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  const downloadCoverLetter = () => {
    if (coverLetter) {
      const element = document.createElement('a');
      const file = new Blob([coverLetter], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `CoverLetter_${coverLetterForm.startupName.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // PHOTO ASSISTANT COMPONENT
  const ProfilePhotoAssistant = () => {
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [faceData, setFaceData] = useState(null);
    const [tips, setTips] = useState([]);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    let faceDetection = null;
    let camera = null;

    // Initialize MediaPipe Face Detection
    useEffect(() => {
      const initFaceDetection = async () => {
        // Load MediaPipe scripts dynamically
        if (!window.FaceDetection) {
          await loadMediaPipeScripts();
        }
        
        if (window.FaceDetection) {
          faceDetection = new window.FaceDetection({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
            }
          });

          faceDetection.setOptions({
            model: 'short',
            minDetectionConfidence: 0.5,
          });

          faceDetection.onResults(onFaceDetectionResults);
        }
      };

      initFaceDetection();

      return () => {
        if (camera) {
          camera.stop();
        }
      };
    }, []);

    const loadMediaPipeScripts = () => {
      return new Promise((resolve) => {
        if (window.FaceDetection && window.Camera) {
          resolve();
          return;
        }

        const faceScript = document.createElement('script');
        faceScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js';
        faceScript.crossOrigin = 'anonymous';
        
        const cameraScript = document.createElement('script');
        cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        cameraScript.crossOrigin = 'anonymous';
        
        faceScript.onload = () => {
          cameraScript.onload = () => {
            resolve();
          };
          document.head.appendChild(cameraScript);
        };
        
        document.head.appendChild(faceScript);
      });
    };

    const onFaceDetectionResults = (results) => {
      if (results.detections && results.detections.length > 0) {
        const detection = results.detections[0];
        const boundingBox = detection.boundingBox;
        
        // Calculate face metrics
        const faceMetrics = {
          isCentered: checkIfCentered(boundingBox),
          sizeRatio: calculateSizeRatio(boundingBox),
          eyeLevel: calculateEyeLevel(detection.keypoints),
          smileScore: calculateSmileScore(detection.keypoints),
          headTilt: calculateHeadTilt(detection.keypoints)
        };

        setFaceData(faceMetrics);
        generateTips(faceMetrics);
        
        // Draw on canvas
        drawFaceDetection(results);
      } else {
        setFaceData(null);
        setTips([{ type: 'error', message: 'No face detected. Please position yourself in the frame.' }]);
      }
    };

    const checkIfCentered = (box) => {
      const centerX = (box.xMin + box.xMax) / 2;
      return centerX > 0.4 && centerX < 0.6;
    };

    const calculateSizeRatio = (box) => {
      const width = box.xMax - box.xMin;
      const height = box.yMax - box.yMin;
      return (width * height) * 100; // Percentage of frame
    };

    const calculateEyeLevel = (keypoints) => {
      // Keypoints: 0=right eye, 1=left eye, 2=nose, 3=right ear, 4=left ear
      if (keypoints && keypoints.length >= 2) {
        const rightEye = keypoints[0];
        const leftEye = keypoints[1];
        const averageY = (rightEye.y + leftEye.y) / 2;
        return averageY;
      }
      return 0.5;
    };

    const calculateSmileScore = (keypoints) => {
      // Simplified smile detection (using mouth corners if available)
      if (keypoints && keypoints.length >= 6) {
        // Assuming index 5 and 6 are mouth corners
        const mouthLeft = keypoints[5];
        const mouthRight = keypoints[6];
        const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
        return mouthWidth * 10; // Simple smile score
      }
      return 0;
    };

    const calculateHeadTilt = (keypoints) => {
      if (keypoints && keypoints.length >= 2) {
        const rightEye = keypoints[0];
        const leftEye = keypoints[1];
        const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
        return Math.abs(angle);
      }
      return 0;
    };

    const generateTips = (metrics) => {
      const newTips = [];
      
      if (!metrics.isCentered) {
        newTips.push({ 
          type: 'adjustment', 
          message: 'Try to center your face in the frame',
          icon: '🎯'
        });
      }
      
      if (metrics.sizeRatio < 15) {
        newTips.push({ 
          type: 'adjustment', 
          message: 'Move closer to the camera for better framing',
          icon: '👤'
        });
      } else if (metrics.sizeRatio > 40) {
        newTips.push({ 
          type: 'adjustment', 
          message: 'Move back a bit - your face is too close',
          icon: '↔️'
        });
      }
      
      if (metrics.eyeLevel < 0.4 || metrics.eyeLevel > 0.6) {
        newTips.push({ 
          type: 'adjustment', 
          message: 'Adjust camera height to eye level',
          icon: '👁️'
        });
      }
      
      if (metrics.smileScore < 3) {
        newTips.push({ 
          type: 'suggestion', 
          message: 'Try a gentle, confident smile!',
          icon: '😊'
        });
      }
      
      if (metrics.headTilt > 10) {
        newTips.push({ 
          type: 'adjustment', 
          message: 'Straighten your head for a professional look',
          icon: '📏'
        });
      }
      
      // If all metrics are good
      if (newTips.length === 0 && metrics.isCentered && metrics.sizeRatio >= 15 && metrics.sizeRatio <= 40) {
        newTips.push({ 
          type: 'success', 
          message: 'Perfect! You look professional and confident!',
          icon: '✅'
        });
      }
      
      setTips(newTips);
    };

    const drawFaceDetection = (results) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;
      
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw face bounding box
      if (results.detections && results.detections.length > 0) {
        const detection = results.detections[0];
        const boundingBox = detection.boundingBox;
        
        const x = boundingBox.xMin * canvas.width;
        const y = boundingBox.yMin * canvas.height;
        const width = (boundingBox.xMax - boundingBox.xMin) * canvas.width;
        const height = (boundingBox.yMax - boundingBox.yMin) * canvas.height;
        
        // Draw bounding box
        ctx.strokeStyle = faceData && faceData.isCentered ? '#4CAF50' : '#FF9800';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Draw center guide
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw keypoints
        if (detection.keypoints) {
          ctx.fillStyle = '#FF4081';
          detection.keypoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              3, 0, 2 * Math.PI
            );
            ctx.fill();
          });
        }
      }
    };

    const startCamera = async () => {
      try {
        setIsLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraOn(true);
          
          // Start face detection
          if (faceDetection) {
            camera = new window.Camera(videoRef.current, {
              onFrame: async () => {
                if (videoRef.current) {
                  await faceDetection.send({ image: videoRef.current });
                }
              },
              width: 640,
              height: 480
            });
            camera.start();
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setTips([{ type: 'error', message: 'Unable to access camera. Please check permissions.' }]);
      } finally {
        setIsLoading(false);
      }
    };

    const stopCamera = () => {
      if (camera) {
        camera.stop();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      setIsCameraOn(false);
      setFaceData(null);
      setTips([]);
    };

    const capturePhoto = () => {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      if (!video) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const photoData = canvas.toDataURL('image/png');
      setCapturedPhoto(photoData);
      
      // Provide download option
      const downloadLink = document.createElement('a');
      downloadLink.href = photoData;
      downloadLink.download = 'professional-profile-photo.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    const uploadToProfile = async () => {
      if (!capturedPhoto) return;
      
      try {
        setIsLoading(true);
        
        // Convert base64 to blob
        const response = await fetch(capturedPhoto);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('image', blob, 'profile-photo.png');
        
        const token = localStorage.getItem('token');
        const uploadResponse = await fetch(`${API_BASE_URL}/students/upload-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (uploadResponse.ok) {
          alert('Profile photo updated successfully!');
          // Refresh the dashboard
          window.location.reload();
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Failed to upload photo. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="profile-photo-assistant">
        <div className="assistant-header">
          <h2>🎯 Professional Profile Photo Assistant</h2>
          <p>Get AI-powered guidance for the perfect profile picture</p>
        </div>
        
        <div className="assistant-content">
          <div className="camera-section">
            <div className="camera-container">
              <video 
                ref={videoRef} 
                className="camera-feed"
                playsInline
              />
              <canvas 
                ref={canvasRef} 
                className="face-canvas"
              />
              
              <div className="camera-controls">
                {!isCameraOn ? (
                  <button 
                    className="camera-btn start-btn"
                    onClick={startCamera}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Starting Camera...' : '🎥 Start Camera'}
                  </button>
                ) : (
                  <>
                    <button 
                      className="camera-btn capture-btn"
                      onClick={capturePhoto}
                    >
                      📸 Capture Photo
                    </button>
                    <button 
                      className="camera-btn stop-btn"
                      onClick={stopCamera}
                    >
                      ⏹️ Stop Camera
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="tips-section">
            <h3>📋 AI Feedback</h3>
            
            <div className="face-metrics">
              {faceData ? (
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="metric-label">Centering</span>
                    <span className={`metric-value ${faceData.isCentered ? 'good' : 'needs-work'}`}>
                      {faceData.isCentered ? '✓ Good' : '↔ Adjust'}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Framing</span>
                    <span className={`metric-value ${
                      faceData.sizeRatio >= 15 && faceData.sizeRatio <= 40 ? 'good' : 'needs-work'
                    }`}>
                      {faceData.sizeRatio >= 15 && faceData.sizeRatio <= 40 ? '✓ Good' : '📐 Adjust'}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Eye Level</span>
                    <span className={`metric-value ${
                      faceData.eyeLevel >= 0.4 && faceData.eyeLevel <= 0.6 ? 'good' : 'needs-work'
                    }`}>
                      {faceData.eyeLevel >= 0.4 && faceData.eyeLevel <= 0.6 ? '✓ Good' : '👁️ Adjust'}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Confidence</span>
                    <span className={`metric-value ${faceData.smileScore >= 3 ? 'good' : 'needs-work'}`}>
                      {faceData.smileScore >= 3 ? '😊 Good' : '😐 Smile more'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="no-face-detected">
                  <p>👤 Face detection will appear here when camera is on</p>
                </div>
              )}
            </div>
            
            <div className="tips-list">
              <h4>💡 Professional Tips</h4>
              {tips.length > 0 ? (
                <ul>
                  {tips.map((tip, index) => (
                    <li key={index} className={`tip-item tip-${tip.type}`}>
                      <span className="tip-icon">{tip.icon}</span>
                      <span className="tip-message">{tip.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-tips">Start camera to get personalized tips...</p>
              )}
            </div>
            
            {capturedPhoto && (
              <div className="captured-photo-section">
                <h4>📸 Captured Photo</h4>
                <div className="photo-preview">
                  <img src={capturedPhoto} alt="Captured" />
                  <div className="photo-actions">
                    <button 
                      className="upload-btn"
                      onClick={uploadToProfile}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Uploading...' : '💾 Use as Profile Photo'}
                    </button>
                    <button 
                      className="retake-btn"
                      onClick={() => setCapturedPhoto(null)}
                    >
                      🔄 Retake
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="professional-tips">
          <h4>🎓 Professional Profile Photo Guidelines</h4>
          <div className="guidelines-grid">
            <div className="guideline">
              <div className="guideline-icon">👔</div>
              <div className="guideline-content">
                <strong>Dress professionally</strong>
                <p>Wear formal or business casual attire</p>
              </div>
            </div>
            <div className="guideline">
              <div className="guideline-icon">💡</div>
              <div className="guideline-content">
                <strong>Good lighting</strong>
                <p>Face light source, avoid shadows</p>
              </div>
            </div>
            <div className="guideline">
              <div className="guideline-icon">🎯</div>
              <div className="guideline-content">
                <strong>Eye contact</strong>
                <p>Look directly at the camera</p>
              </div>
            </div>
            <div className="guideline">
              <div className="guideline-icon">😊</div>
              <div className="guideline-content">
                <strong>Confident smile</strong>
                <p>Natural, genuine smile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Header />
      
      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="notification-panel-overlay" onClick={() => setShowNotificationPanel(false)}>
          <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notification-header">
              <h3>Acceptance Notifications</h3>
              <button className="close-notification-btn" onClick={() => setShowNotificationPanel(false)}>
                ×
              </button>
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <span className="empty-icon">🎉</span>
                  <h4>No acceptance notifications yet</h4>
                  <p>You'll see notifications here when your applications get accepted</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification._id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => markNotificationAsRead(notification._id)}
                  >
                    <div className="notification-icon">🎉</div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {!notification.read && <div className="unread-dot"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* AI Cover Letter Generator Modal */}
      {showCoverLetterModal && (
        <div className="modal-overlay" onClick={() => setShowCoverLetterModal(false)}>
          <div className="modal-content cover-letter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Cover Letter Generator</h2>
              <button className="close-modal-btn" onClick={() => setShowCoverLetterModal(false)}>×</button>
            </div>
            
            <div className="cover-letter-content">
              {!coverLetter ? (
                <>
                  <div className="cover-letter-form">
                    {/* Pending Applications Dropdown */}
                    {pendingApplications.length > 0 && (
                      <div className="pending-apps-section">
                        <label>Use Pending Application:</label>
                        <select 
                          className="pending-apps-select"
                          onChange={(e) => {
                            const app = pendingApplications.find(a => a.id === e.target.value);
                            if (app) {
                              setCoverLetterForm({
                                startupName: app.startupName || '',
                                jobRole: app.role || '',
                                jobDescription: app.message || '',
                                tone: 'professional',
                                length: 'medium'
                              });
                            }
                          }}
                        >
                          <option value="">Select from pending applications...</option>
                          {pendingApplications.map(app => (
                            <option key={app.id} value={app.id}>
                              {app.startupName} - {app.role}
                            </option>
                          ))}
                        </select>
                        <p className="pending-apps-hint">
                          📌 Pre-filled from your pending applications
                        </p>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>Company/Startup Name *</label>
                      <input
                        type="text"
                        name="startupName"
                        value={coverLetterForm.startupName}
                        onChange={handleCoverLetterFormChange}
                        placeholder="Enter company name"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Job Role *</label>
                      <input
                        type="text"
                        name="jobRole"
                        value={coverLetterForm.jobRole}
                        onChange={handleCoverLetterFormChange}
                        placeholder="e.g., Frontend Developer Intern"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Job Description (Optional)</label>
                      <textarea
                        name="jobDescription"
                        value={coverLetterForm.jobDescription}
                        onChange={handleCoverLetterFormChange}
                        placeholder="Brief description of the role..."
                        className="form-textarea"
                        rows="3"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tone</label>
                        <select
                          name="tone"
                          value={coverLetterForm.tone}
                          onChange={handleCoverLetterFormChange}
                          className="form-select"
                        >
                          <option value="professional">Professional</option>
                          <option value="enthusiastic">Enthusiastic</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Length</label>
                        <select
                          name="length"
                          value={coverLetterForm.length}
                          onChange={handleCoverLetterFormChange}
                          className="form-select"
                        >
                          <option value="short">Short</option>
                          <option value="medium">Medium</option>
                          <option value="long">Long</option>
                        </select>
                      </div>
                    </div>
                    
                    <button 
                      className="generate-letter-btn"
                      onClick={generateCoverLetter}
                      disabled={isGeneratingCoverLetter || !coverLetterForm.startupName || !coverLetterForm.jobRole}
                    >
                      {isGeneratingCoverLetter ? (
                        <>
                          <span className="spinner-small"></span>
                          Generating...
                        </>
                      ) : (
                        'Generate Cover Letter'
                      )}
                    </button>
                    
                    <div className="ai-info">
                      <p>✅ <strong>Free Tool:</strong> Generate personalized cover letters instantly</p>
                      <p>📊 <strong>Uses your profile:</strong> Skills: {profileData.skills?.length || 0}, Bio: {profileData.bio ? '✓' : 'Add in profile'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="cover-letter-result">
                  <div className="result-header">
                    <h3>Your Cover Letter is Ready!</h3>
                    <div className="result-actions">
                      <button onClick={copyCoverLetterToClipboard} className="action-btn copy-btn">
                        📋 Copy
                      </button>
                      <button onClick={downloadCoverLetter} className="action-btn download-btn">
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                  
                  <div className="cover-letter-preview">
                    <textarea 
                      value={coverLetter} 
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows="15"
                      className="letter-textarea"
                    />
                    <div className="letter-stats">
                      <span>📊 {coverLetter.split(' ').length} words</span>
                      <span>🎯 {coverLetterForm.tone === 'professional' ? 'Professional' : 'Enthusiastic'} tone</span>
                      <span>🏢 For: {coverLetterForm.startupName}</span>
                    </div>
                  </div>
                  
                  <div className="result-footer">
                    <button 
                      onClick={() => {
                        setCoverLetter('');
                        generateCoverLetter();
                      }}
                      className="regenerate-btn"
                    >
                      🔄 Regenerate
                    </button>
                    <button 
                      onClick={() => setShowCoverLetterModal(false)}
                      className="close-result-btn"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Professional Photo Assistant Modal */}
      {showPhotoAssistant && (
        <div className="modal-overlay" onClick={() => setShowPhotoAssistant(false)}>
          <div className="modal-content" style={{maxWidth: '900px'}} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🤳 Professional Photo Assistant</h2>
              <button className="close-modal-btn" onClick={() => setShowPhotoAssistant(false)}>×</button>
            </div>
            <div className="modal-body">
              <ProfilePhotoAssistant />
            </div>
          </div>
        </div>
      )}
      
      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="modal-content application-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application Details</h2>
              <button className="close-modal-btn" onClick={() => setShowApplicationModal(false)}>×</button>
            </div>
            
            <div className="application-details">
              <div className="detail-section">
                <div className="startup-name-large">{selectedApplication.startupName}</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Position Applied:</span>
                    <span className="detail-value">{selectedApplication.role}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="status-badge" style={{backgroundColor: getStatusColor(selectedApplication.status)}}>
                      {getStatusText(selectedApplication.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Applied Date:</span>
                    <span className="detail-value">{selectedApplication.appliedDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Your Application Message</h4>
                <div className="application-message-content">
                  <p>{selectedApplication.message}</p>
                </div>
              </div>
              
              {selectedApplication.experience && (
                <div className="detail-section">
                  <h4>Experience & Background</h4>
                  <div className="application-experience">
                    <p>{selectedApplication.experience}</p>
                  </div>
                </div>
              )}
              
              {selectedApplication.skills && selectedApplication.skills.length > 0 && (
                <div className="detail-section">
                  <h4>Skills</h4>
                  <div className="skills-tags">
                    {selectedApplication.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                {selectedApplication.resume && (
                  <button 
                    className="view-resume-btn"
                    onClick={() => window.open(selectedApplication.resume, '_blank')}
                  >
                    View Resume
                  </button>
                )}
                {selectedApplication.status === 'pending' && (
                  <button 
                    className="withdraw-application-btn"
                    onClick={() => {
                      handleWithdrawApplication(selectedApplication.id);
                      setShowApplicationModal(false);
                    }}
                  >
                    Withdraw Application
                  </button>
                )}
                <button 
                  className="close-details-btn"
                  onClick={() => setShowApplicationModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-main">
        
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-left">
            <h1>Welcome back, {profileData.name || 'Student'}!</h1>
            <p>Connect with startups and build your career</p>
            <div className="welcome-stats">
              <div className="welcome-stat">
                <span className="stat-number">{recentApplications.length}</span>
                <span className="stat-label">Applications</span>
              </div>
              <div className="welcome-stat">
                <span className="stat-number">
                  {recentApplications.filter(app => app.status === 'accepted').length}
                </span>
                <span className="stat-label">Accepted</span>
              </div>
              <div className="welcome-stat">
                <span className="stat-number">{pendingApplications.length}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          </div>
          <div className="welcome-right">
            <div className="profile-completion">
              <div className="completion-header">
                <span>Profile Completion</span>
                <span className="completion-percent">{profileCompletion}%</span>
              </div>
              <div className="completion-bar">
                <div 
                  className="completion-fill" 
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <button 
                className="complete-profile-btn" 
                onClick={() => setIsEditing(true)}
              >
                {profileCompletion < 100 ? 'Complete Profile' : 'Update Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="profile-section">
          <div className="section-header">
            <h2>My Profile</h2>
            <div className="section-actions">
              {!isEditing ? (
                <button 
                  className="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      fetchDashboardData();
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="save-btn"
                    onClick={handleSaveProfile}
                    disabled={uploadingImage || uploadingResume}
                  >
                    {uploadingImage || uploadingResume ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-content">
            {/* Left Column - Profile Info */}
            <div className="profile-info">
              <div className="profile-header">
                <div className="avatar-section">
                  <div className="avatar-container">
                    <div className="profile-avatar-container">
                      <img 
                        src={profileData.profileImage || '/default-avatar.png'} 
                        alt={profileData.name}
                        className="profile-avatar"
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                          e.target.onerror = null;
                        }}
                      />
                      {isEditing && (
                        <div className="avatar-upload-container">
                          <label className="avatar-upload-label">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden-input"
                              disabled={uploadingImage}
                            />
                            {uploadingImage ? '📤 Uploading...' : '📷 Change Photo'}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="user-name">
                    <h2>{profileData.name}</h2>
                    <div className="user-tags">
                      <span className="user-role">Student</span>
                      <span className="user-branch">{profileData.branch || 'Not specified'}</span>
                      <span className="user-year">Year {profileData.year || 'Not specified'}</span>
                    </div>
                    <div className="user-contact">
                      <span className="user-email">{profileData.email}</span>
                      {profileData.phone && <span className="user-phone">• {profileData.phone}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form/Info */}
              <div className="info-fields">
                {isEditing ? (
                  <div className="edit-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          className="form-input"
                          disabled
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="+91 1234567890"
                        />
                      </div>
                      <div className="form-group">
                        <label>Branch</label>
                        <select
                          name="branch"
                          value={profileData.branch}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="">Select Branch</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Mechanical">Mechanical</option>
                          <option value="Civil">Civil</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Biotechnology">Biotechnology</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Year of Study</label>
                        <select
                          name="year"
                          value={profileData.year}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="">Select Year</option>
                          <option value="1">First Year</option>
                          <option value="2">Second Year</option>
                          <option value="3">Third Year</option>
                          <option value="4">Fourth Year</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Enrollment Number</label>
                        <input
                          type="text"
                          name="enrollmentNumber"
                          value={profileData.enrollmentNumber}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="B123456789"
                        />
                      </div>
                    </div>

                    {/* Resume Upload */}
                    <div className="form-group">
                      <label>Resume Upload</label>
                      <div className="resume-upload-form">
                        {profileData.resume ? (
                          <div className="resume-uploaded-form">
                            <div className="resume-info-form">
                              <span className="resume-name-form">Resume uploaded ✓</span>
                              <div className="resume-actions-form">
                                <button 
                                  type="button"
                                  className="view-resume-btn-form"
                                  onClick={viewResume}
                                >
                                  View Resume
                                </button>
                                <label className="resume-update-btn-form">
                                  <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleResumeUpload}
                                    className="hidden-input"
                                    disabled={uploadingResume}
                                  />
                                  {uploadingResume ? 'Uploading...' : 'Update Resume'}
                                </label>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="resume-upload-form-section">
                            <p className="resume-upload-text">No resume uploaded yet</p>
                            <label className="upload-resume-btn-form">
                              <input 
                                type="file" 
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeUpload}
                                className="hidden-input"
                                disabled={uploadingResume}
                              />
                              {uploadingResume ? '📤 Uploading...' : '📄 Upload Resume (PDF/DOC)'}
                            </label>
                            <p className="resume-hint">Max file size: 5MB</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>About Me</label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        className="form-textarea"
                        placeholder="Tell startups about yourself, your interests, and career goals..."
                        rows="4"
                        maxLength="500"
                      />
                      <div className="char-count">{profileData.bio.length}/500</div>
                    </div>

                    <div className="form-group">
                      <label>Skills</label>
                      <div className="skills-edit">
                        <div className="skills-tags">
                          {profileData.skills.map((skill, index) => (
                            <div key={index} className="skill-tag">
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="remove-skill"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="add-skill">
                          <input
                            type="text"
                            placeholder="Add a skill (press Enter)"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                handleAddSkill(e.target.value.trim());
                                e.target.value = '';
                              }
                            }}
                            className="skill-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="view-info">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{profileData.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone</span>
                        <span className="info-value">
                          {profileData.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Branch</span>
                        <span className="info-value">{profileData.branch || 'Not specified'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Year</span>
                        <span className="info-value">Year {profileData.year || 'Not specified'}</span>
                      </div>
                      {profileData.enrollmentNumber && (
                        <div className="info-item">
                          <span className="info-label">Enrollment No.</span>
                          <span className="info-value">{profileData.enrollmentNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Resume Section */}
                    <div className="resume-view-section">
                      <h4>Resume</h4>
                      {profileData.resume ? (
                        <div className="resume-view">
                          <div className="resume-info-view">
                            <span className="resume-name-view">Resume Uploaded</span>
                            <div className="resume-actions-view">
                              <button 
                                className="view-resume-btn-view"
                                onClick={viewResume}
                              >
                                View Resume
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="no-resume-view">
                          <p>No resume uploaded yet</p>
                          <button 
                            className="upload-resume-btn-view"
                            onClick={() => setIsEditing(true)}
                          >
                            Upload Resume
                          </button>
                        </div>
                      )}
                    </div>

                    {profileData.bio && (
                      <div className="bio-display">
                        <h4>About Me</h4>
                        <p className="bio-text">{profileData.bio}</p>
                      </div>
                    )}

                    {profileData.skills.length > 0 && (
                      <div className="skills-display">
                        <h4>Skills</h4>
                        <div className="skills-tags">
                          {profileData.skills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - AI Tools & Notifications */}
            <div className="dashboard-sidebar">
              {/* AI Cover Letter Generator Card */}
              <div className="ai-tools-card">
                <div className="ai-tools-header">
                  <h3>Cover Letter Generator</h3>
                </div>
                <div className="ai-tools-content">
                  <div className="ai-tool-item">
                    <div className="ai-tool-icon">📝</div>
                    <div className="ai-tool-info">
                      <h4>Create Cover Letters</h4>
                      <p>Generate personalized cover letters for your applications</p>
                    </div>
                    <button 
                      className="ai-tool-btn"
                      onClick={openCoverLetterGenerator}
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>

              {/* Professional Photo Assistant Card */}
              <div className="ai-tools-card" style={{marginBottom: '20px'}}>
                <div className="ai-tools-header">
                  <h3>📸 Photo Assistant</h3>
                </div>
                <div className="ai-tools-content">
                  <div className="ai-tool-item">
                    <div className="ai-tool-icon">🤳</div>
                    <div className="ai-tool-info">
                      <h4>Professional Photo Assistant</h4>
                      <p>Get AI guidance for perfect profile photos</p>
                    </div>
                    <button 
                      className="ai-tool-btn"
                      onClick={() => setShowPhotoAssistant(true)}
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications Card */}
              <div className="notifications-card">
                <div className="notifications-header">
                  <h3>Acceptance Notifications</h3>
                  <button 
                    className="view-all-notifications-btn"
                    onClick={() => setShowNotificationPanel(true)}
                  >
                    View All
                  </button>
                </div>
                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications-preview">
                      <span className="notification-icon">🎉</span>
                      <p>No acceptance notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 3).map(notification => (
                      <div 
                        key={notification._id} 
                        className="notification-preview"
                        onClick={() => markNotificationAsRead(notification._id)}
                      >
                        <div className="notification-preview-content">
                          <div className="notification-preview-title">
                            {notification.title}
                          </div>
                          <div className="notification-preview-message">
                            {notification.message.length > 50 
                              ? notification.message.substring(0, 50) + '...' 
                              : notification.message}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Section */}
        <div className="recent-applications-section">
          <div className="section-header">
            <h3>Recent Applications</h3>
            <div className="section-header-actions">
              {/* REMOVED: Generate Cover Letter button from here */}
              <a href="/my-applications" className="view-all-link">View All →</a>
            </div>
          </div>
          
          {recentApplications.length > 0 ? (
            <div className="applications-list">
              {recentApplications.map(app => (
                <div key={app.id} className="application-card">
                  <div className="application-header">
                    <div className="startup-info">
                      <div className="startup-icon">
                        <span className="startup-icon-text">🏢</span>
                      </div>
                      <div className="startup-details">
                        <div className="startup-name">{app.startupName}</div>
                        <div className="application-role">{app.role}</div>
                        <div className="application-status">
                          <span 
                            className="status-indicator" 
                            style={{backgroundColor: getStatusColor(app.status)}}
                          ></span>
                          <span className="status-text">{getStatusText(app.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {app.message && (
                    <div className="application-preview">
                      <p className="application-message-preview">
                        {app.message.length > 120 
                          ? app.message.substring(0, 120) + '...' 
                          : app.message}
                      </p>
                    </div>
                  )}
                  
                  <div className="application-footer">
                    <div className="application-meta">
                      <div className="application-date">
                        Applied: {app.appliedDate}
                      </div>
                    </div>
                    <div className="application-actions">
                      <button 
                        className="view-details-btn"
                        onClick={() => handleViewApplicationDetails(app)}
                      >
                        View Details
                      </button>
                      {app.status === 'pending' && (
                        <button 
                          className="withdraw-btn"
                          onClick={() => handleWithdrawApplication(app.id)}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-applications">
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <h4>No Applications Yet</h4>
                <p>Start applying to startups to see your applications here.</p>
                <div className="empty-state-actions">
                  <a href="/founders" className="browse-startups-btn">
                    Browse Startups
                  </a>
                  <button 
                    className="generate-cover-letter-btn"
                    onClick={openCoverLetterGenerator}
                  >
                    📝 Prepare Cover Letter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <div className="footer-content">
            
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Banasthali Vidyapith Startup Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;