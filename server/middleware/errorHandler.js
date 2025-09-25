import logger from '../utils/logger.js';

export function notFoundHandler(_req, res) {
  res.status(404);
  if (res.req.path.startsWith('/api/')) {
    return res.json({ error: 'Not found' });
  }
  return res.render('error', {
    title: 'Page introuvable',
    message: 'La ressource demandée est introuvable.',
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  logger.error({ err }, 'Erreur serveur');
  const status = err.status || 500;

  if (req.path.startsWith('/api/')) {
    res.status(status).json({ error: err.message || 'Erreur interne' });
    return;
  }

  res.status(status).render('error', {
    title: 'Erreur serveur',
    message: err.message || 'Une erreur inattendue est survenue.',
  });
}
