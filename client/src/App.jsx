import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AllTasksPage from './pages/AllTasksPage';
import MyTasksPage from './pages/MyTasksPage';
import GridViewPage from './pages/GridViewPage';
import KanbanPage from './pages/KanbanPage';
import SectionViewPage from './pages/SectionViewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 */
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * GuestRoute — redirects to / if already authenticated.
 */
function GuestRoute({ user, children }) {
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading, login, register, logout } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={
          <GuestRoute user={user}>
            <LoginPage onLogin={login} />
          </GuestRoute>
        } />
        <Route path="/register" element={
          <GuestRoute user={user}>
            <RegisterPage onRegister={register} />
          </GuestRoute>
        } />

        {/* Protected routes inside Layout */}
        <Route element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={logout} />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<AllTasksPage />} />
          <Route path="my-tasks" element={<MyTasksPage />} />
          <Route path="grid" element={<GridViewPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="sections" element={<SectionViewPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage user={user} />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
