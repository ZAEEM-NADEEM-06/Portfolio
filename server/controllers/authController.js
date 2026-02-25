const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');

const generateToken = (id, tokenVersion, sessionId) => {
  return jwt.sign(
    { 
      id, 
      version: tokenVersion,
      sessionId: sessionId
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    console.log('🔍 Login attempt:', username);

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide username and password' 
      });
    }

    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate unique session ID
    const sessionId = uuidv4();
    
    // Generate token with session ID
    const token = generateToken(user._id, user.tokenVersion, sessionId);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Parse user agent (simplified)
    const device = userAgent.includes('Mobile') ? 'mobile' : 'desktop';
    const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                   userAgent.includes('Firefox') ? 'Firefox' : 'Other';

    // Deactivate any existing active session for this user
    await Session.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    // Create new session
    const session = await Session.create({
      userId: user._id,
      sessionId,
      token,
      ipAddress,
      userAgent,
      device,
      browser,
      expiresAt,
      lastActive: new Date()
    });

    // Update user with active session
    user.activeSession = sessionId;
    user.lastLogin = new Date();
    user.lastLoginIP = ipAddress;
    await user.save();

    console.log('✅ Login successful, session created:', sessionId);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      sessionId,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again.' 
    });
  }
};

const verify = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check token version
    if (decoded.version !== user.tokenVersion) {
      return res.status(401).json({ 
        success: false,
        message: 'Session expired. Please login again.',
        code: 'TOKEN_VERSION_MISMATCH'
      });
    }

    // Check if this session is the active one
    if (user.activeSession !== decoded.sessionId) {
      return res.status(401).json({ 
        success: false,
        message: 'Logged in from another device',
        code: 'SESSION_OVERRIDDEN'
      });
    }

    // Verify session exists and is active
    const session = await Session.findOne({ 
      sessionId: decoded.sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({ 
        success: false,
        message: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    // Update last active
    session.lastActive = new Date();
    await session.save();

    res.json({ 
      success: true,
      message: 'Token is valid',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Deactivate session
      await Session.findOneAndUpdate(
        { sessionId: decoded.sessionId },
        { isActive: false }
      );
      
      // Clear active session from user if it matches
      await User.findByIdAndUpdate(decoded.id, {
        $set: { activeSession: null }
      });
    }

    res.json({ 
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.json({ 
      success: true,
      message: 'Logged out successfully'
    });
  }
};

const checkServer = async (req, res) => {
  res.json({ 
    success: true,
    status: 'online', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

module.exports = {
  login,
  verify,
  logout,
  checkServer
};