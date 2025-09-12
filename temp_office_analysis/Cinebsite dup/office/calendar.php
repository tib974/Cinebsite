<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

$items = read_json('calendar.json', []);
$catalog = read_json('catalog.json', []);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  require_csrf();
  $mode = $_POST['mode'] ?? '';
  if ($mode === 'save') {
    $entry = [
      'date' => trim($_POST['date'] ?? ''),
      'date_from' => trim($_POST['date_from'] ?? ''),
      'date_to' => trim($_POST['date_to'] ?? ''),
      'item_slug' => strtolower(trim($_POST['item_slug'] ?? '')),
      'status' => 'blocked',
    ];
    // normalize single date into date_from/date_to
    if ($entry['date'] && !$entry['date_from'] && !$entry['date_to']) {
      $entry['date_from'] = $entry['date'];
      $entry['date_to'] = $entry['date'];
      $entry['date'] = '';
    }
    $items[] = $entry;
    write_json('calendar.json', $items);
    header('Location: '.ADMIN_BASE_PATH.'/calendar.php?saved=1'); exit;
  } elseif ($mode === 'delete') {
    $idx = intval($_POST['idx'] ?? -1);
    if ($idx >= 0 && isset($items[$idx])) {
      array_splice($items, $idx, 1);
      write_json('calendar.json', $items);
    }
    header('Location: '.ADMIN_BASE_PATH.'/calendar.php?deleted=1'); exit;
  }
}

?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Calendrier — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f;display:flex;justify-content:space-between;align-items:center}
    .wrap{padding:18px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px}
    input,select{width:100%;padding:10px;border-radius:8px;border:1px solid #2a2b2f;background:#0f1013;color:#eaeaea}
    button{background:#6a4bc7;border:none;color:#fff;padding:9px 14px;border-radius:8px;cursor:pointer;font-weight:700}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid #2a2b2f;padding:8px;text-align:left}
    .muted{color:#a0a3a8}
    @media(max-width:900px){.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header>
    <a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a>
    <div>Calendrier</div>
    <div></div>
  </header>
  <div class="wrap">
    <div class="grid">
      <div class="card">
        <h2>Bloquer une période</h2>
        <form method="post">
          <input type="hidden" name="mode" value="save">
          <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
          <label class="muted">Matériel / Pack (facultatif)</label>
          <select name="item_slug">
            <option value="">— Tous —</option>
            <?php foreach($catalog as $c): ?>
              <option value="<?php echo htmlspecialchars($c['slug']); ?>"><?php echo htmlspecialchars($c['name']); ?> (<?php echo htmlspecialchars($c['slug']); ?>)</option>
            <?php endforeach; ?>
          </select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <label class="muted">Date unique</label>
              <input name="date" type="date">
            </div>
            <div></div>
          </div>
          <div class="muted" style="margin:6px 0">— ou —</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <label class="muted">Du</label>
              <input name="date_from" type="date">
            </div>
            <div>
              <label class="muted">Au</label>
              <input name="date_to" type="date">
            </div>
          </div>
          <div style="height:10px"></div>
          <button type="submit">Enregistrer</button>
        </form>
        <p class="muted">Si aucun matériel n’est choisi, la période s’applique à tout le catalogue.</p>
      </div>
      <div class="card">
        <h2>Périodes</h2>
        <table>
          <tr><th>Article</th><th>Du</th><th>Au</th><th></th></tr>
          <?php foreach($items as $i => $it): ?>
            <?php $from = $it['date_from'] ?: ($it['date'] ?? ''); $to = $it['date_to'] ?: ($it['date'] ?? ''); ?>
            <tr>
              <td><?php echo htmlspecialchars($it['item_slug'] ?: '—'); ?></td>
              <td><?php echo htmlspecialchars($from); ?></td>
              <td><?php echo htmlspecialchars($to); ?></td>
              <td>
                <form method="post" onsubmit="return confirm('Supprimer cette période ?');">
                  <input type="hidden" name="mode" value="delete">
                  <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
                  <input type="hidden" name="idx" value="<?php echo $i; ?>">
                  <button style="background:#c74b4b" type="submit">Supprimer</button>
                </form>
              </td>
            </tr>
          <?php endforeach; ?>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
