import { Bell } from 'lucide-react';

export default function Topbar({ title, subtitle, user }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1>{title}</h1>
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
