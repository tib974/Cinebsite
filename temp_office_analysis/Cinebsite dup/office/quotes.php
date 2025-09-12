<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

$csvPath = data_path('quotes.csv');
$rows = [];
if (file_exists($csvPath)) {
  if (($fp = fopen($csvPath, 'r')) !== false) {
    $headers = fgetcsv($fp) ?: [];
    while (($r = fgetcsv($fp)) !== false) { $rows[] = $r; }
    fclose($fp);
  }
}

?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Devis — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f}
    .wrap{padding:18px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid #2a2b2f;padding:8px;text-align:left;color:#eaeaea}
    a.btn{background:#6a4bc7;border:none;color:#fff;padding:9px 14px;border-radius:8px;text-decoration:none;font-weight:700}
    .muted{color:#a0a3a8}
  </style>
</head>
<body>
  <header>
    <a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a>
  </header>
  <div class="wrap">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2>Demandes de devis</h2>
        <?php if(file_exists($csvPath)): ?>
          <a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/download.php?type=quotes">Télécharger CSV</a>
        <?php endif; ?>
      </div>
      <table>
        <tr><th>Reçu</th><th>Nom</th><th>Email</th><th>Tel</th><th>Matériel</th><th>Dates</th><th>Source</th><th>IP</th></tr>
        <?php foreach($rows as $r): ?>
          <tr>
            <?php foreach($r as $i=>$v): ?>
              <td><?php echo htmlspecialchars($v); ?></td>
            <?php endforeach; ?>
          </tr>
        <?php endforeach; ?>
        <?php if(empty($rows)): ?>
          <tr><td colspan="8" class="muted">Aucune demande pour le moment.</td></tr>
        <?php endif; ?>
      </table>
    </div>
  </div>
</body>
</html>
