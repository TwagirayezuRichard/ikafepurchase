import { Bell, Menu, X } from 'lucide-react';

export default function Topbar({ title, subtitle, user, mobileMenuOpen, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="app-sidebar"
          onClick={onMenuClick}
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="user-pill">
          <span className="avatar">{user?.fullName?.slice(0, 1).toUpperCase() || 'U'}</span>
          <div>
            <strong>{user?.fullName || 'User'}</strong>
            <small>{user?.role || 'Role'}</small>
          </div>
        </div>
      </div>
    </header>
  );
}
