import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';

/**
 * Main app layout with sidebar and top bar.
 */

const pageTitles = {
  '/': 'Dashboard',
  '/tasks': 'All Tasks',
  '/grid': 'Grid View',
  '/kanban': 'Kanban Board',
  '/sections': 'Section View',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export default function Layout({ user, onLogout }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'TaskFlow';

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{title}</h1>
          </div>
          <div className="topbar-right">
            <GlobalSearch />
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
