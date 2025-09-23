import { useEffect, useState } from 'react';
import { getAnalyticsConsent, saveAnalyticsConsent, initAnalytics } from '../utils/analytics.js';

export default function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState(() => getAnalyticsConsent());

  useEffect(() => {
    if (consent === 'granted') {
      initAnalytics();
    }
  }, [consent]);

  if (consent) {
    return null;
  }

  const handleAccept = () => {
    saveAnalyticsConsent('granted');
    setConsent('granted');
  };

  const handleDecline = () => {
    saveAnalyticsConsent('denied');
    setConsent('denied');
  };

  return (
    <div className="analytics-banner" role="dialog" aria-live="polite">
      <div className="analytics-banner__content">
        <div>
          <strong>Mesure d’audience</strong>
          <p className="muted" style={{ margin: '6px 0 0 0' }}>
            Nous utilisons un outil d’analyse respectueux de la vie privée pour améliorer le site. Autorisez-vous la
            collecte de statistiques anonymes ?
          </p>
        </div>
        <div className="analytics-banner__actions">
          <button type="button" className="btn ghost" onClick={handleDecline}>
            Refuser
          </button>
          <button type="button" className="btn" onClick={handleAccept}>
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

