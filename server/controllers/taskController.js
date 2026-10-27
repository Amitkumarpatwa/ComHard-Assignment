const Task = require('../models/Task');
const mongoose = require('mongoose');

// Valid statuses for validation
const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

/**
 * @route   POST /api/tasks
 * @desc    Create a new task (defaults to TODO)
 */
const createTask = async (req, res) => {
  try {
    const { title, description, assigneeName, assigneeEmail, priority, slaMinutes } = req.body;

    // Validate required fields
    if (!title || !assigneeName || !assigneeEmail) {
      return res.status(400).json({ success: false, message: 'Title, assignee name, and assignee email are required.' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(assigneeEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid assignee email.' });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Priority must be LOW, MEDIUM, or HIGH.' });
    }

    if (slaMinutes !== undefined && (slaMinutes < 1 || slaMinutes > 10080)) {
      return res.status(400).json({ success: false, message: 'SLA must be between 1 and 10080 minutes.' });
    }

    const now = new Date();

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      assigneeName: assigneeName.trim(),
      assigneeEmail: assigneeEmail.toLowerCase().trim(),
      priority: priority || 'MEDIUM',
      slaMinutes: slaMinutes || 25,
      status: 'TODO',
      createdBy: req.user._id,
      stageTimeSeconds: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
      currentStageStartedAt: now,
      statusHistory: [{
        status: 'TODO',
        enteredAt: now,
        exitedAt: null,
        durationSeconds: 0,
      }],
    });

    res.status(201).json({ success: true, message: 'Task created successfully.', task });
  } catch (error) {
    console.error('Create task error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error creating task.' });
  }
};

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for authenticated user with search, filter, sort, pagination
 */
const getTasks = async (req, res) => {
  try {
    const { search, status, priority, sortBy, sortOrder, page = 1, limit = 50 } = req.query;

    const query = { createdBy: req.user._id };

    // Helper to safely escape special regex characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Search by title, description, assignee name, or assignee email
    if (search && typeof search === 'string' && search.trim()) {
      const cleanSearch = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
        { assigneeEmail: { $regex: cleanSearch, $options: 'i' } },
        { assigneeName: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status && VALID_STATUSES.includes(status)) {
      query.status = status;
    }

    // Filter by priority
    if (priority && VALID_PRIORITIES.includes(priority)) {
      query.priority = priority;
    }

    // Sort options
    const sortOptions = {};
    const validSortFields = ['createdAt', 'priority', 'title', 'status', 'slaMinutes'];
    if (sortBy && validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [tasks, total] = await Promise.all([
      Task.find(query).sort(sortOptions).skip((pageNum - 1) * limitNum).limit(limitNum),
      Task.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching tasks.' });
  }
};

/**
 * @route   GET /api/tasks/analytics
 * @desc    Get task analytics for dashboard
 */
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all tasks for this user
    const tasks = await Task.find({ createdBy: userId });

    const total = tasks.length;
    const todoTasks = tasks.filter(t => t.status === 'TODO');
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
    const doneTasks = tasks.filter(t => t.status === 'DONE');

    // Calculate SLA for all tasks using:
    // sla_i = todo timer + inprogress timer
    // avg SLA = (sla_1 + sla_2 + ... + sla_N) / N
    const now = new Date();
    let overdueCount = 0;
    let totalSlaSum = 0;

    const calculateTaskSla = (task) => {
      const currentLive = (task.status !== 'DONE' && task.currentStageStartedAt)
        ? Math.max(0, Math.floor((now.getTime() - new Date(task.currentStageStartedAt).getTime()) / 1000))
        : 0;

      const todoTimer = (task.stageTimeSeconds?.TODO || 0) + (task.status === 'TODO' ? currentLive : 0);
      const inProgressTimer = (task.stageTimeSeconds?.IN_PROGRESS || 0) + (task.status === 'IN_PROGRESS' ? currentLive : 0);
      const taskSla = todoTimer + inProgressTimer;

      return { todoTimer, inProgressTimer, taskSla };
    };

    tasks.forEach(task => {
      const { taskSla } = calculateTaskSla(task);
      totalSlaSum += taskSla;
      if (taskSla > (task.slaMinutes || 25) * 60) {
        overdueCount++;
      }
    });

    const avgSlaAll = total > 0 ? Math.round(totalSlaSum / total) : 0;

    // Completed task metrics
    const completedTasks = doneTasks;
    let avgSlaCompleted = 0;
    let avgSlaUtilization = 0;
    let slaCompliantCount = 0;
    let avgStageDurations = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };

    if (completedTasks.length > 0) {
      let totalSlaCompleted = 0;
      let totalUtilization = 0;

      completedTasks.forEach(task => {
        const { todoTimer, inProgressTimer, taskSla } = calculateTaskSla(task);
        const slaLimit = (task.slaMinutes || 25) * 60;
        totalSlaCompleted += taskSla;
        totalUtilization += slaLimit > 0 ? (taskSla / slaLimit) * 100 : 0;

        if (taskSla <= slaLimit) {
          slaCompliantCount++;
        }

        avgStageDurations.TODO += todoTimer;
        avgStageDurations.IN_PROGRESS += inProgressTimer;
        avgStageDurations.DONE += (task.stageTimeSeconds?.DONE || 0);
      });

      avgSlaCompleted = Math.round(totalSlaCompleted / completedTasks.length);
      avgSlaUtilization = Math.round((totalUtilization / completedTasks.length) * 100) / 100;
      avgStageDurations.TODO = Math.round(avgStageDurations.TODO / completedTasks.length);
      avgStageDurations.IN_PROGRESS = Math.round(avgStageDurations.IN_PROGRESS / completedTasks.length);
      avgStageDurations.DONE = Math.round(avgStageDurations.DONE / completedTasks.length);
    }

    const slaCompliancePercentage = completedTasks.length > 0
      ? Math.round((slaCompliantCount / completedTasks.length) * 10000) / 100
      : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalTasks: total,
        todoCount: todoTasks.length,
        inProgressCount: inProgressTasks.length,
        doneCount: doneTasks.length,
        overdueCount,
        averageSlaSeconds: avgSlaAll,
        averageElapsedSeconds: avgSlaAll, // alias for backwards compatibility
        averageSlaCompletedSeconds: avgSlaCompleted,
        averageElapsedCompletedSeconds: avgSlaCompleted,
        averageSlaUtilization: avgSlaUtilization,
        slaCompliancePercentage,
        slaCompliantCount,
        completedCount: completedTasks.length,
        averageStageDurations: avgStageDurations,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching analytics.' });
  }
};

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task by ID
 */
const getTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('Get task error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching task.' });
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details (does NOT change status or reset SLA)
 */
const updateTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { title, description, assigneeName, assigneeEmail, priority, slaMinutes } = req.body;

    // Only update allowed fields — never allow overwriting timing fields
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be empty.' });
      task.title = title.trim();
    }
    if (description !== undefined) task.description = description.trim();
    if (assigneeName !== undefined) {
      if (!assigneeName.trim()) return res.status(400).json({ success: false, message: 'Assignee name cannot be empty.' });
      task.assigneeName = assigneeName.trim();
    }
    if (assigneeEmail !== undefined) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(assigneeEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid assignee email.' });
      }
      task.assigneeEmail = assigneeEmail.toLowerCase().trim();
    }
    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, message: 'Priority must be LOW, MEDIUM, or HIGH.' });
      }
      task.priority = priority;
    }
    if (slaMinutes !== undefined) {
      if (slaMinutes < 1 || slaMinutes > 10080) {
        return res.status(400).json({ success: false, message: 'SLA must be between 1 and 10080 minutes.' });
      }
      task.slaMinutes = slaMinutes;
    }

    await task.save();
    res.status(200).json({ success: true, message: 'Task updated successfully.', task });
  } catch (error) {
    console.error('Update task error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating task.' });
  }
};

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Change task status with SLA tracking
 *
 * This is the critical SLA transition endpoint:
 * 1. Calculate duration spent in previous stage
 * 2. Add it to stageTimeSeconds for that stage
 * 3. Close the previous statusHistory entry
 * 4. Set the new status and start a new history entry
 * 5. Handle DONE specially (stop timer, set completedAt)
 */
const updateTaskStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const { status: newStatus } = req.body;

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Status must be TODO, IN_PROGRESS, or DONE.' });
    }

    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const oldStatus = task.status;

    // Don't transition if already in same status
    if (oldStatus === newStatus) {
      return res.status(400).json({ success: false, message: `Task is already in ${newStatus} status.` });
    }

    const now = new Date();

    // --- Step 1: Finalize the previous stage ---
    // Calculate duration spent in the current (old) stage
    let stageDuration = 0;
    if (task.currentStageStartedAt) {
      stageDuration = Math.max(0, Math.floor((now - task.currentStageStartedAt) / 1000));
    }

    // Accumulate duration into the old stage
    task.stageTimeSeconds[oldStatus] = (task.stageTimeSeconds[oldStatus] || 0) + stageDuration;

    // Close the active history entry (last one without exitedAt)
    const activeHistoryEntry = task.statusHistory.find(h => h.exitedAt === null);
    if (activeHistoryEntry) {
      activeHistoryEntry.exitedAt = now;
      activeHistoryEntry.durationSeconds = (activeHistoryEntry.durationSeconds || 0) + stageDuration;
    }

    // --- Step 2: Start the new stage ---
    task.status = newStatus;

    if (newStatus === 'DONE') {
      // Timer stops for completed tasks
      task.completedAt = now;
      task.currentStageStartedAt = null;
      // Add a final DONE history entry (already closed)
      task.statusHistory.push({
        status: 'DONE',
        enteredAt: now,
        exitedAt: now,
        durationSeconds: 0,
      });
    } else {
      // Start timing the new stage
      task.completedAt = null;
      task.currentStageStartedAt = now;
      task.statusHistory.push({
        status: newStatus,
        enteredAt: now,
        exitedAt: null,
        durationSeconds: 0,
      });
    }

    await task.save();

    res.status(200).json({ success: true, message: `Task moved to ${newStatus}.`, task });
  } catch (error) {
    console.error('Update task status error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating task status.' });
  }
};

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task (only owner can delete)
 */
const deleteTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting task.' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getAnalytics,
};
