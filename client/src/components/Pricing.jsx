import { getUserTierLevel, isSubscriptionActive, isPlanExpired } from '../lib/userTier';

const TIER_CARDS = [
  {
    id: 'v1',
    badge: 'v1',
    name: 'Starter',
    amount: '$1',
    sub: 'per month',
    level: 1,
    features: [
      [true, '1 Discord Account'],
      [true, 'Channel messaging'],
      [false, 'Image attachments'],
      [true, 'Send all at once'],
      [false, 'Auto-reply to DMs'],
    ],
    cta: 'Buy v1',
  },
  {
    id: 'v2',
    badge: 'v2',
    name: 'Professional',
    amount: '$2',
    sub: 'per month',
    level: 2,
    features: [
      [true, '3 Discord Accounts'],
      [true, 'Channel messaging'],
      [true, 'Image attachments'],
      [true, 'Send all at once'],
      [false, 'Auto-reply to DMs'],
    ],
    cta: 'Buy v2',
  },
  {
    id: 'v3',
    badge: 'v3',
    name: 'Elite Monthly',
    amount: '$3',
    sub: 'per month',
    level: 3,
    features: [
      [true, '5 Discord Accounts'],
      [true, 'Channel messaging'],
      [true, 'Image attachments'],
      [true, 'Auto-reply to DMs'],
      [true, 'Send all at once'],
    ],
    cta: 'Buy v3',
  },
  {
    id: 'v3-lifetime',
    badge: 'Lifetime',
    name: 'Elite Forever',
    amount: '$30',
    sub: 'one-time payment',
    level: 4,
    features: [
      [true, '5 Discord Accounts forever'],
      [true, 'All features forever'],
      [true, 'Image attachments'],
      [true, 'Auto-reply to DMs'],
      [true, 'Send all at once'],
    ],
    cta: 'Buy Lifetime',
  },
];

function Mark({ ok }) {
  return ok
    ? <span className="check">&#x2713;</span>
    : <span className="xmark">&#x2717;</span>;
}

// Pricing grid. Cards for tiers the user already owns are hidden, and once a
// customer holds the lifetime plan the whole section is removed upstream.
// Reseller customers (redeemOnly) only ever see the redeem key card.
export default function Pricing({ user, onPurchase, onClaimTrial, onRedeem, redeemOnly }) {
  const tierLevel = getUserTierLevel(user);
  const activeSub = isSubscriptionActive(user);
  const expired = isPlanExpired(user);
  const showTrialButton = !redeemOnly && !(activeSub && !expired);
  const visibleCards = redeemOnly ? [] : TIER_CARDS.filter((card) => tierLevel < card.level);

  return (
    <section className="section" id="pricing">
      <div className="container pricing-section-container">
        <div className="pricing-intro reveal is-visible">
          <span className="eyebrow">{redeemOnly ? 'Access' : 'Pricing'}</span>
          <h2>{redeemOnly ? 'Redeem Your Key' : 'Choose Your Plan'}</h2>
          <p>
            {redeemOnly
              ? 'Enter the access key provided by your reseller to unlock the dashboard.'
              : 'Monthly subscriptions and a lifetime option. Pay with Litecoin.'}
          </p>
        </div>
        <div className="plans-grid">
          {visibleCards.map((card) => (
            <article className="price-card reveal is-visible" key={card.id} data-tier={card.id}>
              <span className="price-badge">{card.badge}</span>
              <div className="price-name">{card.name}</div>
              <div className="price-amount">{card.amount}</div>
              <div className="price-sub">{card.sub}</div>
              <div className="divider"></div>
              <ul>
                {card.features.map(([ok, label]) => (
                  <li key={label}>
                    <Mark ok={ok} />
                    {label}
                  </li>
                ))}
              </ul>
              <button className="btn" onClick={() => onPurchase(card.id)}>{card.cta}</button>
            </article>
          ))}

          <article className="price-card reveal is-visible">
            <span className="price-badge">Access</span>
            <div className="price-name">Get Started</div>
            {!redeemOnly && (
              <>
                <div className="price-amount" style={{ fontSize: 'clamp(1.5rem,3vw,2rem)' }}>Free Trial</div>
                <div className="price-sub">10 minutes full access</div>
                <div className="divider"></div>
                <ul>
                  <li><span className="check">&#x2713;</span>1 Discord Account</li>
                  <li><span className="check">&#x2713;</span>All features</li>
                  <li><span className="check">&#x2713;</span>10 minutes access</li>
                </ul>
              </>
            )}
            {showTrialButton && (
              <button className="btn" style={{ marginBottom: 12 }} onClick={onClaimTrial}>
                {expired ? 'Expired - Claim Trial' : 'Claim Trial'}
              </button>
            )}
            {!redeemOnly && <div className="divider"></div>}
            <div className="price-name" style={{ fontSize: '1rem', marginTop: 4 }}>Have a key?</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>
              Redeem your Veiled Adv access key
            </p>
            <button className="btn-ghost" onClick={onRedeem}>Redeem Key</button>
          </article>
        </div>
      </div>
    </section>
  );
}
