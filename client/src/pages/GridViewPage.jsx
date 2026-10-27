import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import FiltersBar from '../components/FiltersBar';
import { showToast } from '../components/Toast';
import { Grid3X3, Plus } from 'lucide-react';

/**
 * Grid View page — displays tasks as responsive cards.
 */
export default function GridViewPage() {
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
      showToast('Task updated successfully', 'success');
    } else {
      await createTask(data);
      showToast('Task created successfully', 'success');
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

  return (
    <div>
      <FiltersBar filters={filters} onFilterChange={setFilters} onCreateClick={handleCreate} />

      {loading && <div className="loading-spinner"><div className="spinner" /></div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state">
          <Grid3X3 size={64} />
          <h3>No tasks found</h3>
          <p>Create your first task or adjust your filters.</p>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={18} /> Create Task
          </button>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="task-grid">
          {tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              variant="grid"
            />
          ))}
        </div>
      )}

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
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This cannot be undone.`}
      />
    </div>
  );
}
