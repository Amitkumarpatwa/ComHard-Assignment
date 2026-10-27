import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, User, Grid3X3, Columns3, Layers, BarChart3,
  Settings, LogOut, Zap, Menu, X
} from 'lucide-react';
import { useState } from 'react';

/**
 * App sidebar with navigation links.
 */
export default function Sidebar({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'All Tasks', path: '/tasks', icon: <ListTodo size={20} /> },
  ];

  const viewItems = [
    { label: 'Grid View', path: '/grid', icon: <Grid3X3 size={20} /> },
    { label: 'Kanban Board', path: '/kanban', icon: <Columns3 size={20} /> },
    { label: 'Section View', path: '/sections', icon: <Layers size={20} /> },
  ];

  const toolItems = [
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon"><Zap size={20} /></div>
          <h2>TaskFlow</h2>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main</span>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          <span className="sidebar-section-label">Views</span>
          {viewItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          <span className="sidebar-section-label">Tools</span>
          {toolItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.fullName}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <button
            className="sidebar-link"
            onClick={handleLogout}
            style={{ width: '100%', marginTop: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
