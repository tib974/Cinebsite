const STORAGE_KEY = 'cineb_error_log';
const MAX_LOG_ENTRIES = 50;

function readLog() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[CinéB][monitoring] Lecture du log impossible', error);
    return [];
  }
}

function writeLog(entries) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_LOG_ENTRIES)));
  } catch (error) {
    console.warn('[CinéB][monitoring] Écriture du log impossible', error);
  }
}

export function reportError(error, context = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    message: error?.message ?? String(error),
    stack: error?.stack ?? null,
    context,
  };

  console.error('[CinéB][error]', payload);

  const currentLog = readLog();
  currentLog.unshift(payload);
  writeLog(currentLog);

  // Expose log pour récupération rapide par le propriétaire.
  if (typeof window !== 'undefined') {
    window.__CINEB_LAST_ERROR__ = payload;
  }
}

export function getErrorLog() {
  return readLog();
}

export function clearErrorLog() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.__CINEB_LAST_ERROR__ = null;
    }
  } catch (error) {
    console.warn('[CinéB][monitoring] Nettoyage du log impossible', error);
  }
}

export function initErrorMonitoring() {
  if (typeof window === 'undefined') return;
  if (window.__CINEB_MONITORING_READY__) return;

  window.__CINEB_MONITORING_READY__ = true;

  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      origin: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason || new Error('Promise rejetée sans message'), {
      origin: 'window.unhandledrejection',
    });
  });

  console.info('[CinéB][monitoring] Suivi client initialisé');
}

