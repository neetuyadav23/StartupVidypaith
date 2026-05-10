const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Community = require('../models/Community');
const Message = require('../models/Message');

// GET /api/community – list all communities with membership flag
router.get('/', protect, async (req, res) => {
  try {
    // 🔥 Populate createdBy with fullName and email
    const communities = await Community.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName email');
    const userId = req.user._id.toString();

    const communitiesWithMembership = communities.map(community => ({
      ...community.toObject(),
      isMember: community.members && community.members.some(m => m.toString() === userId)
    }));

    res.json(communitiesWithMembership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/community/create – founder/admin only
router.post('/create', protect, authorize('founder', 'admin'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Community name is required' });

  try {
    const community = new Community({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id]
    });
    await community.save();
    console.log(`✅ Created community: ${community._id}`);
    res.status(201).json(community);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/community/:id/messages – members only (admin bypass)
router.get('/:id/messages', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const isMember = community.members && community.members.some(m => m.toString() === req.user._id.toString());
    if (req.user.userType !== 'admin' && !isMember) {
      return res.status(403).json({ error: 'You are not a member of this community' });
    }

    const messages = await Message.find({ community: id })
      .populate('sender', 'fullName')
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      text: msg.text,
      senderId: msg.sender._id,
      senderName: msg.sender.fullName,
      createdAt: msg.createdAt
    }));

    res.json(formattedMessages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/community/:id – admin OR community creator can delete
router.delete('/:id', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const isAdmin = req.user.userType === 'admin';
    const isCreator = community.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Forbidden: You cannot delete this community' });
    }

    await Message.deleteMany({ community: req.params.id });
    await community.deleteOne();
    res.json({ message: 'Community and all messages deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/community/:id/join – join a community
router.post('/:id/join', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    if (!community.members) community.members = [];

    const isMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (isMember) return res.status(400).json({ error: 'Already a member' });

    community.members.push(req.user._id);
    await community.save();
    console.log(`✅ User ${req.user._id} joined community ${community._id}`);
    res.json({ message: 'Joined community' });
  } catch (err) {
    console.error('Join error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/community/:id/leave – leave a community
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    if (!community.members) community.members = [];

    const isMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(400).json({ error: 'Not a member' });

    community.members = community.members.filter(m => m.toString() !== req.user._id.toString());
    await community.save();
    console.log(`✅ User ${req.user._id} left community ${community._id}`);
    res.json({ message: 'Left community' });
  } catch (err) {
    console.error('Leave error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;