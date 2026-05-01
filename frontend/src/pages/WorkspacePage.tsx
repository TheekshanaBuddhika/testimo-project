import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { api, type Testimonial, type Workspace } from '../lib/api';
import CsvImportModal from '../components/CsvImportModal';
import './WorkspacePage.css';

/**
 * pages/WorkspacePage.tsx
 * -----------------------
 * Shows testimonials for a single workspace with filtering and status management.
 */

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function WorkspacePage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [workspace, setWorkspace]         = useState<Workspace | null>(null);
  const [testimonials, setTestimonials]   = useState<Testimonial[]>([]);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      api.getWorkspace(workspaceId),
      api.getTestimonials(workspaceId, { status: statusFilter === 'all' ? undefined : statusFilter }),
    ]).then(([wsData, tData]) => {
      setWorkspace(wsData.workspace);
      setNewName(wsData.workspace.name);
      setTestimonials(tData.testimonials);
      setTotal(tData.total);
    }).finally(() => setLoading(false));
  }, [workspaceId, statusFilter]);

  const handleApprove = async (tid: string) => {
    await api.updateTestimonial(workspaceId!, tid, { status: 'approved' });
    setTestimonials((prev) =>
      prev.map((t) => t.id === tid ? { ...t, status: 'approved' } : t)
    );
  };

  const handleReject = async (tid: string) => {
    await api.updateTestimonial(workspaceId!, tid, { status: 'rejected' });
    setTestimonials((prev) =>
      prev.map((t) => t.id === tid ? { ...t, status: 'rejected' } : t)
    );
  };

  const handleFeature = async (tid: string, current: boolean) => {
    await api.updateTestimonial(workspaceId!, tid, { is_featured: !current });
    setTestimonials((prev) =>
      prev.map((t) => t.id === tid ? { ...t, is_featured: !current } : t)
    );
  };

  const handleDelete = async (tid: string) => {
    setConfirmDelete(tid);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteTestimonial(workspaceId!, confirmDelete);
      setTestimonials((prev) => prev.filter((t) => t.id !== confirmDelete));
      setTotal((n) => n - 1);
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Failed to delete testimonial');
    } finally {
      setConfirmDelete(null);
    }
  };

  const stars = (n: number | null) =>
    n != null && n > 0 ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—';

  const formatWorkspaceName = (val: string) => {
    if (!val) return '';
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const handleUpdateName = async () => {
    if (!workspaceId || !newName.trim() || isSavingRef.current) return;
    isSavingRef.current = true;
    setSavingName(true);
    try {
      await api.updateWorkspace(workspaceId, { name: formatWorkspaceName(newName) });
      setWorkspace(prev => prev ? { ...prev, name: formatWorkspaceName(newName) } : null);
      setIsEditingName(false);
    } catch (err) {
      toast.error('Failed to update workspace name');
    } finally {
      setSavingName(false);
      isSavingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="workspace-page">
        <div className="ws-loading">Loading workspace…</div>
      </div>
    );
  }

  return (
    <div className="workspace-page" role="main">
      <header className="ws-header">
        <div className="ws-breadcrumb">
          <Link to="/" className="breadcrumb-link">Dashboard</Link>
          <span className="breadcrumb-sep">›</span>
          <span>{workspace?.name}</span>
        </div>
        <div className="ws-actions">
          <Link
            to={`/workspaces/${workspaceId}/integrations`}
            className="btn-ghost"
          >
            🔌 Integrations
          </Link>
          <Link
            to={`/workspaces/${workspaceId}/widgets/new`}
            className="btn-ghost"
          >
            🎨 Build Widget
          </Link>
          <button
            className="btn-ghost"
            onClick={() => setShowImportModal(true)}
          >
            📥 Import CSV
          </button>
          <Link
            to={`/workspaces/${workspaceId}/forms`}
            className="btn-secondary"
            id="manage-forms-btn"
          >
            📋 Collection Forms
          </Link>
        </div>
      </header>

      {isEditingName ? (
        <div className="ws-title-edit">
          <input 
            type="text" 
            className="ws-name-input" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleUpdateName}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
            autoFocus
          />
          <button className="btn-save" onClick={handleUpdateName} disabled={savingName}>
            {savingName ? 'Saving...' : 'Save'}
          </button>
        </div>
      ) : (
        <h1 className="ws-title" onClick={() => setIsEditingName(true)}>
          {workspace?.name} <span className="edit-icon">✎</span>
        </h1>
      )}
      <p className="ws-meta">{total} testimonials total</p>

      {/* ── Status Filter ── */}
      <div className="filter-tabs" role="tablist" aria-label="Status filter">
        {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={statusFilter === s}
            className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
            id={`filter-${s}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Testimonials ── */}
      {testimonials.length === 0 ? (
        <div className="no-testimonials">
          <p>No testimonials match this filter.</p>
        </div>
      ) : (
        <div className="testimonials-list">
          {testimonials.map((t) => (
            <div key={t.id} className={`testimonial-card status-${t.status}`} id={`testimonial-${t.id}`}>
              <div className="t-header">
                <div className="t-author">
                  {t.submitter_avatar && (
                    <img src={t.submitter_avatar} alt={t.submitter_name ?? ''} className="t-avatar" />
                  )}
                  <div>
                    <p className="t-name">{t.submitter_name}</p>
                    {(t.submitter_title || t.submitter_company) && (
                      <p className="t-role">
                        {[t.submitter_title, t.submitter_company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="t-meta">
                  <span className={`status-badge ${t.status}`}>{t.status}</span>
                  {t.is_featured && <span className="featured-badge">⭐ Featured</span>}
                </div>
              </div>

              <p className="t-content">{t.content}</p>

              <div className="t-footer">
                <span className="t-stars">{stars(t.rating)}</span>
                <div className="t-actions">
                  {t.status === 'pending' && (
                    <>
                      <button
                        className="action-btn approve"
                        id={`approve-${t.id}`}
                        onClick={() => handleApprove(t.id)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="action-btn reject"
                        id={`reject-${t.id}`}
                        onClick={() => handleReject(t.id)}
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  <button
                    className={`action-btn feature ${t.is_featured ? 'unfeature' : ''}`}
                    id={`feature-${t.id}`}
                    onClick={() => handleFeature(t.id, t.is_featured)}
                  >
                    {t.is_featured ? '☆ Unfeature' : '⭐ Feature'}
                  </button>
                  <button
                    className="action-btn delete"
                    id={`delete-${t.id}`}
                    onClick={() => handleDelete(t.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showImportModal && (
        <CsvImportModal 
          workspaceId={workspaceId!} 
          onClose={() => setShowImportModal(false)} 
          onSuccess={() => {
            setShowImportModal(false);
            toast.success('Testimonials imported successfully!');
            // Refresh testimonials list
            api.getTestimonials(workspaceId!, { status: statusFilter === 'all' ? undefined : statusFilter })
               .then(tData => {
                 setTestimonials(tData.testimonials);
                 setTotal(tData.total);
               });
          }}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal">
            <h2 className="modal-title">Delete Testimonial?</h2>
            <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '16px' }}>
              This action cannot be undone. The testimonial will be permanently removed.
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={confirmDeleteAction}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
