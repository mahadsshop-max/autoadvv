import { useState } from 'react';
import { TIER_NAMES } from '../constants';
import { isPlanExpired } from '../lib/userTier';

const SUB_TIER_NAMES = {
  v1: 'v1 Starter',
  v2: 'v2 Professional',
  v3: 'v3 Elite Monthly',
  'v3-lifetime': 'v3 Elite Lifetime',
};

function SubscriptionStatus({ user, onNavigate }) {
  if (!user || !user.plan || user.keyRevoked) return null;

  const planName = SUB_TIER_NAMES[user.plan] || user.plan;
  const slots = user.purchasedSlots > 0 ? ` (+${user.purchasedSlots} purchased slots)` : '';
  const expired = isPlanExpired(user);

  let icon = '\u2705';
  let title = 'Subscription Active';
  let expiry = user.planExpires ? `Renews/Expires: ${new Date(user.planExpires).toLocaleDateString()}` : 'Renews/Expires: N/A';
  let expiryColor = 'var(--muted)';

  if (user.plan === 'v3-lifetime') {
    icon = '\u{1F451}';
    title = 'Lifetime Access Active';
    expiry = 'Never expires';
    expiryColor = 'var(--success)';
  } else if (expired) {
    icon = '\u26A0';
    title = 'Subscription Expired';
    expiry = `Expired: ${new Date(user.planExpires).toLocaleDateString()}`;
    expiryColor = 'var(--danger)';
  }

  return (
    <div className="payment-container">
      <div className="payment-card reveal is-visible">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>{icon}</div>
          <h3 style={{ marginBottom: 8 }}>{title}</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Plan: {planName}{slots}</p>
          <p style={{ color: expiryColor, fontSize: '0.9rem', marginBottom: 16 }}>{expiry}</p>
          {expired && (
            <div>
              <div className="divider" style={{ margin: '16px 0' }}></div>
              <p style={{ color: 'var(--warning)', marginBottom: 12 }}>&#x26A0; Your subscription has expired</p>
              <button className="btn" onClick={() => onNavigate('pricing')}>Renew {planName}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentScreen({ payment }) {
  const [copied, setCopied] = useState(false);
  const data = payment.active;
  const tierLabel = TIER_NAMES[data.tier] || data.tier;
  const qrData = `litecoin:${data.ltcAddress}?amount=${data.ltcAmount}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.ltcAddress);
    } catch {
      // Clipboard can be blocked in some browsers; the address stays visible.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="payment-container">
      <div className="payment-card reveal is-visible">
        <h2 className="payment-title">
          {payment.isSlot
            ? `Purchase ${data.slotQuantity || 1} Account Slot(s)`
            : `Complete Your ${tierLabel} Purchase`}
        </h2>
        <p className="payment-sub">
          {payment.isSlot
            ? `Send exactly ${data.ltcAmount} LTC to purchase ${data.slotQuantity || 1} additional account slot(s)`
            : `Send exactly ${data.ltcAmount} LTC to the address below`}
        </p>

        <div className="payment-timer">{payment.timeLeftLabel}</div>

        <div className="qr-placeholder">
          <img src={qrUrl} alt="Litecoin payment QR code" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
        </div>

        <div className="ltc-address-box" onClick={copy}>
          <span className="ltc-address">{data.ltcAddress}</span>
          <button className={`copy-btn${copied ? ' copied' : ''}`}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>

        <div className="payment-amount">
          <div className="payment-amount-item">
            <strong>{data.ltcAmount}</strong>
            <span>LTC to send</span>
          </div>
          <div className="payment-amount-item">
            <strong>${data.amountUSD.toFixed(2)}</strong>
            <span>USD value</span>
          </div>
        </div>

        <div className={`payment-status ${payment.status.kind}`}>{payment.status.text}</div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-ghost" style={{ fontSize: '0.9rem' }} onClick={payment.cancel}>Cancel</button>
          <button className="btn-ghost" style={{ fontSize: '0.9rem' }} onClick={payment.refreshNow}>Refresh</button>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 16, textAlign: 'center' }}>
          Send the exact amount. &#x00B1;$0.10 tolerance accepted.<br />
          Address expires in 30 minutes and will never be reused.
        </p>
      </div>
    </div>
  );
}

function History({ payments, onNavigate }) {
  if (!payments || payments.length === 0) {
    return (
      <div className="payment-container">
        <div className="activity-card reveal is-visible">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>&#x1F4B8;</div>
            <h3 style={{ marginBottom: 8 }}>No Active Payments</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Choose a plan from Pricing to get started.</p>
            <button className="btn" onClick={() => onNavigate('pricing')}>View Pricing</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="activity-history">
        <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Recent Activity</h3>
        <div>
          {payments.map((p) => {
            const tierName = TIER_NAMES[p.tier] || p.tier;
            const dateStr = new Date(p.createdAt).toLocaleDateString();
            return (
              <div className="activity-item" key={p.id}>
                <div className="activity-item-left">
                  <span className={`activity-status-dot ${p.status}`}></span>
                  <div>
                    <strong>{tierName}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {dateStr} &bull; ${p.amountUSD.toFixed(2)}
                    </div>
                  </div>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{p.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Activity view: subscription summary, the live payment screen when a purchase
// is in flight, and otherwise the payment history list.
export default function ActivitySection({ user, payment, onNavigate }) {
  return (
    <section className="section" id="activitySection">
      <div className="container">
        <div className="pricing-intro reveal is-visible">
          <span className="eyebrow">Activity</span>
          <h2>Payment Activity</h2>
          <p>Track your payments and access status.</p>
        </div>

        <SubscriptionStatus user={user} onNavigate={onNavigate} />

        {payment.active ? (
          <PaymentScreen payment={payment} />
        ) : (
          <History payments={payment.history} onNavigate={onNavigate} />
        )}
      </div>
    </section>
  );
}
