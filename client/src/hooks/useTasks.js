import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../services/api';

/**
 * Shared hook for fetching and managing tasks.
 * All views (Grid, Kanban, Section) use this same hook.
 */
export function useTasks(initialFilters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = { ...filters, ...params };
      const data = await tasksAPI.getAll(mergedParams);
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (taskData) => {
    const data = await tasksAPI.create(taskData);
    await fetchTasks();
    return data;
  }, [fetchTasks]);

  const updateTask = useCallback(async (id, taskData) => {
    const data = await tasksAPI.update(id, taskData);
    await fetchTasks();
    return data;
  }, [fetchTasks]);

  const updateStatus = useCallback(async (id, status) => {
    const data = await tasksAPI.updateStatus(id, status);
    await fetchTasks();
    return data;
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id) => {
    const data = await tasksAPI.delete(id);
    await fetchTasks();
    return data;
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  };
}
