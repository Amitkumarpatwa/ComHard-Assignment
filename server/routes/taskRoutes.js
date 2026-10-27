const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getAnalytics,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// All task routes require authentication
router.use(protect);

// Analytics must come before /:id to avoid route conflict
router.get('/analytics', getAnalytics);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/status', updateTaskStatus);

module.exports = router;
