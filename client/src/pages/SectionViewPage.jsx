import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { formatDuration, computeElapsed, getSlaInfo, getStatusInfo, getPriorityClass, useLiveElapsed, useLiveSla } from '../hooks/useSla';
import FiltersBar from '../components/FiltersBar';
import { ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';

/**
 * Section View — grouped collapsible sections by status.
 */
export default function SectionViewPage() {
  const { tasks, loading, error, filters, setFilters, createTask, updateTask, updateStatus, deleteTask } = useTasks();
  const [collapsed, setCollapsed] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const toggleSection = (status) => {
    setCollapsed(prev => ({ ...prev, [status]: !prev[status] }));
  };

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
      showToast(`Task moved to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const sections = [
    { title: 'To Do', status: 'TODO', tasks: tasks.filter(t => t.status === 'TODO'), color: 'var(--color-status-todo)' },
    { title: 'In Progress', status: 'IN_PROGRESS', tasks: tasks.filter(t => t.status === 'IN_PROGRESS'), color: 'var(--color-status-progress)' },
    { title: 'Done', status: 'DONE', tasks: tasks.filter(t => t.status === 'DONE'), color: 'var(--color-status-done)' },
  ];

  return (
    <div>
      <FiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onCreateClick={handleCreate}
        showStatusFilter={false}
      />

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-spinner"><div className="spinner" /></div>}

      <div className="section-view">
        {sections.map(section => (
          <div key={section.status} className="section-group">
            <div
              className={`section-header ${collapsed[section.status] ? 'collapsed' : ''}`}
              onClick={() => toggleSection(section.status)}
            >
              <div className="section-header-left">
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: section.color }} />
                <span className="section-header-title">{section.title}</span>
                <span className="section-header-count">{section.tasks.length}</span>
              </div>
              <ChevronDown size={20} />
            </div>

            {!collapsed[section.status] && (
              <div className="section-body">
                {section.tasks.length === 0 ? (
                  <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    No tasks in this section
                  </div>
                ) : (
                  section.tasks.map(task => {
                    const sla = getSlaInfo(task);
                    const elapsed = computeElapsed(task);
                    return (
                      <SectionRow
                        key={task._id}
                        task={task}
                        sla={sla}
                        elapsed={elapsed}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editingTask={editingTask}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"?`}
      />
    </div>
  );
}

function SectionRow({ task, onEdit, onDelete, onStatusChange }) {
  const sla = useLiveSla(task);

  return (
    <div className="section-task-row">
      <div>
        <div className="section-task-title">{task.title}</div>
        <div className="section-task-subtitle">{task.assigneeName} · {task.assigneeEmail}</div>
      </div>
      <div>
        <span className={`badge ${getPriorityClass(task.priority)}`}>{task.priority}</span>
      </div>
      <div style={{ fontSize: 'var(--font-size-xs)' }}>
        <div><strong>{formatDuration(sla.totalElapsed)}</strong> / {task.slaMinutes}m</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '2px' }}>
          Todo: {formatDuration(sla.todoDuration)} · Prog: {formatDuration(sla.inProgressDuration)}
        </div>
      </div>
      <div>
        <span className={`badge ${sla.isOverdue ? 'overdue' : 'on-track'}`}>
          {sla.isOverdue ? `Overdue (${formatDuration(sla.overdueBy)})` : `${formatDuration(sla.remaining)} left`}
        </span>
      </div>
      <div>
        <select
          className="form-select"
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          style={{ padding: '4px 8px', fontSize: 'var(--font-size-xs)', minWidth: 'auto' }}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
      <div className="section-task-actions">
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
