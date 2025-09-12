<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/config.php';

$catalog = read_json('catalog.json', []);
$reals = read_json('realisations.json', []);
$calendar = read_json('calendar.json', []);
$quotesPath = data_path('quotes.csv');
$quotesCount = 0;
if (file_exists($quotesPath)) {
  $quotesCount = max(0, count(file($quotesPath)) - 1);
}
$uses_default_password = false;
if (function_exists('get_admin_hash') && defined('ADMIN_BOOTSTRAP_PASSWORD')) {
  $hash = get_admin_hash();
  if ($hash) { $uses_default_password = password_verify(ADMIN_BOOTSTRAP_PASSWORD, $hash); }
}
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin — CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="X-Robots-Tag" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f;display:flex;justify-content:space-between;align-items:center}
    a.btn,button.btn{background:#6a4bc7;border:none;color:#fff;padding:9px 14px;border-radius:8px;text-decoration:none;font-weight:700}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:16px;padding:18px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px}
    .muted{color:#a0a3a8}
    .stat{font-size:28px;font-weight:800}
    nav a{margin-right:10px;color:#fff;text-decoration:none}
  </style>
</head>
  <body>
    <header>
    <div>CinéB — Administration</div>
    <nav>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/catalog.php">Catalogue</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/realisations.php">Réalisations</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/calendar.php">Calendrier</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/quotes.php">Devis</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/backup.php">Backup</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/analytics.php">Analytics</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/import.php">Import</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/layout.php">Layout</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/layout_versions.php">Versions</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/settings.php">Paramètres</a>
      <a href="<?php echo ADMIN_BASE_PATH; ?>/logout.php">Quitter</a>
      <a href="#" onclick="var p=prompt('URL publique à éditer (ex: /index.html):','/index.html'); if(p){ location.href='<?php echo ADMIN_BASE_PATH; ?>/layout.php?page='+encodeURIComponent(p); } return false;">Éditer une page…</a>
    </nav>
    </header>
    <main>
      <div class="grid" style="padding-top:0">
        <div class="card">
          <h2>Assistant UX (accès rapide)</h2>
          <p class="muted">Ouvrir la page publique avec l’assistant d’édition (blocs, grilles, thèmes, audit).</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="btn" href="/index.html?layout=edit" target="_blank">Accueil</a>
            <a class="btn" href="/packs.html?layout=edit" target="_blank">Packs</a>
            <a class="btn" href="/services.html?layout=edit" target="_blank">Services</a>
            <a class="btn" href="/realisations.html?layout=edit" target="_blank">Réalisations</a>
            <a class="btn" href="/calendrier.html?layout=edit" target="_blank">Calendrier</a>
            <a class="btn" href="/contact.html?layout=edit" target="_blank">Contact</a>
          </div>
        </div>
      </div>
    <?php if($uses_default_password): ?>
      <div class="grid" style="padding-top:0">
        <div class="card" style="border-color:#7a1f1f;background:#241313">
          <div style="font-weight:800;margin-bottom:6px">Sécurité: mot de passe par défaut</div>
          <div class="muted">Le mot de passe admin n’a pas été modifié depuis l’installation. Allez dans Paramètres pour le changer.</div>
          <div style="margin-top:10px"><a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/settings.php">Changer le mot de passe</a></div>
        </div>
      </div>
    <?php endif; ?>
    <div class="grid">
      <div class="card"><div class="muted">Produits/Packs</div><div class="stat"><?php echo count($catalog); ?></div><div style="margin-top:10px"><a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/catalog.php">Gérer</a></div></div>
      <div class="card"><div class="muted">Réalisations</div><div class="stat"><?php echo count($reals); ?></div><div style="margin-top:10px"><a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/realisations.php">Gérer</a></div></div>
      <div class="card"><div class="muted">Plages calendrier</div><div class="stat"><?php echo count($calendar); ?></div><div style="margin-top:10px"><a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/calendar.php">Gérer</a></div></div>
      <?php $aviews = file_exists(data_path('analytics.csv')) ? max(0, count(file(data_path('analytics.csv'))) - 1) : 0; ?>
      <div class="card"><div class="muted">Vues (total)</div><div class="stat"><?php echo $aviews; ?></div><div style="margin-top:10px"><a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/analytics.php">Voir</a></div></div>
      <div class="card"><div class="muted">Devis reçus</div><div class="stat"><?php echo $quotesCount; ?></div><div style="margin-top:10px"><a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/quotes.php">Voir</a></div></div>
    </div>
    </main>
</body>
</html>
