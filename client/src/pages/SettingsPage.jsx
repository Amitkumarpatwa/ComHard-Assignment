import { User, Shield, Info } from 'lucide-react';

/**
 * Settings page — displays user profile and app info.
 */
export default function SettingsPage({ user }) {
  return (
    <div>
      <div className="settings-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} /> Profile
        </h3>
        <div className="analytics-metric">
          <span className="analytics-metric-label">Full Name</span>
          <span className="analytics-metric-value">{user?.fullName}</span>
        </div>
        <div className="analytics-metric">
          <span className="analytics-metric-label">Email</span>
          <span className="analytics-metric-value">{user?.email}</span>
        </div>
        <div className="analytics-metric">
          <span className="analytics-metric-label">User ID</span>
          <span className="analytics-metric-value" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{user?.id}</span>
        </div>
      </div>

      <div className="settings-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} /> Security
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Your session is secured with HttpOnly cookies and JWT tokens. Passwords are hashed with bcrypt (12 rounds).
          All task data is scoped to your account — other users cannot see or modify your tasks.
        </p>
      </div>

      <div className="settings-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={20} /> About TaskFlow
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          TaskFlow is a MERN stack task management system with real-time SLA tracking.
          Built with React + Vite, Express.js, and MongoDB.
        </p>
        <div className="analytics-metric" style={{ marginTop: 'var(--space-3)' }}>
          <span className="analytics-metric-label">Version</span>
          <span className="analytics-metric-value">1.0.0</span>
        </div>
        <div className="analytics-metric">
          <span className="analytics-metric-label">Stack</span>
          <span className="analytics-metric-value">MERN</span>
        </div>
      </div>
    </div>
  );
}
