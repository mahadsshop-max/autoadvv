import { useCallback, useEffect, useState } from 'react';
import { api, tryGet } from './api';
import { useToast } from './toast.jsx';
import { hasAccess as computeAccess } from './lib/userTier';
import { useAccounts } from './lib/useAccounts';
import { RESELLER_SITE_BRAND } from './lib/site';
import { KEY_PREFIX } from './constants';

import Dashboard from './components/Dashboard.jsx';
import Manage from './components/Manage.jsx';

// Trimmed front end shown on autoadv.cc. Reseller customers verify with
// Discord, paste the key their reseller sold them, then land straight in
// the bot configuration dashboard. No marketing copy, no pricing tiers,
// no veiled.gg branding leaks through.
export default function ResellerCustomerApp() {
  const toast = useToast();
  const accounts = useAccounts();

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState('configure');
  const [configs, setConfigs] = useState([]);
  const [keyInput, setKeyInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const refreshAuth = useCallback(async () => {
    const data = await tryGet('/api/user');
    setUser(data || null);
    return data || null;
  }, []);

  useEffect(() => {
    (async () => {
      await refreshAuth();
      setReady(true);
    })();
  }, [refreshAuth]);

  const reloadConfigs = useCallback(async () => {
    const data = await tryGet('/api/bot/configs');
    if (data && data.configs) {
      setConfigs(data.configs);
      refreshAuth();
    }
  }, [refreshAuth]);

  const access = computeAccess(user);

  // Once the user has access, make sure their configs are loaded.
  useEffect(() => {
    if (user && access) reloadConfigs();
  }, [user, access, reloadConfigs]);

  const handleLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/logout', { credentials: 'include' });
    } catch {
      // Ignore network errors, the reload below clears local state anyway.
    }
    window.location.reload();
  }, []);

  const redeem = useCallback(async () => {
    const key = keyInput.trim().toUpperCase();
    if (!key.startsWith(KEY_PREFIX)) {
      toast.error('Invalid key format. Must start with VEILED-');
      return;
    }
    setRedeeming(true);
    try {
      const data = await api.post('/api/redeem', { key });
      if (data && data.success) {
        toast.success('Access granted.');
        setKeyInput('');
        await refreshAuth();
        setView('configure');
      } else {
        toast.error((data && data.error) || 'Invalid key');
      }
    } catch (e) {
      toast.error(e.message || 'Error redeeming key');
    } finally {
      setRedeeming(false);
    }
  }, [keyInput, toast, refreshAuth]);

  // Toast-only shim so the shared Dashboard component can still call
  // onNavigate('pricing') without trying to scroll to a section that does
  // not exist on this site.
  const onNavigate = useCallback(
    (target) => {
      if (target === 'pricing') {
        toast.info('Contact your reseller to upgrade or get a new key.');
      }
    },
    [toast]
  );

  const buySlot = useCallback(() => {
    toast.info('Extra slots are not available here. Ask your reseller for a higher tier key.');
  }, [toast]);

  if (!ready) {
    return (
      <div className="reseller-customer-shell">
        <div className="reseller-customer-card">
          <p style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Step 1: not signed in -> ask them to verify with Discord.
  if (!user) {
    return (
      <div className="reseller-customer-shell">
        <div className="reseller-customer-card">
          <div className="reseller-customer-brand">
            <span className="brand-mark">A</span>
            <span>{RESELLER_SITE_BRAND.name}</span>
          </div>
          <h1 className="reseller-customer-title">Verify to continue</h1>
          <p className="reseller-customer-sub">
            Sign in with Discord to unlock the dashboard your reseller set up for you.
          </p>
          <button type="button" className="btn reseller-customer-cta" onClick={handleLogin}>
            Verify with Discord
          </button>
          <p className="reseller-customer-foot">
            {RESELLER_SITE_BRAND.tagline}
          </p>
        </div>
      </div>
    );
  }

  // Step 2: signed in but no access yet -> ask for the access key.
  if (!access) {
    return (
      <div className="reseller-customer-shell">
        <div className="reseller-customer-card">
          <div className="reseller-customer-brand">
            <span className="brand-mark">A</span>
            <span>{RESELLER_SITE_BRAND.name}</span>
          </div>
          <h1 className="reseller-customer-title">Enter your access key</h1>
          <p className="reseller-customer-sub">
            Paste the key your reseller sent you to open your dashboard.
          </p>
          <input
            type="text"
            className="form-input"
            placeholder="VEILED-XXXX-XXXX"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !redeeming && redeem()}
            style={{ marginBottom: 14, textAlign: 'center', letterSpacing: '0.05em' }}
            autoFocus
          />
          <button
            type="button"
            className="btn reseller-customer-cta"
            onClick={redeem}
            disabled={redeeming}
          >
            {redeeming ? 'Checking...' : 'Redeem Key'}
          </button>
          <button
            type="button"
            className="btn-ghost reseller-customer-link"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Step 3: signed in with access -> the bot configuration dashboard.
  return (
    <div className="reseller-customer-app">
      <header className="reseller-customer-nav">
        <div className="reseller-customer-brand">
          <span className="brand-mark">A</span>
          <span>{RESELLER_SITE_BRAND.name}</span>
        </div>
        <div className="reseller-customer-nav-actions">
          <button
            type="button"
            className={`btn-ghost btn-small${view === 'configure' ? ' is-active' : ''}`}
            onClick={() => setView('configure')}
          >
            Configure
          </button>
          <button
            type="button"
            className={`btn-ghost btn-small${view === 'manage' ? ' is-active' : ''}`}
            onClick={() => { setView('manage'); reloadConfigs(); }}
          >
            Manage
          </button>
          <button
            type="button"
            className={`btn-ghost btn-small${view === 'redeem' ? ' is-active' : ''}`}
            onClick={() => setView('redeem')}
          >
            Redeem another key
          </button>
          <button type="button" className="btn-small btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      {view === 'configure' && (
        <Dashboard
          user={user}
          accounts={accounts}
          toast={toast}
          trialActive={false}
          trialLabel=""
          onBuySlot={buySlot}
          refreshAuth={refreshAuth}
          reloadConfigs={reloadConfigs}
          onNavigate={onNavigate}
          onAccessLost={() => { refreshAuth(); setView('redeem'); }}
          hidePricing
        />
      )}

      {view === 'manage' && (
        <Manage
          configs={configs}
          toast={toast}
          reloadConfigs={reloadConfigs}
          refreshAuth={refreshAuth}
        />
      )}

      {view === 'redeem' && (
        <main className="dashboard-container">
          <div className="reseller-customer-redeem-card">
            <h2 style={{ marginBottom: 8 }}>Redeem another key</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
              Got a new key from your reseller? Paste it below to extend or upgrade your access.
            </p>
            <input
              type="text"
              className="form-input"
              placeholder="VEILED-XXXX-XXXX"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !redeeming && redeem()}
              style={{ marginBottom: 14, textAlign: 'center', letterSpacing: '0.05em' }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setView('configure')}
              >
                Back
              </button>
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                onClick={redeem}
                disabled={redeeming}
              >
                {redeeming ? 'Checking...' : 'Redeem'}
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
