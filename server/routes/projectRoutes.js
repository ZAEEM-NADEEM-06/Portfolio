const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handleUpload } = require('../middleware/uploadMiddleware');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateOrder
} = require('../controllers/projectController');

// Public routes
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Protected routes
router.post('/', protect, handleUpload, createProject);
router.put('/order', protect, updateOrder);
router.put('/:id', protect, handleUpload, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;