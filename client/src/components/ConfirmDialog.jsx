import { X, AlertTriangle } from 'lucide-react';

/**
 * Confirmation dialog for destructive actions.
 */
export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', variant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2>{title || 'Confirm Action'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="confirm-dialog">
            <AlertTriangle size={48} color="var(--color-warning)" style={{ marginBottom: '16px' }} />
            <p>{message || 'Are you sure you want to proceed? This action cannot be undone.'}</p>
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
