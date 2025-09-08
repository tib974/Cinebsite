<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

$items = read_json('realisations.json', []);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  require_csrf();
  $mode = $_POST['mode'] ?? '';
  if ($mode === 'save') {
    $entry = [
      'title' => trim($_POST['title'] ?? ''),
      'slug' => strtolower(trim($_POST['slug'] ?? '')),
      'image' => trim($_POST['image'] ?? ''),
      'url' => trim($_POST['url'] ?? ''),
      'date' => trim($_POST['date'] ?? ''),
      'tags' => trim($_POST['tags'] ?? ''),
      'featured' => isset($_POST['featured']) && $_POST['featured'] === '1',
      'description' => trim($_POST['description'] ?? ''),
      'order' => intval($_POST['order'] ?? 0)
    ];
    if ($entry['slug'] === '') $entry['slug'] = slugify($entry['title']);
    $found = false;
    foreach ($items as &$it) { if (strtolower($it['slug']) === strtolower($entry['slug'])) { $it = $entry; $found = true; break; } }
    unset($it);
    if (!$found) $items[] = $entry;
    write_json('realisations.json', $items);
    header('Location: '.ADMIN_BASE_PATH.'/realisations.php?saved=1'); exit;
  } elseif ($mode === 'delete') {
    $slug = strtolower(trim($_POST['slug'] ?? ''));
    $items = array_values(array_filter($items, fn($it)=> strtolower($it['slug']) !== $slug));
    write_json('realisations.json', $items);
    header('Location: '.ADMIN_BASE_PATH.'/realisations.php?deleted=1'); exit;
  } elseif ($mode === 'save_order') {
    $order = $_POST['order'] ?? [];
    if (!is_array($order)) $order = [];
    $pos = 0;
    $index = [];
    foreach ($items as $k => $it) { $index[strtolower($it['slug'])] = $k; }
    foreach ($order as $slug) {
      $sl = strtolower(trim($slug));
      if (isset($index[$sl])) {
        $items[$index[$sl]]['order'] = $pos++;
      }
    }
    write_json('realisations.json', $items);
    header('Location: '.ADMIN_BASE_PATH.'/realisations.php?ordered=1'); exit;
  }
}

$edit = null;
if (!empty($_GET['slug'])) {
  $slug = strtolower(trim($_GET['slug']));
  foreach ($items as $it) if (strtolower($it['slug']) === $slug) { $edit = $it; break; }
}
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Réalisations — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f;display:flex;justify-content:space-between;align-items:center}
    .wrap{padding:18px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px}
    input,textarea{width:100%;padding:10px;border-radius:8px;border:1px solid #2a2b2f;background:#0f1013;color:#eaeaea}
    button{background:#6a4bc7;border:none;color:#fff;padding:9px 14px;border-radius:8px;cursor:pointer;font-weight:700}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid #2a2b2f;padding:8px;text-align:left}
    img.thumb{width:64px;height:36px;object-fit:cover;border-radius:6px;border:1px solid #2a2b2f;background:#0f1013}
    .muted{color:#a0a3a8}
    @media(max-width:900px){.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header>
    <a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a>
    <div>Réalisations</div>
    <div></div>
  </header>
  <div class="wrap">
    <div class="grid">
      <div class="card">
        <h2><?php echo $edit ? 'Modifier' : 'Nouveau'; ?> projet</h2>
        <form method="post">
          <input type="hidden" name="mode" value="save">
          <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
          <label class="muted">Titre</label>
          <input name="title" required value="<?php echo htmlspecialchars($edit['title']??''); ?>">
          <label class="muted">Identifiant (slug)</label>
          <input name="slug" value="<?php echo htmlspecialchars($edit['slug']??''); ?>" placeholder="auto">
          <label class="muted">Image (URL)</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input id="imageInput" name="image" value="<?php echo htmlspecialchars($edit['image']??''); ?>" style="flex:1">
            <input id="uploadFile" type="file" accept="image/*" style="width:220px">
            <button type="button" class="btn" onclick="return uploadImage(this)">Uploader</button>
          </div>
          <label class="muted">Lien vidéo (YouTube/Vimeo) ou URL</label>
          <input name="url" value="<?php echo htmlspecialchars($edit['url']??''); ?>">
          <label class="muted">Date</label>
          <input name="date" value="<?php echo htmlspecialchars($edit['date']??''); ?>" placeholder="YYYY-MM-DD">
          <label class="muted">Ordre (optionnel)</label>
          <input name="order" type="number" value="<?php echo htmlspecialchars($edit['order']??'0'); ?>" placeholder="0">
          <label class="muted">Mots-clés</label>
          <input name="tags" value="<?php echo htmlspecialchars($edit['tags']??''); ?>" placeholder="ex: interview, pub">
          <div style="display:flex;align-items:center;gap:8px;margin:10px 0">
            <input type="checkbox" id="featured" name="featured" value="1" <?php echo !empty($edit['featured'])?'checked':''; ?>>
            <label for="featured">Mettre en avant</label>
          </div>
          <label class="muted">Description</label>
          <textarea name="description" rows="4"><?php echo htmlspecialchars($edit['description']??''); ?></textarea>
          <div style="height:10px"></div>
          <button type="submit">Enregistrer</button>
        </form>
      </div>
      <div class="card">
        <h2>Liste</h2>
        <form method="post" id="orderForm">
          <input type="hidden" name="mode" value="save_order">
          <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
          <table>
            <tr><th></th><th>Titre</th><th>Date</th><th></th></tr>
            <?php usort($items, function($a,$b){ return ($a['order']??0) <=> ($b['order']??0) ?: strcasecmp($a['title'],$b['title']);}); foreach($items as $it): ?>
              <tr draggable="true" data-slug="<?php echo htmlspecialchars($it['slug']); ?>">
                <td><?php if(!empty($it['image'])): ?><img class="thumb" src="../<?php echo htmlspecialchars($it['image']); ?>"><?php endif; ?></td>
                <td><?php echo htmlspecialchars($it['title']); ?><div class="muted"><?php echo htmlspecialchars($it['slug']); ?></div></td>
                <td><?php echo htmlspecialchars($it['date']); ?></td>
                <td>
                  <a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/realisations.php?slug=<?php echo urlencode($it['slug']); ?>">Éditer</a>
                  <form method="post" style="display:inline" onsubmit="return confirm('Supprimer cet élément ?');">
                    <input type="hidden" name="mode" value="delete">
                    <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
                    <input type="hidden" name="slug" value="<?php echo htmlspecialchars($it['slug']); ?>">
                    <button style="background:#c74b4b" type="submit">Supprimer</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </table>
          <div style="margin-top:10px"><button type="submit" class="btn">Enregistrer l'ordre</button></div>
        </form>
      </div>
    </div>
  </div>
  <script>
    async function uploadImage(btn){
      const file = document.getElementById('uploadFile').files[0];
      if(!file){ alert('Choisissez une image.'); return false; }
      btn.disabled = true; btn.textContent = 'Envoi…';
      try{
        const fd = new FormData();
        fd.append('file', file);
        fd.append('csrf', '<?php echo htmlspecialchars(csrf_token()); ?>');
        const res = await fetch('<?php echo ADMIN_BASE_PATH; ?>/upload.php', { method:'POST', body: fd });
        const j = await res.json();
        if(!res.ok || !j.ok){ throw new Error(j.error||'Échec'); }
        document.getElementById('imageInput').value = j.path;
      }catch(e){ alert('Échec de l\'upload: '+e.message); }
      finally{ btn.disabled=false; btn.textContent='Uploader'; }
      return false;
    }
    // Drag & drop reorder
    const table = document.querySelector('table');
    let dragging;
    table.addEventListener('dragstart', e=>{ const tr=e.target.closest('tr[draggable]'); if(tr){ dragging=tr; tr.style.opacity=.5; }});
    table.addEventListener('dragend', e=>{ if(dragging){ dragging.style.opacity=''; dragging=null; }});
    table.addEventListener('dragover', e=>{ e.preventDefault(); const tr=e.target.closest('tr[draggable]'); if(!tr||!dragging||tr===dragging) return; const rect=tr.getBoundingClientRect(); const after=(e.clientY-rect.top)>(rect.height/2); tr.parentNode.insertBefore(dragging, after? tr.nextSibling : tr); });
    document.getElementById('orderForm')?.addEventListener('submit', (e)=>{
      const slugs=[...document.querySelectorAll('tr[draggable]')].map(tr=>tr.dataset.slug);
      slugs.forEach((slug)=>{ const iel=document.createElement('input'); iel.type='hidden'; iel.name='order[]'; iel.value=slug; e.target.appendChild(iel); });
    });
  </script>
</body>
</html>
