//  M.Theekshana Buddhika - 25021196
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { api, type CollectionForm, type FormQuestion } from '../lib/api';
import './FormsPage.css';

/**
 * pages/FormsPage.tsx
 * --------------------
 * Lists collection forms for a workspace and lets users create new ones.
 */
export default function FormsPage() {
  const { id: workspaceId }               = useParams<{ id: string }>();
  const [forms, setForms]                 = useState<CollectionForm[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [creating, setCreating]           = useState(false);
  const [formTitle, setFormTitle]         = useState('');
  const [formDesc, setFormDesc]           = useState('');
  const [questions, setQuestions]         = useState<FormQuestion[]>([
    { id: crypto.randomUUID(), label: 'Share your experience', type: 'text', required: true },
    { id: crypto.randomUUID(), label: 'Rate your experience', type: 'rating', required: false }
  ]);

  useEffect(() => {
    if (!workspaceId) return;
    api.getForms(workspaceId)
      .then((d) => setForms(d.forms))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    if (questions.length === 0) {
      toast.error('Add at least one question.');
      return;
    }

    setCreating(true);
    try {
      const data = await api.createForm(workspaceId, {
        title: formTitle,
        description: formDesc || undefined,
        questions,
      });
      setForms((prev) => [data.form, ...prev]);
      setShowModal(false);
      setFormTitle('');
      setFormDesc('');
      setQuestions([
        { id: crypto.randomUUID(), label: 'Share your experience', type: 'text', required: true },
        { id: crypto.randomUUID(), label: 'Rate your experience', type: 'rating', required: false }
      ]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create form');
    } finally {
      setCreating(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: crypto.randomUUID(), label: 'New Question', type: 'text', required: false }]);
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const collectUrl = (formId: string) =>
    `${window.location.origin}/collect/${formId}`;

  const copyUrl = (formId: string) => {
    navigator.clipboard.writeText(collectUrl(formId));
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="forms-page" role="main">
      <header className="forms-header">
        <div>
          <div className="forms-breadcrumb">
            <Link to="/" className="breadcrumb-link">Dashboard</Link>
            <span> › </span>
            <Link to={`/workspaces/${workspaceId}`} className="breadcrumb-link">Workspace</Link>
            <span> › Forms</span>
          </div>
          <h1 className="forms-title">Collection Forms</h1>
        </div>
        <button
          id="create-form-btn"
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          + New Form
        </button>
      </header>

      {loading ? (
        <p className="forms-loading">Loading forms…</p>
      ) : forms.length === 0 ? (
        <div className="forms-empty">
          <span>📋</span>
          <h2>No forms yet</h2>
          <p>Create a form to start collecting testimonials via a shareable link.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Create Form</button>
        </div>
      ) : (
        <div className="forms-list">
          {forms.map((f) => (
            <div key={f.id} className="form-card" id={`form-card-${f.id}`}>
              <div className="form-card-info">
                <h2 className="form-card-title">{f.title}</h2>
                {f.description && <p className="form-card-desc">{f.description}</p>}
                <p className="form-card-meta">
                  {f.submission_count ?? 0} submissions ·{' '}
                  <span className={`form-status ${f.is_active ? 'active' : 'inactive'}`}>
                    {f.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div className="form-card-actions">
                <a
                  href={collectUrl(f.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-link"
                  id={`preview-form-${f.id}`}
                >
                  Preview ↗
                </a>
                <button
                  className="btn-copy"
                  id={`copy-form-${f.id}`}
                  onClick={() => copyUrl(f.id)}
                >
                  Copy Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">New Collection Form</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label htmlFor="f-title" className="form-label">Form Title</label>
              <input
                id="f-title"
                type="text"
                className="form-input"
                placeholder="Share your experience with us"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />

              <label htmlFor="f-desc" className="form-label">Description (optional)</label>
              <textarea
                id="f-desc"
                className="form-input"
                rows={2}
                placeholder="We'd love to hear your feedback…"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Questions</label>
                <button type="button" className="btn-link" style={{ padding: 0 }} onClick={addQuestion}>+ Add Question</button>
              </div>

              <div className="questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questions.map((q) => (
                  <div key={q.id} style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={q.label} 
                        onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                        placeholder="Question label"
                        required
                      />
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '13px', width: '120px' }}
                          value={q.type}
                          onChange={(e) => updateQuestion(q.id, { type: e.target.value as 'text' | 'rating' })}
                        >
                          <option value="text">Text Response</option>
                          <option value="rating">Star Rating</option>
                        </select>
                        <label style={{ fontSize: '13px', color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={q.required} 
                            onChange={(e) => updateQuestion(q.id, { required: e.target.checked })} 
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    {questions.length > 1 && (
                      <button type="button" className="btn-ghost" style={{ padding: '0 8px', color: '#ef4444', border: 'none' }} onClick={() => removeQuestion(q.id)}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating} id="create-form-submit">
                  {creating ? 'Creating…' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
