import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './FounderProfile.css';
import Header from '../Components/Header/Header.jsx';
import { API_BASE_URL } from '../constants';

const FounderProfile = () => {
  const { founderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Debug logging
  console.log('Current founderId from URL:', founderId);
  console.log('Current user state:', currentUser);
  console.log('Current profile state:', profile);
  
  // Questions state
  const [questions, setQuestions] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    category: 'General',
    anonymous: false
  });
  
  // Products state
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'Software',
    status: 'Idea',
    url: '',
    tags: [],
    image: ''
  });
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [tagInput, setTagInput] = useState('');
  
  // Application state
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [applicationData, setApplicationData] = useState({
    role: '',
    message: '',
    experience: '',
    skills: '',
    email: '',
    phone: '',
    resume: '',
    portfolio: ''
  });
  
  // Load current user
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        console.log('Loading user from localStorage:', userStr);
        console.log('Token exists:', !!token);
        
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('Parsed user:', user);
          setCurrentUser(user);
        } else {
          console.log('No user found in localStorage');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('❌ Error loading user:', error);
        setCurrentUser(null);
      }
    };
    
    loadUser();
  }, []);
  
  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [founderId]);
  
  // Load questions and products when profile is loaded
  useEffect(() => {
    if (profile && profile._id) {
      console.log('Profile loaded, fetching questions and products for profile ID:', profile._id);
      loadQuestions();
      loadProducts();
    }
  }, [profile]);
  
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = token ? { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };
      
      console.log('Attempting to fetch founder profile...');
      console.log('Founder ID from URL:', founderId);
      
      // Try fetching founder by ID first
      let response = await fetch(`${API_BASE_URL}/founders/${founderId}`, {
        headers
      });
      
      console.log('First endpoint response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('First endpoint data:', data);
        if (data.success && data.founder) {
          console.log('Founder found by ID:', data.founder);
          setProfile(data.founder);
          return;
        } else {
          console.log('No founder found by ID, or success is false');
        }
      } else {
        console.log('First endpoint failed with status:', response.status);
      }
      
      // If not found by founder ID, try by user ID
      console.log('Trying to fetch by user ID...');
      response = await fetch(`${API_BASE_URL}/founders/user/${founderId}`, {
        headers
      });
      
      console.log('Second endpoint response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Second endpoint data:', data);
        if (data.success && data.founder) {
          console.log('Founder found by user ID:', data.founder);
          setProfile(data.founder);
          return;
        } else {
          console.log('No founder found by user ID, or success is false');
        }
      }
      
      // Try one more endpoint - get founder by userId
      console.log('Trying direct endpoint...');
      response = await fetch(`${API_BASE_URL}/users/${founderId}/founder-profile`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Direct endpoint data:', data);
        if (data.success && data.founder) {
          console.log('Founder found via direct endpoint:', data.founder);
          setProfile(data.founder);
          return;
        }
      }
      
      throw new Error('Founder profile not found. Please check if the founder has completed their profile setup.');
      
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadQuestions = async () => {
    try {
      if (!profile || !profile._id) {
        console.log('Cannot load questions: profile or profile._id is missing');
        return;
      }
      
      console.log('Loading questions for founder ID:', profile._id);
      
      const response = await fetch(`${API_BASE_URL}/questions/founder/${profile._id}`);
      console.log('Questions endpoint response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Questions data:', data);
        
        if (data.success) {
          setQuestions(data.questions || []);
          console.log('Questions loaded:', data.questions?.length || 0);
        } else {
          console.log('Questions API returned success: false');
          setQuestions([]);
        }
      } else {
        console.log('Failed to load questions, status:', response.status);
        setQuestions([]);
      }
    } catch (error) {
      console.error('❌ Error loading questions:', error);
      setQuestions([]);
    }
  };
  
  const loadProducts = async () => {
    try {
      if (!profile || !profile._id) {
        console.log('Cannot load products: profile or profile._id is missing');
        return;
      }
      
      console.log('Loading products for founder ID:', profile._id);
      
      const response = await fetch(`${API_BASE_URL}/products/founder/${profile._id}`);
      console.log('Products endpoint response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Products data:', data);
        if (data.success) {
          setProducts(data.products || []);
          console.log('Products loaded:', data.products?.length || 0);
        }
      } else {
        console.log('Failed to load products, status:', response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };
  
  // Check if current user is the founder
  const isCurrentUserFounder = () => {
    if (!currentUser || !profile) {
      console.log('isCurrentUserFounder: false (missing currentUser or profile)');
      console.log('currentUser:', currentUser);
      console.log('profile:', profile);
      return false;
    }
    
    // Check multiple possible ID fields
    const isFounder = currentUser._id === profile.userId || 
                     currentUser._id === profile._id ||
                     currentUser.id === profile.userId ||
                     (currentUser.userId && currentUser.userId === profile.userId);
    
    console.log('isCurrentUserFounder check:');
    console.log('currentUser._id:', currentUser._id);
    console.log('profile.userId:', profile.userId);
    console.log('profile._id:', profile._id);
    console.log('Result:', isFounder);
    
    return isFounder;
  };
  
  // Check if current user is admin
  const isCurrentUserAdmin = () => {
    if (!currentUser) {
      console.log('isCurrentUserAdmin: false (no currentUser)');
      return false;
    }
    
    const isAdmin = currentUser.role === 'admin' || 
                   currentUser.userType === 'admin' ||
                   (currentUser.roles && currentUser.roles.includes('admin'));
    
    console.log('isCurrentUserAdmin:', isAdmin);
    return isAdmin;
  };
  
  // Check if user can ask question
  const canAskQuestion = () => {
    if (!currentUser) {
      console.log('canAskQuestion: false (no currentUser)');
      return false;
    }
    
    if (isCurrentUserFounder()) {
      console.log('canAskQuestion: false (user is founder)');
      return false;
    }
    
    console.log('canAskQuestion: true');
    return true;
  };
  
  // Check if user can delete/edit question
  const canManageQuestion = (question) => {
    if (!currentUser) {
      console.log('canManageQuestion: false (no currentUser)');
      return false;
    }
    
    if (isCurrentUserAdmin()) {
      console.log('canManageQuestion: true (user is admin)');
      return true;
    }
    
    if (question.askedBy && currentUser._id === question.askedBy._id) {
      console.log('canManageQuestion: true (user asked the question)');
      return true;
    }
    
    if (isCurrentUserFounder()) {
      console.log('canManageQuestion: true (user is founder)');
      return true;
    }
    
    console.log('canManageQuestion: false');
    return false;
  };
  
  // Check if user can delete product (founder or admin)
  const canDeleteProduct = () => {
    if (!currentUser) {
      console.log('canDeleteProduct: false (no currentUser)');
      return false;
    }
    
    const canDelete = isCurrentUserFounder() || isCurrentUserAdmin();
    console.log('canDeleteProduct:', canDelete);
    return canDelete;
  };
  
  // Check if user can apply for roles - ALL non-current users can apply
  const canApplyForRoles = () => {
    if (!currentUser) {
      console.log('canApplyForRoles: false (no currentUser)');
      return false;
    }
    
    if (isCurrentUserFounder()) {
      console.log('canApplyForRoles: false (user is founder)');
      return false; // Current founder cannot apply to their own startup
    }
    
    console.log('canApplyForRoles: true');
    return true; // All other logged-in users (both students AND other founders) can apply
  };
  
  // Check if user can apply for specific role - All roles open to all non-current users
  const canApplyForRole = (role) => {
    if (!currentUser) {
      console.log('canApplyForRole: false (no currentUser)');
      return false;
    }
    
    if (isCurrentUserFounder()) {
      console.log('canApplyForRole: false (user is founder)');
      return false; // Current founder cannot apply to their own startup
    }
    
    console.log('canApplyForRole: true for role:', role);
    return true; // All other logged-in users can apply for all roles
  };
  
  // Handle asking a question
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    
    console.log('handleAskQuestion called');
    
    if (!currentUser) {
      alert('Please login to ask a question');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    if (isCurrentUserFounder()) {
      alert('You cannot ask questions on your own profile');
      return;
    }
    
    if (!newQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    if (!profile || !profile._id) {
      alert('Cannot submit question: Founder profile not properly loaded');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      console.log('Submitting question for founder ID:', profile._id);
      
      const response = await fetch(`${API_BASE_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          founderId: profile._id,
          question: newQuestion.question,
          category: newQuestion.category,
          anonymous: newQuestion.anonymous
        })
      });
      
      const data = await response.json();
      console.log('Question submission response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to ask question (${response.status})`);
      }
      
      if (data.success) {
        setQuestions([data.question, ...questions]);
        setNewQuestion({
          question: '',
          category: 'General',
          anonymous: false
        });
        setShowQuestionForm(false);
        alert('✅ Question submitted successfully!');
      } else {
        throw new Error(data.error || data.message || 'Failed to submit question');
      }
    } catch (error) {
      console.error('❌ Error asking question:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Handle answering a question
  const handleAnswerQuestion = async (questionId, answer) => {
    console.log('handleAnswerQuestion called for question:', questionId);
    
    if (!isCurrentUserFounder()) {
      alert('Only the founder can answer questions on their profile');
      return;
    }
    
    if (!answer.trim()) {
      alert('Please enter an answer');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}/answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer })
      });
      
      const data = await response.json();
      console.log('Answer submission response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit answer');
      }
      
      if (data.success) {
        setQuestions(questions.map(q => 
          q._id === questionId ? { ...q, answer: answer, isAnswered: true, answeredAt: new Date() } : q
        ));
        alert('✅ Answer submitted successfully!');
      }
    } catch (error) {
      console.error('Error answering question:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Handle deleting a question
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete question');
      }
      
      if (data.success) {
        setQuestions(questions.filter(q => q._id !== questionId));
        alert('✅ Question deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Handle editing a question
  const handleEditQuestion = async (questionId) => {
    const question = questions.find(q => q._id === questionId);
    if (!question) return;
    
    const newQuestionText = prompt('Edit your question:', question.question);
    
    if (newQuestionText && newQuestionText.trim() !== question.question) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ question: newQuestionText })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update question');
        }
        
        if (data.success) {
          setQuestions(questions.map(q => 
            q._id === questionId ? { ...q, question: newQuestionText } : q
          ));
          alert('✅ Question updated successfully!');
        }
      } catch (error) {
        console.error('Error updating question:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };
  
  // Handle deleting a product (for founder and admin)
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Session expired. Please login again.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Product deletion response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }
      
      if (data.success) {
        // Remove the deleted product from state
        setProducts(products.filter(product => product._id !== productId));
        alert('✅ Product deleted successfully!');
      } else {
        throw new Error(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      alert(`Error: ${error.message || 'Failed to delete product'}`);
    }
  };
  
  // Handle applying for a role
  const handleApplyForRole = (role) => {
    console.log('handleApplyForRole called for role:', role);
    
    if (!currentUser) {
      alert('Please login to apply for this role');
      navigate('/login');
      return;
    }
    
    if (isCurrentUserFounder()) {
      alert('You cannot apply to your own startup');
      return;
    }
    
    setSelectedRole(role);
    setApplicationData({
      role: role,
      message: `I'm interested in applying for the ${role} position at ${profile.startupName}.`,
      experience: '',
      skills: currentUser.skills ? currentUser.skills.join(', ') : '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      resume: currentUser.resume || '',
      portfolio: ''
    });
    setShowApplicationModal(true);
  };
  
  // Submit application for role
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      if (!profile || !profile.userId) {
        alert('Cannot submit application: Founder profile not properly loaded');
        return;
      }
      
      // Send application data
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          founderId: profile.userId,
          role: selectedRole,
          message: applicationData.message,
          experience: applicationData.experience,
          skills: applicationData.skills,
          email: applicationData.email,
          phone: applicationData.phone,
          resume: applicationData.resume,
          portfolio: applicationData.portfolio,
          applicantType: currentUser.userType || 'student'
        })
      });
      
      const data = await response.json();
      console.log('Application submission response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit application');
      }
      
      if (data.success) {
        setShowApplicationModal(false);
        setApplicationData({
          role: '',
          message: '',
          experience: '',
          skills: '',
          email: '',
          phone: '',
          resume: '',
          portfolio: ''
        });
        alert('✅ Application submitted successfully! The founder will review your application.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(`Error: ${error.message || 'Failed to submit application'}`);
    }
  };
  
  // Handle product submission
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!isCurrentUserFounder()) {
      alert('Only the founder can add products');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const productData = {
        ...newProduct,
        tags: newProduct.tags.filter(tag => tag.trim() !== '')
      };
      
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add product');
      }
      
      if (data.success) {
        setProducts([...products, data.product]);
        setNewProduct({
          name: '',
          description: '',
          category: 'Software',
          status: 'Idea',
          url: '',
          tags: [],
          image: ''
        });
        setProductImagePreview(null);
        setTagInput('');
        setShowProductForm(false);
        alert('✅ Product added successfully!');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Product image upload handler
  const handleProductImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setProductImagePreview(base64Image);
        setNewProduct(prev => ({
          ...prev,
          image: base64Image
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Add tag to product
  const handleAddTag = () => {
    if (tagInput.trim() && !newProduct.tags.includes(tagInput.trim())) {
      setNewProduct(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  // Remove tag from product
  const handleRemoveTag = (tagToRemove) => {
    setNewProduct(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="founder-profile-container">
        <Header />
        <div className="founder-profile loading">
          <div className="spinner"></div>
          <p>Loading founder profile...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && !profile) {
    return (
      <div className="founder-profile-container">
        <Header />
        <div className="founder-profile error">
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <p>Please ensure the founder has completed their profile setup.</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }
  
  // Profile not found
  if (!profile) {
    return (
      <div className="founder-profile-container">
        <Header />
        <div className="founder-profile not-found">
          <h2>Founder Profile Not Found</h2>
          <p>The founder profile doesn't exist or has been removed.</p>
          <p>Founder ID: {founderId}</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }
  
  console.log('Rendering profile:', profile);
  console.log('Current user:', currentUser);
  console.log('Is current user founder?', isCurrentUserFounder());
  console.log('Can ask question?', canAskQuestion());
  console.log('Can apply for roles?', canApplyForRoles());
  
  return (
    <div className="founder-profile-container">
      <Header />
      <div className="founder-profile">
        {/* Header Section */}
        <div className="profile-header">
          <div className="header-content">
            <div className="avatar-section">
              {profile.profilePhoto || profile.profileImage ? (
                <img 
                  src={profile.profilePhoto || profile.profileImage} 
                  alt={profile.fullName} 
                  className="profile-avatar" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="avatar-placeholder">
                        ${profile.fullName ? profile.fullName.charAt(0) : 'F'}
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {profile.fullName ? profile.fullName.charAt(0) : 'F'}
                </div>
              )}
            </div>
            
            <div className="header-info">
              <h1 className="startup-name">{profile.startupName || 'Startup Name'}</h1>
              <p className="founder-name">by {profile.fullName || 'Founder'}</p>
              {profile.banasthaliId && (
                <p className="banasthali-id">{profile.banasthaliId}</p>
              )}
              
              <div className="status-badges">
                {profile.businessStage && (
                  <span className="badge business-stage">{profile.businessStage}</span>
                )}
                {profile.fundingStage && (
                  <span className="badge funding-stage">{profile.fundingStage}</span>
                )}
                {profile.hiring && <span className="badge hiring">🚀 Hiring</span>}
              </div>
            </div>
            
            <div className="header-actions">
              {isCurrentUserFounder() && (
                <button 
                  className="edit-btn"
                  onClick={() => navigate('/founder/setup')}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="profile-content">
  {/* Left Column - Main Info */}
  <div className="left-column">
    {/* Bio Section */}
    <section className="profile-section">
      <h2 
        className="section-title" 
        style={{
          color: '#191515ff',
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #0d2148ff'
        }}
      >
        About
      </h2>
      <div className="section-content">
        <p className="bio">{profile.bio || 'No bio provided yet.'}</p>
      </div>
    </section>

            {/* Products & Services Section */}
            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Products & Services</h2>
                {isCurrentUserFounder() && (
                  <button 
                    className="add-product-btn"
                    onClick={() => setShowProductForm(!showProductForm)}
                  >
                    {showProductForm ? 'Cancel' : '+ Add Product'}
                  </button>
                )}
              </div>
              
              {/* Product Form - Only for founder */}
              {showProductForm && isCurrentUserFounder() && (
                <form className="product-form" onSubmit={handleAddProduct}>
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Describe your product..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      >
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Service">Service</option>
                        <option value="App">App</option>
                        <option value="Website">Website</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={newProduct.status}
                        onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
                      >
                        <option value="Idea">Idea</option>
                        <option value="Prototype">Prototype</option>
                        <option value="Beta">Beta</option>
                        <option value="Launched">Launched</option>
                        <option value="Scaling">Scaling</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Product Image (Optional)</label>
                    <div className="image-upload">
                      <input
                        type="file"
                        id="product-image"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="product-image" style={{ cursor: 'pointer' }}>
                        {productImagePreview ? 'Change Image' : 'Upload Product Image'}
                      </label>
                      {productImagePreview && (
                        <div className="image-preview">
                          <img src={productImagePreview} alt="Preview" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Website URL (Optional)</label>
                    <input
                      type="url"
                      value={newProduct.url}
                      onChange={(e) => setNewProduct({...newProduct, url: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Tags</label>
                    <div className="tag-input-group">
                      <input
                        type="text"
                        placeholder="Add a tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddTag}
                      >
                        Add
                      </button>
                    </div>
                    {newProduct.tags.length > 0 && (
                      <div className="tags-container">
                        {newProduct.tags.map((tag, index) => (
                          <span key={index} className="tag">
                            {tag}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTag(tag)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    Add Product
                  </button>
                </form>
              )}
              
              {/* Products List */}
              <div className="products-grid">
                {products.length === 0 ? (
                  <p className="no-data">No products added yet</p>
                ) : (
                  products.map(product => (
                    <div key={product._id} className="product-card">
                      <div className="product-card-header">
                        <h4 className="product-name">{product.name}</h4>
                        {canDeleteProduct() && (
                          <button 
                            className="delete-product-btn"
                            onClick={() => handleDeleteProduct(product._id)}
                            title="Delete Product"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="product-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="product-image-placeholder">
                                📦
                              </div>
                            `;
                          }}
                        />
                      )}
                      <div className="product-content">
                        <p className="product-description">{product.description}</p>
                        
                        <div className="product-meta">
                          <span className="product-category">{product.category}</span>
                          <span className="product-status">{product.status}</span>
                        </div>
                        
                        {product.tags && product.tags.length > 0 && (
                          <div className="product-tags">
                            {product.tags.map((tag, idx) => (
                              <span key={idx} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {product.url && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer" className="product-link">
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Questions & Answers Section - FIXED: Always show login button for non-logged-in users */}
            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Questions & Answers</h2>
                
                {/* Always show button - either "Ask Question" or "Login to Ask" */}
                {currentUser ? (
                  canAskQuestion() && (
                    <button 
                      className="ask-question-btn"
                      onClick={() => setShowQuestionForm(!showQuestionForm)}
                    >
                      {showQuestionForm ? 'Cancel' : 'Ask Question'}
                    </button>
                  )
                ) : (
                  <button 
                    className="ask-question-btn login-required"
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  >
                    Login to Ask Question
                  </button>
                )}
              </div>
              
              {/* Question Form - Only for logged-in non-founders */}
              {showQuestionForm && currentUser && canAskQuestion() && (
                <form className="question-form" onSubmit={handleAskQuestion}>
                  <div className="form-group">
                    <label>Your Question *</label>
                    <textarea
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                      placeholder="Ask a question about their startup, experience, or advice..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={newQuestion.category}
                        onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                      >
                        <option value="General">General</option>
                        <option value="Business">Business</option>
                        <option value="Technology">Technology</option>
                        <option value="Funding">Funding</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Career">Career</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newQuestion.anonymous}
                          onChange={(e) => setNewQuestion({...newQuestion, anonymous: e.target.checked})}
                        />
                        Ask anonymously
                      </label>
                    </div>
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    Submit Question
                  </button>
                </form>
              )}
              
              <div className="questions-list">
                {questions.length === 0 ? (
                  <div className="no-questions">
                    <p className="no-data">No questions yet. Be the first to ask!</p>
                    {!currentUser && (
                      <button 
                        className="login-to-ask-btn"
                        onClick={() => navigate('/login', { state: { from: location.pathname } })}
                      >
                        Login to Ask a Question
                      </button>
                    )}
                  </div>
                ) : (
                  questions.map(q => (
                    <div key={q._id} className="question-item">
                      <div className="question-header">
                        <div className="questioner-info">
                          {q.anonymous ? (
                            <span className="questioner">Anonymous {q.askedBy?.userType || 'User'}</span>
                          ) : (
                            <span className="questioner">
                              {q.askedBy?.fullName || 'User'} 
                              {q.askedBy?.userType === 'founder' && ' (Founder)'}
                            </span>
                          )}
                          <span className="question-category">{q.category}</span>
                        </div>
                        
                        <div className="question-actions">
                          <span className="question-time">
                            {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                          
                          {canManageQuestion(q) && (
                            <div className="question-management">
                              {isCurrentUserAdmin() && (
                                <button 
                                  className="edit-question-btn"
                                  onClick={() => handleEditQuestion(q._id)}
                                >
                                  Edit
                                </button>
                              )}
                              <button 
                                className="delete-question-btn"
                                onClick={() => handleDeleteQuestion(q._id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="question-text">{q.question}</p>
                      
                      {q.isAnswered ? (
                        <div className="answer-section">
                          <div className="answer-header">
                            <strong>Answer from {profile.fullName}:</strong>
                            <span className="answer-time">
                              Answered on {new Date(q.answeredAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="answer-text">{q.answer}</p>
                        </div>
                      ) : isCurrentUserFounder() ? (
                        <div className="answer-form">
                          <textarea
                            placeholder="Type your answer..."
                            rows={2}
                            id={`answer-${q._id}`}
                          />
                          <button 
                            className="answer-btn"
                            onClick={() => {
                              const answer = document.getElementById(`answer-${q._id}`).value;
                              if (answer.trim()) {
                                handleAnswerQuestion(q._id, answer);
                              }
                            }}
                          >
                            Answer
                          </button>
                        </div>
                      ) : (
                        <p className="waiting-answer">
                          ⏳ Waiting for answer...
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Side Info */}
          <div className="right-column">
            {/* Looking For Section - FIXED: Show Apply buttons for all logged-in non-founders */}
            {profile.lookingFor && profile.lookingFor.length > 0 && (
              <section className="info-card">
                <h3 className="card-title">Looking For</h3>
                <div className="looking-for-list">
                  {profile.lookingFor.map((item, index) => (
                    <div key={index} className="role-item">
                      <div className="role-item-content">
                        <span className="role-text">{item}</span>
                        <div className="role-actions">
                          {/* Show Apply button for all logged-in users who are NOT the current founder */}
                          {currentUser && !isCurrentUserFounder() && (
                            <button 
                              className="apply-role-btn"
                              onClick={() => handleApplyForRole(item)}
                            >
                              Apply
                            </button>
                          )}
                          
                          {/* Show Login button for non-logged-in users */}
                          {!currentUser && (
                            <button 
                              className="apply-role-btn login-required"
                              onClick={() => {
                                navigate('/login', { state: { from: location.pathname } });
                              }}
                            >
                              Login to Apply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills Section */}
            {profile.skills && profile.skills.length > 0 && (
              <section className="info-card">
                <h3 className="card-title">Skills</h3>
                <div className="tags-container">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Interests Section */}
            {profile.interests && profile.interests.length > 0 && (
              <section className="info-card">
                <h3 className="card-title">Interests</h3>
                <div className="tags-container">
                  {profile.interests.map((interest, index) => (
                    <span key={index} className="interest-tag">
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Contact Info */}
            <section className="info-card">
              <h3 className="card-title">Contact</h3>
              <div className="card-content">
                {profile.email && (
                  <p className="contact-item">
                    <span className="contact-label">Email:</span>
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </p>
                )}
                
                {profile.phone && (
                  <p className="contact-item">
                    <span className="contact-label">Phone:</span>
                    <span>{profile.phone}</span>
                  </p>
                )}
                
                {profile.linkedin && (
                  <p className="contact-item">
                    <span className="contact-label">LinkedIn:</span>
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                      View Profile
                    </a>
                  </p>
                )}
                
                {profile.website && (
                  <p className="contact-item">
                    <span className="contact-label">Website:</span>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                      Visit Site
                    </a>
                  </p>
                )}
                
                <p className="contact-item">
                  <span className="contact-label">Location:</span>
                  <span>{profile.location || 'Banasthali Vidyapith'}</span>
                </p>
              </div>
            </section>

            {/* Hiring Info - FIXED: Show Apply Now button for all logged-in non-founders */}
            {profile.hiring && (
              <section className="info-card hiring-card">
                <h3 className="card-title">🚀 Currently Hiring</h3>
                <div className="card-content">
                  <p>{profile.hiringDetails || 'Looking for talented individuals to join the team!'}</p>
                  
                  {/* Show Apply Now button for all logged-in users who are NOT the current founder */}
                  {currentUser && !isCurrentUserFounder() && (
                    <button 
                      className="apply-now-btn"
                      onClick={() => handleApplyForRole('General Position')}
                    >
                      Apply Now
                    </button>
                  )}
                  
                  {/* Show Login button for non-logged-in users */}
                  {!currentUser && (
                    <button 
                      className="apply-now-btn"
                      onClick={() => {
                        navigate('/login', { state: { from: location.pathname } });
                      }}
                    >
                      Login to Apply
                    </button>
                  )}
                </div>
              </section>
            )}
            
            {/* View Applications Button (for founder only) */}
            {isCurrentUserFounder() && (
              <section className="info-card">
                <h3 className="card-title">📋 Manage Applications</h3>
                <div className="card-content">
                  <p>View and manage applications for your open positions.</p>
                  <button 
                    className="view-applications-btn"
                    onClick={() => navigate(`/founder/applications/${profile.userId || profile._id}`)}
                  >
                    View Applications
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Application Modal */}
        {showApplicationModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Apply for {selectedRole}</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowApplicationModal(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitApplication}>
                <div className="form-group">
                  <label>Your Message *</label>
                  <textarea
                    value={applicationData.message}
                    onChange={(e) => setApplicationData({...applicationData, message: e.target.value})}
                    placeholder="Why are you interested in this role? What can you bring to the startup?"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Relevant Experience</label>
                  <textarea
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData({...applicationData, experience: e.target.value})}
                    placeholder="Describe your relevant experience, projects, or achievements..."
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label>Skills *</label>
                  <input
                    type="text"
                    value={applicationData.skills}
                    onChange={(e) => setApplicationData({...applicationData, skills: e.target.value})}
                    placeholder="Your skills (comma separated)"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={applicationData.email}
                      onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Resume URL (Optional)</label>
                  <input
                    type="url"
                    value={applicationData.resume}
                    onChange={(e) => setApplicationData({...applicationData, resume: e.target.value})}
                    placeholder="Link to your resume"
                  />
                </div>
                
                <div className="form-group">
                  <label>Portfolio/Website (Optional)</label>
                  <input
                    type="url"
                    value={applicationData.portfolio}
                    onChange={(e) => setApplicationData({...applicationData, portfolio: e.target.value})}
                    placeholder="Link to your portfolio or projects"
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="submit" className="submit-btn">
                    Submit Application
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowApplicationModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FounderProfile;