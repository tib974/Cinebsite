<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/csv_import.php';

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  require_csrf();
  if (isset($_POST['import']) && $_POST['import'] === 'catalog') {
    $src = __DIR__ . '/../data/catalogfdf.csv';
    $data = import_catalog_from_csv($src);
    write_json('catalog.json', $data);
    $msg = 'Catalogue importé depuis CSV (' . count($data) . ' éléments).';
  }
  if (isset($_POST['import']) && $_POST['import'] === 'realisations') {
    $src = __DIR__ . '/../data/realisations.csv';
    $data = import_realisations_from_csv($src);
    write_json('realisations.json', $data);
    $msg = 'Réalisations importées depuis CSV (' . count($data) . ' éléments).';
  }
}

?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Import — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f}
    .wrap{padding:18px;max-width:680px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px;margin-bottom:16px}
    button{background:#6a4bc7;border:none;color:#fff;padding:9px 14px;border-radius:8px;cursor:pointer;font-weight:700}
    .muted{color:#a0a3a8}
  </style>
</head>
<body>
  <header>
    <a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a>
  </header>
  <div class="wrap">
    <?php if($msg): ?><div class="card" style="border-color:#2f8147;background:#142318">✅ <?php echo htmlspecialchars($msg); ?></div><?php endif; ?>
    <div class="card">
      <h2>Importer le catalogue</h2>
      <p class="muted">Source: <code>data/catalogfdf.csv</code>. Le fichier JSON <code>data/catalog.json</code> sera écrasé.</p>
      <form method="post">
        <input type="hidden" name="import" value="catalog">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <button type="submit">Importer</button>
      </form>
    </div>
    <div class="card">
      <h2>Importer les réalisations</h2>
      <p class="muted">Source: <code>data/realisations.csv</code>. Le fichier JSON <code>data/realisations.json</code> sera écrasé.</p>
      <form method="post">
        <input type="hidden" name="import" value="realisations">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <button type="submit">Importer</button>
      </form>
    </div>
  </div>
</body>
</html>
