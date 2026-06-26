// Detects which "site" the React bundle is being served from. Same code,
// same backend, but two front-of-house experiences:
//
//   veiled.gg    -> the full marketing site + storefront for direct customers
//   autoadv.cc   -> a stripped flow for reseller customers (no pricing, no
//                   marketing, no Discord server promo). They only ever
//                   verify with Discord and redeem the key their reseller
//                   sold them.
//
// In local development the hostname is "localhost", so we also honour a
// "?as=reseller-customer" override (persisted to localStorage) to make it
// easy to QA the autoadv flow without hostname spoofing.

const STORAGE_KEY = 'veiled.siteOverride';
const RESELLER_HOSTS = ['autoadv.cc', 'www.autoadv.cc'];

function readOverride() {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('as');
    if (param === 'reseller-customer') {
      window.localStorage.setItem(STORAGE_KEY, 'reseller-customer');
      return 'reseller-customer';
    }
    if (param === 'main') {
      window.localStorage.removeItem(STORAGE_KEY);
      return 'main';
    }
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function isResellerCustomerSite() {
  if (typeof window === 'undefined') return false;
  const override = readOverride();
  if (override === 'reseller-customer') return true;
  if (override === 'main') return false;
  const host = (window.location.hostname || '').toLowerCase();
  return RESELLER_HOSTS.includes(host);
}

// Branding shown in the stripped autoadv.cc flow. Kept generic so the
// reseller's customers never see veiled.gg branding.
export const RESELLER_SITE_BRAND = {
  name: 'AutoAdv',
  tagline: 'Discord auto-messenger access portal',
};
