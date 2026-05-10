import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token/${token}`);
        const data = await response.json();
        if (!response.ok || !data.valid) {
          setTokenValid(false);
        }
      } catch (error) {
        setTokenValid(false);
      } finally {
        setTokenChecked(true);
      }
    };
    if (token) verifyToken();
    else setTokenChecked(true);
  }, [token]);

  const validatePassword = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Must include uppercase, lowercase, and number';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResetSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        alert(data.message || 'Password reset failed. Please try again.');
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenChecked) return <div className="auth-page"><div className="auth-container">Verifying link...</div></div>;
  if (!tokenValid) return <div className="auth-page"><div className="auth-container">Invalid or expired reset link. <Link to="/login">Back to Login</Link></div></div>;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-right-panel" style={{ margin: 'auto', maxWidth: '500px' }}>
          <div className="auth-form-container">
            <div className="form-header">
              <h2>Reset Your Password</h2>
              <p>Create a new strong password for your account.</p>
            </div>
            {resetSuccess ? (
              <div className="success-message">
                <span className="success-icon">✓</span>
                <p>Password reset successfully! Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="At least 8 chars, with uppercase, lowercase & number"
                  />
                  {errors.password && <div className="field-error">{errors.password}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter your password"
                  />
                  {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
                </div>
                <button type="submit" className="auth-button primary" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <Link to="/login" className="auth-button secondary" style={{ textAlign: 'center', display: 'inline-block', marginTop: '15px' }}>
                  Back to Login
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;