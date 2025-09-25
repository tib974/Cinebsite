import bcrypt from 'bcrypt';

const adminUser = (process.env.ADMIN_USER || 'admin').trim();
const adminPasswordHash = process.env.ADMIN_PASS_HASH;

export function attachUser(req, _res, next) {
  req.user = req.session.user || null;
  next();
}

export function ensureLoggedOut(req, res, next) {
  if (req.user) {
    return res.redirect('/admin');
  }
  return next();
}

export function requireAuthPage(req, res, next) {
  if (!req.user) {
    return res.redirect('/admin/login');
  }
  return next();
}

export function requireAuthApi(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  return next();
}

export async function handleLogin(req, username, password) {
  if (!username || !password || !adminPasswordHash) {
    return false;
  }

  if (username.trim() !== adminUser) {
    return false;
  }

  const match = await bcrypt.compare(password, adminPasswordHash);
  if (!match) {
    return false;
  }

  req.session.user = { username: adminUser, role: 'admin' };
  return true;
}

export function handleLogout(req) {
  req.session.destroy(() => {});
}
