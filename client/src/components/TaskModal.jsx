import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Task create/edit modal form.
 * When editing, pre-fills fields but never exposes or resets timing data.
 */
export default function TaskModal({ isOpen, onClose, onSubmit, editingTask }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeName: '',
    assigneeEmail: '',
    priority: 'MEDIUM',
    slaMinutes: 25,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title || '',
        description: editingTask.description || '',
        assigneeName: editingTask.assigneeName || '',
        assigneeEmail: editingTask.assigneeEmail || '',
        priority: editingTask.priority || 'MEDIUM',
        slaMinutes: editingTask.slaMinutes || 25,
      });
    } else {
      setForm({
        title: '',
        description: '',
        assigneeName: '',
        assigneeEmail: '',
        priority: 'MEDIUM',
        slaMinutes: 25,
      });
    }
    setErrors({});
  }, [editingTask, isOpen]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.assigneeName.trim()) errs.assigneeName = 'Assignee name is required';
    if (!form.assigneeEmail.trim()) {
      errs.assigneeEmail = 'Assignee email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.assigneeEmail)) {
      errs.assigneeEmail = 'Invalid email format';
    }
    if (form.slaMinutes < 1 || form.slaMinutes > 10080) {
      errs.slaMinutes = 'SLA must be between 1 and 10080 minutes';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        slaMinutes: Number(form.slaMinutes),
      });
      onClose();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.submit && <div className="error-message">{errors.submit}</div>}

            <div className="form-group">
              <label htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                className="form-input"
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter task title"
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                className="form-input"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter task description (optional)"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label htmlFor="task-assignee-name">Assignee Name *</label>
                <input
                  id="task-assignee-name"
                  className="form-input"
                  type="text"
                  value={form.assigneeName}
                  onChange={(e) => handleChange('assigneeName', e.target.value)}
                  placeholder="Name"
                />
                {errors.assigneeName && <div className="form-error">{errors.assigneeName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="task-assignee-email">Assignee Email *</label>
                <input
                  id="task-assignee-email"
                  className="form-input"
                  type="email"
                  value={form.assigneeEmail}
                  onChange={(e) => handleChange('assigneeEmail', e.target.value)}
                  placeholder="email@example.com"
                />
                {errors.assigneeEmail && <div className="form-error">{errors.assigneeEmail}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="task-sla">SLA (minutes)</label>
                <input
                  id="task-sla"
                  className="form-input"
                  type="number"
                  min="1"
                  max="10080"
                  value={form.slaMinutes}
                  onChange={(e) => handleChange('slaMinutes', e.target.value)}
                />
                {errors.slaMinutes && <div className="form-error">{errors.slaMinutes}</div>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
