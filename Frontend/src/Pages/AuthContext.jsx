// src/Pages/AuthContext.jsx - UPDATED VERSION WITH GLOBAL HEADER SETTING
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios'; // <-- use the default axios instance

// Import the constants
import { API_BASE_URL } from '../constants.jsx';

// ✅ IMMEDIATELY SET GLOBAL AUTHORIZATION HEADER FROM LOCALSTORAGE
const tokenFromStorage = localStorage.getItem('token');
if (tokenFromStorage) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${tokenFromStorage}`;
  console.log('✅ Global Authorization header set from localStorage');
}

// Configure axios to send cookies with requests (only needed for API calls that need cookies)
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize user from localStorage on app start
  useEffect(() => {
    const initUserFromStorage = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        console.log('🔄 Initializing from localStorage:', {
          hasToken: !!token,
          hasUser: !!userStr
        });
        
        if (token && userStr) {
          try {
            const userData = JSON.parse(userStr);
            console.log('📋 Loaded user from localStorage:', {
              id: userData._id,
              name: userData.fullName || userData.name,
              type: userData.userType || userData.type
            });
            
            // Immediately set user from localStorage for quick UI display
            setUser({
              ...userData,
              type: userData.userType || userData.type,
              id: userData._id,
              name: userData.fullName || userData.name
            });
            
            // Then verify with server
            await verifyTokenAndFetchUser(token);
          } catch (err) {
            console.error('❌ Error parsing user from localStorage:', err);
            clearLocalStorage();
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing from localStorage:', error);
        clearLocalStorage();
        setLoading(false);
      }
    };
    
    initUserFromStorage();
  }, []);

  // Verify token and fetch fresh user data
  const verifyTokenAndFetchUser = async (token) => {
    try {
      console.log('🔍 Verifying token with server...');
      
      const response = await api.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Token verification response:', response.data);
      
      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        console.log('👤 User verified via API:', {
          id: userData._id,
          name: userData.fullName,
          type: userData.userType,
          banasthaliId: userData.banasthaliId
        });
        
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser({
          ...userData,
          type: userData.userType,
          id: userData._id,
          name: userData.fullName
        });
      } else {
        console.log('❌ Token verification failed');
        clearLocalStorage();
      }
    } catch (err) {
      console.log('🔒 Token verification error:', err.message);
      // Don't clear storage immediately - keep user logged in for offline
      // Only clear if it's an auth error
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.log('🔒 Auth error, logging out');
        clearLocalStorage();
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to clear localStorage and global header
  const clearLocalStorage = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization']; // ✅ remove global header
    setUser(null);
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      console.log('📝 Registering user with data:', {
        fullName: userData.fullName,
        banasthaliId: userData.banasthaliId,
        email: userData.email
      });

      const response = await api.post('/auth/register', {
        fullName: userData.fullName,
        banasthaliId: userData.banasthaliId,
        email: userData.email,
        password: userData.password,
        userType: userData.userType,
        branch: userData.branch,
        year: userData.year,
        phone: userData.phone,
        startupName: userData.startupName,
        designation: userData.designation
      });
      
      console.log('✅ Registration response:', response.data);
      
      if (response.data.success && response.data.token && response.data.user) {
        const { token, user: userResponse } = response.data;
        
        console.log('🎉 Registration successful! User:', {
          id: userResponse._id,
          name: userResponse.fullName,
          type: userResponse.userType
        });
        
        // Store token and user in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userResponse));
        
        // ✅ Set global header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser({
          ...userResponse,
          type: userResponse.userType,
          id: userResponse._id,
          name: userResponse.fullName
        });
        return { success: true, user: userResponse, token };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('❌ Registration error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login function
  const login = async (credentials, rememberMe = false) => {
    try {
      setError(null);
      console.log('🔑 Attempting login with:', {
        banasthaliId: credentials.banasthaliId,
        email: credentials.email
      });

      const response = await api.post('/auth/login', {
        banasthaliId: credentials.banasthaliId?.toUpperCase(),
        email: credentials.email?.toLowerCase(),
        password: credentials.password
      });
      
      console.log('✅ Login response:', response.data);
      
      if (response.data.success && response.data.token && response.data.user) {
        const { token, user: userData } = response.data;
        
        console.log('🎉 Login successful! User:', {
          id: userData._id,
          name: userData.fullName,
          type: userData.userType,
          banasthaliId: userData.banasthaliId,
          email: userData.email
        });
        
        // Always store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // ✅ Set global header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser({
          ...userData,
          type: userData.userType,
          id: userData._id,
          name: userData.fullName
        });
        
        return { success: true, user: userData, token };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.post('/auth/logout', {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (err) {
          console.error('Logout API error:', err);
        }
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local storage and state
      clearLocalStorage();
      // ✅ Remove global header (already done in clearLocalStorage)
      setError(null);
      console.log('✅ User logged out and local storage cleared');
    }
  };

  // Update user details
  const updateUser = async (userData) => {
    try {
      console.log('📝 Updating user details:', userData);
      const token = localStorage.getItem('token');
      
      const response = await api.put('/auth/updatedetails', userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setUser({
          ...updatedUser,
          type: updatedUser.userType,
          id: updatedUser._id,
          name: updatedUser.fullName
        });
        return { success: true, user: updatedUser };
      }
    } catch (err) {
      console.error('❌ Update error:', err);
      const errorMessage = err.response?.data?.message || 'Update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Test login functions for demo accounts
  const testLogin = async (userType) => {
    console.log(`🧪 Testing ${userType} login...`);
    
    const demoAccounts = {
      student: {
        banasthaliId: 'BTCSE20201',
        email: 'priya.sharma@gmail.com',
        password: 'Student@123'
      },
      founder: {
        banasthaliId: 'BTFDR20201',
        email: 'meera.joshi@techstartup.com',
        password: 'Founder@123'
      },
      admin: {
        banasthaliId: 'BTADM20201',
        email: 'sunita.verma@banasthali.in',
        password: 'Admin@123'
      }
    };

    const account = demoAccounts[userType];
    if (!account) {
      console.error(`❌ No demo account for type: ${userType}`);
      return { success: false, error: `Demo ${userType} account not found` };
    }

    console.log(`📤 Using demo ${userType} credentials:`, {
      banasthaliId: account.banasthaliId,
      email: account.email
    });

    return await login(account);
  };

  // Force refresh user data
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await verifyTokenAndFetchUser(token);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
    testLogin,
    refreshUser,
    isAuthenticated: !!user && !!localStorage.getItem('token'),
    isAdmin: user?.type === 'admin' || user?.userType === 'admin',
    isFounder: user?.type === 'founder' || user?.userType === 'founder',
    isStudent: user?.type === 'student' || user?.userType === 'student' || user?.userType === 'user'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};