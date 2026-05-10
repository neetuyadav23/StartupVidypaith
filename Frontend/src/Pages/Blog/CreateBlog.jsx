import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Header from "../../Components/Header/Header.jsx";
import { API_BASE_URL } from "../../constants";
import "./CreateBlog.css";

const CreateBlog = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [canEditBlog, setCanEditBlog] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Technology",
    tags: [],
    readTime: 5,
    isPublished: true,
    image: ""
  });
  
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (id) {
      setIsEditing(true);
      fetchBlogForEdit();
    }
  }, [id, isAuthenticated, user, navigate]);

  const fetchBlogForEdit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`${API_BASE_URL}/blogs/${id}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to load blog: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.blog) {
        throw new Error("Blog not found");
      }
      
      const isAdmin = user?.role === 'admin' || user?.type === 'admin';
      const isBlogAuthor = data.blog.author?._id === user?._id || 
                          data.blog.author === user?._id;
      
      const canEdit = isAdmin || isBlogAuthor;
      
      if (!canEdit) {
        setError("You don't have permission to edit this blog");
        setLoading(false);
        return;
      }
      
      setCanEditBlog(true);
      
      setFormData({
        title: data.blog.title || "",
        excerpt: data.blog.excerpt || "",
        content: data.blog.content || "",
        category: data.blog.category || "Technology",
        tags: data.blog.tags || [],
        readTime: data.blog.readTime || 5,
        isPublished: data.blog.isPublished !== undefined ? data.blog.isPublished : true,
        image: data.blog.image || ""
      });
      
      if (data.blog.image) {
        setImagePreview(data.blog.image);
      }
      
    } catch (err) {
      console.error("❌ Error fetching blog for edit:", err);
      setError("Failed to load blog: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContentChange = (e) => {
    setFormData(prev => ({
      ...prev,
      content: e.target.value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file (JPEG, PNG, etc.)");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData(prev => ({ ...prev, image: base64String }));
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: "" }));
    setImagePreview(null);
  };

  const handleTagInput = (e) => {
    setTagInput(e.target.value);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e, saveAsDraft = false) => {
    e.preventDefault();
    
    if (loading) return;
    
    // Validation
    if (!formData.title.trim()) {
      setError("Blog title is required");
      return;
    }
    
    // 🔥 CHANGED: minimum content length from 100 to 10 characters for publishing
    if (!saveAsDraft && (!formData.content.trim() || formData.content.length < 10)) {
      setError("Blog content must be at least 10 characters to publish");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const token = localStorage.getItem("token");
      
      const url = isEditing ? 
        `${API_BASE_URL}/blogs/${id}` : 
        `${API_BASE_URL}/blogs`;
      
      const method = isEditing ? "PUT" : "POST";
      
      const requestData = {
        ...formData,
        isPublished: saveAsDraft ? false : formData.isPublished
      };
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `Server error: ${response.status}`);
      }
      
      if (data.success && data.blog) {
        const blogId = data.blog._id;
        
        console.log(`✅ Blog ${isEditing ? 'updated' : 'created'} successfully. ID: ${blogId}`);
        
        if (saveAsDraft) {
          setSuccessMessage("Draft saved successfully!");
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setSuccessMessage(isEditing ? "Blog updated and published!" : "Blog published successfully!");
          setSuccess(true);
          
          if (!isEditing) {
            setFormData({
              title: "",
              excerpt: "",
              content: "",
              category: "Technology",
              tags: [],
              readTime: 5,
              isPublished: true,
              image: ""
            });
            setImagePreview(null);
          }
          
          setTimeout(() => {
            if (blogId) {
              navigate(`/blog/${blogId}`);
            } else {
              navigate("/blogs");
            }
          }, 1500);
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error(`❌ Error ${isEditing ? 'updating' : 'creating'} blog:`, err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} blog. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = (e) => handleSubmit(e, false);
  const handleSaveDraft = (e) => handleSubmit(e, true);

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
      navigate(-1);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading && isEditing && !canEditBlog) {
    return (
      <div className="create-blog-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking edit permissions...</p>
        </div>
      </div>
    );
  }

  if (isEditing && !loading && !canEditBlog && error) {
    return (
      <div className="create-blog-page">
        <Header />
        <div className="permission-denied">
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button onClick={() => navigate(`/blog/${id}`)} className="back-btn">
            View Blog
          </button>
          <button onClick={() => navigate("/blogs")} className="back-btn">
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-blog-page">
      <Header />
      
      <div className="create-blog-container">
        <div className="create-blog-header">
          <h1>{isEditing ? "Edit Blog Post" : "Create New Blog Post"}</h1>
          <p className="subtitle">
            {isEditing 
              ? "Update your blog post and share your insights with the community."
              : "Share your experiences, insights, and knowledge with our community."
            }
          </p>
        </div>

        {success && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <div>
              <h3>Success!</h3>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <div className="error-icon">❌</div>
            <div>
              <h3>Error</h3>
              <p>{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="dismiss-error-btn"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handlePublish} className="blog-form">
          {/* Blog Image Upload Field */}
          <div className="form-group">
            <label className="form-label">
              Blog Cover Image (Optional)
            </label>
            <div className="image-upload-container">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Blog cover preview" className="preview-img" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="remove-image-btn"
                    disabled={loading}
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="blogImage"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleImageUpload}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="blogImage" className="upload-label">
                    <span className="upload-icon">🖼️</span>
                    <span>Click to upload cover image</span>
                    <span className="upload-hint">JPEG, PNG, WebP (max 2MB)</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Blog Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a compelling title for your blog"
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="excerpt" className="form-label">
              Short Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              placeholder="Write a brief summary of your blog (appears in blog listings)"
              className="form-textarea excerpt"
              rows="3"
              disabled={loading}
            />
            <div className="form-hint">
              {formData.excerpt.length}/300 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="form-select"
              disabled={loading}
            >
              <option value="Technology">Technology</option>
              <option value="Business">Business</option>
              <option value="Marketing">Marketing</option>
              <option value="Funding">Funding</option>
              <option value="Leadership">Leadership</option>
              <option value="Product Development">Product Development</option>
              <option value="Growth Hacking">Growth Hacking</option>
              <option value="Startup Stories">Startup Stories</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Tags
            </label>
            <div className="tags-input-container">
              <div className="tags-input-wrapper">
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tags (press Enter to add)"
                  className="form-input tag-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="add-tag-btn"
                  disabled={loading || !tagInput.trim()}
                >
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="tags-display">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag-item">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="remove-tag"
                        disabled={loading}
                        aria-label={`Remove ${tag} tag`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="form-hint">
              Add relevant tags to help users discover your blog
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="readTime" className="form-label">
              Estimated Read Time (minutes)
            </label>
            <div className="read-time-input">
              <input
                type="range"
                id="readTime"
                name="readTime"
                value={formData.readTime}
                onChange={handleInputChange}
                min="1"
                max="60"
                className="form-range"
                disabled={loading}
              />
              <div className="read-time-display">
                <span className="read-time-value">{formData.readTime} minute{formData.readTime !== 1 ? 's' : ''}</span>
                <span className="read-time-hint">(1-60 minutes)</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Blog Content * {!isEditing && "(min 10 characters for publishing)"}
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Write your blog content here..."
              className="form-textarea content-textarea"
              rows="15"
              required
              disabled={loading}
            />
            <div className="form-hint">
              <span>Characters: {formData.content.length}</span>
              <span>Words: {formData.content.trim().split(/\s+/).filter(Boolean).length}</span>
              {!isEditing && <span>Minimum for publish: 10 characters</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span>Publish immediately</span>
            </label>
            <div className="form-hint">
              Uncheck to save as draft (can be published later)
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            
            <div className="action-buttons">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="save-draft-btn"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save as Draft"}
              </button>
              
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || (!isEditing && formData.content.length < 10)}
              >
                {loading 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Blog" : "Publish Blog")
                }
              </button>
            </div>
          </div>
        </form>

        <div className="tips-section">
          <h3>💡 Writing Tips</h3>
          <ul className="tips-list">
            <li><strong>Start with a compelling introduction</strong> - Hook your readers in the first paragraph</li>
            <li><strong>Use short paragraphs and clear headings</strong> - Improve readability</li>
            <li><strong>Include personal stories and experiences</strong> - Make it relatable</li>
            <li><strong>Add actionable insights and takeaways</strong> - Provide value to readers</li>
            <li><strong>Use examples and case studies</strong> - Concrete examples help understanding</li>
            <li><strong>End with a strong conclusion</strong> - Summarize key points</li>
            <li><strong>Include a call-to-action</strong> - Encourage comments or sharing</li>
            <li><strong>Proofread before publishing</strong> - Check for typos and grammar</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateBlog;