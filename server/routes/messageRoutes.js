const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  submitMessage,
  getMessages,
  getMessageById,
  markAsRead,
  deleteMessage
} = require('../controllers/messageController');

// Public route - submit contact form
router.post('/contact', submitMessage);

// Protected routes (admin only)
router.get('/messages', protect, getMessages);
router.get('/messages/:id', protect, getMessageById);
router.put('/messages/:id/read', protect, markAsRead);
router.delete('/messages/:id', protect, deleteMessage);

module.exports = router;