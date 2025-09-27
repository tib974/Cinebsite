import express from 'express';
import { config as loadEnv } from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.resolve(__dirname, '..', '.env.admin') });

const PORT = process.env.ADMIN_TOOL_PORT ? Number(process.env.ADMIN_TOOL_PORT) : 4545;
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'jyku6tox';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_ADMIN_TOKEN = process.env.SANITY_ADMIN_TOKEN || '';
const DEFAULT_ROLE = process.env.SANITY_INVITE_ROLE || 'editor';

if (!SANITY_ADMIN_TOKEN) {
  console.warn('[admin-dashboard] SANITY_ADMIN_TOKEN manquant. Le bouton "Inviter" ne fonctionnera pas tant que .env.admin ne sera pas configuré.');
}

let deployInProgress = false;

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'admin-ui.html'));
});

app.get('/api/status', (_req, res) => {
  res.json({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    hasToken: Boolean(SANITY_ADMIN_TOKEN),
  });
});

app.post('/api/invite', async (req, res) => {
  if (!SANITY_ADMIN_TOKEN) {
    res.status(500).json({ ok: false, error: 'SANITY_ADMIN_TOKEN absent. Configurer .env.admin.' });
    return;
  }

  const { email, role } = req.body || {};
  if (!email || typeof email !== 'string') {
    res.status(400).json({ ok: false, error: 'Adresse email invalide.' });
    return;
  }

  const inviteRole = (role && typeof role === 'string' ? role : DEFAULT_ROLE).trim();

  try {
    const response = await fetch(`https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}/collaborators/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SANITY_ADMIN_TOKEN}`,
      },
      body: JSON.stringify({ email, roleName: inviteRole }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = payload?.error?.description || payload?.message || `Code ${response.status}`;
      res.status(response.status).json({ ok: false, error: errorMessage });
      return;
    }

    res.json({ ok: true, message: 'Invitation envoyée.', invitation: payload });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Erreur inconnue.' });
  }
});

app.post('/api/deploy', (_req, res) => {
  if (deployInProgress) {
    res.status(409).json({ ok: false, error: 'Un déploiement est déjà en cours.' });
    return;
  }

  deployInProgress = true;
  const studioDir = path.resolve(__dirname, '..', 'studio');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['run', 'deploy'], { cwd: studioDir, shell: false });

  let log = '';

  const push = (chunk) => {
    const text = chunk.toString();
    log += text;
    process.stdout.write(text);
  };

  child.stdout.on('data', push);
  child.stderr.on('data', push);

  child.on('close', (code) => {
    deployInProgress = false;
    console.log(`[admin-dashboard] Déploiement terminé (code ${code}).`);
  });

  res.json({ ok: true, message: 'Déploiement lancé. Suivre le terminal pour les logs.' });
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`🛠️  Outil d’administration Sanity disponible sur ${url}`);
  open(url).catch(() => {
    console.log('Impossible d’ouvrir automatiquement le navigateur. Ouvrez manuellement :', url);
  });
});
