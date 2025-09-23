const CONSENT_KEY = 'cineb_analytics_consent';
const SCRIPT_ID = 'cineb-analytics-script';

const DEFAULT_SCRIPT_SRC = import.meta.env.VITE_ANALYTICS_SRC || 'https://plausible.io/js/script.manual.js';
const DEFAULT_ANALYTICS_DOMAIN = import.meta.env.VITE_ANALYTICS_DOMAIN || 'cinebsite.vercel.app';

export function getAnalyticsConsent() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(CONSENT_KEY);
  } catch (error) {
    console.warn('[CinéB][analytics] Lecture consentement impossible', error);
    return null;
  }
}

export function saveAnalyticsConsent(value) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch (error) {
    console.warn('[CinéB][analytics] Sauvegarde consentement impossible', error);
  }
}

function injectAnalyticsScript() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = DEFAULT_SCRIPT_SRC;
  script.defer = true;
  script.dataset.domain = DEFAULT_ANALYTICS_DOMAIN;
  document.head.appendChild(script);
}

export function initAnalytics() {
  if (getAnalyticsConsent() !== 'granted') return;
  injectAnalyticsScript();
}

export function trackPageview(pathname) {
  if (typeof window === 'undefined') return;
  if (getAnalyticsConsent() !== 'granted') return;

  if (typeof window.plausible === 'function') {
    window.plausible('pageview', { u: `${window.location.origin}${pathname}` });
  }
}

export function resetAnalyticsConsent() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch (error) {
    console.warn('[CinéB][analytics] Suppression consentement impossible', error);
  }
}

