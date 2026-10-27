import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { tasksAPI } from '../services/api';
import { formatDuration, getSlaInfo, getStatusInfo, getPriorityClass } from '../hooks/useSla';

/**
 * Global Search Component in Topbar Header
 * Real-time search across tasks with interactive results dropdown and navigation.
 */
export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await tasksAPI.getAll({ search: trimmed, limit: 6 });
        setResults(res.tasks || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectTask = (task) => {
    setIsOpen(false);
    navigate(`/tasks?search=${encodeURIComponent(task.title)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
      const trimmed = searchTerm.trim();
      if (trimmed) {
        navigate(`/tasks?search=${encodeURIComponent(trimmed)}`);
      } else {
        navigate('/tasks');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="global-search-container" ref={containerRef} style={{ position: 'relative', width: '320px' }}>
      <div className="search-box" style={{ width: '100%', position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }}
        />

        <input
          ref={inputRef}
          type="text"
          placeholder="Search tasks, assignee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => { if (searchTerm.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '8px 36px 8px 38px',
            borderRadius: 'var(--radius-full)',
            border: '1.5px solid var(--color-border)',
            fontSize: 'var(--font-size-sm)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            outline: 'none',
            transition: 'all var(--transition-fast)',
          }}
        />

        {loading ? (
          <Loader2
            size={14}
            className="spinner"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            title="Clear search"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Floating Interactive Results Dropdown */}
      {isOpen && searchTerm.trim() && (
        <div
          className="global-search-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              {loading ? 'Searching tasks...' : `No tasks found matching "${searchTerm}"`}
            </div>
          ) : (
            <div>
              <div style={{ padding: '8px 12px', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-light)' }}>
                TASKS ({results.length})
              </div>
              {results.map((task) => {
                const sla = getSlaInfo(task);
                const status = getStatusInfo(task.status);
                return (
                  <div
                    key={task._id}
                    onClick={() => handleSelectTask(task)}
                    className="global-search-item"
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border-light)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                        {task.title}
                      </span>
                      <span className={`badge ${getPriorityClass(task.priority)}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {task.priority}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      <span className={`badge ${status.className}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {status.label}
                      </span>
                      <span>·</span>
                      <span>{task.assigneeName}</span>
                      <span>·</span>
                      <span style={{ color: sla.isOverdue ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 500 }}>
                        {sla.isOverdue ? 'Overdue' : `${formatDuration(sla.remaining)} left`}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/tasks?search=${encodeURIComponent(searchTerm.trim())}`);
                }}
                style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  background: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>Press Enter or click to see all results in All Tasks</span>
                <ArrowRight size={14} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
