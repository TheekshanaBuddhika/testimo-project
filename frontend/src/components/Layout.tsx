import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';
import logo from '../assets/testimo.png';

/**
 * components/Layout.tsx
 * ----------------------
 * Authenticated shell — sidebar nav + main content area.
 * Redirects to /login if the user is not authenticated.
 */
export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract workspaceId from path if present: /workspaces/:id/...
  const workspaceMatch = location.pathname.match(/\/workspaces\/([^\/]+)/);
  const currentWorkspaceId = workspaceMatch ? workspaceMatch[1] : null;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="layout-loading" aria-label="Loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    await logout();
  };

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar-brand">
          <img src={logo} alt="Testimo Logo" className="brand-logo" />
          <span className="brand-name">Testimo</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">⊞</span>
            Dashboard
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'} <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          {currentWorkspaceId && (
            <NavLink 
              to={`/workspaces/${currentWorkspaceId}/pricing`} 
              className={({ isActive }) => `nav-item upgrade-nav-footer ${isActive ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span className="nav-icon">⭐</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Upgrade Plan</span>
            </NavLink>
          )}
          <div className="user-info">
            {user.image && (
              <img src={user.image} alt={user.name} className="user-avatar" />
            )}
            <div>
              <p className="user-name">{user.name}</p>
              <p className="user-email">{user.email}</p>
            </div>
          </div>
          <button className="sign-out-btn" onClick={handleSignOut} id="sign-out-btn">
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Sign Out Modal ── */}
      {showSignOutModal && (
        <div className="signout-backdrop">
          <div className="signout-modal">
            <h3>Sign Out?</h3>
            <p>Are you sure you want to log out of Testimo?</p>
            <div className="signout-actions">
              <button className="btn-cancel" onClick={() => setShowSignOutModal(false)}>
                Stay Logged In
              </button>
              <button className="btn-confirm" onClick={confirmSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
