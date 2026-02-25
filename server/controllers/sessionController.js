const Session = require('../models/Session');
const User = require('../models/User');

// @desc    Get all active sessions for current user
// @route   GET /api/sessions
// @access  Private
const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.getUserSessions(req.user.id);
    
    // Don't send the actual token for security
    const safeSessions = sessions.map(session => ({
      id: session._id,
      device: session.device,
      browser: session.browser,
      os: session.os,
      ipAddress: session.ipAddress,
      location: session.location,
      lastActive: session.lastActive,
      expiresAt: session.expiresAt,
      isCurrentSession: session.token === req.token
    }));
    
    res.json({
      success: true,
      count: safeSessions.length,
      sessions: safeSessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all sessions for a specific user (admin only)
// @route   GET /api/sessions/user/:userId
// @access  Private/Admin
const getUserSessions = async (req, res) => {
  try {
    // Check if requester is admin (you can add role check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const sessions = await Session.getUserSessions(req.params.userId);
    
    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Terminate a specific session
// @route   DELETE /api/sessions/:sessionId
// @access  Private
const terminateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check if session belongs to user
    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Don't allow terminating current session
    if (session.token === req.token) {
      return res.status(400).json({ message: 'Cannot terminate current session' });
    }
    
    await session.deactivate();
    
    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Terminate all other sessions (logout from other devices)
// @route   POST /api/sessions/terminate-others
// @access  Private
const terminateOtherSessions = async (req, res) => {
  try {
    // Deactivate all sessions except current one
    await Session.updateMany(
      { 
        userId: req.user.id, 
        token: { $ne: req.token },
        isActive: true 
      },
      { isActive: false }
    );
    
    // Increment token version for extra security
    const user = await User.findById(req.user.id);
    user.tokenVersion += 1;
    await user.save();
    
    res.json({
      success: true,
      message: 'All other sessions terminated successfully'
    });
  } catch (error) {
    console.error('Terminate other sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Terminate all sessions (logout everywhere)
// @route   POST /api/sessions/terminate-all
// @access  Private
const terminateAllSessions = async (req, res) => {
  try {
    // Deactivate all sessions for user
    await Session.updateMany(
      { userId: req.user.id, isActive: true },
      { isActive: false }
    );
    
    // Increment token version to invalidate current token
    const user = await User.findById(req.user.id);
    user.tokenVersion += 1;
    await user.save();
    
    res.json({
      success: true,
      message: 'All sessions terminated successfully'
    });
  } catch (error) {
    console.error('Terminate all sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clean up expired sessions (can be called by a cron job)
// @route   POST /api/sessions/cleanup
// @access  Private/Admin
const cleanupExpiredSessions = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const result = await Session.cleanupExpired();
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired sessions`
    });
  } catch (error) {
    console.error('Cleanup sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get session statistics (admin only)
// @route   GET /api/sessions/stats
// @access  Private/Admin
const getSessionStats = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ isActive: true });
    const expiredSessions = await Session.countDocuments({ expiresAt: { $lt: new Date() } });
    
    // Group by device type
    const deviceStats = await Session.aggregate([
      { $group: { _id: '$device', count: { $sum: 1 } } }
    ]);
    
    // Group by browser
    const browserStats = await Session.aggregate([
      { $group: { _id: '$browser', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalSessions,
        active: activeSessions,
        expired: expiredSessions,
        byDevice: deviceStats,
        byBrowser: browserStats
      }
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMySessions,
  getUserSessions,
  terminateSession,
  terminateOtherSessions,
  terminateAllSessions,
  cleanupExpiredSessions,
  getSessionStats
};