import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../toast.jsx';

const STORAGE_KEY = 'veiled.resellerApiKey';

const TIER_LABELS = {
  v1: 'v1 Starter',
  v2: 'v2 Professional',
  v3: 'v3 Elite',
  'v3-lifetime': 'v3 Elite Lifetime',
};

const DURATIONS = [
  ['lifetime', 'Lifetime'],
  ['1h', '1 Hour'],
  ['24h', '24 Hours'],
  ['7d', '7 Days'],
  ['30d', '30 Days'],
];

// Requests against the reseller API always carry the reseller's key in a
// dedicated header rather than the session cookie.
async function resellerRequest(apiKey, method, url, body) {
  const options = { method, headers: { 'X-Reseller-Key': apiKey } };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error((data && data.error) || `Request failed (${res.status})`);
    error.data = data;
    throw error;
  }
  return data;
}

// Reseller portal: API key sign in, balance and pricing overview, key
// generation at the reseller rate, and a list of previously issued keys.
export default function Reseller() {
  const toast = useToast();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [keyInput, setKeyInput] = useState('');
  const [me, setMe] = useState(null);
  const [pricing, setPricing] = useState({});
  const [keys, setKeys] = useState([]);
  const [tier, setTier] = useState('v1');
  const [duration, setDuration] = useState('lifetime');
  const [loading, setLoading] = useState(false);

  const loadKeys = useCallback(async (key) => {
    try {
      const data = await resellerRequest(key, 'GET', '/api/reseller/keys');
      if (data.success) setKeys(data.keys || []);
    } catch {
      // The key list is non-critical; a failure here leaves the table empty.
    }
  }, []);

  const loadMe = useCallback(
    async (key) => {
      setLoading(true);
      try {
        const data = await resellerRequest(key, 'GET', '/api/reseller/me');
        if (data.success) {
          setMe(data.reseller);
          setPricing(data.pricing || {});
          await loadKeys(key);
        }
      } catch (e) {
        toast.error(e.message || 'Invalid reseller API key');
        localStorage.removeItem(STORAGE_KEY);
        setApiKey('');
        setMe(null);
      } finally {
        setLoading(false);
      }
    },
    [loadKeys, toast]
  );

  useEffect(() => {
    if (apiKey) loadMe(apiKey);
  }, [apiKey, loadMe]);

  const signIn = () => {
    const key = keyInput.trim();
    if (!key) {
      toast.error('Enter your reseller API key');
      return;
    }
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    setMe(null);
    setKeys([]);
    setKeyInput('');
  };

  const generate = async () => {
    try {
      const data = await resellerRequest(apiKey, 'POST', '/api/reseller/keys/generate', { tier, duration });
      if (data.success) {
        toast.success(`Generated ${data.key.key} for $${data.cost.toFixed(2)}`);
        setMe((prev) => (prev ? { ...prev, balance: data.balance } : prev));
        loadKeys(apiKey);
      } else {
        toast.error(data.error || 'Failed to generate key');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to generate key');
    }
  };

  if (!apiKey || !me) {
    return (
      <div className="container" style={{ maxWidth: 460, paddingTop: 80 }}>
        <div className="payment-card">
          <div className="brand" style={{ justifyContent: 'center', marginBottom: 20 }}>
            <span className="brand-mark">V</span>
            <span>Veiled Reseller</span>
          </div>
          <h2 className="payment-title" style={{ textAlign: 'center' }}>Reseller Portal</h2>
          <p className="payment-sub" style={{ textAlign: 'center' }}>
            Sign in with your reseller API key to generate access keys at the reseller rate.
          </p>
          <input
            type="password"
            className="form-input"
            style={{ marginBottom: 16 }}
            placeholder="rsk_..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && signIn()}
          />
          <button className="btn" style={{ width: '100%' }} onClick={signIn} disabled={loading}>
            {loading ? 'Checking...' : 'Sign In'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 980, paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="brand">
          <span className="brand-mark">V</span>
          <span>Veiled Reseller</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--muted)' }}>{me.name}</span>
          <button className="btn-ghost btn-small" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      <div className="reseller-grid" style={{ marginBottom: 24 }}>
        <div className="reseller-stat">
          <div className="label">Balance</div>
          <div className="value">${(me.balance || 0).toFixed(2)}</div>
        </div>
        <div className="reseller-stat">
          <div className="label">Keys Sold</div>
          <div className="value">{me.totalSold || 0}</div>
        </div>
        <div className="reseller-stat">
          <div className="label">Revenue</div>
          <div className="value">${(me.totalRevenue || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="payment-card" style={{ textAlign: 'left', marginBottom: 24 }}>
        <h3 style={{ marginBottom: 6 }}>Generate Access Key</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 0 }}>
          Reseller pricing (50% off retail):
        </p>
        <div className="price-grid">
          {Object.entries(pricing).map(([t, price]) => (
            <div className="price-chip" key={t}>
              <div className="t">{t}</div>
              <div className="p">${Number(price).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <select className="form-input" style={{ flex: 1, minWidth: 140 }} value={tier} onChange={(e) => setTier(e.target.value)}>
            {Object.entries(TIER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select className="form-input" style={{ flex: 1, minWidth: 140 }} value={duration} onChange={(e) => setDuration(e.target.value)}>
            {DURATIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button className="btn" onClick={generate}>Generate</button>
        </div>
      </div>

      <div className="payment-card" style={{ textAlign: 'left' }}>
        <h3 style={{ marginBottom: 16 }}>Issued Keys</h3>
        {keys.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No keys generated yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Tier</th>
                  <th>Duration</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Redeemed</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.key}>
                    <td><code>{k.key}</code></td>
                    <td>{(k.tier || '').toUpperCase()}</td>
                    <td>{k.duration}</td>
                    <td>${Number(k.costUSD || 0).toFixed(2)}</td>
                    <td>
                      <span className={`pill ${k.active ? 'live' : 'dead'}`}>{k.active ? 'Active' : 'Used/Revoked'}</span>
                    </td>
                    <td>{(k.usedBy && k.usedBy.length) || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
