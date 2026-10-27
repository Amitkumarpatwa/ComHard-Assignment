import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import FiltersBar from '../components/FiltersBar';

/**
 * Kanban Board — three columns: Todo, In Progress, Done.
 * Status changes via buttons on each card.
 */
export default function KanbanPage() {
  const { tasks, loading, error, filters, setFilters, createTask, updateTask, updateStatus, deleteTask } = useTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

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

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus(id, status);
      showToast(`Task moved to ${status.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const columns = [
    { title: 'To Do', status: 'TODO', tasks: todoTasks, color: 'var(--color-status-todo)' },
    { title: 'In Progress', status: 'IN_PROGRESS', tasks: inProgressTasks, color: 'var(--color-status-progress)' },
    { title: 'Done', status: 'DONE', tasks: doneTasks, color: 'var(--color-status-done)' },
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

      <div className="kanban-board">
        {columns.map(col => (
          <div key={col.status} className="kanban-column">
            <div className="kanban-column-header">
              <div className="kanban-column-title">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                {col.title}
              </div>
              <span className="kanban-column-count">{col.tasks.length}</span>
            </div>
            <div className="kanban-column-body">
              {col.tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  No tasks
                </div>
              ) : (
                col.tasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    variant="kanban"
                  />
                ))
              )}
            </div>
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
