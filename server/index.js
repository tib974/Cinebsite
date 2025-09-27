import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import compression from 'compression';
import morgan from 'morgan';

import logger from './utils/logger.js';
import { applySecurity, adminCsrfProtection } from './middleware/security.js';
import { attachUser, requireAuthPage, ensureLoggedOut, handleLogin, handleLogout } from './middleware/auth.js';
import adminRouter from './routes/admin.js';
import productsApiRouter from './routes/api/products.js';
import packsApiRouter from './routes/api/packs.js';
import quotesApiRouter from './routes/api/quotes.js';
import availabilityApiRouter from './routes/api/availability.js';
import realisationsApiRouter from './routes/api/realisations.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '..', 'dist');
const publicDir = path.resolve(__dirname, '..', 'public');
const dataDir = process.env.SQLITE_DIR
  ? path.resolve(process.env.SQLITE_DIR)
  : path.resolve(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  logger.warn('SESSION_SECRET non défini. Utilisation d\'une valeur par défaut temporaire.');
}

const SQLiteStore = connectSqlite3(session);

app.set('trust proxy', process.env.TRUST_PROXY === '1');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  const parentNext = next;
  const originalRender = res.render.bind(res);

  res.render = (view, options = {}, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? {} : { ...options };
    const layout = opts.layout === false ? null : opts.layout || 'layout';

    originalRender(view, opts, (err, html) => {
      if (err) {
        if (cb) return cb(err);
        return parentNext(err);
      }

      if (!layout) {
        if (cb) return cb(null, html);
        res.send(html);
        return undefined;
      }

      const layoutOptions = { ...opts, body: html };
      originalRender(layout, layoutOptions, (layoutErr, layoutHtml) => {
        if (layoutErr) {
          if (cb) return cb(layoutErr);
          return parentNext(layoutErr);
        }
        if (cb) return cb(null, layoutHtml);
        res.send(layoutHtml);
        return undefined;
      });
      return undefined;
    });
  };

  next();
});

applySecurity(app);

app.use(morgan('tiny'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new SQLiteStore({
      db: process.env.SESSION_DB || 'sessions.sqlite',
      dir: dataDir,
    }),
    name: process.env.SESSION_COOKIE_NAME || 'cineb.sid',
    secret: sessionSecret || 'change-this-secret',
    resave: false,
    rolling: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === '1',
      maxAge: 1000 * 60 * 60 * 24, // 1 jour
    },
  })
);

app.use(attachUser);

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Routes d\'authentification admin
app.get('/admin/login', ensureLoggedOut, adminCsrfProtection, (req, res) => {
  res.render('login', { layout: false, csrfToken: req.csrfToken(), error: null });
});

app.post('/admin/login', ensureLoggedOut, adminCsrfProtection, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const success = await handleLogin(req, username, password);
    if (!success) {
      return res.status(401).render('login', {
        layout: false,
        csrfToken: req.csrfToken(),
        error: 'Identifiants invalides',
      });
    }
    return res.redirect('/admin');
  } catch (error) {
    return next(error);
  }
});

app.post('/admin/logout', requireAuthPage, adminCsrfProtection, (req, res, next) => {
  try {
    handleLogout(req);
    res.redirect('/admin/login');
  } catch (error) {
    next(error);
  }
});

// Pages admin (auth requise)
app.use('/admin', requireAuthPage, adminCsrfProtection, adminRouter);

// API publiques
app.use('/api/products', productsApiRouter);
app.use('/api/packs', packsApiRouter);
app.use('/api/quotes', quotesApiRouter);
app.use('/api/availability', availabilityApiRouter);
app.use('/api/realisations', realisationsApiRouter);

// Fichiers statiques si dist présent
if (fs.existsSync(distDir)) {
  const oneYearMs = 1000 * 60 * 60 * 24 * 365;
  app.use(
    express.static(distDir, {
      maxAge: oneYearMs,
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store');
        }
      },
    })
  );

  app.get('*', (req, res, next) => {
    const indexFile = path.join(distDir, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.sendFile(indexFile);
    }
    return next();
  });
}

// Static fallback to public assets during dev
app.use('/public', express.static(publicDir));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Serveur Cineb en écoute sur le port ${port}`);
});
