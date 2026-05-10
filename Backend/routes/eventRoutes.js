const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect } = require('../middleware/authMiddleware.js');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sort = 'date'
    } = req.query;

    const query = {};

    // Filter by category
    if (category && category !== 'All Events') {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { startupName: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort === 'date' ? 'date' : '-createdAt'
    };

    const events = await Event.paginate(query, options);

    res.json({
      success: true,
      count: events.totalDocs,
      totalPages: events.totalPages,
      currentPage: events.page,
      events: events.docs
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Founders and Admins)
router.post('/', protect, async (req, res) => {
  try {
    console.log('User creating event:', req.user);
    
    // Check if user is authorized (founder or admin)
    const userRole = req.user.role || req.user.type || req.user.userType;
    const isFounder = userRole === 'founder';
    const isAdmin = userRole === 'admin';
    
    if (!isFounder && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only founders and admins can create events'
      });
    }

    // Set default values for optional fields
    const eventData = {
      ...req.body,
      description: req.body.description || '',
      applyLink: req.body.applyLink || '',
      createdBy: req.user._id,
      creatorName: req.user.fullName || req.user.name || 'Anonymous',
      creatorRole: userRole
    };

    console.log('Creating event with data:', eventData);
    
    // Create event without using callbacks
    const event = new Event(eventData);
    
    // Manually set status since pre-save hook might fail
    try {
      const now = new Date();
      const eventDate = new Date(eventData.date);
      
      if (!isNaN(eventDate.getTime())) {
        if (eventDate < now) {
          event.status = 'completed';
        } else if (eventDate.toDateString() === now.toDateString()) {
          event.status = 'ongoing';
        } else {
          event.status = 'upcoming';
        }
      }
    } catch (dateError) {
      console.warn('Could not set event status:', dateError);
      event.status = 'upcoming';
    }
    
    await event.save();

    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Unable to create event'
    });
  }
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Event creator or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if user is admin
    const userRole = req.user.role || req.user.type || req.user.userType;
    const isAdmin = userRole === 'admin';
    
    // Check if user is the creator
    const isCreator = event.createdBy.toString() === req.user._id.toString();
    
    // Only allow: creator or admin
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this event'
      });
    }

    // Update the event
    Object.assign(event, req.body);
    
    // Update status if date changed
    if (req.body.date) {
      try {
        const now = new Date();
        const eventDate = new Date(req.body.date);
        
        if (!isNaN(eventDate.getTime())) {
          if (eventDate < now) {
            event.status = 'completed';
          } else if (eventDate.toDateString() === now.toDateString()) {
            event.status = 'ongoing';
          } else {
            event.status = 'upcoming';
          }
        }
      } catch (dateError) {
        console.warn('Could not update event status:', dateError);
      }
    }
    
    await event.save();

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Unable to update event'
    });
  }
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Event creator or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if user is admin
    const userRole = req.user.role || req.user.type || req.user.userType;
    const isAdmin = userRole === 'admin';
    
    // Check if user is the creator
    const isCreator = event.createdBy.toString() === req.user._id.toString();
    
    // Only allow: creator or admin
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this event'
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get events by creator
// @route   GET /api/events/creator/:creatorId
// @access  Public
router.get('/creator/:creatorId', async (req, res) => {
  try {
    const events = await Event.find({
      createdBy: req.params.creatorId
    })
    .sort('-date')
    .limit(10);

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error fetching creator events:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await Event.find({
      date: { $gte: today }
    })
    .sort('date')
    .limit(6);

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;