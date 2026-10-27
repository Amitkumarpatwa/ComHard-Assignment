# ⚡ TaskFlow — MERN Task Management System with SLA Tracking

TaskFlow is a production-grade, lightweight Task Management System with authentication, multi-view task visualization (Grid, Kanban, Section/List), and an accurate **Service Level Agreement (SLA) Tracking Engine**.

---

## ✨ Features

- 🔐 **Authentication & Security**
  - Cookie-based authentication via secure `HttpOnly` JWT tokens.
  - Password encryption using `bcryptjs`.
  - Sensitive route rate-limiting and secure error handling without leaking stack traces.
- ⏱️ **Accurate SLA Tracking Engine**
  - Configurable SLA thresholds per task (in minutes).
  - Accurate elapsed time computation taking into account active stage duration and stage transition history.
  - Live real-time updates and indicators: On Track vs. Overdue badges, visual progress bars, and SLA status indicators.
- 📊 **Multi-View Task Visualization**
  - **Dashboard**: High-level KPI metrics, SLA performance overview, and quick task summary.
  - **Grid View**: Responsive card layout with priority badges, assignee details, SLA countdowns, and quick status changes.
  - **Kanban Board**: Drag-and-drop / single-click column moves across `TODO`, `IN_PROGRESS`, and `DONE` states.
  - **Section / Grouped View**: Collapsible rows grouped by status with granular elapsed time metrics.
  - **All Tasks & My Tasks**: Tabular filtering and sorting by priority, status, and search query.
- 📈 **Analytics & Performance Tracking**
  - Overall SLA compliance rate.
  - Average resolution time and stage duration breakdowns.
  - Priority breakdown and overdue analysis.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router v7, Vanilla CSS design system, Lucide React icons.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose ODM.
- **Authentication**: JWT stored in `HttpOnly` cookie, bcryptjs.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [MongoDB](https://www.mongodb.com/) running locally on default port `27017` (or MongoDB Atlas URI)

### 2. Environment Configuration

Check `server/.env` (pre-configured with defaults):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=taskflow_dev_secret_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Install Dependencies
```bash
# From the project root:
npm run install:all
```

### 4. Seed Database (Optional but Recommended)
Populate sample tasks with various priorities and SLA milestones:
```bash
npm run seed
```
> **Default Test Credentials:**
> - Email: `amit@taskflow.dev`
> - Password: `password123`

### 5. Running the Application

You can start the backend and frontend in separate terminals:

**Terminal 1 — Backend API Server:**
```bash
npm run server
```
*API runs on `http://localhost:5000`*

**Terminal 2 — Frontend Development Server:**
```bash
npm run client
```
*Client runs on `http://localhost:5173`*

---

## 📐 Architecture & SLA Logic

1. **Stage Duration Tracking**:
   Each task maintains:
   - `stageTimeSeconds`: Map of time accumulated in each status (`TODO`, `IN_PROGRESS`, `DONE`).
   - `currentStageStartedAt`: Timestamp when the current status was entered.
   - `statusHistory`: Audit log of transitions with timestamps.

2. **Total Elapsed Time**:
   ```
   Total Elapsed = Sum of past stage durations + (Current Time - currentStageStartedAt [if not DONE])
   ```

3. **SLA Breach Calculation**:
   ```
   Overdue = Total Elapsed Seconds > (slaMinutes * 60)
   ```

---

## 📂 Project Structure

```text
├── client/
│   ├── src/
│   │   ├── components/      # UI components (TaskCard, TaskModal, Layout, Sidebar, Toast, etc.)
│   │   ├── hooks/           # useTasks, useAuth, useSla hooks
│   │   ├── pages/           # Dashboard, Grid, Kanban, Section, Analytics, Login, Register, Settings
│   │   ├── services/        # Fetch API service layer
│   │   ├── App.jsx          # Router & Auth guard setup
│   │   └── index.css        # Clean custom CSS design system
├── server/
│   ├── config/              # MongoDB connection
│   ├── controllers/         # Auth & Task controller functions
│   ├── middleware/          # JWT auth middleware
│   ├── models/              # User and Task Mongoose models
│   ├── routes/              # Express API route declarations
│   ├── utils/               # Seed script and JWT helper
│   └── server.js            # Express server entry point
├── package.json             # Root runner scripts
└── README.md
```
