<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

$dataDir = data_path('');
$files = glob($dataDir . 'layout-*.json');
rsort($files);

if (isset($_POST['restore'])) {
  $sel = basename($_POST['restore']);
  $src = $dataDir . $sel;
  $dst = $dataDir . 'layout.json';
  if (is_file($src)) {
    @copy($src, $dst);
    header('Location: '.ADMIN_BASE_PATH.'/layout_versions.php?restored=1');
    exit;
  }
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Versions Layout — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f}
    .wrap{padding:18px;max-width:900px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px;margin-bottom:14px}
    .muted{color:#a0a3a8}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid #2a2b2f;padding:8px;text-align:left}
    button{background:#6a4bc7;border:none;color:#fff;padding:7px 12px;border-radius:8px;cursor:pointer;font-weight:700}
  </style>
</head>
<body>
  <header><a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a></header>
  <div class="wrap">
    <?php if(!empty($_GET['restored'])): ?><div class="card" style="border-color:#2f8147;background:#142318">✅ Version restaurée comme layout actif.</div><?php endif; ?>
    <div class="card">
      <h2>Versions sauvegardées</h2>
      <p class="muted">Une sauvegarde est créée automatiquement à chaque publication.</p>
      <table>
        <tr><th>Fichier</th><th>Taille</th><th></th></tr>
        <?php foreach($files as $f): $bn=basename($f); ?>
          <tr>
            <td><?php echo htmlspecialchars($bn); ?></td>
            <td class="muted"><?php echo number_format(filesize($f)).' octets'; ?></td>
            <td>
              <form method="post" style="display:inline" onsubmit="return confirm('Restaurer cette version ?');">
                <input type="hidden" name="restore" value="<?php echo htmlspecialchars($bn); ?>">
                <button type="submit">Restaurer</button>
              </form>
              <a class="btn" href="../data/<?php echo rawurlencode($bn); ?>" download style="margin-left:6px">Télécharger</a>
            </td>
          </tr>
        <?php endforeach; if(!$files): ?>
          <tr><td colspan="3" class="muted">Aucune version disponible.</td></tr>
        <?php endif; ?>
      </table>
    </div>
  </div>
</body>
</html>

