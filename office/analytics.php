<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

$csv = data_path('analytics.csv');
$rows = [];
if (file_exists($csv)) {
  if (($fp = fopen($csv, 'r')) !== false) {
    $headers = fgetcsv($fp) ?: [];
    while (($r = fgetcsv($fp)) !== false) { $rows[] = $r; }
    fclose($fp);
  }
}

// Basic aggregation last 7 days
$since = strtotime('-7 days');
$perPath = [];
foreach ($rows as $r) {
  $ts = strtotime($r[0] ?? '');
  if ($ts === false || $ts < $since) continue;
  $path = $r[1] ?? '/';
  $perPath[$path] = ($perPath[$path] ?? 0) + 1;
}
arsort($perPath);
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Analytics — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f}
    .wrap{padding:18px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid #2a2b2f;padding:8px;text-align:left}
    .muted{color:#a0a3a8}
  </style>
</head>
<body>
  <header>
    <a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a>
  </header>
  <div class="wrap">
    <div class="card">
      <h2>Vues des 7 derniers jours</h2>
      <table>
        <tr><th>Page</th><th>Vues</th></tr>
        <?php foreach($perPath as $path=>$cnt): ?>
          <tr><td><?php echo htmlspecialchars($path); ?></td><td><?php echo $cnt; ?></td></tr>
        <?php endforeach; ?>
        <?php if(empty($perPath)): ?>
          <tr><td colspan="2" class="muted">Aucune donnée pour le moment.</td></tr>
        <?php endif; ?>
      </table>
    </div>
  </div>
</body>
</html>

