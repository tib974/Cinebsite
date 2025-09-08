// Configuration locale — API PHP interne (aucun secret côté client)
window.CINEB_CONFIG = {
  // Endpoints locaux
  CATALOG_API_URL: 'api/catalog.php',
  REALISATIONS_API_URL: 'api/realisations.php',
  CALENDAR_API_URL: 'api/calendar.php',
  WEB_APP_URL: 'api/quote.php',

  // Fallbacks locaux (CSV existants)
  CATALOG_CSV_URL: 'data/catalogfdf.csv',
  REALISATIONS_CSV_URL: 'data/realisations.csv',

  PERFORMANCE: { API_TIMEOUT: 5000, RETRY_ATTEMPTS: 2, CACHE_DURATION: 300000, FALLBACK_DELAY: 1000 },
  BOOKING_IFRAME_URL: 'https://calendly.com/grondin-thibaut/demande-de-reservation-cineb',
  // Facultatif: définir le domaine canonique (ex: 'https://www.cineb.re') pour og:url/canonical
  SITE_ORIGIN: 'https://www.cineb.re'
};
