import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';

const defaultRateLimit = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: Number.parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
});

export function applySecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: process.env.DISABLE_CSP === '1' ? false : undefined,
    crossOriginEmbedderPolicy: false,
  }));

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length > 0) {
    app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      })
    );
  }

  app.use(defaultRateLimit);
}

const csrfProtection = csrf({ cookie: false });

export function adminCsrfProtection(req, res, next) {
  return csrfProtection(req, res, (err) => {
    if (err) {
      if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).render('error', {
          title: 'Action non autorisée',
          message: 'Jeton CSRF invalide ou expiré. Merci de réessayer.',
        });
      }
      return next(err);
    }

    res.locals.csrfToken = req.csrfToken();
    return next();
  });
}
