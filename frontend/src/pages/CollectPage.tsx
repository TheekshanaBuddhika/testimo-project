import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, type PublicForm } from '../lib/api';
import './CollectPage.css';

/**
 * pages/CollectPage.tsx
 * ----------------------
 * Public page — rendered when a customer follows a collection form link.
 * Route: /collect/:formId  (no auth required)
 */
export default function CollectPage() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm]         = useState<PublicForm | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [fields, setFields]     = useState({
    submitter_name:    '',
    submitter_email:   '',
    submitter_title:   '',
    submitter_company: '',
    content:           '',
  });

  useEffect(() => {
    if (!formId) return;
    api.getPublicForm(formId)
      .then((data) => setForm(data.form))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [formId]);

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.submitTestimonial(formId, { ...fields, rating: rating || undefined });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="collect-page">
        <div className="collect-loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="collect-page">
        <div className="collect-card">
          <p className="collect-error">This form is no longer available.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="collect-page">
        <div className="collect-card success">
          <span className="success-icon">🎉</span>
          <h1>Thank you!</h1>
          <p>Your testimonial has been submitted and is awaiting review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collect-page" role="main">
      <div className="collect-card">
        {form?.workspace_logo && (
          <img src={form.workspace_logo} alt={form.workspace_name} className="collect-logo" />
        )}
        <h1 className="collect-title">{form?.title}</h1>
        {form?.description && <p className="collect-desc">{form.description}</p>}

        <form className="collect-form" onSubmit={handleSubmit} id="collect-form">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="cf-name">Your Name *</label>
              <input
                id="cf-name"
                type="text"
                required
                value={fields.submitter_name}
                onChange={(e) => setFields((f) => ({ ...f, submitter_name: e.target.value }))}
                placeholder="Jane Smith"
              />
            </div>
            <div className="form-field">
              <label htmlFor="cf-email">Email</label>
              <input
                id="cf-email"
                type="email"
                value={fields.submitter_email}
                onChange={(e) => setFields((f) => ({ ...f, submitter_email: e.target.value }))}
                placeholder="jane@company.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="cf-title">Job Title</label>
              <input
                id="cf-title"
                type="text"
                value={fields.submitter_title}
                onChange={(e) => setFields((f) => ({ ...f, submitter_title: e.target.value }))}
                placeholder="Head of Marketing"
              />
            </div>
            <div className="form-field">
              <label htmlFor="cf-company">Company</label>
              <input
                id="cf-company"
                type="text"
                value={fields.submitter_company}
                onChange={(e) => setFields((f) => ({ ...f, submitter_company: e.target.value }))}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="cf-content">Your Testimonial *</label>
            <textarea
              id="cf-content"
              required
              rows={5}
              value={fields.content}
              onChange={(e) => setFields((f) => ({ ...f, content: e.target.value }))}
              placeholder="Share your experience…"
            />
          </div>

          {/* Star rating */}
          <div className="form-field">
            <label>Rating</label>
            <div className="star-row" role="group" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  id={`star-${n}`}
                  className={`star-btn ${(hover || rating) >= n ? 'active' : ''}`}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {submitError && <p className="collect-error" style={{ color: '#ef4444', marginBottom: '12px' }}>{submitError}</p>}

          <button
            type="submit"
            className="collect-submit"
            id="collect-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Testimonial'}
          </button>
        </form>
      </div>
    </div>
  );
}
