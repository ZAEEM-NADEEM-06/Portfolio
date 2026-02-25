const express = require('express');
const router = express.Router();
const { login, logout, verify, changePassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/logout', logout);
router.get('/verify', verify);
router.put('/change-password', changePassword);

module.exports = router;