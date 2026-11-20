import { Activity, BarChart3, Boxes, FileText, Grid2x2, LayoutDashboard, LogOut, Package, Settings, ShieldCheck, ShoppingCart, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import ikafeLogo from '../assets/ikafe-logo.png';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/purchase-requests', label: 'Purchase Requests', icon: ShoppingCart },
  { to: '/admin/items', label: 'Item Catalogue', icon: Boxes },
  { to: '/admin/categories', label: 'Categories', icon: Grid2x2 },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/history', label: 'Purchase History', icon: FileText },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/notifications', label: 'Notifications', icon: Package },
  { to: '/admin/activity', label: 'Activity Logs', icon: Activity },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/profile', label: 'Profile', icon: ShieldCheck },
];

const employeeLinks = [
  { to: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/new-request', label: 'New Purchase Request', icon: ShoppingCart },
  { to: '/employee/requests', label: 'My Requests', icon: FileText },
  { to: '/employee/profile', label: 'Profile', icon: ShieldCheck },
];

export default function Sidebar({ role, onLogout, mobileOpen, onNavigate }) {
  const links = role === 'admin' ? adminLinks : employeeLinks;

  return (
    <aside id="app-sidebar" className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand-box">
        <img className="brand-mark" src={ikafeLogo} alt="Ikafe Haven" />
        <div>
          <h2>RPMS</h2>
          <p>Request Portal</p>
        </div>
      </div>

      <nav className="nav-list">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/admin' || to === '/employee'} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="logout-button" onClick={onLogout}>
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
