import { useCallback, useEffect, useState } from 'react';
import { api, tryGet } from '../api';

// Floating admin panel for owners and whitelisted key generators. Handles key
// generation, the whitelist, and user revocation. Data loads when opened.
export default function AdminPanel({ user, toast }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [keys, setKeys] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [revoked, setRevoked] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [duration, setDuration] = useState('lifetime');
  const [tier, setTier] = useState('v1');
  const [whitelistId, setWhitelistId] = useState('');
  const [revokeId, setRevokeId] = useState('');
  const [newResellerName, setNewResellerName] = useState('');
  const [newResellerBalance, setNewResellerBalance] = useState('');
  const [balanceEdits, setBalanceEdits] = useState({});

  const isAdmin = !!(user && user.isAdmin);
  const canGenerate = !!(user && (user.isAdmin || user.canGenerate));
  const visible = !!(user && (user.isAdmin || user.isWhitelisted || user.canGenerate));

  const loadKeys = useCallback(async () => {
    const data = await tryGet('/api/admin/keys');
    if (data && data.keys) setKeys(data.keys);
  }, []);

  const loadWhitelist = useCallback(async () => {
    const data = await tryGet('/api/admin/whitelist');
    if (data && data.whitelist) setWhitelist(data.whitelist);
  }, []);

  const loadRevoked = useCallback(async () => {
    const data = await tryGet('/api/admin/users/revoked');
    if (data && data.revokedUsers) setRevoked(data.revokedUsers);
  }, []);

  const loadResellers = useCallback(async () => {
    const data = await tryGet('/api/admin/resellers');
    if (data && data.resellers) setResellers(data.resellers);
  }, []);

  useEffect(() => {
    if (!visible) return;
    loadKeys();
    if (isAdmin) {
      loadWhitelist();
      loadRevoked();
      loadResellers();
    }
  }, [visible, isAdmin, loadKeys, loadWhitelist, loadRevoked, loadResellers]);

  if (!visible) return null;

  const generateKey = async () => {
    try {
      const data = await api.post('/api/admin/keys/generate', { duration, tier });
      if (data.success) {
        toast.success(`Generated: ${data.key.key} (${data.key.tier})`);
        loadKeys();
      } else {
        toast.error(data.error || 'Failed to generate key');
      }
    } catch (e) {
      toast.error(e.message || 'Error generating key');
    }
  };

  const revokeKey = async (key) => {
    if (!window.confirm(`Revoke key ${key}? This will stop all bots and deactivate every user who redeemed it.`)) return;
    try {
      const data = await api.post('/api/admin/keys/revoke', { key });
      if (data.success) {
        toast.success(`Key ${key} revoked.`);
        loadKeys();
      } else {
        toast.error(data.error || 'Failed to revoke key');
      }
    } catch (e) {
      toast.error(e.message || 'Error revoking key');
    }
  };

  const addToWhitelist = async () => {
    const id = whitelistId.trim();
    if (!id) return;
    try {
      const data = await api.post('/api/admin/whitelist/add', { userId: id });
      if (data.success) {
        setWhitelistId('');
        loadWhitelist();
      }
    } catch {
      toast.error('Error adding to whitelist');
    }
  };

  const removeFromWhitelist = async (id) => {
    try {
      const data = await api.post('/api/admin/whitelist/remove', { userId: id });
      if (data.success) loadWhitelist();
    } catch {
      toast.error('Error removing from whitelist');
    }
  };

  const revokeUser = async () => {
    const id = revokeId.trim();
    if (!id) {
      toast.error('Please enter a Discord User ID');
      return;
    }
    if (id === user.id) {
      toast.error('You cannot revoke yourself.');
      return;
    }
    if (!window.confirm(`Revoke user ${id}? This will immediately stop all of their bots and remove all access.`)) return;
    try {
      const data = await api.post('/api/admin/users/revoke', { userId: id });
      if (data.success) {
        toast.success(`User ${id} has been revoked.`);
        setRevokeId('');
        loadRevoked();
      } else {
        toast.error(data.error || 'Failed to revoke user');
      }
    } catch (e) {
      toast.error(e.message || 'Error revoking user');
    }
  };

  const unrevokeUser = async (id) => {
    if (!window.confirm(`Unrevoke user ${id}? They will be able to purchase or redeem a key again.`)) return;
    try {
      const data = await api.post('/api/admin/users/unrevoke', { userId: id });
      if (data.success) {
        toast.success(`User ${id} has been unrevoked.`);
        loadRevoked();
      } else {
        toast.error(data.error || 'Failed to unrevoke user');
      }
    } catch (e) {
      toast.error(e.message || 'Error unrevoking user');
    }
  };

  const createReseller = async () => {
    const name = newResellerName.trim();
    if (!name) {
      toast.error('Enter a reseller name');
      return;
    }
    const balance = Number(newResellerBalance) || 0;
    try {
      const data = await api.post('/api/admin/resellers/create', { name, balance });
      if (data.success) {
        toast.success(`Reseller created. API key: ${data.reseller.apiKey}`);
        setNewResellerName('');
        setNewResellerBalance('');
        loadResellers();
      } else {
        toast.error(data.error || 'Failed to create reseller');
      }
    } catch (e) {
      toast.error(e.message || 'Error creating reseller');
    }
  };

  const adjustResellerBalance = async (id, delta) => {
    try {
      const data = await api.post('/api/admin/resellers/balance', { id, delta });
      if (data.success) {
        setBalanceEdits((m) => ({ ...m, [id]: '' }));
        loadResellers();
      } else {
        toast.error(data.error || 'Failed to adjust balance');
      }
    } catch (e) {
      toast.error(e.message || 'Error adjusting balance');
    }
  };

  const copyResellerKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('API key copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const rotateResellerKey = async (id, name) => {
    if (!window.confirm(`Rotate API key for ${name}? Their current key will stop working immediately.`)) return;
    try {
      const data = await api.post('/api/admin/resellers/rotate-key', { id });
      if (data.success) {
        toast.success(`New API key: ${data.reseller.apiKey}`);
        loadResellers();
      } else {
        toast.error(data.error || 'Failed to rotate key');
      }
    } catch (e) {
      toast.error(e.message || 'Error rotating key');
    }
  };

  const deleteReseller = async (id, name) => {
    if (!window.confirm(`Delete reseller ${name}? This cannot be undone.`)) return;
    try {
      const data = await api.post('/api/admin/resellers/delete', { id });
      if (data.success) {
        toast.success(`Reseller ${name} deleted`);
        loadResellers();
      } else {
        toast.error(data.error || 'Failed to delete reseller');
      }
    } catch (e) {
      toast.error(e.message || 'Error deleting reseller');
    }
  };

  // Play the close animation before unmounting the panel.
  const closePanel = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  };

  return (
    <>
      <div className="ghost-fab show" onClick={() => (open ? closePanel() : setOpen(true))}>&#x1F47B;</div>
      {open && (
        <div className={`admin-panel show${closing ? ' closing' : ''}`}>
          <div className="admin-header">
            <div className="admin-title">&#x1F47B; Admin Panel</div>
            <button className="admin-close" onClick={closePanel}>&#xD7;</button>
          </div>

          {canGenerate && (
            <>
              <div className="admin-section">
                <div className="admin-section-title">Generate Key</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <select className="form-input" style={{ flex: 1, minWidth: 120 }} value={duration} onChange={(e) => setDuration(e.target.value)}>
                    <option value="lifetime">Lifetime</option>
                    <option value="1h">1 Hour</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                  </select>
                  <select className="form-input" style={{ flex: 1, minWidth: 100 }} value={tier} onChange={(e) => setTier(e.target.value)}>
                    <option value="v1">v1 ($1)</option>
                    <option value="v2">v2 ($2)</option>
                    <option value="v3">v3 ($3)</option>
                  </select>
                  <button className="btn btn-small" onClick={generateKey}>Generate</button>
                </div>
              </div>

              <div className="admin-section">
                <div className="admin-section-title">Active Keys</div>
                <div className="key-list">
                  {keys.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No keys generated</p>
                  ) : (
                    keys.map((k) => (
                      <div className="key-item" key={k.key}>
                        <span>{k.key} ({(k.tier || 'v1').toUpperCase()} | {k.duration})</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{k.active ? 'Active' : 'Revoked'}</span>
                          {isAdmin && k.active && (
                            <button className="btn-danger btn-small" onClick={() => revokeKey(k.key)}>Revoke</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <div className="admin-section">
                <div className="admin-section-title">Whitelist</div>
                <div className="whitelist-input">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="User ID"
                    value={whitelistId}
                    onChange={(e) => setWhitelistId(e.target.value)}
                  />
                  <button className="btn btn-small" onClick={addToWhitelist}>Add</button>
                </div>
                <div className="whitelist-list">
                  {whitelist.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No whitelisted users</p>
                  ) : (
                    whitelist.map((id) => (
                      <div className="whitelist-item" key={id}>
                        <span>{id}</span>
                        <button className="btn-ghost btn-small" onClick={() => removeFromWhitelist(id)}>Remove</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-section">
                <div className="admin-section-title">Revoke User</div>
                <div className="revoke-input">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Discord User ID to revoke..."
                    value={revokeId}
                    onChange={(e) => setRevokeId(e.target.value)}
                  />
                  <button className="btn-danger btn-small" onClick={revokeUser}>Revoke</button>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 12 }}>
                  Revoking a user will immediately stop all their bots and remove all access.
                </p>
                <div className="admin-section-title" style={{ marginTop: 16 }}>Revoked Users</div>
                <div className="revoke-list">
                  {revoked.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No revoked users</p>
                  ) : (
                    revoked.map((r) => (
                      <div className="revoke-item" key={r.userId}>
                        <div className="revoke-info">
                          <span style={{ fontWeight: 600 }}>
                            User {r.userId}{r.previousPlan ? ` (${r.previousPlan})` : ''}
                          </span>
                          <span className="revoke-id">Revoked on {new Date(r.revokedAt).toLocaleDateString()}</span>
                        </div>
                        <button className="btn-success btn-small" onClick={() => unrevokeUser(r.userId)}>Unrevoke</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-section">
                <div className="admin-section-title">Resellers</div>
                <div className="reseller-create">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Reseller name"
                    value={newResellerName}
                    onChange={(e) => setNewResellerName(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="Starting $"
                    value={newResellerBalance}
                    onChange={(e) => setNewResellerBalance(e.target.value)}
                    style={{ maxWidth: 110 }}
                  />
                  <button className="btn btn-small" onClick={createReseller}>Create</button>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 12 }}>
                  Share the generated API key with the reseller. They paste it at autoadv.cc/reseller.
                </p>
                <div className="reseller-list">
                  {resellers.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No resellers yet</p>
                  ) : (
                    resellers.map((r) => (
                      <div className="reseller-item" key={r.id}>
                        <div className="reseller-row">
                          <div className="reseller-info">
                            <span className="reseller-name">{r.name}</span>
                            <span className="reseller-stats">
                              ${Number(r.balance || 0).toFixed(2)} balance &middot; {r.totalSold || 0} sold &middot; ${Number(r.totalRevenue || 0).toFixed(2)} revenue
                            </span>
                            <span className="reseller-key" title={r.apiKey}>{r.apiKey}</span>
                          </div>
                          <div className="reseller-actions">
                            <button className="btn-ghost btn-small" onClick={() => copyResellerKey(r.apiKey)}>Copy</button>
                            <button className="btn-ghost btn-small" onClick={() => rotateResellerKey(r.id, r.name)}>Rotate</button>
                            <button className="btn-danger btn-small" onClick={() => deleteReseller(r.id, r.name)}>Delete</button>
                          </div>
                        </div>
                        <div className="reseller-balance">
                          <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            placeholder="Amount (e.g. 25 or -5)"
                            value={balanceEdits[r.id] || ''}
                            onChange={(e) => setBalanceEdits((m) => ({ ...m, [r.id]: e.target.value }))}
                          />
                          <button
                            className="btn-success btn-small"
                            onClick={() => {
                              const v = Number(balanceEdits[r.id]);
                              if (!v) {
                                toast.error('Enter a non-zero amount');
                                return;
                              }
                              adjustResellerBalance(r.id, v);
                            }}
                          >
                            Adjust
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
