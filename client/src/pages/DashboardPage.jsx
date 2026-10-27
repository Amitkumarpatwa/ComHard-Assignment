import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import { formatDuration, getSlaInfo, getStatusInfo, computeElapsed } from '../hooks/useSla';
import {
  ListTodo, Clock, CheckCircle2, AlertTriangle, Timer,
  TrendingUp, Percent, ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsData, tasksData] = await Promise.all([
          tasksAPI.analytics(),
          tasksAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);
        setAnalytics(analyticsData.analytics);
        setRecentTasks(tasksData.tasks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const a = analytics;

  const statCards = [
    { label: 'Total Tasks', value: a.totalTasks, icon: <ListTodo size={22} />, variant: 'primary' },
    { label: 'To Do', value: a.todoCount, icon: <Clock size={22} />, variant: 'todo' },
    { label: 'In Progress', value: a.inProgressCount, icon: <Timer size={22} />, variant: 'progress' },
    { label: 'Completed', value: a.doneCount, icon: <CheckCircle2 size={22} />, variant: 'done' },
    { label: 'Overdue', value: a.overdueCount, icon: <AlertTriangle size={22} />, variant: 'danger' },
    { label: 'Avg Elapsed', value: formatDuration(a.averageElapsedSeconds), icon: <TrendingUp size={22} />, variant: 'info' },
    { label: 'SLA Compliance', value: `${a.slaCompliancePercentage}%`, icon: <Percent size={22} />, variant: 'warning' },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className={`stat-card ${card.variant}`}>
            <div className="stat-card-icon">{card.icon}</div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* SLA Summary */}
      <div className="analytics-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="analytics-card">
          <h3>📊 SLA Summary</h3>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Completed Tasks</span>
            <span className="analytics-metric-value">{a.completedCount}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Within SLA</span>
            <span className="analytics-metric-value" style={{ color: 'var(--color-success)' }}>{a.slaCompliantCount}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Overdue</span>
            <span className="analytics-metric-value" style={{ color: 'var(--color-danger)' }}>{a.overdueCount}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Avg SLA Utilization</span>
            <span className="analytics-metric-value">{a.averageSlaUtilization}%</span>
          </div>
        </div>

        <div className="analytics-card">
          <h3>⏱ Average Stage Durations</h3>
          <div className="analytics-metric">
            <span className="analytics-metric-label">To Do</span>
            <span className="analytics-metric-value">{formatDuration(a.averageStageDurations?.TODO || 0)}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">In Progress</span>
            <span className="analytics-metric-value">{formatDuration(a.averageStageDurations?.IN_PROGRESS || 0)}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Done</span>
            <span className="analytics-metric-value">{formatDuration(a.averageStageDurations?.DONE || 0)}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Avg Total (Completed)</span>
            <span className="analytics-metric-value">{formatDuration(a.averageElapsedCompletedSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="recent-tasks">
        <div className="recent-tasks-header">
          <h3>Recent Tasks</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
            View All <ArrowRight size={16} />
          </button>
        </div>
        {recentTasks.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <p>No tasks yet. Create your first task to get started!</p>
            <button className="btn btn-primary" onClick={() => navigate('/grid')}>
              Create Task
            </button>
          </div>
        ) : (
          <table className="recent-tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>SLA Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map(task => {
                const status = getStatusInfo(task.status);
                const sla = getSlaInfo(task);
                return (
                  <tr key={task._id}>
                    <td style={{ fontWeight: 600 }}>{task.title}</td>
                    <td><span className={`badge ${status.className}`}>{status.label}</span></td>
                    <td><span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                    <td>{task.assigneeName}</td>
                    <td>
                      <span className={`badge ${sla.isOverdue ? 'overdue' : 'on-track'}`}>
                        {sla.isOverdue ? 'Overdue' : 'On Track'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
