const mongoose = require('mongoose');

// Each entry records time spent in a particular status
const statusHistoryEntrySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'DONE'],
    required: true,
  },
  enteredAt: {
    type: Date,
    required: true,
  },
  exitedAt: {
    type: Date,
    default: null,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
}, { _id: true });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [150, 'Title must be at most 150 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description must be at most 2000 characters'],
    default: '',
  },
  assigneeName: {
    type: String,
    required: [true, 'Assignee name is required'],
    trim: true,
  },
  assigneeEmail: {
    type: String,
    required: [true, 'Assignee email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'DONE'],
    default: 'TODO',
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  },
  slaMinutes: {
    type: Number,
    default: 25,
    min: [1, 'SLA must be at least 1 minute'],
    max: [10080, 'SLA must be at most 7 days (10080 minutes)'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Accumulated seconds spent in each stage (finalized portions only)
  stageTimeSeconds: {
    TODO: { type: Number, default: 0 },
    IN_PROGRESS: { type: Number, default: 0 },
    DONE: { type: Number, default: 0 },
  },
  // When the current stage was entered — used to compute live duration
  currentStageStartedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  statusHistory: [statusHistoryEntrySchema],
}, {
  timestamps: true, // adds createdAt and updatedAt
});

/**
 * Calculate the total elapsed time in seconds.
 * For active tasks: sum of all finalized stage durations + live current-stage duration.
 * For completed tasks (DONE): sum of all finalized stage durations only.
 */
taskSchema.methods.getTotalElapsedSeconds = function () {
  const finalized =
    (this.stageTimeSeconds.TODO || 0) +
    (this.stageTimeSeconds.IN_PROGRESS || 0) +
    (this.stageTimeSeconds.DONE || 0);

  // If task is DONE, the timer is stopped — return finalized total
  if (this.status === 'DONE' || !this.currentStageStartedAt) {
    return finalized;
  }

  // For active tasks, add the live current-stage duration
  const now = new Date();
  const liveSeconds = Math.max(0, Math.floor((now - this.currentStageStartedAt) / 1000));
  return finalized + liveSeconds;
};

/**
 * Get current stage's live duration in seconds.
 */
taskSchema.methods.getCurrentStageLiveSeconds = function () {
  if (this.status === 'DONE' || !this.currentStageStartedAt) {
    return 0;
  }
  const now = new Date();
  return Math.max(0, Math.floor((now - this.currentStageStartedAt) / 1000));
};

/**
 * Compute SLA metrics for this task.
 */
taskSchema.methods.getSlaMetrics = function () {
  const totalElapsed = this.getTotalElapsedSeconds();
  const slaLimitSeconds = this.slaMinutes * 60;
  const remainingSeconds = Math.max(0, slaLimitSeconds - totalElapsed);
  const utilization = slaLimitSeconds > 0 ? (totalElapsed / slaLimitSeconds) * 100 : 0;
  const isOverdue = totalElapsed > slaLimitSeconds;

  return {
    totalElapsedSeconds: totalElapsed,
    slaLimitSeconds,
    remainingSeconds,
    utilization: Math.round(utilization * 100) / 100,
    isOverdue,
  };
};

module.exports = mongoose.model('Task', taskSchema);
