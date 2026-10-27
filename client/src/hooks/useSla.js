import { useState, useEffect, useRef } from 'react';

/**
 * SLA helper utilities.
 * Accurately tracks:
 * - Time in TODO stage (starts from 0 at creation)
 * - Time in IN_PROGRESS stage (starts from 0 when transitioning to in-progress)
 * - Overall SLA elapsed time (sum of both stage periods)
 */

/**
 * Format seconds into a readable duration string.
 * e.g. 125 → "2m 5s", 3661 → "1h 1m 1s"
 */
export function formatDuration(totalSeconds) {
  if (totalSeconds == null || totalSeconds < 0 || isNaN(totalSeconds)) return '0s';
  const s = Math.floor(totalSeconds);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m ${secs}s`;
}

/**
 * Compute the live and finalized duration for each stage:
 * - TODO duration: finalized TODO time + live TODO time (if currently in TODO)
 * - IN_PROGRESS duration: finalized IN_PROGRESS time + live IN_PROGRESS time (if currently IN_PROGRESS)
 * - Total SLA Elapsed: TODO duration + IN_PROGRESS duration (both time periods)
 */
export function getStageBreakdown(task) {
  if (!task) {
    return {
      todoDuration: 0,
      inProgressDuration: 0,
      totalElapsed: 0,
      currentStageDuration: 0,
      slaLimitSeconds: 1500,
      remaining: 1500,
      isOverdue: false,
      overdueBy: 0,
      utilization: 0,
    };
  }

  const now = Date.now();
  const currentStageDuration = (task.status !== 'DONE' && task.currentStageStartedAt)
    ? Math.max(0, Math.floor((now - new Date(task.currentStageStartedAt).getTime()) / 1000))
    : 0;

  const todoDuration = (task.stageTimeSeconds?.TODO || 0) + (task.status === 'TODO' ? currentStageDuration : 0);
  const inProgressDuration = (task.stageTimeSeconds?.IN_PROGRESS || 0) + (task.status === 'IN_PROGRESS' ? currentStageDuration : 0);
  const totalElapsed = todoDuration + inProgressDuration;

  const slaLimitSeconds = (task.slaMinutes || 25) * 60;
  const remaining = Math.max(0, slaLimitSeconds - totalElapsed);
  const isOverdue = totalElapsed > slaLimitSeconds;
  const overdueBy = isOverdue ? totalElapsed - slaLimitSeconds : 0;
  const utilization = slaLimitSeconds > 0 ? (totalElapsed / slaLimitSeconds) * 100 : 0;

  return {
    todoDuration,
    inProgressDuration,
    totalElapsed,
    currentStageDuration,
    slaLimitSeconds,
    remaining,
    isOverdue,
    overdueBy,
    utilization: Math.round(utilization * 100) / 100,
  };
}

/**
 * Total elapsed seconds (TODO + IN_PROGRESS duration).
 */
export function computeElapsed(task) {
  return getStageBreakdown(task).totalElapsed;
}

/**
 * Current active stage's live duration in seconds.
 */
export function computeCurrentStageDuration(task) {
  return getStageBreakdown(task).currentStageDuration;
}

/**
 * Get SLA metrics for a task.
 */
export function getSlaInfo(task) {
  return getStageBreakdown(task);
}

/**
 * Hook providing live-ticking stage durations and SLA status.
 * Updates every second while task is active.
 */
export function useLiveSla(task) {
  const [sla, setSla] = useState(() => getStageBreakdown(task));
  const intervalRef = useRef(null);

  useEffect(() => {
    // Immediate calculation
    setSla(getStageBreakdown(task));

    // Only tick when task is active (TODO or IN_PROGRESS)
    if (task && task.status !== 'DONE' && task.currentStageStartedAt) {
      intervalRef.current = setInterval(() => {
        setSla(getStageBreakdown(task));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    task?.status,
    task?.currentStageStartedAt,
    task?.stageTimeSeconds?.TODO,
    task?.stageTimeSeconds?.IN_PROGRESS,
    task?.slaMinutes,
  ]);

  return sla;
}

/**
 * Backward compatible hook returning just live total elapsed seconds.
 */
export function useLiveElapsed(task) {
  const sla = useLiveSla(task);
  return sla.totalElapsed;
}

/**
 * Priority color class mapping.
 */
export function getPriorityClass(priority) {
  switch (priority) {
    case 'HIGH': return 'priority-high';
    case 'MEDIUM': return 'priority-medium';
    case 'LOW': return 'priority-low';
    default: return '';
  }
}

/**
 * Status display badge information.
 */
export function getStatusInfo(status) {
  switch (status) {
    case 'TODO': return { label: 'To Do', className: 'status-todo' };
    case 'IN_PROGRESS': return { label: 'In Progress', className: 'status-in-progress' };
    case 'DONE': return { label: 'Done', className: 'status-done' };
    default: return { label: status, className: '' };
  }
}

/**
 * Format a date for display.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}
