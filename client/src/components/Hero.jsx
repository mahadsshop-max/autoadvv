// Hero section: headline, call to action, and the decorative dashboard
// preview card. The preview account counter reflects the live user state.
export default function Hero({ user, onNavigate }) {
  const limit = (user && user.accountsLimit) || 1;
  const configured = (user && user.configuredCount) || 0;
  const showTrialButton = !user || !user.plan || !!user.keyRevoked || user.planExpires <= Date.now();

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="reveal is-visible">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true"></span>Discord Auto Messenger &#x2022; 24/7 cloud runner
          </span>
          <h1>Automate channels, DMs, and scale harder.</h1>
          <p className="hero-copy">
            Send messages to multiple Discord channels, auto-reply to DMs, manage several accounts from one dashboard,
            and keep every campaign running server-side even when your browser is closed. Built for speed, cleaner control,
            and a premium black-and-grey look.
          </p>
          <div className="hero-actions">
            {showTrialButton && (
              <a className="btn" href="#pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }}>
                Start Free Trial
              </a>
            )}
            <a className="btn-ghost" href="#services" onClick={(e) => { e.preventDefault(); onNavigate('services'); }}>
              See Everything
            </a>
          </div>
          <div className="stats" aria-label="Key stats">
            <div className="stat"><strong>24/7</strong><span>Cloud execution</span></div>
            <div className="stat"><strong>10 min</strong><span>Free trial</span></div>
            <div className="stat"><strong>Multi-account</strong><span>Independent setups</span></div>
          </div>
        </div>

        <div className="hero-card reveal is-visible" aria-label="Dashboard preview">
          <div className="app-shell" aria-hidden="true" draggable="false">
            <div className="app-nav">
              <div className="app-dots" aria-hidden="true"><span></span><span></span><span></span></div>
              <div className="app-links"><span>Dashboard</span><span>Campaigns</span><span>DM Replies</span><span>Accounts</span></div>
            </div>
            <div className="dashboard">
              <div className="stack">
                <section className="panel-card">
                  <div className="panel-title">Channel campaign performance</div>
                  <div className="graph" aria-hidden="true">
                    <div className="grid-lines"></div>
                    <svg viewBox="0 0 520 220" fill="none" preserveAspectRatio="none">
                      <path d="M10 176C58 180 89 144 134 148C178 152 197 112 240 106C296 98 323 128 380 92C428 62 449 76 510 36" stroke="rgba(255,255,255,.96)" strokeWidth="4.5" strokeLinecap="round" />
                      <path d="M10 176C58 180 89 144 134 148C178 152 197 112 240 106C296 98 323 128 380 92C428 62 449 76 510 36V220H10Z" fill="url(#fill)" />
                      <defs>
                        <linearGradient id="fill" x1="260" y1="36" x2="260" y2="220" gradientUnits="userSpaceOnUse">
                          <stop stopColor="rgba(255,255,255,0.22)" />
                          <stop offset="1" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="kpi-grid">
                    <div className="mini-card"><span>Messages sent</span><strong>82,419</strong><span>Queued safely</span></div>
                    <div className="mini-card"><span>Replies handled</span><strong>5,204</strong><span>Once per user</span></div>
                  </div>
                </section>
              </div>
              <div className="stack">
                <section className="panel-card">
                  <div className="panel-title">Live activity</div>
                  <div className="feed">
                    <div className="feed-item"><div><strong>Cloud runner</strong><span>Campaigns remain active</span></div><span>24/7</span></div>
                    <div className="feed-item"><div><strong>Encrypted storage</strong><span>Tokens secured at rest</span></div><span>Safe</span></div>
                    <div className="feed-item"><div><strong>Rate limiting</strong><span>Protection layer enabled</span></div><span>On</span></div>
                  </div>
                </section>
                <section className="panel-card">
                  <div className="panel-title">Account control</div>
                  <div className="kpi-grid">
                    <div className="mini-card"><span>Accounts</span><strong>{configured}/{limit}</strong><span>Independent setups</span></div>
                    <div className="mini-card"><span>Devices</span><strong>Any</strong><span>Desktop, tablet, phone</span></div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
