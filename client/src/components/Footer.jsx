const DISCORD_INVITE = 'https://discord.gg/veiledadv';

// Footer with quick links and attribution. The year is computed at render.
export default function Footer({ onNavigate, onShowView, pricingHidden }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-shell reveal is-visible">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <span className="brand-mark">V</span>
                <strong>Veiled Adv</strong>
              </div>
              <div className="footer-copy">
                Premium destination for Discord automation, messaging flows, account scaling, and clean cloud-based execution.
              </div>
              <div className="footer-note">Not affiliated with Discord in any way.</div>
            </div>
            <div className="footer-right">
              <h4>Quick Links</h4>
              <div className="footer-links">
                <a href="#" onClick={(e) => { e.preventDefault(); onShowView('landing'); }}>Home</a>
                <a href="#services" onClick={(e) => { e.preventDefault(); onNavigate('services'); }}>Services</a>
                {!pricingHidden && (
                  <a href="#pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }}>Pricing</a>
                )}
                <a href="#" onClick={(e) => { e.preventDefault(); onShowView('activity'); }}>Activity</a>
                <a href="#faq" onClick={(e) => { e.preventDefault(); onNavigate('faq'); }}>FAQs</a>
                <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">Join Discord</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div>&#xA9; {year} Veiled Adv. All rights reserved.</div>
            <div>Website developed by <strong>Veiled &amp; Mahad</strong></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
