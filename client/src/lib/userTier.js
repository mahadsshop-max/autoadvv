import { TIER_ORDER } from '../constants';

// Pure helpers that interpret the user object returned by /api/user. These
// mirror the original front end logic so plan gating behaves identically.

export function getUserTierLevel(user) {
  if (!user || !user.plan) return 0;
  if (user.keyRevoked) return 0;
  return TIER_ORDER[user.plan] || 0;
}

export function isSubscriptionActive(user) {
  if (!user) return false;
  if (user.keyRevoked) return false;
  if (user.trialActive) return true;
  if (user.plan) {
    if (user.plan === 'v3-lifetime') return true;
    if (user.planExpires && user.planExpires > Date.now()) return true;
    if (!user.planExpires && user.purchased) return true;
  }
  return false;
}

export function isPlanExpired(user) {
  if (!user || !user.plan) return false;
  if (user.keyRevoked) return true;
  if (user.plan === 'v3-lifetime') return false;
  if (user.planExpires && user.planExpires <= Date.now()) return true;
  return false;
}

// A user "has access" when they hold an active subscription, an unexpired
// plan, or a running trial, and their key has not been revoked.
export function hasAccess(user) {
  if (!user || user.keyRevoked) return false;
  return Boolean(
    user.purchased ||
      user.trialActive ||
      (user.plan && (!user.planExpires || user.planExpires > Date.now()))
  );
}
