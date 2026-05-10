const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  startupName: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: [
      'Startup Stories',
      'Technology',
      'Business',
      'Marketing',
      'Funding',
      'Leadership',
      'Product Development',
      'Growth Hacking',
      'Other'
    ],
    default: 'Startup Stories'
  },
  readTime: {
    type: Number,
    default: 5
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  commentsCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  // ✅ ADDED: Blog cover image (Base64 string or URL)
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// SIMPLIFIED pre-save hook - FIXED VERSION
blogSchema.pre('save', async function(next) {
  try {
    console.log('Blog pre-save hook triggered for:', this.title);
    
    // Only generate slug for new documents
    if (this.isNew) {
      let slug = this.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Add timestamp for uniqueness
      slug = `${slug}-${Date.now().toString().slice(-6)}`;
      this.slug = slug;
      console.log('Generated slug:', this.slug);
    }
    
    // Ensure next is called
    if (next && typeof next === 'function') {
      next();
    }
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    if (next && typeof next === 'function') {
      next(error);
    } else {
      throw error;
    }
  }
});

// Text index for search
blogSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
});

// Add pagination plugin
blogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Blog', blogSchema);