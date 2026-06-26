import { useCallback, useEffect, useRef, useState } from 'react';
import { api, tryGet } from '../api';
import { TIER_NAMES } from '../constants';

function format(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Encapsulates the Litecoin payment screen: countdown timer, status polling,
// and the transition back to the dashboard once a payment clears.
export function usePayment({ user, onPaid, onAfterPaid, toast }) {
  const [active, setActive] = useState(null); // payment object on screen
  const [isSlot, setIsSlot] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState({ text: 'Waiting for payment...', kind: 'pending' });
  const [history, setHistory] = useState([]);

  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const activeIdRef = useRef(null);

  const stopTimers = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  }, []);

  const checkStatus = useCallback(
    async (paymentId) => {
      const data = await tryGet(`/api/payment/status/${paymentId}`);
      if (!data || !data.success) return;
      const payment = data.payment;

      if (payment.status === 'paid') {
        setStatus({
          text:
            payment.tier === 'slot-purchase'
              ? `Payment received. +${payment.slotQuantity || 1} account slot(s) added.`
              : `Payment received. Access granted for ${TIER_NAMES[payment.tier] || payment.tier}.`,
          kind: 'paid',
        });
        stopTimers();
        if (onPaid) await onPaid();
        setTimeout(() => {
          setActive(null);
          activeIdRef.current = null;
          if (onAfterPaid) onAfterPaid();
        }, 2000);
      } else if (payment.status === 'expired') {
        setStatus({ text: 'Address expired. Start a new purchase.', kind: 'expired' });
        stopTimers();
      } else {
        setStatus({
          text: `Waiting for payment... (received: ${(payment.receivedLTC || 0).toFixed(8)} LTC)`,
          kind: 'pending',
        });
      }
    },
    [onPaid, onAfterPaid, stopTimers]
  );

  const showScreen = useCallback(
    (payment, slot) => {
      stopTimers();
      setActive(payment);
      setIsSlot(Boolean(slot));
      setStatus({ text: 'Waiting for payment...', kind: 'pending' });
      activeIdRef.current = payment.id;

      let remaining = payment.timeLeft || 0;
      setTimeLeft(remaining);
      timerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          remaining = 0;
          setTimeLeft(0);
          setStatus({ text: 'Address expired. Please start a new purchase.', kind: 'expired' });
          stopTimers();
          return;
        }
        setTimeLeft(remaining);
      }, 1000);

      pollRef.current = setInterval(() => checkStatus(payment.id), 15000);
      checkStatus(payment.id);
    },
    [checkStatus, stopTimers]
  );

  const refreshHistory = useCallback(async () => {
    if (!user) return;
    const data = await tryGet('/api/payments');
    if (!data || !data.success) return;
    const payments = data.payments || [];
    setHistory(payments);

    // If there is a pending payment and nothing is on screen, resume it.
    const pending = payments.find((p) => p.status === 'pending');
    if (pending && !activeIdRef.current) {
      showScreen(
        {
          id: pending.id,
          tier: pending.tier,
          amountUSD: pending.amountUSD,
          ltcAmount: pending.ltcAmount,
          ltcAddress: pending.ltcAddress,
          slotQuantity: pending.slotQuantity,
          timeLeft: Math.max(0, Math.floor((pending.expiresAt - Date.now()) / 1000)),
        },
        pending.tier === 'slot-purchase'
      );
    }
  }, [user, showScreen]);

  const startTierPurchase = useCallback(
    async (tier) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      try {
        const data = await api.post('/api/payment/create', { tier });
        if (data.success && data.payment) {
          showScreen(data.payment, false);
        } else {
          toast.error(data.error || 'Failed to create payment');
        }
      } catch (e) {
        toast.error(e.message || 'Error creating payment. Make sure the wallet is configured.');
      }
    },
    [user, showScreen, toast]
  );

  const startSlotPurchase = useCallback(
    async (quantity = 1) => {
      if (!user) return;
      if (user.keyRevoked) {
        toast.error('Your access was revoked. Please purchase a new plan.');
        return false;
      }
      try {
        const data = await api.post('/api/payment/create-slot', { quantity });
        if (data.success && data.payment) {
          showScreen(data.payment, true);
          return true;
        }
        toast.error(data.error || 'Failed to create slot purchase');
        return data;
      } catch (e) {
        toast.error(e.message || 'Error creating slot purchase. Make sure the wallet is configured.');
        return false;
      }
    },
    [user, showScreen, toast]
  );

  const cancel = useCallback(async () => {
    stopTimers();
    const id = activeIdRef.current;
    if (id) {
      try {
        await api.post(`/api/payment/cancel/${id}`);
      } catch {
        // Cancelling is best effort; the address still expires on its own.
      }
    }
    activeIdRef.current = null;
    setActive(null);
    refreshHistory();
  }, [stopTimers, refreshHistory]);

  const refreshNow = useCallback(() => {
    if (activeIdRef.current) checkStatus(activeIdRef.current);
  }, [checkStatus]);

  useEffect(() => stopTimers, [stopTimers]);

  return {
    active,
    isSlot,
    timeLeftLabel: format(timeLeft),
    expired: timeLeft <= 0 && active,
    status,
    history,
    startTierPurchase,
    startSlotPurchase,
    cancel,
    refreshNow,
    refreshHistory,
  };
}
