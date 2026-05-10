// src/pages/SignupPage.js - WITH OTP VERIFICATION
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Pages/AuthContext';
import { API_BASE_URL } from '../constants';
import './AuthPages.css';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    userType: '', // 'student', 'founder', 'admin'
    email: '',
    banasthaliId: '', // COMPULSORY FOR ALL USERS
    password: '',
    confirmPassword: '',
    year: '',
    branch: '',
    phone: '',
    startupName: '', // Only for founders
    designation: '' // For admin
  });
 
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [signupError, setSignupError] = useState('');
 
  // OTP States
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
 
  const { register } = useAuth();
  const navigate = useNavigate();

  // Validate Step 1: Basic Information
  const validateStep1 = () => {
    const newErrors = {};
   
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }
   
    if (!formData.userType) {
      newErrors.userType = 'Please select your user type';
    }
   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
   
    if (!formData.banasthaliId) {
      newErrors.banasthaliId = 'Banasthali ID is REQUIRED for all users';
    } else {
      const idRegex = /^[A-Za-z]{5}\d{5}$/;
      if (!idRegex.test(formData.banasthaliId)) {
        newErrors.banasthaliId = 'ID must be exactly 5 letters followed by 5 numbers (e.g., BTBTC12345)';
      }
    }
   
    return newErrors;
  };

  // Validate Step 2: Password
  const validateStep2 = () => {
    const newErrors = {};
   
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }    
   
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
   
    return newErrors;
  };

  // Validate Step 3: Profile Details
  const validateStep3 = () => {
    const newErrors = {};
   
    if (formData.userType === 'student') {
      if (!formData.year) {
        newErrors.year = 'Current year is required';
      }
     
      if (!formData.branch) {
        newErrors.branch = 'Branch/Department is required';
      }
    }
   
    if (formData.userType === 'founder' && !formData.startupName) {
      newErrors.startupName = 'Startup name is required for founders';
    }
   
    if (formData.userType === 'admin' && !formData.designation) {
      newErrors.designation = 'Designation is required for admin';
    }
   
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
   
    return newErrors;
  };

  // ========== OTP FUNCTIONS ==========
  const sendOtp = async () => {
    // Validate email before sending OTP
    const step1Errors = validateStep1();
    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      return false;
    }

    setOtpSending(true);
    setOtpError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email.toLowerCase() })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsOtpSent(true);
        setOtp('');
        setOtpError('');
        // Start resend cooldown (60 seconds)
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        alert('OTP sent to your email. Please check your inbox (and spam folder).');
        return true;
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      setOtpError(error.message || 'Could not send OTP. Please try again.');
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return false;
    }

    setOtpVerifying(true);
    setOtpError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          otp: otp
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsOtpVerified(true);
        setOtpError('');
        alert('Email verified successfully! You can now set your password.');
        // Move to password step
        setCurrentStep(2);
        return true;
      } else {
        throw new Error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verify error:', error);
      setOtpError(error.message || 'OTP verification failed. Please try again.');
      return false;
    } finally {
      setOtpVerifying(false);
    }
  };

  // Modified Next Step Handler (with OTP integration)
  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Step 1: Validate basic info
      const validationErrors = validateStep1();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      
      // If OTP not sent yet, send OTP first
      if (!isOtpSent) {
        await sendOtp();
        return;
      }
      
      // If OTP sent but not verified, show OTP input
      if (isOtpSent && !isOtpVerified) {
        // Wait for user to enter OTP and click verify
        // We'll handle OTP input in the UI, so this function should not proceed
        return;
      }
      
      // If already verified, go to step 2
      if (isOtpVerified) {
        setCurrentStep(2);
      }
      
    } else if (currentStep === 2) {
      const validationErrors = validateStep2();
      if (Object.keys(validationErrors).length === 0) {
        setCurrentStep(3);
      } else {
        setErrors(validationErrors);
      }
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Handle form submission (final step)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');
    const validationErrors = validateStep3();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for API call
      const signupData = {
        fullName: formData.fullName,
        userType: formData.userType,
        email: formData.email.toLowerCase(),
        banasthaliId: formData.banasthaliId.toUpperCase(),
        password: formData.password,
        phone: formData.phone
      };
      
      if (formData.userType === 'student') {
        signupData.year = formData.year;
        signupData.branch = formData.branch;
      } else if (formData.userType === 'founder') {
        signupData.startupName = formData.startupName;
      } else if (formData.userType === 'admin') {
        signupData.designation = formData.designation;
      }
      
      console.log('🚀 Submitting signup data:', signupData);
      
      const result = await register(signupData);
      
      if (result.success) {
        console.log('✅ Registration successful!');
        
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (!storedToken || !storedUser) {
          console.error('❌ Auth data not stored in localStorage!');
          setSignupError('Authentication failed. Please try logging in manually.');
          return;
        }
        
        if (result.user.userType === 'founder') {
          console.log('🚀 Founder detected, redirecting to setup page...');
          localStorage.setItem('founderSignupData', JSON.stringify({
            startupName: formData.startupName,
            userId: result.user._id,
            justSignedUp: true
          }));
          
          setTimeout(() => {
            navigate(`/founder/setup/${result.user._id}`, {
              replace: true,
              state: { user: result.user, justSignedUp: true }
            });
          }, 100);
          
        } else {
          console.log('🎓 Non-founder detected, redirecting to home...');
          localStorage.setItem('justSignedUp', 'true');
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
      } else {
        throw new Error(result.error || 'Registration failed');
      }
      
    } catch (error) {
      console.error('❌ Signup error:', error);
      setSignupError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
   
    if (name === 'banasthaliId') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
   
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (signupError) {
      setSignupError('');
    }
   
    if (name === 'userType') {
      setFormData(prev => ({
        ...prev,
        startupName: '',
        designation: '',
        year: '',
        branch: ''
      }));
    }
  };

  const userTypeDescriptions = {
    student: {
      title: 'Student',
      description: 'Current students of Banasthali Vidyapith',
      icon: '👨‍🎓',
    },
    founder: {
      title: 'Startup Founder',
      description: 'Entrepreneurs building startups from Banasthali',
      icon: '🚀',
    },
    admin: {
      title: 'Admin',
      description: 'Platform administrators and faculty coordinators',
      icon: '👨‍💼',
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Panel - Branding */}
        <div className="auth-left-panel">
          <div className="university-branding">
            <div className="university-logo">
              <span className="logo-text">Banasthali Vidyapith</span>
            </div>
            <h1 className="university-tagline">
              Startup Innovation Portal
            </h1>
          </div>
         
          <div className="auth-description">
            <h2>Create Your Account</h2>
            <p>
              Join the startup ecosystem of Banasthali Vidyapith.
              <strong> Banasthali ID is COMPULSORY for all users.</strong>
            </p>
          </div>
         
          {/* Signup Progress Indicator */}
          <div className="signup-progress">
            <div className="progress-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Basic Info</div>
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Security</div>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Details</div>
              </div>
            </div>
          </div>
         
          <div className="user-type-info">
            <h4>Important Notes:</h4>
            <ul>
              <li><strong>Banasthali ID is COMPULSORY</strong> for all users</li>
              <li>Format: 5 letters + 5 numbers</li>
              <li>Example: BTBTC12345</li>
              <li>Use your personal email address</li>
              <li>All fields are required for verification</li>
            </ul>
            <div className="user-type-redirects">
              <h5>After Signup:</h5>
              <div className="redirect-info">
                <div className="redirect-item">
                  <span className="redirect-icon">🎓</span>
                  <div>
                    <strong>Students</strong>
                    <small>→ Home page (logged in)</small>
                  </div>
                </div>
                <div className="redirect-item">
                  <span className="redirect-icon">🚀</span>
                  <div>
                    <strong>Founders</strong>
                    <small>→ Founder setup page (complete profile)</small>
                  </div>
                </div>
                <div className="redirect-item">
                  <span className="redirect-icon">👨‍💼</span>
                  <div>
                    <strong>Admins</strong>
                    <small>→ Home page (logged in)</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="id-format-example">
              <strong>Banasthali ID Format:</strong>
              <div className="id-example">
                <span className="letters">BTBTC</span>
                <span className="numbers">12345</span>
              </div>
              <div className="id-explanation">
                <span>5 Letters</span>
                <span>5 Numbers</span>
              </div>
            </div>  
          </div>
         
          <div className="already-have-account">
            <p>Already have an account?</p>
            <Link to="/login" className="login-link">
              Login here
            </Link>
          </div>
        </div>
       
        {/* Right Panel - Signup Form */}
        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="form-header">
              <h2>Create New Account</h2>
              <p className="form-subtitle">
                Step {currentStep} of 3
              </p>
            </div>
           
            {signupError && (
              <div className="error-message">
                <span className="error-icon">!</span>
                {signupError}
              </div>
            )}
           
            <form onSubmit={handleSubmit} className="auth-form">
              {currentStep === 1 && (
                <>
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`form-input ${errors.fullName ? 'error' : ''}`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.fullName && (
                      <div className="field-error">{errors.fullName}</div>
                    )}
                  </div>
                 
                  <div className="form-group">
                    <label htmlFor="userType" className="form-label">
                      I am a *
                    </label>
                    <div className="user-type-options">
                      {['student', 'founder', 'admin'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`user-type-btn ${formData.userType === type ? 'active' : ''}`}
                          onClick={() => handleChange({
                            target: { name: 'userType', value: type }
                          })}
                        >
                          <span className="type-icon">
                            {userTypeDescriptions[type].icon}
                          </span>
                          <span className="type-label">
                            {userTypeDescriptions[type].title}
                          </span>
                          <span className="type-description">
                            {userTypeDescriptions[type].description}
                          </span>
                        </button>
                      ))}
                    </div>
                    {errors.userType && (
                      <div className="field-error">{errors.userType}</div>
                    )}
                  </div>
                 
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="Enter your personal email address"
                      disabled={isLoading || isOtpSent} // Disable after OTP sent
                    />
                    {errors.email && (
                      <div className="field-error">{errors.email}</div>
                    )}
                    <div className="input-hint">
                      Use your personal email for verification
                    </div>
                  </div>
                 
                  <div className="form-group">
                    <label htmlFor="banasthaliId" className="form-label">
                      Banasthali ID *
                    </label>
                    <div className="input-with-hint compulsory-field">
                      <input
                        type="text"
                        id="banasthaliId"
                        name="banasthaliId"
                        value={formData.banasthaliId}
                        onChange={handleChange}
                        className={`form-input ${errors.banasthaliId ? 'error' : ''}`}
                        placeholder="Enter your Banasthali ID (e.g., BTBTC12345)"
                        maxLength="10"
                        pattern="[A-Za-z]{5}\d{5}"
                        title="5 letters followed by 5 numbers"
                        disabled={isLoading}
                      />
                      <div className="input-hint compulsory-hint">
                        ⚠️ COMPULSORY: 5 letters + 5 numbers format
                      </div>
                    </div>
                    {errors.banasthaliId && (
                      <div className="field-error">{errors.banasthaliId}</div>
                    )}
                    <div className="id-examples">
                      <small>Examples: BTBTC12345, BTITC67890, BTECE24680</small>
                    </div>
                  </div>

                  {/* OTP Section - appears after clicking "Send OTP" */}
                  {isOtpSent && !isOtpVerified && (
                    <div className="otp-section">
                      <div className="form-group">
                        <label htmlFor="otp" className="form-label">
                          Enter OTP *
                        </label>
                        <input
                          type="text"
                          id="otp"
                          name="otp"
                          value={otp}
                          onChange={(e) => {
                            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setOtpError('');
                          }}
                          className={`form-input ${otpError ? 'error' : ''}`}
                          placeholder="6-digit OTP"
                          maxLength="6"
                          autoComplete="off"
                          disabled={otpVerifying}
                        />
                        {otpError && (
                          <div className="field-error">{otpError}</div>
                        )}
                        <div className="otp-actions">
                          <button
                            type="button"
                            className="verify-otp-btn"
                            onClick={verifyOtp}
                            disabled={otpVerifying || otp.length !== 6}
                          >
                            {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                          </button>
                          {resendCooldown > 0 ? (
                            <span className="resend-cooldown">
                              Resend in {resendCooldown}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="resend-otp-btn"
                              onClick={sendOtp}
                              disabled={otpSending}
                            >
                              {otpSending ? 'Sending...' : 'Resend OTP'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                 
                  <button
                    type="button"
                    className="auth-button primary"
                    onClick={handleNextStep}
                    disabled={isLoading || (isOtpSent && !isOtpVerified)}
                  >
                    {!isOtpSent ? 'Send OTP' : (isOtpVerified ? 'Next: Set Password' : 'Waiting for OTP verification...')}
                  </button>
                </>
              )}
             
              {currentStep === 2 && (
                <>
                  <div className="password-requirements-header">
                    <h4>Create a Strong Password</h4>
                    <p>Your password must meet the following requirements:</p>
                  </div>
                 
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Password *
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-input ${errors.password ? 'error' : ''}`}
                        placeholder="Create a strong password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                    {errors.password && (
                      <div className="field-error">{errors.password}</div>
                    )}
                    <div className="password-requirements">
                      <ul>
                        <li className={formData.password.length >= 8 ? 'met' : ''}>
                          At least 8 characters
                        </li>
                        <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                          One lowercase letter
                        </li>
                        <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                          One uppercase letter
                        </li>
                        <li className={/\d/.test(formData.password) ? 'met' : ''}>
                          One number
                        </li>
                      </ul>
                    </div>
                  </div>
                 
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password *
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Confirm your password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="field-error">{errors.confirmPassword}</div>
                    )}
                  </div>
                 
                  <div className="step-buttons">
                    <button
                      type="button"
                      className="auth-button secondary"
                      onClick={() => {
                        setCurrentStep(1);
                        setIsOtpVerified(false);
                        setIsOtpSent(false);
                        setOtp('');
                      }}
                      disabled={isLoading}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="auth-button primary"
                      onClick={handleNextStep}
                      disabled={isLoading}
                    >
                      Next: Complete Profile
                    </button>
                  </div>
                </>
              )}
             
              {currentStep === 3 && (
                <>
                  {formData.userType === 'student' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="year" className="form-label">
                          Current Year *
                        </label>
                        <select
                          id="year"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          className={`form-input ${errors.year ? 'error' : ''}`}
                          disabled={isLoading}
                        >
                          <option value="">Select Current Year</option>
                          <option value="1st">1st Year</option>
                          <option value="2nd">2nd Year</option>
                          <option value="3rd">3rd Year</option>
                          <option value="4th">4th Year</option>
                          <option value="5th">5th Year</option>
                        </select>
                        {errors.year && (
                          <div className="field-error">{errors.year}</div>
                        )}
                      </div>
                     
                      <div className="form-group">
                        <label htmlFor="branch" className="form-label">
                          Branch/Department *
                        </label>
                        <select
                          id="branch"
                          name="branch"
                          value={formData.branch}
                          onChange={handleChange}
                          className={`form-input ${errors.branch ? 'error' : ''}`}
                          disabled={isLoading}
                        >
                          <option value="">Select Branch/Department</option>
                          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Electronics & Communication">Electronics & Communication</option>
                          <option value="Electrical Engineering">Electrical Engineering</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Chemical Engineering">Chemical Engineering</option>
                          <option value="Biotechnology">Biotechnology</option>
                          <option value="Business Administration">Business Administration</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                          <option value="Science">Science</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.branch && (
                          <div className="field-error">{errors.branch}</div>
                        )}
                      </div>
                    </>
                  )}
                 
                  {formData.userType === 'founder' && (
                    <div className="form-group">
                      <label htmlFor="startupName" className="form-label">
                        Startup Name *
                      </label>
                      <input
                        type="text"
                        id="startupName"
                        name="startupName"
                        value={formData.startupName}
                        onChange={handleChange}
                        className={`form-input ${errors.startupName ? 'error' : ''}`}
                        placeholder="Enter your startup name"
                        disabled={isLoading}
                      />
                      {errors.startupName && (
                        <div className="field-error">{errors.startupName}</div>
                      )}
                      <div className="input-hint">
                        After signup, you'll go to the founder setup page to complete your profile
                      </div>
                    </div>
                  )}
                 
                  {formData.userType === 'admin' && (
                    <div className="form-group">
                      <label htmlFor="designation" className="form-label">
                        Designation *
                      </label>
                      <select
                        id="designation"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className={`form-input ${errors.designation ? 'error' : ''}`}
                        disabled={isLoading}
                      >
                        <option value="">Select Designation</option>
                        <option value="Faculty Coordinator">Faculty Coordinator</option>
                        <option value="Platform Admin">Platform Admin</option>
                        <option value="System Administrator">System Administrator</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.designation && (
                        <div className="field-error">{errors.designation}</div>
                      )}
                    </div>
                  )}
                 
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                      disabled={isLoading}
                    />
                    {errors.phone && (
                      <div className="field-error">{errors.phone}</div>
                    )}
                  </div>
                  
                  <div className="terms-agreement">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        required
                        disabled={isLoading}
                      />
                      <span>
                        I agree to the{' '}
                        <Link to="/terms">Terms of Service</Link> and{' '}
                        <Link to="/privacy">Privacy Policy</Link>
                      </span>
                    </label>
                  </div>
                 
                  <div className="step-buttons">
                    <button
                      type="button"
                      className="auth-button secondary"
                      onClick={handlePrevStep}
                      disabled={isLoading}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="auth-button primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading-spinner"></span>
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </>
              )}
             
              <div className="terms-notice">
                <p className="restricted-access">
                  Restricted Access: For Banasthali Vidyapith community only
                </p>
              </div>
            </form>
          </div>
         
          <div className="auth-footer">
            <div className="security-info">
              <span>🔒 Banasthali ID is COMPULSORY for all accounts</span>
            </div>
            <div className="contact-support">
              Need help? <Link to="/contact">Contact Support</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;