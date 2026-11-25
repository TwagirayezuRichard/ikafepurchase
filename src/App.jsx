import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StatCard from './components/StatCard';
import api from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import ikafeLogo from './assets/ikafe-logo.png';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  return children;
}

function DashboardShell({ role, title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setLogoutError('');
    setMobileMenuOpen(false);
    try {
      await logout();
    } catch {
      setLogoutError('The session was cleared locally, but the server could not confirm logout.');
    }
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <Sidebar
        role={role}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onNavigate={() => setMobileMenuOpen(false)}
      />
      <main className="main-panel">
        <Topbar
          title={title}
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          onMenuClick={() => setMobileMenuOpen((open) => !open)}
        />
        <div className="content-panel">
          {logoutError && <div className="alert error">{logoutError}</div>}
          {children}
        </div>
      </main>
    </div>
  );
}

function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="search-box">
      <Search size={16} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginStage, setLoginStage] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const [installError, setInstallError] = useState('');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setIsAndroid(/Android/i.test(userAgent));
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true
    );

    const handleInstallPrompt = (event) => {
      setInstallPrompt(event);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      window.ikafeInstallPrompt = null;
    };

    if (window.ikafeInstallPrompt) {
      handleInstallPrompt(window.ikafeInstallPrompt);
    }
    window.addEventListener('ikafeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('ikafeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      setInstallError('');
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        window.ikafeInstallPrompt = null;
        setInstallPrompt(null);
        setInstallHelp(outcome !== 'accepted');
        setIsInstalled(outcome === 'accepted');
        return;
      } catch {
        setInstallError('Automatic installation could not be opened. Use your browser menu to install the app.');
        setInstallPrompt(null);
        window.ikafeInstallPrompt = null;
      }
    }
    setInstallHelp(true);
  };

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/employee');
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setLoginStage('Signing in...');

    try {
      const result = await login(form);
      navigate(result.user.role === 'admin' ? '/admin' : '/employee');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('The server did not respond within 12 seconds. It may be starting up—please wait a few seconds and try again.');
      } else if (!err.response) {
        setError('Unable to connect to the server. Check your internet connection and try again.');
      } else {
        setError(err.response.data?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
      setLoginStage('');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img className="brand-mark large" src={ikafeLogo} alt="Ikafe Haven" />
          <div>
            <p className="eyebrow">Restaurant Management</p>
            <h1>Purchase Request Portal</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email address</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@restaurant.com"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="••••••••"
            />
          </label>

          {error && <div className="alert error">{error}</div>}

          <button type="submit" disabled={loading} className="primary-button">
            {loading ? loginStage : 'Login'}
          </button>
        </form>

        <div className="mobile-download">
          <p>Use Ikafe Haven on your phone</p>
          {isInstalled ? (
            <div className="ios-install">App installed — open Ikafepurcharseapp from your home screen.</div>
          ) : installPrompt ? (
            <button type="button" className="download-button" onClick={handleInstall}>
              Install Ikafepurcharseapp
            </button>
          ) : isIOS ? (
            <div className="ios-install">
              Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
            </div>
          ) : (
            <>
              <button type="button" className="download-button" onClick={handleInstall}>
                Install Ikafepurcharseapp
              </button>
              {installError && <p className="alert error" role="status">{installError}</p>}
              {installHelp && (
                <p className="install-help">
                  {isAndroid
                    ? <>In Chrome, tap <strong>⋮</strong>, then <strong>Install app</strong> or <strong>Add to Home screen</strong>.</>
                    : <>Open this website in Chrome on Android, then use <strong>⋮ → Install app</strong> or <strong>Add to Home screen</strong>.</>}
                </p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const [stats, setStats] = useState({ stats: {}, recentRequests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/dashboard')
      .then((response) => setStats(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Dashboard data could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell role="admin" title="Administrator Dashboard">
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <div className="loading">Loading dashboard...</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Total Requests" value={stats.stats.totalRequests || 0} accent="#0f172a" />
            <StatCard label="Pending" value={stats.stats.pending || 0} accent="#f59e0b" />
            <StatCard label="Approved" value={stats.stats.approved || 0} accent="#22c55e" />
            <StatCard label="Rejected" value={stats.stats.rejected || 0} accent="#ef4444" />
            <StatCard label="Purchased" value={stats.stats.purchased || 0} accent="#10b981" />
            <StatCard label="Partially Purchased" value={stats.stats.partiallyPurchased || 0} accent="#2563eb" />
            <StatCard label="Line Items" value={stats.stats.totalLineItems || 0} accent="#2563eb" />
            <StatCard label="Notification Failures" value={stats.stats.notificationFailures || 0} accent="#ef4444" />
          </div>

          <div className="card">
            <div className="section-header">
              <h3>Recent Requests</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Requested By</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentRequests || []).map((request) => (
                  <tr key={request._id}>
                      <td><a href={`/admin/request/${request._id}`} className="table-link">{request.requestNumber}</a></td>
                    <td>{request.requestedBy?.fullName || 'Unknown'}</td>
                    <td>{request.department}</td>
                    <td><span className={`status-badge ${String(request.status).toLowerCase()}`}>{request.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function PurchaseRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/purchase-requests', { params: { status: status || undefined, department: department || undefined, search: search || undefined } })
      .then((response) => setRequests(response.data.requests || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Requests could not be loaded.'));
  }, [status, department, search]);

  return (
    <DashboardShell role="admin" title="Purchase Requests">
      <div className="card">
        <div className="section-header">
          <h3>All Requests</h3>
          <div className="toolbar-controls">
            <SearchField value={search} onChange={setSearch} placeholder="Search request ID" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="PENDING_APPROVAL">Pending approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PARTIALLY_PURCHASED">Partially purchased</option>
              <option value="PURCHASED">Purchased</option>
            </select>
            <select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department">
              <option value="">All departments</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Stock">Stock</option>
            </select>
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requested By</th>
              <th>Department</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td>{request.requestNumber}</td>
                <td>{request.requestedBy?.fullName || 'Unknown'}</td>
                <td>{request.department}</td>
                <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                <td><span className={`status-badge ${String(request.status).toLowerCase()}`}>{request.status}</span></td>
                <td><a href={`/admin/request/${request._id}`} className="table-link">View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function AdminRequestDetailsPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [purchaseValues, setPurchaseValues] = useState({});
  const [commentText, setCommentText] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get(`/purchase-requests/${id}`)
      .then((response) => {
        setRequest(response.data);
        setPurchaseValues(Object.fromEntries(response.data.items.map((item) => [item.itemId, item.quantityPurchased || 0])));
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Request details could not be loaded.'));
  }, [id]);

  useEffect(() => {
    let active = true;
    let loading = false;
    const loadNotifications = () => api.get(`/notifications/request/${id}`)
      .then((response) => {
        if (active) setNotifications(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Notification statuses could not be loaded.');
      });

    const pollNotifications = async () => {
      if (loading) return;
      loading = true;
      try {
        await loadNotifications();
      } finally {
        loading = false;
      }
    };

    pollNotifications();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') pollNotifications();
    }, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [id]);

  const runAction = async (action, body = {}) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/purchase-requests/${id}/${action}`, body);
      const response = await api.get(`/purchase-requests/${id}`);
      setRequest(response.data);
      setPurchaseValues(Object.fromEntries(response.data.items.map((item) => [item.itemId, item.quantityPurchased || 0])));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The request could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  const reject = () => {
    const rejectionReason = window.prompt('Enter a reason for rejecting this request:');
    if (rejectionReason?.trim()) runAction('reject', { rejectionReason });
  };

  const savePurchaseProgress = () => runAction('purchase-progress', {
    itemUpdates: request.items.map((item) => ({
      itemId: item.itemId,
      quantityPurchased: Number(purchaseValues[item.itemId] ?? item.quantityPurchased ?? 0),
    })),
  });

  const addComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/purchase-requests/${id}/comments`, { text: commentText });
      setCommentText('');
      const response = await api.get(`/purchase-requests/${id}`);
      setRequest(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Comment could not be added.');
    } finally {
      setSaving(false);
    }
  };

  if (!request) {
    return (
      <DashboardShell role="admin" title="Request Details">
        {error ? <div className="alert error">{error}</div> : <div className="loading">Loading request...</div>}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title={`Request ${request.requestNumber}`}>
      {error && <div className="alert error">{error}</div>}
      <div className="detail-grid">
        <div className="card">
          <h3>Request Summary</h3>
          <div className="detail-list">
            <div><span>Requested by</span><strong>{request.requestedBy?.fullName}</strong></div>
            <div><span>Department</span><strong>{request.department}</strong></div>
            <div><span>Status</span><strong>{request.status}</strong></div>
            <div><span>Submitted</span><strong>{new Date(request.createdAt).toLocaleString()}</strong></div>
            {request.notes && <div><span>Additional notes</span><strong>{request.notes}</strong></div>}
          </div>
        </div>

        <div className="card">
          <h3>Actions</h3>
          <div className="action-stack">
            {request.status === 'PENDING_APPROVAL' && (
              <>
                <button type="button" disabled={saving} className="primary-button small" onClick={() => runAction('approve')}>Approve</button>
                <button type="button" disabled={saving} className="warning-button small" onClick={reject}>Reject</button>
              </>
            )}
            {['APPROVED', 'PARTIALLY_PURCHASED'].includes(request.status) && (
              <button type="button" disabled={saving} className="primary-button small" onClick={savePurchaseProgress}>
                {saving ? 'Saving...' : 'Save purchase progress'}
              </button>
            )}
            <button type="button" className="secondary-button small" onClick={() => window.print()}>Print</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Requested Items</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Purchased</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {request.items.map((item, index) => (
              <tr key={`${item.itemId}-${index}`}>
                <td>{item.itemNameSnapshot}</td>
                <td>{item.quantityRequested}</td>
                <td>{item.unitSnapshot}</td>
                <td>
                  {['APPROVED', 'PARTIALLY_PURCHASED'].includes(request.status) ? (
                    <input
                      type="number"
                      min="0"
                      max={item.quantityRequested}
                      step="any"
                      value={purchaseValues[item.itemId] ?? item.quantityPurchased ?? 0}
                      onChange={(event) => setPurchaseValues((current) => ({ ...current, [item.itemId]: event.target.value }))}
                    />
                  ) : (item.quantityPurchased || 0)}
                </td>
                <td>{Math.max(0, item.quantityRequested - (Number(purchaseValues[item.itemId]) || 0))} {item.unitSnapshot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card comments-card">
        <h3>Request comments</h3>
        <div className="comment-list">
          {(request.comments || []).map((comment) => (
            <div className="comment-item" key={comment._id}>
              <strong>{comment.userId?.fullName || 'User'}</strong>
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
              <p>{comment.text}</p>
            </div>
          ))}
          {!request.comments?.length && <p className="muted">No comments yet.</p>}
        </div>
        <form className="comment-form" onSubmit={addComment}>
          <textarea maxLength="2000" required rows="3" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment" />
          <button type="submit" className="primary-button small" disabled={saving}>Add comment</button>
        </form>
      </div>
      <div className="card">
        <h3>Notification delivery status</h3>
        <table className="data-table">
          <thead><tr><th>Channel</th><th>Recipient</th><th>Status</th><th>Attempts</th><th>Last error</th></tr></thead>
          <tbody>
            {notifications.map((notification) => (
              <tr key={notification._id}>
                <td>{notification.channel}</td>
                <td>{notification.recipient}</td>
                <td><span className={`status-badge ${notification.status}`}>{notification.status}</span></td>
                <td>{notification.attempts}</td>
                <td>{notification.errorMessage || '—'}</td>
              </tr>
            ))}
            {!notifications.length && <tr><td colSpan="5">No notifications have been queued.</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function ItemCataloguePage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({ name: '', categoryId: '', unit: '', description: '', minimumStockLevel: 0 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([api.get('/items'), api.get('/categories')]);
      setItems(itemsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Catalogue data could not be loaded.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/items/${editingId}`, form);
      } else {
        await api.post('/items', form);
      }
      setForm({ name: '', categoryId: '', unit: '', description: '', minimumStockLevel: 0 });
      setEditingId('');
      setFormOpen(false);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Item could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = async (item) => {
    try {
      await api.patch(`/items/${item._id}/status`, { isActive: !item.isActive });
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Item status could not be changed.');
    }
  };

  const editItem = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      categoryId: item.categoryId?._id || '',
      unit: item.unit,
      description: item.description || '',
      minimumStockLevel: item.minimumStockLevel || 0,
    });
    setFormOpen(true);
  };

  const filteredItems = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardShell role="admin" title="Item Catalogue">
      <div className="card">
        <div className="section-header">
          <h3>Catalogue Items</h3>
          <button type="button" className="primary-button small" onClick={() => {
            setEditingId('');
            setForm({ name: '', categoryId: '', unit: '', description: '', minimumStockLevel: 0 });
            setFormOpen((open) => !open);
          }}>Add Item</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        {formOpen && (
          <form className="inline-form" onSubmit={saveItem}>
            <label><span>Item name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label><span>Category</span>
              <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">Select category</option>
                {categories.filter((category) => category.isActive).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </label>
            <label><span>Unit</span><input required placeholder="Kg, Litres, Pieces" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></label>
            <label><span>Minimum stock level</span><input type="number" min="0" step="any" value={form.minimumStockLevel} onChange={(event) => setForm({ ...form, minimumStockLevel: event.target.value })} /></label>
            <label className="wide-field"><span>Description</span><input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <button type="submit" className="primary-button small" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Item' : 'Save Item'}</button>
            <button type="button" className="ghost-button small" onClick={() => { setFormOpen(false); setEditingId(''); }}>Cancel</button>
          </form>
        )}
        <div className="catalogue-toolbar">
          <SearchField value={search} onChange={setSearch} placeholder="Search catalogue items" />
          <span className="muted">Showing {filteredItems.length} of {items.length} items</span>
        </div>
        <div className="catalogue-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.categoryId?.name || 'Uncategorized'}</td>
                  <td>{item.unit}</td>
                  <td><span className={`status-badge ${item.isActive ? 'approved' : 'rejected'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="table-actions"><button type="button" className="ghost-button small" onClick={() => editItem(item)}>Edit</button><button type="button" className="ghost-button small" onClick={() => toggleItem(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
              {!filteredItems.length && <tr><td colSpan="5" className="muted">No catalogue items match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');

  const loadCategories = () => api.get('/categories').then((response) => setCategories(response.data))
    .catch((requestError) => setError(requestError.response?.data?.message || 'Categories could not be loaded.'));
  useEffect(() => {
    loadCategories();
  }, []);

  const saveCategory = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) await api.put(`/categories/${editingId}`, form);
      else await api.post('/categories', form);
      setForm({ name: '', description: '' });
      setEditingId('');
      setFormOpen(false);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Category could not be saved.');
    }
  };

  const toggleCategory = async (category) => {
    try {
      await api.patch(`/categories/${category._id}/status`, { isActive: !category.isActive });
      await loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Category status could not be changed.');
    }
  };

  const editCategory = (category) => {
    setEditingId(category._id);
    setForm({ name: category.name, description: category.description || '' });
    setFormOpen(true);
  };

  return (
    <DashboardShell role="admin" title="Categories">
      <div className="card">
        <div className="section-header">
          <h3>Available Categories</h3>
          <button type="button" className="primary-button small" onClick={() => {
            setEditingId('');
            setForm({ name: '', description: '' });
            setFormOpen((open) => !open);
          }}>New Category</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        {formOpen && (
          <form className="inline-form" onSubmit={saveCategory}>
            <label><span>Name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label><span>Description</span><input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <button type="submit" className="primary-button small">{editingId ? 'Update Category' : 'Save Category'}</button>
            <button type="button" className="ghost-button small" onClick={() => { setFormOpen(false); setEditingId(''); }}>Cancel</button>
          </form>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td>{category.name}</td>
                <td>{category.description}</td>
                <td><span className={`status-badge ${category.isActive ? 'approved' : 'rejected'}`}>{category.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="table-actions"><button type="button" className="ghost-button small" onClick={() => editCategory(category)}>Edit</button><button type="button" className="ghost-button small" onClick={() => toggleCategory(category)}>{category.isActive ? 'Deactivate' : 'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function EmployeesPage() {
  const [users, setUsers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'kitchen_manager',
    phoneNumber: '',
  });

  const loadUsers = () => api.get('/users').then((response) => setUsers(response.data))
    .catch((requestError) => setError(requestError.response?.data?.message || 'Employees could not be loaded.'));
  useEffect(() => {
    loadUsers();
  }, []);

  const saveEmployee = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editingId) {
        const { password, ...userDetails } = form;
        await api.put(`/users/${editingId}`, userDetails);
      } else {
        await api.post('/users', form);
      }
      setForm({ fullName: '', email: '', password: '', role: 'kitchen_manager', phoneNumber: '' });
      setEditingId('');
      setFormOpen(false);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Employee could not be created.');
    }
  };

  const toggleEmployee = async (employee) => {
    try {
      await api.patch(`/users/${employee._id}/status`, { isActive: !employee.isActive });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Employee status could not be changed.');
    }
  };

  const editEmployee = (employee) => {
    setEditingId(employee._id);
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      password: '',
      role: employee.role,
      phoneNumber: employee.phoneNumber || '',
    });
    setFormOpen(true);
  };

  return (
    <DashboardShell role="admin" title="Employees">
      <div className="card">
        <div className="section-header">
          <h3>System Users</h3>
          <button type="button" className="primary-button small" onClick={() => {
            setEditingId('');
            setForm({ fullName: '', email: '', password: '', role: 'kitchen_manager', phoneNumber: '' });
            setFormOpen((open) => !open);
          }}>Add Employee</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        {formOpen && (
          <form className="inline-form" onSubmit={saveEmployee}>
            <label><span>Full name</span><input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
            <label><span>Email</span><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            {!editingId && <label><span>Temporary password (12+ characters)</span><input required minLength="12" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>}
            <label><span>Phone number</span><input value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} /></label>
            <label><span>Role</span>
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="admin">Administrator</option>
                <option value="kitchen_manager">Kitchen Manager</option>
                <option value="stock_manager">Stock Manager</option>
              </select>
            </label>
            <button type="submit" className="primary-button small">{editingId ? 'Update Employee' : 'Create Account'}</button>
            <button type="button" className="ghost-button small" onClick={() => { setFormOpen(false); setEditingId(''); }}>Cancel</button>
          </form>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.department}</td>
                <td><span className={`status-badge ${user.isActive ? 'approved' : 'rejected'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="table-actions"><button type="button" className="ghost-button small" onClick={() => editEmployee(user)}>Edit</button><button type="button" className="ghost-button small" onClick={() => toggleEmployee(user)}>{user.isActive ? 'Deactivate' : 'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function PurchaseHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/purchase-requests')
      .then((response) => setRequests(response.data.requests || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Purchase history could not be loaded.'));
  }, []);

  return (
    <DashboardShell role="admin" title="Purchase History">
      <div className="card">
        {error && <div className="alert error">{error}</div>}
        <div className="section-header"><h3>Historical Requests</h3><button type="button" className="secondary-button small" onClick={() => window.print()}>Print</button></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td>{request.requestNumber}</td>
                <td>{request.requestedBy?.fullName}</td>
                <td><span className={`status-badge ${String(request.status).toLowerCase()}`}>{request.status}</span></td>
                <td>{new Date(request.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function ReportsPage() {
  const [report, setReport] = useState({ daily: [], monthly: [], departments: [], itemDemand: [], consolidated: [] });
  const [requests, setRequests] = useState([]);
  const [selectedIds, setSelectedIds] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/reports/daily'),
      api.get('/reports/consolidated-purchase-list', { params: { requestIds: selectedIds === null ? undefined : selectedIds.join(',') } }),
      api.get('/purchase-requests', { params: { limit: 100 } }),
    ]).then(([dailyResponse, consolidatedResponse, requestsResponse]) => {
      setReport({ ...dailyResponse.data, consolidated: consolidatedResponse.data });
      setRequests((requestsResponse.data.requests || []).filter((request) => ['APPROVED', 'PARTIALLY_PURCHASED'].includes(request.status)));
    }).catch((requestError) => setError(requestError.response?.data?.message || 'Reports could not be loaded.'));
  }, [selectedIds]);

  const exportCsv = async () => {
    await exportFile('csv');
  };

  const exportFile = async (format) => {
    try {
      const response = await api.get(`/reports/export/${format}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `purchase-requests.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'CSV export failed.');
    }
  };

  return (
    <DashboardShell role="admin" title="Reports">
      {error && <div className="alert error">{error}</div>}
      <div className="section-header report-tools"><h3>Purchase analytics</h3><div className="toolbar-controls"><button type="button" className="secondary-button small" onClick={() => exportFile('pdf')}>Export PDF</button><button type="button" className="primary-button small" onClick={exportCsv}>Export CSV</button></div></div>
      <div className="stats-compact">
        <div className="card report-box">
          <h3>Requests per day</h3>
          <div className="bar-chart">
            {report.daily.map((entry) => (
              <div key={entry.date} className="bar" style={{ height: `${Math.max(entry.count * 12, 4)}px` }} title={`${entry.date}: ${entry.count}`} />
            ))}
          </div>
        </div>

        <div className="card report-box">
          <h3>Consolidated Purchase List</h3>
          <label className="select-all-row">
            <input
              type="checkbox"
              checked={selectedIds === null || (requests.length > 0 && selectedIds.length === requests.length)}
              onChange={(event) => setSelectedIds(event.target.checked ? null : [])}
            />
            <span>Consolidate all eligible requests</span>
          </label>
          <div className="request-select-list">
            {requests.map((request) => (
              <label key={request._id}>
                <input
                  type="checkbox"
                  checked={selectedIds === null || selectedIds.includes(request._id)}
                  onChange={(event) => setSelectedIds((current) => {
                    if (current === null) {
                      return event.target.checked ? null : requests.filter((entry) => entry._id !== request._id).map((entry) => entry._id);
                    }
                    return event.target.checked
                      ? [...current, request._id]
                      : current.filter((requestId) => requestId !== request._id);
                  })}
                />
                <span>{request.requestNumber} · {request.department}</span>
              </label>
            ))}
            {!requests.length && <span className="muted">No approved requests are open.</span>}
          </div>
          <ul className="list-plain">
            {report.consolidated.slice(0, 10).map((entry) => (
              <li key={entry.itemId}>
                {entry.item}: {entry.totalQuantity} {entry.unit}
              </li>
            ))}
            {!report.consolidated.length && <li>No approved items remain to purchase.</li>}
          </ul>
        </div>
      </div>
      <div className="stats-compact report-lower">
        <div className="card">
          <h3>Requests by department</h3>
          <ul className="list-plain">{report.departments.map((entry) => <li key={entry.department}>{entry.department}: {entry.count}</li>)}</ul>
        </div>
        <div className="card">
          <h3>Top requested items</h3>
          <ul className="list-plain">{report.itemDemand.slice(0, 8).map((entry) => <li key={entry.itemId}>{entry.item}: {entry.quantityRequested} {entry.unit}</li>)}</ul>
        </div>
      </div>
    </DashboardShell>
  );
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState('');
  const loadingRef = useRef(false);

  const loadNotifications = async (silent = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (requestError) {
      if (!silent) setError(requestError.response?.data?.message || 'Notifications could not be loaded.');
    } finally {
      loadingRef.current = false;
    }
  };
  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications(true);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const retry = async (id) => {
    setRetrying(id);
    setError('');
    try {
      await api.post(`/notifications/${id}/retry`);
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Notification retry failed.');
    } finally {
      setRetrying('');
    }
  };

  return (
    <DashboardShell role="admin" title="Notifications">
      <div className="card">
        {error && <div className="alert error">{error}</div>}
        <p className="muted notification-refresh-note">Statuses refresh automatically every 5 seconds.</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Last error</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((item) => (
              <tr key={item._id}>
                <td>{item.channel}</td>
                <td>{item.recipient}</td>
                <td><span className={`status-badge ${String(item.status).toLowerCase()}`}>{item.status}</span></td>
                <td>{item.attempts}</td>
                <td>{item.errorMessage || '—'}</td>
                <td>{item.status === 'failed' && <button type="button" className="ghost-button small" disabled={retrying === item._id} onClick={() => retry(item._id)}>{retrying === item._id ? 'Retrying...' : 'Retry'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/audit-logs')
      .then((response) => setLogs(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Activity logs could not be loaded.'));
  }, []);

  return (
    <DashboardShell role="admin" title="Activity Logs">
      <div className="card">
        {error && <div className="alert error">{error}</div>}
        <table className="data-table">
          <thead><tr><th>Date</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.userId?.fullName || 'System'}</td>
                <td>{log.action.replaceAll('_', ' ')}</td>
                <td>{log.entityType}</td>
                <td>{log.newValue?.requestNumber || log.newValue?.email || log.newValue?.name || log.newValue?.status || '—'}</td>
              </tr>
            ))}
            {!logs.length && !error && <tr><td colSpan="5">No activity recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function SettingsPage() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings/notifications')
      .then((response) => setStatus(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Configuration status could not be loaded.'));
  }, []);

  return (
    <DashboardShell role="admin" title="System Settings">
      {error && <div className="alert error">{error}</div>}
      <div className="card settings-grid">
        <div>
          <h3>Notification services</h3>
          <p>Email: <span className={`status-badge ${status?.emailConfigured ? 'approved' : 'rejected'}`}>{status?.emailConfigured ? 'Configured' : 'Not configured'}</span></p>
          <p className="muted">Configure Resend API or SMTP credentials in Render environment settings, then redeploy the API. Secrets are never shown here.</p>
        </div>
        <div>
          <h3>Security</h3>
          <p>Session lifetime: 8 hours</p>
          <p>Configured administrator recipient: {status?.adminEmailConfigured ? 'Configured' : 'Not configured'}</p>
        </div>
      </div>
    </DashboardShell>
  );
}

function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.get('/purchase-requests/my-requests').then((response) => setRequests(response.data));
  }, []);

  return (
    <DashboardShell role="employee" title="Employee Dashboard">
      <div className="stat-grid">
        <StatCard label="My Requests" value={requests.length} accent="#0f172a" />
        <StatCard label="Pending" value={requests.filter((request) => request.status === 'PENDING_APPROVAL').length} accent="#f59e0b" />
        <StatCard label="Approved" value={requests.filter((request) => request.status === 'APPROVED').length} accent="#22c55e" />
        <StatCard label="Purchased" value={requests.filter((request) => request.status === 'PURCHASED').length} accent="#10b981" />
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Latest Requests</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Department</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td>{request.requestNumber}</td>
                <td>{request.department}</td>
                <td><span className={`status-badge ${String(request.status).toLowerCase()}`}>{request.status}</span></td>
                <td>{new Date(request.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function NewPurchaseRequestPage() {
  const { user } = useAuth();
  const { id: draftId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cataloguePage, setCataloguePage] = useState(1);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftId));

  useEffect(() => {
    api.get('/items', { params: { activeOnly: true } })
      .then((response) => setItems(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Catalogue items could not be loaded.'));
    if (draftId) {
      api.get(`/purchase-requests/${draftId}`)
        .then((response) => {
          if (response.data.status !== 'DRAFT') {
            setError('Only draft requests can be edited.');
            return;
          }
          setSelected(response.data.items.map((item) => ({
            itemId: String(item.itemId),
            quantityRequested: item.quantityRequested,
            itemNotes: item.itemNotes || '',
          })));
          setNotes(response.data.notes || '');
        })
        .catch((requestError) => setError(requestError.response?.data?.message || 'Draft could not be loaded.'))
        .finally(() => setLoadingDraft(false));
    }
  }, [draftId]);

  const categories = [...new Map(items.map((item) => [item.categoryId?._id, item.categoryId])).values()].filter(Boolean);
  const visibleItems = items.filter((item) =>
    (!category || item.categoryId?._id === category) && item.name.toLowerCase().includes(search.toLowerCase())
  );
  const itemsPerPage = 5;
  const totalCataloguePages = Math.ceil(visibleItems.length / itemsPerPage);
  const pageItems = visibleItems.slice((cataloguePage - 1) * itemsPerPage, cataloguePage * itemsPerPage);
  const selectedItemIds = new Set(selected.map((entry) => entry.itemId));

  const addItem = (item) => {
    setSelected((current) => {
      if (current.some((entry) => entry.itemId === item._id)) {
        return current;
      }
      return [...current, { itemId: item._id, quantityRequested: 1, itemNotes: '' }];
    });
  };

  const updateQuantity = (itemId, value) => {
    setSelected((current) =>
      current.map((entry) => (entry.itemId === itemId ? { ...entry, quantityRequested: Number(value) || 1 } : entry))
    );
  };

  const removeItem = (itemId) => {
    setSelected((current) => current.filter((entry) => entry.itemId !== itemId));
  };

  const handleSubmit = async (saveAsDraft = false) => {
    setError('');
    if (!selected.length) {
      setError('Please choose at least one item before submitting.');
      return;
    }
    if (selected.some((entry) => !Number.isFinite(Number(entry.quantityRequested)) || Number(entry.quantityRequested) <= 0)) {
      setError('Each item quantity must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      let request;
      if (draftId) {
        const updated = await api.put(`/purchase-requests/${draftId}/draft`, { items: selected, notes });
        request = updated.data.request;
      } else {
        const response = await api.post('/purchase-requests', { items: selected, notes, saveAsDraft }, {
          headers: { 'Idempotency-Key': crypto.randomUUID() },
        });
        request = response.data.request;
      }

      if (saveAsDraft) {
        setMessage(`Draft ${request.requestNumber} saved.`);
        if (!draftId) navigate(`/employee/edit-draft/${request._id}`);
      } else if (draftId) {
        await api.post(`/purchase-requests/${draftId}/submit`);
        navigate('/employee/requests');
      } else {
        setMessage(`Request ${request.requestNumber} submitted successfully.`);
        setSelected([]);
        setNotes('');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="employee" title="New Purchase Request">
      {loadingDraft && <div className="loading">Loading draft...</div>}
      <div className="card form-layout purchase-request-card">
        <div className="catalogue-panel">
          <h3>Catalogue</h3>
          <div className="toolbar-controls">
            <SearchField value={search} onChange={(value) => { setSearch(value); setCataloguePage(1); }} placeholder="Search catalogue" />
            <select value={category} onChange={(event) => { setCategory(event.target.value); setCataloguePage(1); }} aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map((entry) => <option key={entry._id} value={entry._id}>{entry.name}</option>)}
            </select>
          </div>
          <div className="item-list">
            {pageItems.map((item) => {
              const isSelected = selectedItemIds.has(item._id);
              return (
                <button
                  type="button"
                  key={item._id}
                  className={`item-pill${isSelected ? ' selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => addItem(item)}
                >
                  <span><span>{item.name}</span><strong>{isSelected ? 'Added' : '+ Add'}</strong></span>
                  <small>{item.categoryId?.name} · {item.unit}</small>
                </button>
              );
            })}
            {!visibleItems.length && <p className="muted">No active items match this filter.</p>}
          </div>
          {totalCataloguePages > 0 && (
            <nav className="catalogue-pagination" aria-label="Catalogue pages">
              <span className="muted">
                Showing {(cataloguePage - 1) * itemsPerPage + 1}–{Math.min(cataloguePage * itemsPerPage, visibleItems.length)} of {visibleItems.length} items
              </span>
              <div>
                <button type="button" className="ghost-button small" disabled={cataloguePage === 1} onClick={() => setCataloguePage((page) => page - 1)}>Previous</button>
                <span className="catalogue-page-number">Page {cataloguePage} of {totalCataloguePages}</span>
                <button type="button" className="ghost-button small" disabled={cataloguePage === totalCataloguePages} onClick={() => setCataloguePage((page) => page + 1)}>Next</button>
              </div>
            </nav>
          )}
        </div>

        <div className="request-summary">
          <div className="request-summary-heading">
            <h3>Request Summary</h3>
            <span>{selected.length} selected</span>
          </div>
          <p className="muted">Department: {user?.department || 'Not assigned'}</p>

          <div className="selected-items">
            {selected.length === 0 && <p className="muted">No items selected yet. Add items from the catalogue.</p>}

            {selected.map((entry) => {
              const foundItem = items.find((item) => item._id === entry.itemId);
              if (!foundItem) return null;

              return (
                <div className="request-row" key={entry.itemId}>
                  <div>
                    <strong>{foundItem.name}</strong>
                    <small>{foundItem.unit}</small>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={entry.quantityRequested}
                    onChange={(event) => updateQuantity(entry.itemId, event.target.value)}
                  />
                  <button type="button" className="ghost-button" onClick={() => removeItem(entry.itemId)}>Remove</button>
                </div>
              );
            })}
          </div>

          <label>
            <span>Additional comments</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="4" />
          </label>

          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert info">{message}</div>}

          <div className="action-stack">
            <button type="button" className="secondary-button" disabled={submitting || loadingDraft} onClick={() => handleSubmit(true)}>{submitting ? 'Saving...' : 'Save as Draft'}</button>
            <button type="button" className="primary-button" disabled={submitting || loadingDraft} onClick={() => handleSubmit(false)}>{submitting ? 'Submitting...' : draftId ? 'Submit Draft' : 'Submit Request'}</button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function MyRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/purchase-requests/my-requests')
      .then((response) => setRequests(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Your requests could not be loaded.'));
  }, []);

  return (
    <DashboardShell role="employee" title="My Purchase Requests">
      <div className="card">
        {error && <div className="alert error">{error}</div>}
        {!requests.length && !error && <p className="muted">No purchase requests submitted yet.</p>}
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Status</th>
              <th>Department</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td>{request.requestNumber}</td>
                <td><span className={`status-badge ${String(request.status).toLowerCase()}`}>{request.status}</span></td>
                <td>{request.department}</td>
                <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                <td><a href={`/employee/request/${request._id}`} className="table-link">Open</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function EmployeeRequestDetailsPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/purchase-requests/${id}`)
      .then((response) => setRequest(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Request details could not be loaded.'));
  }, [id]);

  const addComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setSavingComment(true);
    setError('');
    try {
      await api.post(`/purchase-requests/${id}/comments`, { text: commentText });
      setCommentText('');
      const response = await api.get(`/purchase-requests/${id}`);
      setRequest(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Comment could not be added.');
    } finally {
      setSavingComment(false);
    }
  };

  const submitDraft = async () => {
    setSavingDraft(true);
    setError('');
    try {
      const response = await api.post(`/purchase-requests/${id}/submit`);
      setRequest(response.data.request);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Draft could not be submitted.');
    } finally {
      setSavingDraft(false);
    }
  };

  if (!request) {
    return (
      <DashboardShell role="employee" title="Request Details">
        {error ? <div className="alert error">{error}</div> : <div className="loading">Loading request details...</div>}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="employee" title={`Request ${request.requestNumber}`}>
      <div className="card">
        <h3>Request Summary</h3>
        {request.status === 'DRAFT' && (
          <div className="action-stack draft-actions">
            <button type="button" className="secondary-button small" onClick={() => navigate(`/employee/edit-draft/${id}`)}>Edit draft</button>
            <button type="button" className="primary-button small" disabled={savingDraft} onClick={submitDraft}>{savingDraft ? 'Submitting...' : 'Submit draft'}</button>
          </div>
        )}
        <div className="detail-list">
          <div><span>Department</span><strong>{request.department}</strong></div>
          <div><span>Status</span><strong>{request.status}</strong></div>
          <div><span>Date</span><strong>{new Date(request.createdAt).toLocaleString()}</strong></div>
          {request.notes && <div><span>Additional notes</span><strong>{request.notes}</strong></div>}
          {request.rejectionReason && <div><span>Rejection reason</span><strong>{request.rejectionReason}</strong></div>}
        </div>
      </div>

      <div className="card">
        <h3>Items</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty Requested</th>
              <th>Unit</th>
              <th>Purchased</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {request.items.map((item, index) => (
              <tr key={`${item.itemId}-${index}`}>
                <td>{item.itemNameSnapshot}</td>
                <td>{item.quantityRequested}</td>
                <td>{item.unitSnapshot}</td>
                <td>{item.quantityPurchased || 0}</td>
                <td>{Math.max(0, item.quantityRequested - (item.quantityPurchased || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="card comments-card">
        <h3>Request comments</h3>
        <div className="comment-list">
          {(request.comments || []).map((comment) => (
            <div className="comment-item" key={comment._id}>
              <strong>{comment.userId?.fullName || 'User'}</strong>
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
              <p>{comment.text}</p>
            </div>
          ))}
          {!request.comments?.length && <p className="muted">No comments yet.</p>}
        </div>
        <form className="comment-form" onSubmit={addComment}>
          <textarea maxLength="2000" required rows="3" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment" />
          <button type="submit" className="primary-button small" disabled={savingComment}>{savingComment ? 'Saving...' : 'Add comment'}</button>
        </form>
      </div>
    </DashboardShell>
  );
}

function ProfilePage() {
  const { user, clearUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage('Password changed. Please sign in with your new password.');
      clearUser();
      navigate('/login');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Password could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell role={user?.role === 'admin' ? 'admin' : 'employee'} title="Profile">
      <div className="card profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{user?.fullName?.slice(0, 1).toUpperCase()}</div>
          <div>
            <h3>{user?.fullName}</h3>
            <p>{user?.role}</p>
          </div>
        </div>
        <div className="detail-list">
          <div><span>Email</span><strong>{user?.email}</strong></div>
          <div><span>Department</span><strong>{user?.department}</strong></div>
          <div><span>Access</span><strong>{user?.role === 'admin' ? 'Administrator Portal' : 'Employee Portal'}</strong></div>
        </div>
      </div>
      <form className="card password-form" onSubmit={changePassword}>
        <h3>Change password</h3>
        <label><span>Current password</span><input required type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></label>
        <label><span>New password (at least 12 characters)</span><input required minLength="12" type="password" autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></label>
        <label><span>Confirm new password</span><input required minLength="12" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert info">{message}</div>}
        <button type="submit" className="primary-button small" disabled={saving}>{saving ? 'Updating...' : 'Update password'}</button>
      </form>
    </DashboardShell>
  );
}

function AppRoutes() {
  const { user, ready, bootstrapError } = useAuth();

  if (!ready) return <div className="loading full-page">Loading your secure session...</div>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/admin' : (user ? '/employee' : '/login')} replace />} />
      <Route path="/login" element={bootstrapError ? <div className="auth-page"><div className="alert error">{bootstrapError}</div></div> : <LoginPage />} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Outlet /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="purchase-requests" element={<PurchaseRequestsPage />} />
        <Route path="request/:id" element={<AdminRequestDetailsPage />} />
        <Route path="items" element={<ItemCataloguePage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="history" element={<PurchaseHistoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="activity" element={<ActivityLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/employee" element={<ProtectedRoute allowedRoles={['kitchen_manager', 'stock_manager']}><Outlet /></ProtectedRoute>}>
        <Route index element={<EmployeeDashboardPage />} />
        <Route path="new-request" element={<NewPurchaseRequestPage />} />
        <Route path="edit-draft/:id" element={<NewPurchaseRequestPage />} />
        <Route path="requests" element={<MyRequestsPage />} />
        <Route path="request/:id" element={<EmployeeRequestDetailsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to={user?.role === 'admin' ? '/admin' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
