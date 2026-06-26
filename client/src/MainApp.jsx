import { useCallback, useEffect, useRef, useState } from 'react';
import { api, tryGet } from './api';
import { useToast } from './toast.jsx';
import { hasAccess as computeAccess } from './lib/userTier';
import { useAccounts } from './lib/useAccounts';
import { usePayment } from './lib/usePayment';

import Nav, { isPricingHidden } from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Services from './components/Services.jsx';
import Pricing from './components/Pricing.jsx';
import Faq from './components/Faq.jsx';
import Founders from './components/Founders.jsx';
import Footer from './components/Footer.jsx';
import ActivitySection from './components/ActivitySection.jsx';
import Dashboard from './components/Dashboard.jsx';
import Manage from './components/Manage.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import RedeemModal from './components/RedeemModal.jsx';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MainApp() {
  const toast = useToast();
  const accounts = useAccounts();

  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [configs, setConfigs] = useState([]);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [trialSeconds, setTrialSeconds] = useState(0);
  const trialRef = useRef(null);

  const access = computeAccess(user);
  const redeemOnly = !!(user && user.viaReseller);
  const pricingHidden = isPricingHidden(user) || redeemOnly;

  // Load the current session and normalise the user object the UI relies on.
  const refreshAuth = useCallback(async () => {
    const data = await tryGet('/api/user');
    if (!data) {
      setUser(null);
      return null;
    }
    setUser(data);
    if (data.trialActive && data.trialTimeLeft > 0) {
      setTrialSeconds(data.trialTimeLeft);
    }
    return data;
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Trial countdown. When it reaches zero the session is refreshed and the
  // user is returned to the landing page.
  useEffect(() => {
    if (!user || !user.trialActive || trialSeconds <= 0) return undefined;
    trialRef.current = setInterval(() => {
      setTrialSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(trialRef.current);
          toast.info('Trial expired.');
          refreshAuth();
          setView('landing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(trialRef.current);
  }, [user, trialSeconds > 0, refreshAuth, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadConfigs = useCallback(async () => {
    const data = await tryGet('/api/bot/configs');
    if (data && data.configs) {
      setConfigs(data.configs);
      refreshAuth();
    }
  }, [refreshAuth]);

  const payment = usePayment({
    user,
    toast,
    onPaid: refreshAuth,
    onAfterPaid: () => setView('dashboard'),
  });

  const showView = useCallback(
    (next) => {
      if (next === 'landing') {
        setView('landing');
        return;
      }
      if (next === 'activity') {
        setView('activity');
        payment.refreshHistory();
        return;
      }
      // dashboard and manage both require an authenticated user with access.
      if (!user) {
        window.location.href = '/login';
        return;
      }
      if (!access || user.keyRevoked) {
        toast.info('Please redeem a key, claim a trial, or purchase a plan first.');
        setView('landing');
        setTimeout(() => {
          const el = document.getElementById('pricing');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }
      setView(next);
      reloadConfigs();
    },
    [user, access, toast, payment, reloadConfigs]
  );

  const onNavigate = useCallback((id) => {
    setView('landing');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, []);

  const handleAuth = useCallback(async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await fetch('/logout', { credentials: 'include' });
    } catch {
      // Ignore network errors; we reload regardless to clear local state.
    }
    window.location.reload();
  }, [user]);

  const claimTrial = useCallback(async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (user.keyRevoked) {
      toast.error('Your access was revoked. Please purchase a new plan.');
      return;
    }
    try {
      const data = await api.post('/api/trial/claim');
      if (data.success) {
        setTrialSeconds(data.timeLeft);
        const fresh = await refreshAuth();
        if (fresh) setView('dashboard');
      } else {
        toast.error(data.error || 'Failed to claim trial');
      }
    } catch (e) {
      toast.error(e.message || 'Error claiming trial');
    }
  }, [user, toast, refreshAuth]);

  const onRedeemed = useCallback(async () => {
    const fresh = await refreshAuth();
    if (fresh) setView('dashboard');
  }, [refreshAuth]);

  const startTierPurchase = useCallback(
    (tier) => {
      payment.startTierPurchase(tier);
      setView('activity');
    },
    [payment]
  );

  const buySlot = useCallback(async () => {
    const ok = await payment.startSlotPurchase(1);
    if (ok === true) setView('activity');
  }, [payment]);

  return (
    <>
      <Nav
        user={user}
        pricingHidden={pricingHidden}
        onNavigate={onNavigate}
        onShowView={showView}
        onAuth={handleAuth}
      />

      {view === 'landing' && (
        <main>
          <Hero user={user} onNavigate={onNavigate} />
          <Services />
          {!pricingHidden && (
            <Pricing
              user={user}
              redeemOnly={redeemOnly}
              onPurchase={startTierPurchase}
              onClaimTrial={claimTrial}
              onRedeem={() => (user ? setRedeemOpen(true) : (window.location.href = '/login'))}
            />
          )}
          {redeemOnly && (
            <Pricing
              user={user}
              redeemOnly
              onPurchase={startTierPurchase}
              onClaimTrial={claimTrial}
              onRedeem={() => setRedeemOpen(true)}
            />
          )}
          <Faq />
          <Founders />
          <Footer onNavigate={onNavigate} onShowView={showView} pricingHidden={pricingHidden} />
        </main>
      )}

      {view === 'activity' && (
        <main>
          <ActivitySection user={user} payment={payment} onNavigate={onNavigate} />
          <Footer onNavigate={onNavigate} onShowView={showView} pricingHidden={pricingHidden} />
        </main>
      )}

      {view === 'dashboard' && user && access && (
        <Dashboard
          user={user}
          accounts={accounts}
          toast={toast}
          trialActive={!!user.trialActive}
          trialLabel={formatTime(trialSeconds)}
          onBuySlot={buySlot}
          refreshAuth={refreshAuth}
          reloadConfigs={reloadConfigs}
          onNavigate={onNavigate}
          onAccessLost={() => {
            refreshAuth();
            setView('landing');
          }}
        />
      )}

      {view === 'manage' && user && access && (
        <Manage
          configs={configs}
          toast={toast}
          reloadConfigs={reloadConfigs}
          refreshAuth={refreshAuth}
        />
      )}

      <AdminPanel user={user} toast={toast} />

      <RedeemModal
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        onRedeemed={onRedeemed}
        toast={toast}
      />
    </>
  );
}
