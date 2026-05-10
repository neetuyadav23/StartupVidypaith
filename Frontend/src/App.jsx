import './index.css';  // Import first
import './App.css';  // Import second
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Pages/AuthContext'; // Corrected path
import Home from './Pages/Home/Home.jsx';
import LoginPage from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';
import DashboardPage from './Pages/DashboardPage';
import './Pages/AuthPages.css'; // If you need global auth styles
import Events from './Pages/Events/Events.jsx';
import FounderKit from './Pages/FounderKit/FounderKit.jsx';
import SuccessStories from './Pages/SuccessStories/SuccessStories';
import About from "./Pages/About/About.jsx";
import FounderProfile from './Pages/FounderProfile.jsx';
import FounderSetupMultiStep from './Pages/FounderSetupMultiStep.jsx';
import FoundersDirectory from './Pages/FoundersDirectory.jsx';
import FounderApplications from './Pages/FounderApplications';
import Explore from './Pages/Explore/Explore.jsx';
import ResetPasswordPage from './Pages/ResetPasswordPage'; 

import CommunityChat from './Pages/CommunityChat/CommunityChat';

// Import Blog pages from your Blog folder
import BlogsList from './Pages/Blog/BlogsList';
import BlogDetail from './Pages/Blog/BlogDetail';
import CreateBlog from './Pages/Blog/CreateBlog';

// Protected Route Component (Renamed to PrivateRoute)
const PrivateRoute = ({ children, requireAdmin = false, requireFounder = false, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Check for allowedRoles if provided
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.type) && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/dashboard" />;
  }
  
  if (requireAdmin && user.type !== 'admin' && user.userType !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  if (requireFounder && user.type !== 'founder' && user.userType !== 'founder') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/events" element={<Events />} />
          <Route path="/about" element={<About />} />
          <Route path="/success" element={<SuccessStories />} />
           <Route path="/founderKit" element={<CommunityChat />} />
           <Route path="/explore" element={<Explore />} />
           <Route path="/reset-password/:token" element={<ResetPasswordPage />} />


          {/* Blog Routes */}
          <Route path="/blogs" element={<BlogsList />} />
          <Route path="/blog/:id" element={<BlogDetail />} /> {/* Changed from blogs/:slug to blog/:id */}
          <Route path="/blog/create" element={
            <PrivateRoute allowedRoles={['founder', 'admin']}>
              <CreateBlog />
            </PrivateRoute>
          } />
          <Route path="/blog/edit/:id" element={
            <PrivateRoute allowedRoles={['founder', 'admin']}>
              <CreateBlog />
            </PrivateRoute>
          } />
          
          <Route 
            path="/founder/applications/:founderId" 
            element={
              <PrivateRoute requireFounder>
                <FounderApplications />
              </PrivateRoute>
            } 
          />
          
          {/* New founder routes */}
          <Route path="/founder/setup/:founderId?" element={<PrivateRoute><FounderSetupMultiStep /></PrivateRoute>} />
          <Route path="/founder/:founderId" element={<FounderProfile />} />
          <Route path="/founders" element={<FoundersDirectory />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <PrivateRoute requireAdmin>
                <h1>Admin Dashboard - Coming Soon</h1>
              </PrivateRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;