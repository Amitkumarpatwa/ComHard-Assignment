import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import FiltersBar from '../components/FiltersBar';
import { showToast } from '../components/Toast';
import { formatDuration, useLiveSla, getStatusInfo, getPriorityClass } from '../hooks/useSla';
import { Pencil, Trash2, ListTodo, Plus } from 'lucide-react';

/**
 * All Tasks — table/list view with search, filter, sort,
 * and explicit live SLA tracking for To Do, In Progress, and Total SLA duration.
 */
export default function AllTasksPage() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const {
    tasks,
    loading,
    error,
    filters,
    setFilters,
    createTask,
    updateTask,
    updateStatus,
    deleteTask
  } = useTasks(urlSearch ? { search: urlSearch } : {});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Sync if URL search param changes (e.g. from upper header search bar)
  useEffect(() => {
    if (urlSearch !== (filters.search || '')) {
      setFilters(prev => ({ ...prev, search: urlSearch }));
    }
  }, [urlSearch]);

  const handleCreate = () => { setEditingTask(null); setModalOpen(true); };
  const handleEdit = (task) => { setEditingTask(task); setModalOpen(true); };
  const handleDelete = (task) => setDeleteConfirm(task);

  const handleSubmit = async (data) => {
    if (editingTask) {
      await updateTask(editingTask._id, data);
      showToast('Task updated', 'success');
    } else {
      await createTask(data);
      showToast('Task created', 'success');
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteTask(deleteConfirm._id);
        showToast('Task deleted', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateStatus(taskId, newStatus);
      showToast(`Status updated`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <FiltersBar filters={filters} onFilterChange={setFilters} onCreateClick={handleCreate} />

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <ListTodo size={64} />
          <h3>No tasks found</h3>
          <p>Create a task or adjust your search and filters.</p>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={18} /> Create Task
          </button>
        </div>
      ) : (
        <div className="recent-tasks">
          <table className="recent-tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Priority</th>
                <th>To Do Period</th>
                <th>In Progress Period</th>
                <th>Total SLA Elapsed</th>
                <th>SLA Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} editingTask={editingTask} />
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Delete "${deleteConfirm?.title}"?`}
      />
    </div>
  );
}

function TaskRow({ task, onEdit, onDelete, onStatusChange }) {
  const sla = useLiveSla(task);
  const status = getStatusInfo(task.status);

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>
        <div>{task.title}</div>
        {task.description && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.description}
          </div>
        )}
      </td>
      <td>
        <div>{task.assigneeName}</div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{task.assigneeEmail}</div>
      </td>
      <td>
        <select
          className="form-select"
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          style={{ padding: '4px 24px 4px 8px', fontSize: 'var(--font-size-xs)', minWidth: 'auto' }}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </td>
      <td><span className={`badge ${getPriorityClass(task.priority)}`}>{task.priority}</span></td>

      {/* To Do Stage Duration */}
      <td>
        <div style={{ fontWeight: 600, color: task.status === 'TODO' ? 'var(--color-primary)' : 'var(--color-text)' }}>
          {formatDuration(sla.todoDuration)}
          {task.status === 'TODO' && <span style={{ color: 'var(--color-primary)', marginLeft: '4px' }} title="Ticking live">●</span>}
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {task.status === 'TODO' ? 'Active' : 'Completed'}
        </div>
      </td>

      {/* In Progress Stage Duration */}
      <td>
        <div style={{ fontWeight: 600, color: task.status === 'IN_PROGRESS' ? 'var(--color-warning)' : 'var(--color-text)' }}>
          {formatDuration(sla.inProgressDuration)}
          {task.status === 'IN_PROGRESS' && <span style={{ color: 'var(--color-warning)', marginLeft: '4px' }} title="Ticking live">●</span>}
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {task.status === 'IN_PROGRESS' ? 'Active' : task.status === 'DONE' ? 'Completed' : 'Not started'}
        </div>
      </td>

      {/* Total SLA Elapsed (both periods combined) */}
      <td>
        <div style={{ fontWeight: 700 }}>{formatDuration(sla.totalElapsed)}</div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Target: {task.slaMinutes}m</div>
      </td>

      {/* SLA Status & Remaining */}
      <td>
        <span className={`badge ${sla.isOverdue ? 'overdue' : 'on-track'}`}>
          {sla.isOverdue ? `Overdue (${formatDuration(sla.overdueBy)})` : `${formatDuration(sla.remaining)} left`}
        </span>
      </td>

      {/* Actions */}
      <td>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)} title="Edit">
            <Pencil size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(task)} title="Delete" style={{ color: 'var(--color-danger)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
