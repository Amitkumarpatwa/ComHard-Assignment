import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';

/**
 * Reusable filter/search bar for task views.
 * Debounces search input for smooth typing and prevents API spam/flicker.
 */
export default function FiltersBar({
  filters = {},
  onFilterChange,
  onCreateClick,
  showStatusFilter = true,
}) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const isFirstRender = useRef(true);

  // Sync internal state when external filter changes (e.g., reset from outside)
  useEffect(() => {
    if ((filters.search || '') !== searchTerm) {
      setSearchTerm(filters.search || '');
    }
  }, [filters.search]);

  // Debounce search input to parent onFilterChange
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if ((filters.search || '') !== searchTerm) {
        onFilterChange({ ...filters, search: searchTerm });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm('');
    onFilterChange({ ...filters, search: '' });
  };

  return (
    <div className="filters-bar">
      {/* Search Input with Icon & Clear button */}
      <div style={{ position: 'relative', flex: '1 1 200px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          className="form-input"
          type="text"
          placeholder="Search by title, description, assignee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            paddingLeft: '34px',
            paddingRight: searchTerm ? '32px' : '12px',
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear search"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Status Filter (Optional for views that group by status) */}
      {showStatusFilter && (
        <select
          className="form-select"
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      )}

      {/* Priority Filter */}
      <select
        className="form-select"
        value={filters.priority || ''}
        onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
      >
        <option value="">All Priority</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      {/* Sort By Filter */}
      <select
        className="form-select"
        value={filters.sortBy || 'createdAt'}
        onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
      >
        <option value="createdAt">Newest First</option>
        <option value="priority">Priority</option>
        <option value="title">Title</option>
        <option value="slaMinutes">SLA Duration</option>
      </select>

      {/* Create Task Button */}
      {onCreateClick && (
        <button className="btn btn-primary" onClick={onCreateClick}>
          <Plus size={18} /> New Task
        </button>
      )}
    </div>
  );
}
