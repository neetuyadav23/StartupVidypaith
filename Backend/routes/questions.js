// routes/questions.js - UPDATED to handle both IDs
const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const User = require('../models/User');
const Founder = require('../models/Founder'); // Import Founder model
const { protect: auth } = require('../middleware/authMiddleware');

// POST: Ask a question to a founder
router.post('/', auth, async (req, res) => {
  try {
    const { founderId, question, category, anonymous } = req.body;
    
    console.log('📥 Question POST request received:', {
      founderId,
      questionLength: question?.length,
      category,
      anonymous,
      userId: req.user.id
    });
    
    // First, try to find the founder document
    const founder = await Founder.findById(founderId);
    
    if (!founder) {
      return res.status(404).json({
        success: false,
        error: 'Founder document not found'
      });
    }
    
    console.log('✅ Founder document found:', {
      founderId: founder._id,
      userId: founder.userId,
      startupName: founder.startupName
    });
    
    // Check if the user is trying to ask themselves (founder can't ask themselves)
    if (req.user.id === founder.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You cannot ask questions on your own profile'
      });
    }
    
    // Create question with both IDs
    const newQuestion = new Question({
      askedBy: req.user.id,
      founderId: founder.userId, // User ID
      founderDocumentId: founder._id, // Founder document ID
      question,
      category: category || 'General',
      anonymous: anonymous || false
    });
    
    await newQuestion.save();
    
    // Populate askedBy details
    await newQuestion.populate({
      path: 'askedBy',
      select: 'fullName email userType profileImage'
    });
    
    res.status(201).json({
      success: true,
      message: 'Question submitted successfully',
      question: newQuestion
    });
    
  } catch (error) {
    console.error('❌ Error asking question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit question: ' + error.message
    });
  }
});

// GET: Get all questions for a founder (accepts both User ID or Founder document ID)
router.get('/founder/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔄 Fetching questions for ID:', id);
    
    let questions;
    
    // Try to find by founderDocumentId first (most likely)
    questions = await Question.find({ founderDocumentId: id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'askedBy',
        select: 'fullName email userType role profileImage'
      });
    
    // If not found by founderDocumentId, try by founderId (User ID)
    if (questions.length === 0) {
      questions = await Question.find({ founderId: id })
        .sort({ createdAt: -1 })
        .populate({
          path: 'askedBy',
          select: 'fullName email userType role profileImage'
        });
    }
    
    console.log(`✅ Found ${questions.length} questions`);
    
    res.json({
      success: true,
      questions,
      count: questions.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions: ' + error.message
    });
  }
});

// PUT: Founder answers a question
router.put('/:questionId/answer', auth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    
    const question = await Question.findById(questionId)
      .populate('founderId');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Check if current user is the founder
    if (question.founderId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the founder can answer this question'
      });
    }
    
    // Update question with answer
    question.answer = answer;
    question.isAnswered = true;
    question.answeredAt = Date.now();
    
    await question.save();
    
    res.json({
      success: true,
      message: 'Answer submitted successfully',
      question
    });
    
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
});

// PUT: Admin edits a question (admin only)
router.put('/:questionId', auth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { question: updatedQuestion } = req.body;
    
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin' && user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admin can edit questions'
      });
    }
    
    const existingQuestion = await Question.findById(questionId);
    
    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Update question
    existingQuestion.question = updatedQuestion;
    await existingQuestion.save();
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      question: existingQuestion
    });
    
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update question'
    });
  }
});

// DELETE: Delete a question (admin, asker, or founder)
router.delete('/:questionId', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Check permissions
    const isAsker = question.askedBy.toString() === req.user.id;
    const isFounder = question.founderId.toString() === req.user.id;
    
    // Check if user is admin
    const user = await User.findById(req.user.id);
    const isAdmin = user.role === 'admin' || user.userType === 'admin';
    
    if (!isAsker && !isFounder && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this question'
      });
    }
    
    await question.deleteOne();
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete question'
    });
  }
});

module.exports = router;