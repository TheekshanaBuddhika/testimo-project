//  M.Theekshana Buddhika - 25021196
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, type Workspace } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import './DashboardPage.css';

/**
 * pages/DashboardPage.tsx
 * -------------------------
 * Lists the user's workspaces and lets them create a new one.
 */
export default function DashboardPage() {
  const { user }                            = useAuth();
  const [workspaces, setWorkspaces]         = useState<Workspace[]>([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [form, setForm]                     = useState({ name: '', slug: '' });
  const [creating, setCreating]             = useState(false);
  const [error, setError]                   = useState('');

  useEffect(() => {
    api.getWorkspaces()
      .then((data) => setWorkspaces(data.workspaces))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const formattedName = form.name.charAt(0).toUpperCase() + form.name.slice(1);
      const data = await api.createWorkspace({ ...form, name: formattedName });
      setWorkspaces((prev) => [data.workspace, ...prev]);
      setShowModal(false);
      setForm({ name: '', slug: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <div className="dashboard" role="main">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Good to see you, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="dashboard-subtitle">Manage your testimonial workspaces</p>
        </div>
        <button
          id="create-workspace-btn"
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          + New Workspace
        </button>
      </header>

      {loading ? (
        <div className="workspaces-loading">
          {[1, 2, 3].map((i) => <div key={i} className="workspace-skeleton" />)}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏗️</span>
          <h2>No workspaces yet</h2>
          <p>Create your first workspace to start collecting testimonials.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="workspaces-grid">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/workspaces/${ws.id}`}
              className="workspace-card"
              id={`workspace-card-${ws.id}`}
            >
              <div className="workspace-icon">
                {ws.logo_url
                  ? <img src={ws.logo_url} alt={ws.name} />
                  : ws.name.charAt(0).toUpperCase()}
              </div>
              <div className="workspace-info">
                <h2 className="workspace-name">{ws.name}</h2>
                <p className="workspace-slug">/{ws.slug}</p>
              </div>
              <div className="workspace-stat">
                <span className="stat-number">{ws.testimonial_count ?? 0}</span>
                <span className="stat-label">testimonials</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Create Workspace Modal ── */}
      {showModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <h2 id="modal-title" className="modal-title">New Workspace</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label htmlFor="ws-name" className="form-label">Workspace Name</label>
              <input
                id="ws-name"
                type="text"
                className="form-input"
                placeholder="Acme Corp"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({ name, slug: autoSlug(name) });
                }}
                required
                style={{ background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border)' }}
              />

              <label htmlFor="ws-slug" className="form-label">
                Slug <span className="form-hint">(used in public URLs)</span>
              </label>
              <input
                id="ws-slug"
                type="text"
                className="form-input"
                placeholder="acme-corp"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: autoSlug(e.target.value) }))}
                pattern="[a-z0-9-]+"
                required
                style={{ background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border)' }}
              />

              {error && <p className="form-error">{error}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating} id="create-ws-submit">
                  {creating ? 'Creating…' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
