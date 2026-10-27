import AllTasksPage from './AllTasksPage';

/**
 * My Tasks — same as All Tasks but conceptually filtered to the current user.
 * Since all tasks in the system are scoped to the authenticated user via
 * the backend (createdBy filter), this is identical. If we added shared tasks
 * later, this would filter by assigneeEmail matching the current user.
 */
export default function MyTasksPage() {
  return <AllTasksPage />;
}
