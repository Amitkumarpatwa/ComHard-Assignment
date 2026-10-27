/**
 * Seed script — creates a test user and sample tasks for development.
 * Run with: node utils/seed.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Task = require('../models/Task');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    console.log('Cleared existing data.');

    // Create a test user
    const user = await User.create({
      fullName: 'Amit Patel',
      email: 'amit@taskflow.dev',
      password: 'password123',
    });
    console.log(`Created test user: ${user.email} / password123`);

    const now = new Date();

    // Helper: create a task at a specific time offset (minutes ago)
    const minutesAgo = (min) => new Date(now.getTime() - min * 60000);

    // Task 1: Active in TODO, created 10 minutes ago
    await Task.create({
      title: 'Design landing page wireframes',
      description: 'Create wireframes for the new product landing page including hero, features, and CTA sections.',
      assigneeName: 'Amit Patel',
      assigneeEmail: 'amit@taskflow.dev',
      status: 'TODO',
      priority: 'HIGH',
      slaMinutes: 30,
      createdBy: user._id,
      stageTimeSeconds: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
      currentStageStartedAt: minutesAgo(10),
      statusHistory: [{ status: 'TODO', enteredAt: minutesAgo(10), exitedAt: null, durationSeconds: 0 }],
      createdAt: minutesAgo(10),
    });

    // Task 2: In Progress, spent 5 min in TODO then moved
    const task2TodoStart = minutesAgo(20);
    const task2InProgressStart = minutesAgo(15);
    await Task.create({
      title: 'Implement user authentication API',
      description: 'Build JWT-based authentication with login, register, and password hashing.',
      assigneeName: 'Priya Sharma',
      assigneeEmail: 'priya@taskflow.dev',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      slaMinutes: 25,
      createdBy: user._id,
      stageTimeSeconds: { TODO: 300, IN_PROGRESS: 0, DONE: 0 },
      currentStageStartedAt: task2InProgressStart,
      statusHistory: [
        { status: 'TODO', enteredAt: task2TodoStart, exitedAt: task2InProgressStart, durationSeconds: 300 },
        { status: 'IN_PROGRESS', enteredAt: task2InProgressStart, exitedAt: null, durationSeconds: 0 },
      ],
      createdAt: task2TodoStart,
    });

    // Task 3: DONE, completed within SLA (25 min task, took 20 min)
    const task3Start = minutesAgo(60);
    const task3InProgress = minutesAgo(50);
    const task3Done = minutesAgo(40);
    await Task.create({
      title: 'Set up MongoDB schemas',
      description: 'Define Mongoose models for User and Task collections with proper validation.',
      assigneeName: 'Rahul Verma',
      assigneeEmail: 'rahul@taskflow.dev',
      status: 'DONE',
      priority: 'MEDIUM',
      slaMinutes: 25,
      createdBy: user._id,
      stageTimeSeconds: { TODO: 600, IN_PROGRESS: 600, DONE: 0 },
      currentStageStartedAt: null,
      completedAt: task3Done,
      statusHistory: [
        { status: 'TODO', enteredAt: task3Start, exitedAt: task3InProgress, durationSeconds: 600 },
        { status: 'IN_PROGRESS', enteredAt: task3InProgress, exitedAt: task3Done, durationSeconds: 600 },
        { status: 'DONE', enteredAt: task3Done, exitedAt: task3Done, durationSeconds: 0 },
      ],
      createdAt: task3Start,
    });

    // Task 4: DONE, exceeded SLA (25 min task, took 35 min) — overdue
    const task4Start = minutesAgo(120);
    const task4InProgress = minutesAgo(100);
    const task4Done = minutesAgo(85);
    await Task.create({
      title: 'Write API documentation',
      description: 'Document all REST API endpoints with request/response examples.',
      assigneeName: 'Neha Gupta',
      assigneeEmail: 'neha@taskflow.dev',
      status: 'DONE',
      priority: 'LOW',
      slaMinutes: 25,
      createdBy: user._id,
      stageTimeSeconds: { TODO: 1200, IN_PROGRESS: 900, DONE: 0 },
      currentStageStartedAt: null,
      completedAt: task4Done,
      statusHistory: [
        { status: 'TODO', enteredAt: task4Start, exitedAt: task4InProgress, durationSeconds: 1200 },
        { status: 'IN_PROGRESS', enteredAt: task4InProgress, exitedAt: task4Done, durationSeconds: 900 },
        { status: 'DONE', enteredAt: task4Done, exitedAt: task4Done, durationSeconds: 0 },
      ],
      createdAt: task4Start,
    });

    // Task 5: In Progress, LOW priority
    const task5Start = minutesAgo(45);
    const task5InProgress = minutesAgo(35);
    await Task.create({
      title: 'Add responsive CSS for mobile',
      description: 'Implement mobile-first responsive design for dashboard and task views.',
      assigneeName: 'Amit Patel',
      assigneeEmail: 'amit@taskflow.dev',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      slaMinutes: 60,
      createdBy: user._id,
      stageTimeSeconds: { TODO: 600, IN_PROGRESS: 0, DONE: 0 },
      currentStageStartedAt: task5InProgress,
      statusHistory: [
        { status: 'TODO', enteredAt: task5Start, exitedAt: task5InProgress, durationSeconds: 600 },
        { status: 'IN_PROGRESS', enteredAt: task5InProgress, exitedAt: null, durationSeconds: 0 },
      ],
      createdAt: task5Start,
    });

    // Task 6: TODO, MEDIUM priority
    await Task.create({
      title: 'Create task filter components',
      description: 'Build reusable filter dropdowns for status, priority, and search.',
      assigneeName: 'Priya Sharma',
      assigneeEmail: 'priya@taskflow.dev',
      status: 'TODO',
      priority: 'MEDIUM',
      slaMinutes: 40,
      createdBy: user._id,
      stageTimeSeconds: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
      currentStageStartedAt: minutesAgo(5),
      statusHistory: [{ status: 'TODO', enteredAt: minutesAgo(5), exitedAt: null, durationSeconds: 0 }],
      createdAt: minutesAgo(5),
    });

    console.log('Seeded 6 sample tasks.');
    console.log('\n--- Login Credentials ---');
    console.log('Email: amit@taskflow.dev');
    console.log('Password: password123');
    console.log('-------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
