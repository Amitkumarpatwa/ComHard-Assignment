import { useState } from 'react';
import {
  formatDuration,
  useLiveSla,
  getPriorityClass,
  getStatusInfo,
} from '../hooks/useSla';
import { Pencil, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Reusable TaskCard component used in Grid View and Kanban View.
 * Displays accurate SLA metrics with explicit breakdown for:
 * - To Do period duration (started at 0 upon creation)
 * - In Progress period duration (started at 0 upon entering In Progress)
 * - Total SLA Elapsed (both time periods combined against SLA target)
 */
export default function TaskCard({ task, onEdit, onDelete, onStatusChange, variant = 'grid' }) {
  const [changingStatus, setChangingStatus] = useState(false);
  const sla = useLiveSla(task);
  const statusInfo = getStatusInfo(task.status);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === task.status) return;
    setChangingStatus(true);
    try {
      await onStatusChange(task._id, newStatus);
    } catch (err) {
      // handled by parent toast
    } finally {
      setChangingStatus(false);
    }
  };

  const slaBarWidth = Math.min(100, Math.max(0, sla.utilization));
  const slaBarColor = sla.utilization <= 70 ? 'green' : sla.utilization <= 100 ? 'yellow' : 'red';
  const initials = (task.assigneeName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (variant === 'kanban') {
    return (
      <div className="kanban-card">
        <div className="kanban-card-title">{task.title}</div>
        <div className="kanban-card-meta">
          <span className={`badge ${getPriorityClass(task.priority)}`}>{task.priority}</span>
          <span className={`badge ${sla.isOverdue ? 'overdue' : 'on-track'}`}>
            {sla.isOverdue ? 'Overdue' : 'On Track'}
          </span>
        </div>

        <div className="kanban-card-sla">
          {/* Stage timing breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            fontSize: '11px',
            marginBottom: '6px',
            background: 'var(--color-bg)',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-light)'
          }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>To Do: </span>
              <strong>{formatDuration(sla.todoDuration)}</strong>
              {task.status === 'TODO' && <span style={{ color: 'var(--color-primary)', marginLeft: '2px' }}>●</span>}
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>In Prog: </span>
              <strong>{formatDuration(sla.inProgressDuration)}</strong>
              {task.status === 'IN_PROGRESS' && <span style={{ color: 'var(--color-warning)', marginLeft: '2px' }}>●</span>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: 'var(--font-size-xs)' }}>
            <span>Total SLA: <strong>{formatDuration(sla.totalElapsed)}</strong></span>
            <span>Limit: {task.slaMinutes}m</span>
          </div>

          <div className="sla-bar">
            <div className={`sla-bar-fill ${slaBarColor}`} style={{ width: `${slaBarWidth}%` }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: 'var(--font-size-xs)' }}>
            <span>{task.assigneeName}</span>
            <span style={{ color: sla.isOverdue ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
              {sla.isOverdue ? `Overdue by ${formatDuration(sla.overdueBy)}` : `${formatDuration(sla.remaining)} left`}
            </span>
          </div>
        </div>

        <div className="kanban-card-actions">
          {task.status !== 'TODO' && (
            <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange('TODO')} disabled={changingStatus}>
              → Todo
            </button>
          )}
          {task.status !== 'IN_PROGRESS' && (
            <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange('IN_PROGRESS')} disabled={changingStatus}>
              → Progress
            </button>
          )}
          {task.status !== 'DONE' && (
            <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange('DONE')} disabled={changingStatus}>
              → Done
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)} title="Edit">
            <Pencil size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(task)} title="Delete" style={{ color: 'var(--color-danger)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div className="task-card">
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>
          <span className={`badge ${getPriorityClass(task.priority)}`}>{task.priority}</span>
        </div>
      </div>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-card-assignee">
        <span className="task-card-assignee-avatar">{initials}</span>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{task.assigneeName}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{task.assigneeEmail}</div>
        </div>
      </div>

      {/* Stage Durations & SLA Tracker */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        padding: '8px 10px',
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-light)',
        fontSize: 'var(--font-size-xs)',
        margin: 'var(--space-3) 0 var(--space-2)'
      }}>
        <div>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '2px' }}>To Do Period:</div>
          <div style={{ fontWeight: 600, color: task.status === 'TODO' ? 'var(--color-primary)' : 'var(--color-text)' }}>
            {formatDuration(sla.todoDuration)} {task.status === 'TODO' && <span title="Live active stage">●</span>}
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '2px' }}>In Progress Period:</div>
          <div style={{ fontWeight: 600, color: task.status === 'IN_PROGRESS' ? 'var(--color-warning)' : 'var(--color-text)' }}>
            {formatDuration(sla.inProgressDuration)} {task.status === 'IN_PROGRESS' && <span title="Live active stage">●</span>}
          </div>
        </div>
      </div>

      <dl className="task-card-sla">
        <dt>Total SLA Elapsed</dt>
        <dd style={{ fontWeight: 700 }}>{formatDuration(sla.totalElapsed)}</dd>
        <dt>SLA Limit</dt>
        <dd>{task.slaMinutes}m</dd>
        <dt>Remaining</dt>
        <dd style={{ color: sla.isOverdue ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
          {sla.isOverdue ? `Overdue by ${formatDuration(sla.overdueBy)}` : formatDuration(sla.remaining)}
        </dd>
      </dl>

      <div className="sla-bar">
        <div className={`sla-bar-fill ${slaBarColor}`} style={{ width: `${slaBarWidth}%` }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
        <span>
          {sla.isOverdue ? (
            <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <AlertTriangle size={12} /> Overdue
            </span>
          ) : (
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> On Track
            </span>
          )}
        </span>
        <span>{Math.round(sla.utilization)}% SLA used</span>
      </div>

      <div className="task-card-actions">
        <select
          className="form-select"
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={changingStatus}
          style={{ flex: 1, padding: '6px 8px', fontSize: 'var(--font-size-xs)' }}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)} title="Edit task">
          <Pencil size={16} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onDelete(task)} title="Delete task" style={{ color: 'var(--color-danger)' }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
