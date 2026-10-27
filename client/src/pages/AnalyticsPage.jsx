import { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import { formatDuration } from '../hooks/useSla';
import {
  BarChart3, TrendingUp, Clock, CheckCircle2,
  AlertTriangle, Percent, Timer, Target
} from 'lucide-react';

/**
 * Analytics page — displays detailed SLA metrics from the backend.
 *
 * Metric Definitions:
 * - Average Elapsed Time: Mean elapsed time across all tasks.
 * - Average Elapsed (Completed): Mean elapsed time for completed tasks only.
 * - SLA Compliance %: (Completed tasks within SLA / Total completed tasks) × 100.
 * - Average SLA Utilization: Mean of (elapsed / slaLimit × 100) for completed tasks.
 * - Average Stage Durations: Mean time spent in each stage for completed tasks.
 */
export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await tasksAPI.analytics();
        setAnalytics(data.analytics);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (error) return <div className="error-message">{error}</div>;

  const a = analytics;

  return (
    <div>
      {/* Overview Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card primary">
          <div className="stat-card-icon"><BarChart3 size={22} /></div>
          <div className="stat-card-value">{a.totalTasks}</div>
          <div className="stat-card-label">Total Tasks</div>
        </div>
        <div className="stat-card done">
          <div className="stat-card-icon"><CheckCircle2 size={22} /></div>
          <div className="stat-card-value">{a.completedCount}</div>
          <div className="stat-card-label">Completed</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-card-icon"><AlertTriangle size={22} /></div>
          <div className="stat-card-value">{a.overdueCount}</div>
          <div className="stat-card-label">Overdue</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-icon"><Percent size={22} /></div>
          <div className="stat-card-value">{a.slaCompliancePercentage}%</div>
          <div className="stat-card-label">SLA Compliance</div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* SLA Performance */}
        <div className="analytics-card">
          <h3>🎯 SLA Performance</h3>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Compliance Rate</span>
            <span className="analytics-metric-value">{a.slaCompliancePercentage}%</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Tasks Within SLA</span>
            <span className="analytics-metric-value" style={{ color: 'var(--color-success)' }}>{a.slaCompliantCount}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Overdue Tasks</span>
            <span className="analytics-metric-value" style={{ color: 'var(--color-danger)' }}>{a.overdueCount}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Avg SLA Utilization</span>
            <span className="analytics-metric-value">{a.averageSlaUtilization}%</span>
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div className="sla-bar" style={{ height: '10px' }}>
              <div
                className={`sla-bar-fill ${a.slaCompliancePercentage >= 80 ? 'green' : a.slaCompliancePercentage >= 50 ? 'yellow' : 'red'}`}
                style={{ width: `${Math.min(100, a.slaCompliancePercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Time Metrics */}
        <div className="analytics-card">
          <h3>⏱ Time Metrics</h3>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Avg SLA (Todo + Progress)</span>
            <span className="analytics-metric-value" style={{ fontWeight: 700 }}>
              {formatDuration(a.averageSlaSeconds ?? a.averageElapsedSeconds)}
            </span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Avg SLA (Completed Tasks)</span>
            <span className="analytics-metric-value">
              {formatDuration(a.averageSlaCompletedSeconds ?? a.averageElapsedCompletedSeconds)}
            </span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Total Completed</span>
            <span className="analytics-metric-value">{a.completedCount}</span>
          </div>
        </div>

        {/* Stage Breakdown */}
        <div className="analytics-card">
          <h3>📊 Avg Stage Durations (Completed)</h3>
          <div className="analytics-metric">
            <span className="analytics-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-status-todo)' }} /> To Do
            </span>
            <span className="analytics-metric-value">{formatDuration(a.averageStageDurations?.TODO || 0)}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-status-progress)' }} /> In Progress
            </span>
            <span className="analytics-metric-value">{formatDuration(a.averageStageDurations?.IN_PROGRESS || 0)}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-status-done)' }} /> Done
            </span>
            <span className="analytics-metric-value">{formatDuration(a.averageStageDurations?.DONE || 0)}</span>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="analytics-card">
          <h3>📈 Task Distribution</h3>
          <div className="analytics-metric">
            <span className="analytics-metric-label">To Do</span>
            <span className="analytics-metric-value">{a.todoCount}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">In Progress</span>
            <span className="analytics-metric-value">{a.inProgressCount}</span>
          </div>
          <div className="analytics-metric">
            <span className="analytics-metric-label">Done</span>
            <span className="analytics-metric-value">{a.doneCount}</span>
          </div>
          <div className="analytics-metric" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <span className="analytics-metric-label" style={{ fontWeight: 600 }}>Total</span>
            <span className="analytics-metric-value">{a.totalTasks}</span>
          </div>
        </div>
      </div>

      {/* Metric Definitions */}
      <div className="analytics-card" style={{ marginTop: 'var(--space-8)' }}>
        <h3>ℹ️ Metric Definitions</h3>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
          <p><strong>SLA Compliance %</strong>: Percentage of completed tasks that finished within their SLA limit.</p>
          <p><strong>Avg SLA Utilization</strong>: Average ratio of elapsed time to SLA limit across completed tasks.</p>
          <p><strong>Avg Elapsed (All)</strong>: Mean elapsed time across all tasks (including active ones).</p>
          <p><strong>Avg Elapsed (Completed)</strong>: Mean elapsed time for finished tasks only.</p>
          <p><strong>Overdue</strong>: A task whose total elapsed time exceeds its SLA limit.</p>
        </div>
      </div>
    </div>
  );
}
