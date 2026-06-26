import { api } from '../api';

// Manage view: lists the configurations the server currently holds for this
// user, with controls to stop or delete each running bot.
export default function Manage({ configs, toast, reloadConfigs, refreshAuth }) {
  const stopBot = async (configId) => {
    try {
      const data = await api.post('/api/bot/stop', { configId });
      if (data.success) reloadConfigs();
    } catch {
      toast.error('Error stopping bot');
    }
  };

  const deleteConfig = async (configId) => {
    if (!window.confirm('Delete this configuration?')) return;
    try {
      const data = await api.post('/api/bot/delete', { configId });
      if (data.success) {
        refreshAuth();
        reloadConfigs();
      }
    } catch {
      toast.error('Error deleting config');
    }
  };

  return (
    <main className="dashboard-container">
      <h2 style={{ marginBottom: 20, color: 'var(--text)' }}>Active Configurations</h2>
      <div className="configs-grid">
        {!configs || configs.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No active configurations</p>
        ) : (
          configs.map((cfg) => (
            <div className="config-card-dash" key={cfg.id}>
              <div className="config-header">
                <span className="config-title">
                  {cfg.username || 'Unknown'}
                  {cfg.auto_reply_enabled && (
                    <span style={{ color: 'var(--success)' }}> [Auto-Reply ON]</span>
                  )}
                </span>
                <span className={`status-badge ${cfg.active ? 'status-active' : 'status-inactive'}`}>
                  {cfg.active ? 'Active' : 'Stopped'}
                </span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 8 }}>Channels: {cfg.channels}</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 8 }}>Delay: {cfg.delay_seconds}s</p>
              {cfg.auto_reply_enabled && (
                <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: 12 }}>
                  Auto-reply: &quot;{(cfg.auto_reply_text || '').substring(0, 50)}&quot;
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {cfg.active && (
                  <button className="btn-ghost btn-small" onClick={() => stopBot(cfg.id)}>Stop</button>
                )}
                <button
                  className="btn-ghost btn-small"
                  style={{ color: '#ff6b6b' }}
                  onClick={() => deleteConfig(cfg.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
