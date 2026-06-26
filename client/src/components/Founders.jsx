const DISCORD_INVITE = 'https://discord.gg/veiledadv';

// Founder panel plus the community call to action card.
export default function Founders() {
  return (
    <section className="section" id="founders">
      <div className="container">
        <div className="section-head reveal is-visible">
          <div>
            <span className="eyebrow">Founder Panel</span>
            <h2>Built by Veiled &amp; Mahad</h2>
          </div>
        </div>
        <div className="founder-grid">
          <article className="founder-card reveal is-visible">
            <div className="founder-avatar">V</div>
            <div className="founder-meta">
              <h3>Veiled</h3>
              <div className="founder-role">Founder &amp; Owner</div>
              <div className="tag-row">
                <span className="tag"><strong>Role:</strong> Owner</span>
                <span className="tag"><strong>Focus:</strong> Vision &amp; Product</span>
              </div>
            </div>
            <a className="btn founder-action" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">Contact</a>
          </article>
          <article className="founder-card reveal is-visible">
            <div className="founder-avatar">M</div>
            <div className="founder-meta">
              <h3>Mahad</h3>
              <div className="founder-role">Co-Founder &amp; Developer</div>
              <div className="tag-row">
                <span className="tag"><strong>Role:</strong> Co-Owner</span>
                <span className="tag"><strong>Focus:</strong> Development &amp; Tech</span>
              </div>
            </div>
            <a className="btn founder-action" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">Contact</a>
          </article>
        </div>
        <article className="cta-card reveal is-visible">
          <div>
            <h3>Need help? Join our community</h3>
            <p>Reach out to support instantly and get updates on new features.</p>
          </div>
          <a className="btn" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">Join Discord</a>
        </article>
      </div>
    </section>
  );
}
