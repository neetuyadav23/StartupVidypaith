// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Pages/AuthContext';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Enter identifier, 2: Verify OTP, 3: Reset password
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState('');

  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const validateStep1 = () => {
    const newErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Email or Banasthali ID is required';
    }
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!otp.trim() || otp.length !== 6) {
      newErrors.otp = 'Please enter the 6-digit OTP';
    }
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep1();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // In real app, call API to send reset email/OTP
      const result = await requestPasswordReset(identifier);
      
      if (result.success) {
        setStep(2);
        // Mask email for display
        if (identifier.includes('@')) {
          const [name, domain] = identifier.split('@');
          const maskedEmail = `${name[0]}***@${domain}`;
          setEmailSentTo(maskedEmail);
        } else {
          setEmailSentTo(identifier);
        }
        setMessage(`OTP sent to ${identifier.includes('@') ? 'email' : 'registered contact'}`);
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      setErrors({ general: 'Failed to send reset request. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep2();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP with backend
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp })
      });

      if (response.ok) {
        setStep(3);
        setMessage('OTP verified. Now set your new password.');
        setErrors({});
      } else {
        setErrors({ otp: 'Invalid OTP. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'Failed to verify OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep3();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Send new password to backend
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, newPassword })
      });

      if (response.ok) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setErrors({ general: 'Failed to reset password. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await requestPasswordReset(identifier);
      setMessage('New OTP sent successfully!');
    } catch (error) {
      setErrors({ general: 'Failed to resend OTP' });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left-panel">
          <div className="university-branding">
            <div className="university-logo">
              <span className="logo-text">Banasthali Vidyapith</span>
            </div>
            <h1 className="university-tagline">Password Recovery</h1>
          </div>
          
          <div className="auth-description">
            <h2>Reset Your Password</h2>
            <p>
              Follow these steps to securely reset your password. 
              Use your Banasthali ID or registered email.
            </p>
          </div>
          
          <div className="password-recovery-steps">
            <div className={`recovery-step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-info">
                <h4>Enter Identifier</h4>
                <p>Provide your Banasthali ID or email</p>
              </div>
            </div>
            <div className={`recovery-step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-info">
                <h4>Verify Identity</h4>
                <p>Enter OTP sent to your email/phone</p>
              </div>
            </div>
            <div className={`recovery-step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-info">
                <h4>Set New Password</h4>
                <p>Create a strong new password</p>
              </div>
            </div>
          </div>
          
          <div className="already-have-account">
            <p>Remember your password?</p>
            <Link to="/login" className="login-link">Back to Login</Link>
          </div>
        </div>
        
        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="form-header">
              <h2>Reset Password</h2>
              <p className="form-subtitle">Step {step} of 3</p>
            </div>
            
            {message && (
              <div className="success-message">
                <span className="success-icon">✓</span>
                {message}
              </div>
            )}
            
            {errors.general && (
              <div className="error-message">
                <span className="error-icon">!</span>
                {errors.general}
              </div>
            )}
            
            {/* Step 1: Enter Identifier */}
            {step === 1 && (
              <form onSubmit={handleRequestReset} className="auth-form">
                <div className="form-group">
                  <label htmlFor="identifier" className="form-label">
                    Email or Banasthali ID
                  </label>
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`form-input ${errors.identifier ? 'error' : ''}`}
                    placeholder="Enter your email or Banasthali ID"
                  />
                  {errors.identifier && (
                    <div className="field-error">{errors.identifier}</div>
                  )}
                  <p className="form-hint">
                    Enter the email or Banasthali ID you used during registration
                  </p>
                </div>
                
                <button
                  type="submit"
                  className="auth-button primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
            
            {/* Step 2: Verify OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="form-group">
                  <label htmlFor="otp" className="form-label">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`form-input ${errors.otp ? 'error' : ''}`}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                  />
                  {errors.otp && (
                    <div className="field-error">{errors.otp}</div>
                  )}
                  <p className="form-hint">
                    OTP sent to {emailSentTo}. Valid for 10 minutes.
                  </p>
                  <button
                    type="button"
                    className="resend-otp-btn"
                    onClick={resendOtp}
                  >
                    Resend OTP
                  </button>
                </div>
                
                <div className="step-buttons">
                  <button
                    type="button"
                    className="auth-button secondary"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="auth-button primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )}
            
            {/* Step 3: Reset Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`form-input ${errors.newPassword ? 'error' : ''}`}
                      placeholder="Create new password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <div className="field-error">{errors.newPassword}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="field-error">{errors.confirmPassword}</div>
                  )}
                </div>
                
                <div className="password-requirements">
                  <p>Password must contain:</p>
                  <ul>
                    <li className={newPassword.length >= 8 ? 'met' : ''}>
                      At least 8 characters
                    </li>
                    <li className={/[a-z]/.test(newPassword) ? 'met' : ''}>
                      One lowercase letter
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>
                      One uppercase letter
                    </li>
                    <li className={/\d/.test(newPassword) ? 'met' : ''}>
                      One number
                    </li>
                  </ul>
                </div>
                
                <div className="step-buttons">
                  <button
                    type="button"
                    className="auth-button secondary"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="auth-button primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;