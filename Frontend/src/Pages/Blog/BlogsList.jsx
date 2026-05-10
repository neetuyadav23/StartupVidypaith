import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Header from "../../Components/Header/Header.jsx";
import { API_BASE_URL } from "../../constants";
import "./BlogsList.css";

const BlogsList = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("trending");
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const categories = [
    "All", "Technology", "Business", "Lifestyle", "Education", "Startup Stories"
  ];

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    filterAndSortBlogs();
  }, [searchTerm, selectedCategory, sortBy, blogs]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/blogs`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      let blogsData = [];
      if (data && data.success && data.data) blogsData = data.data;
      else if (Array.isArray(data)) blogsData = data;
      else if (data && data.blogs) blogsData = data.blogs;
      else blogsData = data.data || data.blogs || [];
      
      if (!Array.isArray(blogsData)) blogsData = [];
      setBlogs(blogsData);
      setFilteredBlogs(blogsData);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError(err.message || "Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBlogs = () => {
    if (!blogs || !Array.isArray(blogs)) {
      setFilteredBlogs([]);
      return;
    }
    let filtered = [...blogs];
    
    if (selectedCategory !== "All") {
      filtered = filtered.filter(blog => blog && blog.category === selectedCategory);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(blog => {
        if (!blog) return false;
        const titleMatch = blog.title && blog.title.toLowerCase().includes(term);
        const excerptMatch = blog.excerpt && blog.excerpt.toLowerCase().includes(term);
        const authorMatch = blog.author?.fullName && blog.author.fullName.toLowerCase().includes(term);
        const tagsMatch = blog.tags && blog.tags.some(tag => tag && tag.toLowerCase().includes(term));
        return titleMatch || excerptMatch || authorMatch || tagsMatch;
      });
    }
    
    filtered.sort((a, b) => {
      if (!a || !b) return 0;
      switch (sortBy) {
        case "trending": return (b.trendingScore || 0) - (a.trendingScore || 0);
        case "newest": return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest": return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "popular": return (b.views || 0) - (a.views || 0);
        case "most-liked": return (b.likesCount || 0) - (a.likesCount || 0);
        default: return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
    setFilteredBlogs(filtered);
  };

  const handleCreateBlog = () => {
    if (!isAuthenticated) navigate("/login");
    else navigate("/blog/create");
  };

  const handlePublishDraft = async (blogId) => {
    if (!window.confirm("Publish this draft? It will become visible to everyone.")) return;
    setPublishingId(blogId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/publish`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Blog published successfully!");
        fetchBlogs();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to publish");
      }
    } catch (err) {
      console.error(err);
      alert("Error publishing blog");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm("Delete this blog permanently? This action cannot be undone.")) return;
    setDeletingId(blogId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Blog deleted successfully.");
        fetchBlogs();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete blog");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting blog");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch {
      return "Invalid date";
    }
  };

  const isAdmin = user?.role === 'admin' || user?.type === 'admin' || user?.userType === 'admin';

  if (loading) {
    return (
      <div className="blogs-page">
        <Header />
        <div className="loading-container">Loading blogs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blogs-page">
        <Header />
        <div className="error-container">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="blogs-page">
      <Header />
      
      <section className="blogs-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Startup Insights & Stories</h1>
            <p className="hero-subtitle">
              Learn from fellow founders, discover new trends, and share your journey
            </p>
            {isAuthenticated && (user?.type === 'founder' || user?.userType === 'founder') && (
              <button className="create-blog-btn" onClick={handleCreateBlog}>
                ✍️ Write a Blog
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="blogs-main">
        <div className="container">
          <div className="blogs-controls">
            <div className="categories-filter">
              <div className="categories-label">Categories:</div>
              <div className="categories-list">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="sort-controls">
              <label htmlFor="sort">Sort by:</label>
              <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="trending">Trending 🔥</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
                <option value="most-liked">Most Liked</option>
              </select>
            </div>
          </div>

          <div className="results-info">
            <p>Showing {filteredBlogs.length} of {blogs.length} blog posts</p>
          </div>

          {filteredBlogs.length === 0 ? (
            <div className="no-results">No blogs found</div>
          ) : (
            <div className="blogs-grid">
              {filteredBlogs.map((blog) => {
                const isDraft = blog.isPublished === false;
                const canPublish = isAuthenticated && (blog.author?._id === user?._id || isAdmin);
                const canDelete = isAuthenticated && (blog.author?._id === user?._id || isAdmin);
                return (
                  <div key={blog._id} className="blog-card">
                    {blog.image && (
                      <div className="blog-card-img">
                        <img src={blog.image} alt={blog.title} />
                      </div>
                    )}
                    
                    <div className="blog-card-content">
                      <div className="blog-category">{blog.category || "Uncategorized"}</div>
                      <h3 className="blog-card-title">{blog.title}</h3>
                      {isDraft && <span className="draft-badge">Draft</span>}
                      
                      <p className="blog-card-excerpt">
                        {blog.excerpt ? `${blog.excerpt.substring(0, 120)}...` : "No excerpt available"}
                      </p>
                      
                      <div className="blog-card-author">
                        <div className="author-name">{blog.author?.fullName || "Anonymous"}</div>
                        <div className="author-startup">{blog.author?.startupName || "Startup Community"}</div>
                      </div>
                      
                      {/* Meta info */}
                      <div className="blog-card-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0', fontSize: '0.85rem', color: '#7f8c8d' }}>
                        <span>📅 {formatDate(blog.createdAt)}</span>
                        <span>⏱️ {blog.readTime || 5} min read</span>
                        <span>👁️ {blog.views || 0} views</span>
                        <span>❤️ {blog.likesCount || 0} likes</span>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="blog-card-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link to={`/blog/${blog._id}`} style={{ background: '#3498db', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none' }}>
                          Read More →
                        </Link>
                        {canPublish && isDraft && (
                          <button 
                            className="publish-draft-btn" 
                            onClick={() => handlePublishDraft(blog._id)}
                            disabled={publishingId === blog._id}
                            style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            {publishingId === blog._id ? "Publishing..." : "Publish Draft"}
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="delete-blog-btn" 
                            onClick={() => handleDeleteBlog(blog._id)}
                            disabled={deletingId === blog._id}
                            style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            {deletingId === blog._id ? "Deleting..." : "🗑️ Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BlogsList;