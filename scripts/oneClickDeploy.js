#!/usr/bin/env node
import { Client } from 'basic-ftp';
import { config as loadEnv } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function runStep(label, command, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`\n✖ Échec lors de l’étape "${label}".`);
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(path.join(projectRoot, 'node_modules'))) {
  runStep('Installation des dépendances (npm install)', 'npm', ['install']);
}

runStep('Compilation du site (npm run build)', 'npm', ['run', 'build']);

loadEnv({ path: path.join(projectRoot, '.env.deploy'), override: true });

const ftpHost = process.env.FTP_HOST;
const ftpUser = process.env.FTP_USER;
const ftpPassword = process.env.FTP_PASSWORD;
const ftpDir = process.env.FTP_DIR || '/htdocs';
const ftpPort = Number.parseInt(process.env.FTP_PORT ?? '21', 10);
const ftpSecure = /^(1|true|yes)$/i.test(process.env.FTP_SECURE ?? 'false');
const ftpClean = /^(1|true|yes)$/i.test(process.env.FTP_CLEAN ?? 'true');

if (!ftpHost || !ftpUser || !ftpPassword) {
  console.error('\n✖ Paramètres FTP manquants. Créez un fichier .env.deploy avec FTP_HOST, FTP_USER et FTP_PASSWORD.');
  process.exit(1);
}

const client = new Client();
client.ftp.verbose = true;

client.trackProgress((info) => {
  const transferred = (info.bytes / 1024).toFixed(1);
  process.stdout.write(`Uploading ${info.name} (${transferred} KB)\r`);
});

async function deploy() {
  try {
    console.log('\n▶ Connexion FTP…');
    await client.access({
      host: ftpHost,
      user: ftpUser,
      password: ftpPassword,
      port: ftpPort,
      secure: ftpSecure,
      secureOptions: { rejectUnauthorized: false },
    });

    await client.ensureDir(ftpDir);
    await client.cd(ftpDir);

    if (ftpClean) {
      console.log('▶ Nettoyage du dossier distant…');
      await client.clearWorkingDir();
    }

    const distPath = path.join(projectRoot, 'dist');
    console.log('▶ Upload du dossier dist/…');
    await client.uploadFromDir(distPath);

    console.log('\n✅ Déploiement terminé.');
  } catch (error) {
    console.error('\n✖ Déploiement interrompu :', error.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();

