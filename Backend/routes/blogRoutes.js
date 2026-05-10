const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect } = require('../middleware/authMiddleware.js');

// Debug middleware
router.use((req, res, next) => {
  console.log(`📝 Blog API: ${req.method} ${req.url}`);
  console.log('User:', req.user ? req.user._id : 'No user');
  next();
});

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
      sort = '-createdAt'
    } = req.query;

    const query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: {
        path: 'author',
        select: 'fullName startupName'
      }
    };

    console.log('🔍 Querying blogs with:', { query, options });

    const blogs = await Blog.paginate(query, options);

    res.json({
      success: true,
      count: blogs.totalDocs,
      totalPages: blogs.totalPages,
      currentPage: blogs.page,
      blogs: blogs.docs
    });
  } catch (error) {
    console.error('❌ Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Fetching blog with ID:', req.params.id);
    
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid blog ID format'
      });
    }

    const blog = await Blog.findById(req.params.id)
      .populate('author', 'fullName startupName')
      .populate('likes', 'fullName');

    console.log('Blog found:', !!blog);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    let isLiked = false;
    if (req.user && blog.likes) {
      const userLike = blog.likes.some(like => {
        if (like._id) {
          return like._id.toString() === req.user._id.toString();
        }
        return like.toString() === req.user._id.toString();
      });
      isLiked = !!userLike;
      console.log('User liked blog?', isLiked, 'User ID:', req.user._id);
    }

    blog.views += 1;
    await blog.save();

    const blogObject = blog.toObject ? blog.toObject() : blog;
    blogObject.isLiked = isLiked;
    blogObject.likesCount = blog.likes ? blog.likes.length : 0;
    blogObject.commentsCount = blog.comments ? blog.comments.length : 0;

    console.log('✅ Successfully returning blog');
    
    res.json({
      success: true,
      blog: blogObject
    });
  } catch (error) {
    console.error('❌ Error fetching blog:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// @desc    Create a blog - ALLOW ALL AUTHENTICATED USERS
// @route   POST /api/blogs
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    console.log('User creating blog:', req.user);
    
    const blogData = {
      ...req.body,
      author: req.user._id,
      authorName: req.user.fullName || req.user.name || 'Anonymous',
      startupName: req.user.startupName || req.user.company || 'Not specified'
    };

    console.log('Creating blog with data:', blogData);
    
    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Unable to create blog'
    });
  }
});

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (User can edit own blog, Admin can edit any blog)
router.put('/:id', protect, async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    const isAdmin = req.user.role === 'admin' || req.user.type === 'admin' || req.user.userType === 'admin';
    const isAuthor = blog.author.toString() === req.user._id.toString();
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this blog'
      });
    }

    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'fullName startupName');

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Unable to update blog'
    });
  }
});

// 🔥 UPDATED DELETE ROUTE (as requested)
router.delete('/:id', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    
    const isAdmin = req.user.userType === 'admin';
    const isAuthor = blog.author.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ error: 'You are not allowed to delete this blog' });
    }
    
    await blog.deleteOne();
    res.json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Like/Unlike a blog - ALLOW ALL AUTHENTICATED USERS
// @route   POST /api/blogs/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    console.log('❤️ Like request for blog ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    let alreadyLiked = false;
    
    if (blog.likes && blog.likes.length > 0) {
      alreadyLiked = blog.likes.some(like => {
        if (like._id) {
          return like._id.toString() === req.user._id.toString();
        }
        return like.toString() === req.user._id.toString();
      });
    }

    console.log('Already liked?', alreadyLiked);

    if (alreadyLiked) {
      blog.likes = blog.likes.filter(like => {
        if (like._id) {
          return like._id.toString() !== req.user._id.toString();
        }
        return like.toString() !== req.user._id.toString();
      });
    } else {
      blog.likes.push(req.user._id);
    }

    blog.likesCount = blog.likes.length;
    await blog.save();

    console.log('✅ Like updated successfully');
    console.log('New likes count:', blog.likesCount);

    res.json({
      success: true,
      likesCount: blog.likesCount,
      isLiked: !alreadyLiked
    });
  } catch (error) {
    console.error('❌ Error liking blog:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
});

// @desc    Add comment to blog - ALLOW ALL AUTHENTICATED USERS
// @route   POST /api/blogs/:id/comments
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    const comment = {
      user: req.user._id,
      userName: req.user.fullName || req.user.name || 'Anonymous',
      content: content.trim(),
      createdAt: new Date()
    };

    blog.comments.unshift(comment);
    blog.commentsCount = blog.comments.length;
    await blog.save();

    res.status(201).json({
      success: true,
      comment,
      commentsCount: blog.commentsCount
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Delete comment
// @route   DELETE /api/blogs/:id/comments/:commentId
// @access  Private (Comment author or Admin)
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    const comment = blog.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const isAdmin = req.user.role === 'admin' || req.user.type === 'admin' || req.user.userType === 'admin';
    const isCommentAuthor = comment.user.toString() === req.user._id.toString();
    
    if (!isCommentAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    blog.comments = blog.comments.filter(
      c => c._id.toString() !== req.params.commentId
    );
    blog.commentsCount = blog.comments.length;

    await blog.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      commentsCount: blog.commentsCount
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get blogs by author
// @route   GET /api/blogs/author/:authorId
// @access  Public
router.get('/author/:authorId', async (req, res) => {
  try {
    const blogs = await Blog.find({
      author: req.params.authorId,
      isPublished: true
    })
    .sort('-createdAt')
    .populate('author', 'fullName startupName');

    res.json({
      success: true,
      count: blogs.length,
      blogs
    });
  } catch (error) {
    console.error('Error fetching author blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get featured blogs
// @route   GET /api/blogs/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const blogs = await Blog.find({
      isPublished: true,
      isFeatured: true
    })
    .sort('-createdAt')
    .limit(5)
    .populate('author', 'fullName startupName');

    res.json({
      success: true,
      count: blogs.length,
      blogs
    });
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get trending blogs
// @route   GET /api/blogs/trending
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const blogs = await Blog.find({
      isPublished: true
    })
    .sort('-views -likesCount')
    .limit(10)
    .populate('author', 'fullName startupName');

    res.json({
      success: true,
      count: blogs.length,
      blogs
    });
  } catch (error) {
    console.error('Error fetching trending blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get user's draft blogs
// @route   GET /api/blogs/user/drafts
// @access  Private
router.get('/user/drafts', protect, async (req, res) => {
  try {
    const blogs = await Blog.find({
      author: req.user._id,
      isPublished: false
    })
    .sort('-createdAt')
    .populate('author', 'fullName startupName');

    res.json({
      success: true,
      count: blogs.length,
      blogs
    });
  } catch (error) {
    console.error('Error fetching draft blogs:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Publish draft blog
// @route   PUT /api/blogs/:id/publish
// @access  Private (Blog author or Admin)
router.put('/:id/publish', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    const isAdmin = req.user.role === 'admin' || req.user.type === 'admin' || req.user.userType === 'admin';
    const isAuthor = blog.author.toString() === req.user._id.toString();
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to publish this blog'
      });
    }

    blog.isPublished = true;
    await blog.save();

    res.json({
      success: true,
      message: 'Blog published successfully',
      blog
    });
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Test endpoint to check blog existence
// @route   GET /api/blogs/test/:id
// @access  Public
router.get('/test/:id', async (req, res) => {
  try {
    console.log('🧪 Testing blog existence for ID:', req.params.id);
    
    const blogExists = await Blog.exists({ _id: req.params.id });
    
    res.json({
      success: true,
      exists: !!blogExists,
      message: blogExists ? 'Blog exists in database' : 'Blog not found in database'
    });
  } catch (error) {
    console.error('Test error:', error);
    res.json({
      success: false,
      error: error.message,
      exists: false
    });
  }
});

module.exports = router;