const SERVICES = [
  ['01', 'Auto-send to channels', 'Schedule and send messages across multiple Discord channels without manual posting.'],
  ['02', 'DM auto-reply', 'Reply automatically to incoming DMs once per user and keep your response flow active all day.'],
  ['03', 'Multiple Discord accounts', 'Run more than one account from the same dashboard with independent settings and campaign control.'],
  ['04', 'Cloud runner', 'Everything keeps working server-side, so closing your browser does not stop your campaigns.'],
  ['05', 'Encrypted token storage', 'Tokens are stored with safer handling and paired with rate-limiting style protection logic.'],
  ['06', 'Web dashboard access', 'Manage your setup from desktop, tablet, and phone with a mobile-optimized front end.'],
];

// Static feature grid describing what the platform offers.
export default function Services() {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section-head reveal is-visible">
          <div>
            <span className="eyebrow">Services</span>
            <h2>Everything needed to automate Discord outreach</h2>
          </div>
          <p>Built around channel automation, DM replies, account management, cloud execution, and safer token handling.</p>
        </div>
        <div className="services-grid">
          {SERVICES.map(([num, title, body]) => (
            <article className="service-card reveal is-visible" key={num}>
              <div className="icon">{num}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
