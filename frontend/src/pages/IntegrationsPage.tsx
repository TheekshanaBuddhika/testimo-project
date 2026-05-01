import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import './IntegrationsPage.css';

interface Integration {
  id: string;
  platform: 'google' | 'facebook' | 'instagram';
  external_account_name: string | null;
  created_at: string;
}

const SUPPORTED_PLATFORMS = [
  { id: 'google', name: 'Google My Business', icon: '🌍' },
  { id: 'facebook', name: 'Facebook Pages', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
] as const;

export default function IntegrationsPage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    // We will build this endpoint in the backend
    api.getIntegrations(workspaceId)
      .then(d => setIntegrations(d.integrations))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleConnect = (platform: string) => {
    // Redirect to backend OAuth initiator
    window.location.href = `/api/workspaces/${workspaceId}/integrations/${platform}/auth`;
  };

  const handleDisconnect = async (id: string) => {
    if (!workspaceId) return;
    setConfirmDisconnect(id);
  };

  const confirmDisconnectAction = async () => {
    if (!confirmDisconnect || !workspaceId) return;
    try {
      await api.deleteIntegration(workspaceId, confirmDisconnect);
      setIntegrations(integrations.filter(i => i.id !== confirmDisconnect));
      toast.success('Integration disconnected');
    } catch (err) {
      toast.error('Failed to disconnect');
    } finally {
      setConfirmDisconnect(null);
    }
  };

  return (
    <div className="integrations-page" role="main">
      <header className="page-header">
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Dashboard</Link>
          <span> › </span>
          <Link to={`/workspaces/${workspaceId}`} className="breadcrumb-link">Workspace</Link>
          <span> › Integrations</span>
        </div>
        <h1 className="page-title">Integrations</h1>
        <p style={{ color: '#a0a0b0', marginTop: '8px' }}>
          Connect your social accounts to automatically import and sync reviews.
        </p>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="integrations-grid">
          {SUPPORTED_PLATFORMS.map(platform => {
            const connected = integrations.find(i => i.platform === platform.id);

            return (
              <div key={platform.id} className={`integration-card ${connected ? 'connected' : ''}`}>
                <div className="integration-icon">{platform.icon}</div>
                <div className="integration-info">
                  <h3 className="integration-name">{platform.name}</h3>
                  {connected ? (
                    <p className="integration-status text-green">
                      Connected as {connected.external_account_name || 'Account'}
                    </p>
                  ) : (
                    <p className="integration-status">Not connected</p>
                  )}
                </div>
                <div className="integration-actions" style={{ display: 'flex', gap: '8px' }}>
                  {connected ? (
                    <>
                      <button className="btn-ghost" onClick={async () => {
                        try {
                          const res = await api.syncIntegration(workspaceId!, platform.id);
                          toast.success(`Successfully imported ${res.imported} new reviews from ${platform.name}!`);
                        } catch (e) {
                          toast.error('Sync failed');
                        }
                      }}>
                        Sync Now
                      </button>
                      <button className="btn-ghost text-red" onClick={() => handleDisconnect(connected.id)}>
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button className="btn-primary" onClick={() => handleConnect(platform.id)}>
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Disconnect Confirmation Modal ── */}
      {confirmDisconnect && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setConfirmDisconnect(null)}>
          <div className="modal">
            <h2 className="modal-title">Disconnect Integration?</h2>
            <p style={{ color: '#a0a0b0', fontSize: '14px', marginBottom: '16px' }}>
              This will remove the integration and stop syncing reviews from this platform.
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmDisconnect(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={confirmDisconnectAction}>Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
