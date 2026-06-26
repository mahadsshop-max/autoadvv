import { useEffect, useState } from 'react';
import { getUserTierLevel } from '../lib/userTier';

// Top navigation bar. Links scroll to landing sections or switch SPA views.
// The Configure and Manage entries only appear once a user is signed in.
// A hamburger toggle reveals the links as a dropdown on narrower screens and
// stays available at every width.
export default function Nav({ user, onNavigate, onShowView, onAuth, pricingHidden }) {
  const [open, setOpen] = useState(false);

  // Close the menu automatically once the viewport is wide enough to show the
  // links inline, so it never gets stuck open while resizing.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 860) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Allow closing the menu with the Escape key for accessibility.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Run a navigation action, then collapse the menu.
  const run = (action) => {
    action();
    setOpen(false);
  };

  return (
    <div className="nav-wrap container">
      <nav className={`nav${open ? ' open' : ''}`} aria-label="Primary navigation">
        <a
          href="#"
          className="brand"
          aria-label="Veiled Adv home"
          onClick={(e) => {
            e.preventDefault();
            run(() => onShowView('landing'));
          }}
        >
          <span className="brand-mark">V</span>
          <span>Veiled Adv</span>
        </a>

        <button
          type="button"
          className={`nav-toggle${open ? ' active' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div id="nav-menu" className={`nav-scroll${open ? ' open' : ''}`} aria-label="All menu links">
          <div className="nav-links">
            <a href="#" onClick={(e) => { e.preventDefault(); run(() => onShowView('landing')); }}>Home</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); run(() => onNavigate('services')); }}>Services</a>
            {!pricingHidden && (
              <a href="#pricing" onClick={(e) => { e.preventDefault(); run(() => onNavigate('pricing')); }}>Pricing</a>
            )}
            <a href="#activity" onClick={(e) => { e.preventDefault(); run(() => onShowView('activity')); }}>Activity</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); run(() => onNavigate('faq')); }}>FAQ</a>
            {user && (
              <button onClick={() => run(() => onShowView('dashboard'))}>Configure</button>
            )}
            {user && (
              <button onClick={() => run(() => onShowView('manage'))}>Manage</button>
            )}
          </div>
        </div>

        <button className="btn nav-cta" onClick={() => run(onAuth)}>
          {user ? 'Logout' : 'Login with Discord'}
        </button>
      </nav>
    </div>
  );
}

export function isPricingHidden(user) {
  return getUserTierLevel(user) >= 4;
}
