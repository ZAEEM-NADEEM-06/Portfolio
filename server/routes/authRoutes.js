const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
  login,
  verify,
  logout,
  checkServer
} = require('../controllers/authController');

const validateLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];

// Health check - NO AUTH REQUIRED
router.get('/health', checkServer);

// Public routes
router.post('/login', validateLogin, login);

// Protected routes
router.get('/verify', protect, verify);
router.post('/logout', protect, logout);

module.exports = router;