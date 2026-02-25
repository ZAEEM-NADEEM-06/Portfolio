const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMySessions,
  getUserSessions,
  terminateSession,
  terminateOtherSessions,
  terminateAllSessions,
  cleanupExpiredSessions,
  getSessionStats
} = require('../controllers/sessionController');

// All session routes are protected
router.use(protect);

// Get current user's sessions
router.get('/', getMySessions);

// Terminate all other sessions
router.post('/terminate-others', terminateOtherSessions);

// Terminate all sessions (logout everywhere)
router.post('/terminate-all', terminateAllSessions);

// Terminate specific session
router.delete('/:sessionId', terminateSession);

// Admin only routes
router.get('/user/:userId', getUserSessions);
router.post('/cleanup', cleanupExpiredSessions);
router.get('/stats', getSessionStats);

module.exports = router;