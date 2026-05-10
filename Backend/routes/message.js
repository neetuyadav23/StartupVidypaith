const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Community = require('../models/Community');

// POST /api/message/:communityId - send a new message
router.post('/:communityId', protect, async (req, res) => {
  const { communityId } = req.params;
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const community = await Community.findById(communityId);
  if (!community) {
    return res.status(404).json({ error: 'Community not found' });
  }

  const allowedTypes = ['student', 'founder', 'admin'];
  if (!allowedTypes.includes(req.user.userType)) {
    return res.status(403).json({ error: 'You are not allowed to send messages' });
  }

  try {
    const message = new Message({
      community: communityId,
      sender: req.user._id,
      text: text.trim(),
      senderName: req.user.fullName
    });
    await message.save();

    const populated = await message.populate('sender', 'fullName');
    res.status(201).json({
      _id: populated._id,
      text: populated.text,
      senderId: populated.sender._id,
      senderName: populated.sender.fullName,
      createdAt: populated.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/message/:id - admin, message sender, or community creator can delete
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const community = await Community.findById(message.community);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const isAdmin = req.user.userType === 'admin';
    const isSender = message.sender.toString() === req.user._id.toString();
    const isCommunityCreator = community.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isSender && !isCommunityCreator) {
      return res.status(403).json({ error: 'Forbidden: You cannot delete this message' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;