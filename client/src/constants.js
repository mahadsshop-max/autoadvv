// Shared front end constants. These mirror the tier definitions used by the
// Express backend so the UI labels and ordering stay in sync.

export const TIER_NAMES = {
  v1: 'v1 Starter',
  v2: 'v2 Professional',
  v3: 'v3 Elite',
  'v3-lifetime': 'v3 Elite Lifetime',
  'slot-purchase': 'Additional Account Slot(s)',
};

// Higher number means a more capable plan. Used to decide which pricing cards
// to hide once a customer already owns an equal or better tier.
export const TIER_ORDER = {
  v1: 1,
  v2: 2,
  v3: 3,
  'v3-lifetime': 4,
};

export const SLOT_PRICE = 0.5;

export const KEY_PREFIX = 'VEILED-';
