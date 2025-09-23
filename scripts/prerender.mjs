import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DIST_DIR = path.join(projectRoot, 'dist');
const PUBLIC_DIR = path.join(projectRoot, 'public');
const BASE_URL = (process.env.SITE_BASE_URL || 'https://cinebsite.vercel.app').replace(/\/?$/, '');

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function buildSitemap(routes) {
  const today = formatDate();

  const entries = routes.map((route) => {
    const loc = `${BASE_URL}${route === '/' ? '' : route}`;
    let priority = '0.80';
    if (route === '/') priority = '1.00';
    else if (route.startsWith('/produit') || route.startsWith('/realisation')) priority = '0.60';

    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

async function writeSitemap(routes) {
  const xml = buildSitemap(routes.sort());
  await Promise.all([
    fs.outputFile(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf8'),
    fs.outputFile(path.join(PUBLIC_DIR, 'sitemap.xml'), xml, 'utf8'),
  ]);
}

async function loadTemplate() {
  const templatePath = path.join(DIST_DIR, 'index.html');
  const html = await fs.readFile(templatePath, 'utf8');
  return html;
}

function injectMarkup(template, markup) {
  return template.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
}

async function renderRoutes(viteServer, template, routes) {
  const { render } = await viteServer.ssrLoadModule('/src/entry-server.jsx');

  for (const url of routes) {
    const { html } = await render(url);
    const documentHtml = injectMarkup(template, html);

    const outputPath = url === '/'
      ? path.join(DIST_DIR, 'index.html')
      : path.join(DIST_DIR, url.replace(/^\//, ''), 'index.html');

    await fs.outputFile(outputPath, documentHtml, 'utf8');
    console.log(`[prerender] generated ${outputPath}`);
  }
}

async function getRoutes(viteServer) {
  const { getPreRenderRoutes } = await viteServer.ssrLoadModule('/scripts/prerenderRoutes.js');
  return getPreRenderRoutes(projectRoot);
}

async function run() {
  const template = await loadTemplate();

  const viteServer = await createServer({
    root: projectRoot,
    server: { middlewareMode: 'ssr', hmr: false },
    appType: 'custom',
  });

  try {
    const routes = await getRoutes(viteServer);
    await renderRoutes(viteServer, template, routes);
    await writeSitemap(routes);
  } finally {
    await viteServer.close();
  }
}

run().catch((error) => {
  console.error('[prerender] failed', error);
  process.exit(1);
});
