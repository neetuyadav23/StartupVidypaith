import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Header from "../../Components/Header/Header.jsx";
import Footer from "../../Components/Footer/Footer.jsx";
import { API_BASE_URL } from "../../constants";
import "./BlogDetail.css";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBlogDetails();
  }, [id]);

  const fetchBlogDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE_URL}/blogs/${id}`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch blog: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.blog) {
        setBlog(data.blog);
        setIsLiked(data.blog.isLiked || false);
        setLikeCount(data.blog.likesCount || 0);
        setComments(data.blog.comments || []);
        
        if (data.blog.category) {
          fetchRelatedBlogs(data.blog.category, id);
        }
      } else {
        throw new Error(data.error || "Failed to load blog");
      }
    } catch (err) {
      console.error("Error fetching blog details:", err);
      setError(err.message || "Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (category, currentBlogId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/blogs?category=${category}&limit=4`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.blogs) {
          const filteredBlogs = data.blogs
            .filter(blog => blog._id !== currentBlogId)
            .slice(0, 3);
          setRelatedBlogs(filteredBlogs);
        }
      }
    } catch (err) {
      console.error("Error fetching related blogs:", err);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setLiking(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/blogs/${id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to like blog");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        setLikeCount(data.likesCount);
      }
    } catch (err) {
      console.error("Error liking blog:", err);
      alert("Error liking blog. Please try again.");
    } finally {
      setLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/blogs/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComment("");
          fetchBlogDetails(); // refresh comments
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Error posting comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/blogs/${id}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchBlogDetails();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Error deleting comment. Please try again.");
    }
  };

  const handlePublishDraft = async () => {
    if (!window.confirm("Publish this draft? It will become visible to everyone.")) return;
    setPublishing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/blogs/${id}/publish`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Blog published successfully!");
        fetchBlogDetails(); // refresh to show published status
      } else {
        const data = await response.json();
        alert(data.error || "Failed to publish");
      }
    } catch (err) {
      console.error(err);
      alert("Error publishing blog");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!window.confirm("Delete this blog permanently? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Blog deleted successfully.");
        navigate("/blogs");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete blog");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting blog");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => alert("Link copied to clipboard!"))
      .catch(err => console.error("Failed to copy:", err));
  };

  if (loading) {
    return (
      <div className="blog-detail-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading blog post...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-detail-page">
        <Header />
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Blog</h3>
          <p>{error}</p>
          <button className="back-button" onClick={() => navigate("/blogs")}>
            Back to Blogs
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-detail-page">
        <Header />
        <div className="not-found-container">
          <div className="not-found-icon">📝</div>
          <h3>Blog Not Found</h3>
          <p>The blog post you're looking for doesn't exist or has been removed.</p>
          <button className="back-button" onClick={() => navigate("/blogs")}>
            Browse All Blogs
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.type === 'admin' || user?.userType === 'admin';
  const canPublish = !blog.isPublished && (user && (user._id === blog.author?._id || isAdmin));
  const canDelete = user && (user._id === blog.author?._id || isAdmin);

  return (
    <div className="blog-detail-page">
      <Header />
      
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="hero-content">
          <div className="blog-category-tag">{blog.category}</div>
          
          {/* Blog Featured Image */}
          {blog.image && (
            <div className="blog-featured-image">
              <img src={blog.image} alt={blog.title} className="featured-img" />
            </div>
          )}
          
          <h1 className="blog-title">{blog.title}</h1>
          <p className="blog-excerpt">{blog.excerpt}</p>
          
          <div className="blog-meta-large">
            <div className="author-info-large">
              <div>
                <div className="author-name-large">
                  {blog.author?.fullName || blog.authorName || "Anonymous Author"}
                </div>
                <div className="author-startup">
                  {blog.author?.startupName || blog.startupName || "Startup Community"}
                </div>
              </div>
            </div>
            
            <div className="meta-stats">
              <div className="meta-stat">
                <span className="stat-icon">📅</span>
                <span>{formatDate(blog.createdAt)}</span>
              </div>
              <div className="meta-stat">
                <span className="stat-icon">⏱️</span>
                <span>{blog.readTime || 5} min read</span>
              </div>
              <div className="meta-stat">
                <span className="stat-icon">👁️</span>
                <span>{blog.views || 0} views</span>
              </div>
              <div className="meta-stat">
                <span className="stat-icon">❤️</span>
                <span>{likeCount} likes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="blog-content-section">
        <div className="container">
          <div className="blog-content-wrapper">
            <div className="blog-main-content">
              {/* Action Buttons */}
              <div className="blog-actions">
                <button 
                  className={`like-button ${isLiked ? 'liked' : ''} ${liking ? 'loading' : ''}`}
                  onClick={handleLike}
                  disabled={liking || !isAuthenticated}
                >
                  <span className="action-icon">
                    {liking ? '⏳' : (isLiked ? '❤️' : '🤍')}
                  </span>
                  <span>{likeCount} {liking ? 'Updating...' : 'Likes'}</span>
                </button>
                
                <button className="share-button" onClick={handleShare}>
                  <span className="action-icon">🔗</span>
                  <span>Share</span>
                </button>

                {(user && (user._id === blog.author?._id || isAdmin)) && (
                  <Link to={`/blog/edit/${blog._id}`} className="edit-button">
                    <span className="action-icon">✏️</span>
                    <span>Edit</span>
                  </Link>
                )}

                {canPublish && (
                  <button 
                    className="publish-draft-btn" 
                    onClick={handlePublishDraft}
                    disabled={publishing}
                  >
                    {publishing ? "Publishing..." : "Publish Draft"}
                  </button>
                )}

                {canDelete && (
                  <button 
                    className="delete-button" 
                    onClick={handleDeleteBlog}
                    disabled={deleting}
                  >
                    <span className="action-icon">🗑️</span>
                    <span>{deleting ? "Deleting..." : "Delete"}</span>
                  </button>
                )}
              </div>

              {/* Blog Content */}
              <article className="blog-article">
                <div 
                  className="blog-content"
                  dangerouslySetInnerHTML={{ 
                    __html: blog.content || "<p>No content available</p>" 
                  }}
                />
              </article>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="blog-tags">
                  {blog.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comments Section */}
              <div className="comments-section">
                <h3 className="comments-title">
                  💬 Comments ({comments.length})
                </h3>

                {isAuthenticated ? (
                  <form className="comment-form" onSubmit={handleCommentSubmit}>
                    <textarea
                      className="comment-input"
                      placeholder="Share your thoughts..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows="3"
                    />
                    <div className="comment-form-actions">
                      <button 
                        type="submit" 
                        className="submit-comment-btn"
                        disabled={!comment.trim()}
                      >
                        Post Comment
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="login-prompt">
                    <p>Please <Link to="/login">login</Link> to leave a comment.</p>
                  </div>
                )}

                <div className="comments-list">
                  {comments.length === 0 ? (
                    <div className="no-comments">
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id || comment.createdAt} className="comment-card">
                        <div className="comment-header">
                          <div className="comment-author">
                            <div>
                              <div className="comment-author-name">
                                {comment.user?.fullName || comment.userName || "Anonymous"}
                              </div>
                              <div className="comment-date">
                                {formatDate(comment.createdAt)}
                              </div>
                            </div>
                          </div>
                          
                          {user && (user._id === comment.user?._id || isAdmin) && (
                            <button
                              className="delete-comment-btn"
                              onClick={() => handleDeleteComment(comment._id)}
                              title="Delete comment"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <div className="comment-content">{comment.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="blog-sidebar">
              {relatedBlogs.length > 0 && (
                <div className="sidebar-section">
                  <h4 className="sidebar-title">📚 Related Blogs</h4>
                  <div className="related-blogs">
                    {relatedBlogs.map((relatedBlog) => (
                      <Link
                        key={relatedBlog._id}
                        to={`/blog/${relatedBlog._id}`}
                        className="related-blog-card"
                      >
                        <div className="related-blog-content">
                          <h5 className="related-blog-title">{relatedBlog.title}</h5>
                          <p className="related-blog-excerpt">
                            {relatedBlog.excerpt?.substring(0, 100)}...
                          </p>
                          <div className="related-blog-meta">
                            <span className="related-blog-category">{relatedBlog.category}</span>
                            <span className="related-blog-date">
                              {formatDate(relatedBlog.createdAt)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="sidebar-section">
                <h4 className="sidebar-title">✍️ About the Author</h4>
                <div className="author-sidebar-info">
                  <div className="author-sidebar-details">
                    <div className="author-sidebar-name">
                      {blog.author?.fullName || blog.authorName || "Anonymous"}
                    </div>
                    <div className="author-sidebar-startup">
                      {blog.author?.startupName || blog.startupName || "Startup Community"}
                    </div>
                    <div className="author-sidebar-bio">
                      Passionate about sharing knowledge and experiences.
                    </div>
                  </div>
                </div>
              </div>

              <div className="sidebar-section">
                <h4 className="sidebar-title">🏷️ Category</h4>
                <div className="category-info">
                  <div className="category-badge">{blog.category}</div>
                  <p className="category-description">
                    {blog.category === "Technology" && "Latest tech trends, tools, and innovations"}
                    {blog.category === "Business" && "Business strategies, funding, and growth"}
                    {blog.category === "Marketing" && "Marketing strategies and customer acquisition"}
                    {blog.category === "Funding" && "Fundraising, investment, and financial management"}
                    {blog.category === "Startup Stories" && "Real stories from startup founders and teams"}
                    {blog.category === "Product Development" && "Product design, development, and management"}
                    {blog.category === "Growth Hacking" && "Growth strategies and user acquisition"}
                    {blog.category === "Leadership" && "Leadership, team building, and management"}
                    {blog.category === "Other" && "Various topics and discussions"}
                  </p>
                </div>
              </div>

              <div className="sidebar-section">
                <h4 className="sidebar-title">📤 Share This Blog</h4>
                <div className="share-options">
                  <button className="share-option" onClick={handleShare}>
                    <span className="share-icon">🔗</span>
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="blog-cta-section">
        <div className="container">
          <div className="cta-content">
            <h3>Want to share your own story?</h3>
            <p>Join our community and share your experiences.</p>
            {isAuthenticated ? (
              <Link to="/blog/create" className="cta-button">Write a Blog Post</Link>
            ) : (
              <Link to="/register" className="cta-button">Join Our Community</Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogDetail;