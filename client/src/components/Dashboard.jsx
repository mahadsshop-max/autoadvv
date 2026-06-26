import { useRef, useState } from 'react';
import { api } from '../api';

// Returns the add-account button label and behaviour for the current limits,
// mirroring the original tiered slot logic (free slot, purchasable, maxed).
function resolveAddButton({ configured, limit, purchasableSlots, revoked }) {
  if (revoked) return { label: 'Access Revoked', disabled: true, action: 'none' };
  if (configured < limit) return { label: 'Add Account', disabled: false, action: 'add' };
  if (purchasableSlots > 0 && configured < 5) return { label: 'Buy 1 Account', disabled: false, action: 'buy' };
  return { label: `Limit Reached (${configured}/${limit})`, disabled: true, action: 'none' };
}

export default function Dashboard({
  user,
  accounts,
  toast,
  trialActive,
  trialLabel,
  onBuySlot,
  refreshAuth,
  reloadConfigs,
  onNavigate,
  onAccessLost,
  hidePricing = false,
}) {
  const fileInputRef = useRef(null);
  const [botUsername, setBotUsername] = useState(null);

  const revoked = !!user.keyRevoked;
  const canAutoReply = user.canAutoReply === true && !revoked;
  const canUseImage = user.canUseImage === true && !revoked;

  const limit = user.accountsLimit || 1;
  const baseLimit = user.tierBaseLimit || 1;
  const configured = Math.max(accounts.tabs.length, user.configuredCount || 0);
  const purchasableSlots = user.purchasableSlots || 0;

  const addButton = resolveAddButton({ configured, limit, purchasableSlots, revoked });
  const showUpgradeBanner = !revoked && configured >= limit && limit < 5 && purchasableSlots <= 0;

  const c = accounts.current;

  const handleImage = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => accounts.setField('imageBase64', e.target.result);
    reader.readAsDataURL(file);
  };

  const addAccount = async () => {
    if (revoked) {
      toast.error('Your access was revoked. Please purchase a new plan.');
      onNavigate('pricing');
      return;
    }

    let status = user;
    try {
      const st = await api.get('/api/account-status');
      if (st.success) {
        status = {
          ...user,
          configuredCount: st.configuredCount,
          accountsLimit: st.accountsLimit,
          tierBaseLimit: st.tierBaseLimit,
          purchasableSlots: st.purchasableSlots,
          purchasedSlots: st.purchasedSlots,
        };
        refreshAuth();
      }
    } catch {
      // If the status check fails we fall back to the cached user values.
    }

    const liveLimit = status.accountsLimit || 1;
    const liveBase = status.tierBaseLimit || 1;
    const liveConfigured = status.configuredCount || 0;
    const livePurchasable = status.purchasableSlots || 0;

    if (liveConfigured >= liveLimit) {
      if (livePurchasable > 0 && liveConfigured < 5) {
        onBuySlot();
      } else {
        toast.error(`Max ${liveLimit} accounts reached on ${status.plan || 'your plan'}.`);
      }
      return;
    }

    if (liveConfigured >= liveBase && livePurchasable > 0) {
      onBuySlot();
      return;
    }

    accounts.addTab();
  };

  const deleteTab = async (id) => {
    if (!window.confirm('Delete this account configuration?')) return;
    try {
      const data = await api.post('/api/bot/delete', { configId: id });
      if (data.success) {
        accounts.removeTab(id);
        refreshAuth();
        reloadConfigs();
      }
    } catch {
      toast.error('Error deleting account');
    }
  };

  const submit = async (mode) => {
    if (revoked) {
      toast.error('Your access was revoked. Please purchase a new plan.');
      onNavigate('pricing');
      return;
    }
    if (!c.token || !c.channels || !c.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const data = await api.post('/api/bot/start', {
        token: c.token,
        channels: c.channels,
        message: c.message,
        delay: c.delay,
        autoReplyEnabled: c.autoReplyEnabled,
        autoReplyText: c.autoReplyText,
        sendAllAtOnce: c.sendAllAtOnce,
        imageUrl: c.imageBase64,
        configId: accounts.activeId,
      });

      if (data.success) {
        if (mode === 'save') {
          toast.success('Config saved.');
        } else {
          setBotUsername('@' + (data.username || 'user'));
          toast.success('Bot started.');
        }
        refreshAuth();
        reloadConfigs();
      } else {
        toast.error(data.error || 'Failed to start bot');
      }
    } catch (e) {
      if (e.data && e.data.error && e.data.error.includes('revoked')) {
        toast.error('Your access was revoked. Please purchase a new plan.');
        if (onAccessLost) onAccessLost();
      } else if (e.message && e.message.includes('ws')) {
        toast.error('Server module missing. Please run: npm install ws');
      } else {
        toast.error(e.message || 'Error starting bot');
      }
    }
  };

  return (
    <main className="dashboard-container">
      {revoked && (
        <div className="revoked-banner show">
          &#x26A0; Your access key has been revoked. All bots have been stopped.{' '}
          {hidePricing ? (
            <span>Contact your reseller for a new key.</span>
          ) : (
            <>
              <a
                href="#pricing"
                onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }}
                style={{ color: 'var(--danger)', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Purchase a plan
              </a>{' '}
              to restore access.
            </>
          )}
        </div>
      )}

      {trialActive && (
        <div className="trial-banner">
          <div className="trial-text">
            <span>&#x26A1; Trial Active</span>
            <span className="trial-timer">{trialLabel}</span>
          </div>
        </div>
      )}

      {botUsername && (
        <div
          className="accounts-bar"
          style={{
            background: 'linear-gradient(90deg, rgba(125,247,165,.15), rgba(125,247,165,.05))',
            borderColor: 'var(--success)',
          }}
        >
          <div className="accounts-info">
            <span className="accounts-count" style={{ color: 'var(--success)', fontSize: '1rem' }}>
              &#x2705; Logged in as <strong>{botUsername}</strong>
            </span>
            <span style={{ color: 'var(--muted)' }}>Bot is running</span>
          </div>
        </div>
      )}

      <div className="account-tabs">
        {accounts.tabs.map((tab) => (
          <div
            key={tab.id}
            className={`account-tab${accounts.activeId === tab.id ? ' active' : ''}`}
            onClick={() => accounts.switchTo(tab.id)}
          >
            Account {tab.num}
            <span
              className="tab-close"
              onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }}
            >
              &times;
            </span>
          </div>
        ))}
        <button className="add-account-tab" disabled={addButton.disabled} onClick={addAccount}>
          + Add Account
        </button>
      </div>

      <div className="accounts-bar">
        <div className="accounts-info">
          <span className="accounts-count">{configured}/{limit}</span>
          <span style={{ color: 'var(--muted)' }}>Configured Accounts</span>
        </div>
        <button
          className="buy-slot-btn"
          disabled={addButton.disabled}
          onClick={addButton.action === 'buy' ? onBuySlot : addAccount}
        >
          {addButton.label}
        </button>
      </div>

      {showUpgradeBanner && !hidePricing && (
        <div className="upgrade-banner">
          &#x26A0; Account limit reached.{' '}
          <a
            href="#pricing"
            onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }}
            style={{ color: 'var(--warning)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Upgrade your plan
          </a>{' '}
          to get more base accounts.
        </div>
      )}
      {showUpgradeBanner && hidePricing && (
        <div className="upgrade-banner">
          &#x26A0; Account limit reached. Contact your reseller for a higher tier key.
        </div>
      )}

      <div className="form-group">
        <label className="section-title-dash">Discord Token</label>
        <input
          type="password"
          className="form-input"
          value={c.token}
          placeholder="Enter your Discord token..."
          onChange={(e) => accounts.setField('token', e.target.value)}
        />
      </div>

      <div className={`form-group${canUseImage ? '' : ' disabled'}`}>
        <label className="section-title-dash">Advertisement Image (Optional)</label>
        <div
          className="image-upload"
          onClick={() => canUseImage && fileInputRef.current && fileInputRef.current.click()}
        >
          <div className="image-upload-icon">&#x1F4F7;</div>
          <div className="image-upload-text">Click to upload image<br />PNG, JPG, GIF up to 5MB</div>
          {c.imageBase64 && <img className="image-preview" src={c.imageBase64} alt="Advertisement preview" />}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </div>

      <div className="form-group">
        <label className="section-title-dash">Channel IDs (Comma Separated)</label>
        <input
          type="text"
          className="form-input"
          value={c.channels}
          placeholder="123456789, 987654321..."
          onChange={(e) => accounts.setField('channels', e.target.value)}
        />
      </div>

      <div className={`toggle-row${revoked ? ' disabled' : ''}`} onClick={() => !revoked && accounts.setField('sendAllAtOnce', !c.sendAllAtOnce)}>
        <div className="toggle-info">
          <h4>&#x26A1; Send All At Once</h4>
          <p>Send to all channels simultaneously</p>
        </div>
        <div className={`toggle-switch${c.sendAllAtOnce ? ' active' : ''}${revoked ? ' disabled' : ''}`}></div>
      </div>

      <div className="form-group">
        <label className="section-title-dash">Delay (Seconds)</label>
        <input
          type="number"
          className="form-input"
          min="1"
          value={c.delay}
          onChange={(e) => accounts.setField('delay', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="section-title-dash">Advertisement Message</label>
        <textarea
          className="form-input"
          rows="6"
          value={c.message}
          placeholder="Enter your message..."
          onChange={(e) => accounts.setField('message', e.target.value)}
        />
      </div>

      <div
        className={`toggle-row${canAutoReply ? '' : ' disabled'}`}
        onClick={() => canAutoReply && accounts.setField('autoReplyEnabled', !c.autoReplyEnabled)}
      >
        <div className="toggle-info">
          <h4>&#x1F4AC; Auto-Reply to DM</h4>
          <p>
            {revoked
              ? hidePricing
                ? 'Access revoked. Contact your reseller for a new key.'
                : 'Access revoked. Purchase a plan to unlock.'
              : canAutoReply
                ? 'Automatically reply when someone unknown messages you privately'
                : hidePricing
                  ? 'Auto-reply is only available on v3 keys. Ask your reseller for a v3 key.'
                  : user.plan === 'v2'
                    ? 'Auto-reply is only available on v3. Upgrade to unlock.'
                    : 'Upgrade to v3 for DM auto-reply'}
          </p>
        </div>
        <div className={`toggle-switch${c.autoReplyEnabled && canAutoReply ? ' active' : ''}${canAutoReply ? '' : ' disabled'}`}></div>
      </div>

      {canAutoReply && c.autoReplyEnabled && (
        <div className="form-group">
          <label className="section-title-dash">Auto-Reply Message</label>
          <textarea
            className="form-input"
            rows="4"
            value={c.autoReplyText}
            placeholder="Enter the message to auto-send when someone DMs you..."
            onChange={(e) => accounts.setField('autoReplyText', e.target.value)}
          />
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 8 }}>
            This message will be sent once per user when they DM you for the first time.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button className="btn" onClick={() => submit('start')}>Start Advertising</button>
        <button className="btn-ghost" onClick={() => submit('save')}>Save Config</button>
      </div>
    </main>
  );
}
