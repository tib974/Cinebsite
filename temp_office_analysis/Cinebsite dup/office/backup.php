<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

$maps = [
  'catalog' => 'catalog.json',
  'realisations' => 'realisations.json',
  'calendar' => 'calendar.json',
];

// Downloads
if (isset($_GET['dl'])) {
  $dl = $_GET['dl'];
  if ($dl === 'all') {
    $payload = [
      'catalog' => read_json('catalog.json', []),
      'realisations' => read_json('realisations.json', []),
      'calendar' => read_json('calendar.json', []),
    ];
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="cineb-backup.json"');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
  }
  if (isset($maps[$dl])) {
    $data = read_json($maps[$dl], []);
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="'.$maps[$dl].'"');
    echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
  }
}

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  require_csrf();
  $target = $_POST['target'] ?? '';
  if ($target === 'all') {
    if (!empty($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
      $raw = file_get_contents($_FILES['file']['tmp_name']);
      $j = json_decode($raw, true);
      if (is_array($j)) {
        if (isset($j['catalog']) && is_array($j['catalog'])) write_json('catalog.json', $j['catalog']);
        if (isset($j['realisations']) && is_array($j['realisations'])) write_json('realisations.json', $j['realisations']);
        if (isset($j['calendar']) && is_array($j['calendar'])) write_json('calendar.json', $j['calendar']);
        $msg = 'Import global effectué.';
      } else { $msg = 'Fichier invalide.'; }
    }
  } elseif (isset($maps[$target])) {
    if (!empty($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
      $raw = file_get_contents($_FILES['file']['tmp_name']);
      $j = json_decode($raw, true);
      if (is_array($j)) { write_json($maps[$target], $j); $msg = 'Import effectué: '.$maps[$target]; }
      else { $msg = 'Fichier invalide.'; }
    }
  }
}
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Backup — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f}
    .wrap{padding:18px;max-width:760px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px;margin-bottom:14px}
    .muted{color:#a0a3a8}
    a.btn,button.btn{background:#6a4bc7;border:none;color:#fff;padding:9px 14px;border-radius:8px;text-decoration:none;font-weight:700}
    input[type=file]{color:#eaeaea}
  </style>
</head>
<body>
  <header><a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a></header>
  <div class="wrap">
    <?php if($msg): ?><div class="card" style="border-color:#2f8147;background:#142318">✅ <?php echo htmlspecialchars($msg); ?></div><?php endif; ?>

    <div class="card">
      <h2>Téléchargements</h2>
      <p class="muted">Récupérez vos données au format JSON.</p>
      <p>
        <a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/backup.php?dl=catalog">Catalogue</a>
        <a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/backup.php?dl=realisations">Réalisations</a>
        <a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/backup.php?dl=calendar">Calendrier</a>
        <a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/backup.php?dl=all">Tout (global)</a>
      </p>
    </div>

    <div class="card">
      <h2>Import d’un fichier JSON</h2>
      <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <label>Cible</label>
        <select name="target">
          <option value="catalog">Catalogue</option>
          <option value="realisations">Réalisations</option>
          <option value="calendar">Calendrier</option>
          <option value="all">Global (catalog+realisations+calendar)</option>
        </select>
        <div style="height:10px"></div>
        <input type="file" name="file" accept="application/json" required>
        <div style="height:10px"></div>
        <button type="submit" class="btn">Importer</button>
      </form>
    </div>
  </div>
</body>
</html>

