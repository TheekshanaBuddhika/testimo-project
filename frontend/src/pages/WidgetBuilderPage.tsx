import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import './WidgetBuilderPage.css';

interface WidgetConfig {
  theme: 'light' | 'dark';
  layout: 'grid' | 'carousel' | 'masonry' | 'list';
  primaryColor: string;
  borderRadius: string;
  template: string;
  showRating: boolean;
  showAvatar: boolean;
  fontFamily: string;
  maxLines: number;
}

const TEMPLATES = [
  { id: 'classic', name: 'Classic Card' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'bubble', name: 'Speech Bubble' },
  { id: 'glass', name: 'Glassmorphism' },
  { id: 'neo', name: 'Neumorphic' },
  { id: 'border', name: 'Border Highlight' },
  { id: 'shadow', name: 'Deep Shadow' },
  { id: 'gradient', name: 'Gradient Background' },
  { id: 'modern', name: 'Modern Bold' },
  { id: 'elegant', name: 'Elegant Serif' },
  { id: 'circular', name: 'Circular' },
  { id: 'stack', name: 'Card Stack' },
  { id: 'boxy', name: 'Boxy Retro' },
  { id: 'pastel', name: 'Soft Pastel' },
  { id: 'accent', name: 'Left Accent' },
  { id: 'floating', name: 'Floating Avatar' },
  { id: 'quote', name: 'Minimalist Quote' },
  { id: 'gradborder', name: 'Gradient Border' },
];

export default function WidgetBuilderPage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState<any[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [name, setName] = useState('My Widget');
  const [config, setConfig] = useState<WidgetConfig>({
    theme: 'dark',
    layout: 'carousel',
    primaryColor: '#6366f1',
    borderRadius: '12px',
    template: 'classic',
    showRating: true,
    showAvatar: true,
    fontFamily: 'system-ui',
    maxLines: 4,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    api.getWidgets(workspaceId)
      .then(d => {
        setWidgets(d.widgets);
        if (d.widgets.length > 0) {
          const w = d.widgets[0];
          setSelectedWidget(w);
          setName(w.name);
          setConfig({
            ...w.config,
            maxLines: w.config.maxLines ?? 4
          });
        }
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      if (selectedWidget) {
        await api.updateWidget(workspaceId, selectedWidget.id, { name: formattedName, config });
        setWidgets(widgets.map(w => w.id === selectedWidget.id ? { ...w, name: formattedName, config } : w));
        setName(formattedName);
      } else {
        const res = await api.createWidget(workspaceId, { name: formattedName, config });
        setWidgets([res.widget, ...widgets]);
        setSelectedWidget(res.widget);
        setName(formattedName);
      }
      toast.success('Widget saved!');
      setTimeout(() => {
        navigate(`/workspaces/${workspaceId}`);
      }, 1000);
    } catch (err) {
      toast.error('Failed to save widget');
    } finally {
      setSaving(false);
    }
  };

  const iframeSrc = () => {
    if (!workspaceId) return '';
    const params = new URLSearchParams({
      theme: config.theme,
      layout: config.layout,
      primaryColor: config.primaryColor,
      borderRadius: config.borderRadius,
      template: config.template,
      showRating: String(config.showRating),
      showAvatar: String(config.showAvatar),
      fontFamily: config.fontFamily,
      maxLines: String(config.maxLines ?? 4),
      widgetId: selectedWidget?.id || 'preview',
    });
    return `${window.location.origin}/widget/${workspaceId}?${params.toString()}`;
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const code = `<iframe src="${iframeSrc()}" width="100%" height="500px" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="builder-loading">Loading Builder...</div>;

  return (
    <div className="widget-builder">
      <header className="builder-header">
        <div className="header-left">
          <Link to={`/workspaces/${workspaceId}`} className="btn-back">← Back</Link>
          <div className="widget-name-wrapper">
            <input 
              className="widget-name-input" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Widget Name"
              title="Click to rename"
            />
            <span className="edit-icon">✎</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Widget'}
          </button>
        </div>
      </header>

      <div className="builder-content">
        <aside className="builder-sidebar">
          <section className="settings-section">
            <h3>Layout & Theme</h3>
            <div className="setting-group">
              <label>Theme</label>
              <select value={config.theme} onChange={e => setConfig({...config, theme: e.target.value as any})}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="setting-group">
              <label>Layout</label>
              <select value={config.layout} onChange={e => setConfig({...config, layout: e.target.value as any})}>
                <option value="grid">Grid</option>
                <option value="carousel">Carousel</option>
                <option value="masonry">Masonry</option>
                <option value="list">List</option>
              </select>
            </div>
            <div className="setting-group">
              <label>Template</label>
              <select value={config.template} onChange={e => setConfig({...config, template: e.target.value as any})}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </section>

          <section className="settings-section">
            <h3>Styles</h3>
            <div className="setting-group">
              <label>Primary Color</label>
              <input type="color" value={config.primaryColor} onChange={e => setConfig({...config, primaryColor: e.target.value})} />
            </div>
            <div className="setting-group">
              <label>Border Radius ({config.borderRadius})</label>
              <input type="range" min="0" max="40" value={parseInt(config.borderRadius)} onChange={e => setConfig({...config, borderRadius: `${e.target.value}px`})} />
            </div>
            <div className="setting-group">
              <label>Max Lines ({config.maxLines || 'No Limit'})</label>
              <input type="range" min="1" max="20" value={config.maxLines || 20} onChange={e => setConfig({...config, maxLines: parseInt(e.target.value)})} />
              <div className="setting-hint">Truncate long testimonials</div>
            </div>
          </section>

          <section className="settings-section">
            <h3>Display</h3>
            <label className="toggle-label">
              <input type="checkbox" checked={config.showRating} onChange={e => setConfig({...config, showRating: e.target.checked})} />
              Show Star Ratings
            </label>
            <label className="toggle-label">
              <input type="checkbox" checked={config.showAvatar} onChange={e => setConfig({...config, showAvatar: e.target.checked})} />
              Show Avatars
            </label>
          </section>

          <div className="embed-code-box">
            <div className="embed-header">
              <h4>Embed Code</h4>
              <button className="btn-copy" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea 
              readOnly 
              onClick={e => (e.target as any).select()}
              value={`<iframe src="${iframeSrc()}" width="100%" height="500px" frameborder="0"></iframe>`}
            />
          </div>
        </aside>

        <main className="builder-preview">
          <div className={`preview-container theme-${config.theme}`}>
            <div className="preview-label">Live Preview</div>
            <iframe src={iframeSrc()} key={JSON.stringify(config)} className="preview-iframe" />
          </div>
        </main>
      </div>
    </div>
  );
}
