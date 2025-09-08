<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

$items = read_json('catalog.json', []);

// Save handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  require_csrf();
  $mode = $_POST['mode'] ?? '';
  if ($mode === 'save') {
    $entry = [
      'type' => strtolower(trim($_POST['type'] ?? 'product')),
      'category' => trim($_POST['category'] ?? ''),
      'name' => trim($_POST['name'] ?? ''),
      'slug' => strtolower(trim($_POST['slug'] ?? '')),
      'reference' => trim($_POST['reference'] ?? ''),
      'price_eur_day' => trim($_POST['price_eur_day'] ?? ''),
      'image' => trim($_POST['image'] ?? ''),
      'featured' => isset($_POST['featured']) && $_POST['featured'] === '1',
      'includes' => trim($_POST['includes'] ?? ''),
      'description' => trim($_POST['description'] ?? ''),
      'order' => intval($_POST['order'] ?? 0)
    ];
    if ($entry['slug'] === '') $entry['slug'] = slugify($entry['name']);
    $found = false;
    foreach ($items as &$it) {
      if (strtolower($it['slug']) === strtolower($entry['slug'])) { $it = $entry; $found = true; break; }
    }
    unset($it);
    if (!$found) $items[] = $entry;
    write_json('catalog.json', $items);
    header('Location: '.ADMIN_BASE_PATH.'/catalog.php?saved=1'); exit;
  } elseif ($mode === 'delete') {
    $slug = strtolower(trim($_POST['slug'] ?? ''));
    $items = array_values(array_filter($items, fn($it)=> strtolower($it['slug']) !== $slug));
    write_json('catalog.json', $items);
    header('Location: '.ADMIN_BASE_PATH.'/catalog.php?deleted=1'); exit;
  } elseif ($mode === 'duplicate') {
    $slug = strtolower(trim($_POST['slug'] ?? ''));
    foreach ($items as $it) {
      if (strtolower($it['slug']) === $slug) {
        $copy = $it;
        $base = $copy['slug'] . '-copie';
        $newSlug = $base; $i=1;
        $slugs = array_map(fn($x)=>$x['slug'], $items);
        while (in_array($newSlug, $slugs)) { $i++; $newSlug = $base.'-'.$i; }
        $copy['slug'] = $newSlug;
        $copy['name'] = $copy['name'] . ' (copie)';
        $items[] = $copy;
        break;
      }
    }
    write_json('catalog.json', $items);
    header('Location: '.ADMIN_BASE_PATH.'/catalog.php?duplicated=1'); exit;
  } elseif ($mode === 'save_order') {
    $order = $_POST['order'] ?? [];
    if (!is_array($order)) $order = [];
    $pos = 0;
    $index = [];
    foreach ($items as $k => $it) { $index[strtolower($it['slug'])] = $k; }
    foreach ($order as $slug) {
      $sl = strtolower(trim($slug));
      if (isset($index[$sl])) { $items[$index[$sl]]['order'] = $pos++; }
    }
    write_json('catalog.json', $items);
    header('Location: '.ADMIN_BASE_PATH.'/catalog.php?ordered=1'); exit;
  }
}

// Editing if slug provided
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
  <title>Catalogue — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f;display:flex;justify-content:space-between;align-items:center}
    .wrap{padding:18px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px}
    input,textarea,select{width:100%;padding:10px;border-radius:8px;border:1px solid #2a2b2f;background:#0f1013;color:#eaeaea}
    button{background:#6a4bc7;border:none;color:#fff;padding:9px 14px;border-radius:8px;cursor:pointer;font-weight:700}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid #2a2b2f;padding:8px;text-align:left}
    img.thumb{width:48px;height:48px;object-fit:contain;border-radius:6px;border:1px solid #2a2b2f;background:#0f1013}
    .muted{color:#a0a3a8}
    @media(max-width:900px){.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header>
    <a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a>
    <div>Catalogue</div>
    <div></div>
  </header>
  <div class="wrap">
    <div class="grid">
      <div class="card">
        <h2><?php echo $edit ? 'Modifier' : 'Nouveau'; ?> produit/pack</h2>
        <form method="post">
          <input type="hidden" name="mode" value="save">
          <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
          <label class="muted">Type</label>
          <select name="type" required>
            <?php $t=$edit['type']??'product'; ?>
            <option value="product" <?php if($t==='product') echo 'selected'; ?>>Produit</option>
            <option value="pack" <?php if($t==='pack') echo 'selected'; ?>>Pack</option>
          </select>
          <label class="muted">Catégorie</label>
          <input name="category" value="<?php echo htmlspecialchars($edit['category']??''); ?>" placeholder="Image, Lumière, Audio…">
          <label class="muted">Nom</label>
          <input name="name" required value="<?php echo htmlspecialchars($edit['name']??''); ?>">
          <label class="muted">Identifiant (slug)</label>
          <input name="slug" value="<?php echo htmlspecialchars($edit['slug']??''); ?>" placeholder="auto">
          <label class="muted">Référence (SKU / modèle exact)</label>
          <input name="reference" value="<?php echo htmlspecialchars($edit['reference']??''); ?>" placeholder="ex: ILME-FX30 or NP-FZ100">
          <label class="muted">Prix / jour (€)</label>
          <input name="price_eur_day" value="<?php echo htmlspecialchars($edit['price_eur_day']??''); ?>" placeholder="ex: 45">
          <label class="muted">Ordre (optionnel)</label>
          <input name="order" type="number" value="<?php echo htmlspecialchars($edit['order']??'0'); ?>" placeholder="0">
          <label class="muted">Image (URL)</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input id="imageInput" name="image" value="<?php echo htmlspecialchars($edit['image']??''); ?>" placeholder="assets/..." style="flex:1;min-width:280px">
            <input id="uploadFile" type="file" accept="image/*" style="width:220px">
            <button type="button" class="btn" onclick="return uploadImage(this)">Uploader</button>
            <button type="button" class="btn" onclick="return suggestImage(this)">Suggérer (Local)</button>
            <button type="button" class="btn" onclick="return suggestImageWeb(this)">Suggérer (Web)</button>
            <button type="button" class="btn" onclick="return bestVariant(this)">Meilleure variante</button>
            <label class="muted" style="display:inline-flex;align-items:center;gap:6px"><input id="optimizeUpload" type="checkbox" checked> Optimiser (fond + WebP/AVIF + tailles)</label>
          </div>
          <div id="suggestions" class="muted" style="margin-top:8px"></div>
          <div style="display:flex;align-items:center;gap:8px;margin:10px 0">
            <input type="checkbox" id="featured" name="featured" value="1" <?php echo !empty($edit['featured'])?'checked':''; ?>>
            <label for="featured">Mettre en avant</label>
          </div>
          <?php if(($edit['type']??'')==='pack'): ?>
          <div class="muted" style="margin:8px 0">Image pack: choisissez entre montage studio ou IA photoréaliste. Générez plusieurs variantes, validez celles à conserver.</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button type="button" class="btn" onclick="return composePackImage(this)">Montage studio (local)</button>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="nVariants" type="number" min="1" max="8" value="4" style="width:80px">
              <button type="button" class="btn" onclick="return generatePackAI(this, document.getElementById('nVariants').value)">IA: Générer variantes</button>
              <button type="button" class="btn" onclick="return listAIVariants(this)">Voir variantes</button>
            </div>
          </div>
          <div id="aiVariants" class="muted" style="margin-top:8px"></div>
          <?php endif; ?>
          <label class="muted">Inclus (slugs séparés par des virgules)</label>
          <input name="includes" value="<?php echo htmlspecialchars($edit['includes']??''); ?>" placeholder="ex: sony-fx30, tamron1770">
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
          <tr><th></th><th>Nom</th><th>Catégorie</th><th>Type</th><th>Prix</th><th></th></tr>
          <?php usort($items, function($a,$b){ return ($a['order']??0) <=> ($b['order']??0) ?: strcasecmp($a['name'],$b['name']);}); foreach($items as $it): ?>
            <tr draggable="true" data-slug="<?php echo htmlspecialchars($it['slug']); ?>">
              <td><?php if(!empty($it['image'])): ?><img class="thumb" src="../<?php echo htmlspecialchars($it['image']); ?>"><?php endif; ?></td>
              <td><?php echo htmlspecialchars($it['name']); ?><div class="muted"><?php echo htmlspecialchars($it['slug']); ?></div></td>
              <td><?php echo htmlspecialchars($it['category']); ?></td>
              <td><?php echo htmlspecialchars($it['type']); ?></td>
              <td><?php echo htmlspecialchars($it['price_eur_day']); ?></td>
              <td>
                <a class="btn" href="<?php echo ADMIN_BASE_PATH; ?>/catalog.php?slug=<?php echo urlencode($it['slug']); ?>">Éditer</a>
                <form method="post" style="display:inline" onsubmit="return confirm('Supprimer cet élément ?');">
                  <input type="hidden" name="mode" value="delete">
                  <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
                  <input type="hidden" name="slug" value="<?php echo htmlspecialchars($it['slug']); ?>">
                  <button style="background:#c74b4b" type="submit">Supprimer</button>
                </form>
                <form method="post" style="display:inline">
                  <input type="hidden" name="mode" value="duplicate">
                  <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
                  <input type="hidden" name="slug" value="<?php echo htmlspecialchars($it['slug']); ?>">
                  <button type="submit">Dupliquer</button>
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
        if(document.getElementById('optimizeUpload')?.checked){ fd.append('opt', '1'); }
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
    // Auto-suggest when filling name/slug and no image yet
    ['input[name="name"]','input[name="slug"]'].forEach(sel=>{
      const el=document.querySelector(sel); if(!el) return;
      el.addEventListener('blur', ()=>{ const img=(document.getElementById('imageInput')?.value||'').trim(); if(!img){ const btn=document.createElement('button'); btn.textContent=''; suggestImage(btn); } });
    });

    async function suggestImage(btn){
      const slug = (document.querySelector('input[name="slug"]')?.value || '').trim() || (document.querySelector('input[name="name"]')?.value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
      const name = (document.querySelector('input[name="name"]')?.value || '').trim();
      btn.disabled=true; const old=btn.textContent; btn.textContent='Recherche…';
      try{
        const url = '<?php echo ADMIN_BASE_PATH; ?>/suggest_image.php?slug='+encodeURIComponent(slug)+'&name='+encodeURIComponent(name);
        const r = await fetch(url, {headers:{'Accept':'application/json'}});
        const j = await r.json(); if(!j.ok) throw new Error(j.error||'échec');
        const wrap = document.getElementById('suggestions');
        if(!j.items.length){ wrap.textContent='Aucune suggestion trouvée.'; return false; }
        wrap.innerHTML = '';
        const grid = document.createElement('div'); grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px';
        j.items.forEach(it=>{
          const c = document.createElement('div'); c.style.cssText='border:1px solid #2a2b2f;border-radius:8px;padding:8px;background:#14161a';
          const img = document.createElement('img'); img.src='../'+it.best; img.alt=''; img.style.cssText='width:100%;height:120px;object-fit:contain;background:#0f1013;border:1px solid #2a2b2f;border-radius:6px';
          const p = document.createElement('div'); p.style.cssText='font-size:12px;margin-top:6px;word-break:break-all'; p.textContent=it.best;
          const b = document.createElement('button'); b.className='btn'; b.textContent='Choisir'; b.style.cssText='margin-top:6px'; b.onclick=()=>{ document.getElementById('imageInput').value = it.best; };
          c.appendChild(img); c.appendChild(p); c.appendChild(b); grid.appendChild(c);
        });
        wrap.appendChild(grid);
      }catch(e){ alert('Suggestions indisponibles: '+e.message); }
      finally{ btn.disabled=false; btn.textContent=old; }
      return false;
    }
    async function bestVariant(btn){
      const path = (document.getElementById('imageInput')?.value||'').trim(); if(!path) return alert('Renseignez d\'abord une image.');
      btn.disabled=true; const old=btn.textContent; btn.textContent='Optimisation…';
      try{
        const params = new URLSearchParams(); params.set('path', path); if(document.getElementById('optimizeUpload')?.checked) params.set('opt','1');
        const r = await fetch('<?php echo ADMIN_BASE_PATH; ?>/image_best.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:String(params) });
        const j = await r.json(); if(!j.ok) throw new Error(j.error||'échec');
        document.getElementById('imageInput').value = j.best;
      }catch(e){ alert('Échec optimisation: '+e.message); }
      finally{ btn.disabled=false; btn.textContent=old; }
      return false;
    }

    function buildSuggestionsGrid(items, web){
      const wrap = document.getElementById('suggestions');
      if(!items.length){ wrap.textContent = web? 'Aucune image web correspondante.':'Aucune suggestion locale.'; return; }
      wrap.innerHTML = '';
      const grid = document.createElement('div'); grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px';
      items.forEach(it=>{
        const c = document.createElement('div'); c.style.cssText='border:1px solid #2a2b2f;border-radius:8px;padding:8px;background:#14161a';
        const img = document.createElement('img'); img.src = (web? (it.thumb||it.best): ('../'+it.best)); img.alt=''; img.style.cssText='width:100%;height:140px;object-fit:contain;background:#0f1013;border:1px solid #2a2b2f;border-radius:6px';
        const p = document.createElement('div'); p.style.cssText='font-size:12px;margin-top:6px;word-break:break-all'; p.textContent = it.best || it.path;
        const bar = document.createElement('div'); bar.style.cssText='display:flex;gap:6px;margin-top:6px;flex-wrap:wrap';
        const choose = document.createElement('button'); choose.className='btn'; choose.textContent = web? 'Importer' : 'Choisir';
        choose.onclick = async ()=>{
          if(web){
            try{
              const fd = new URLSearchParams(); fd.set('csrf','<?php echo htmlspecialchars(csrf_token()); ?>'); fd.set('url', it.best || it.url || it.path); if(document.getElementById('optimizeUpload')?.checked) fd.set('opt','1');
              const r = await fetch('<?php echo ADMIN_BASE_PATH; ?>/fetch_image.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:String(fd) });
              const j = await r.json(); if(!j.ok) throw new Error(j.error||'');
              document.getElementById('imageInput').value = j.path; alert('Image importée.');
            }catch(e){ alert('Import impossible: '+e.message); }
          } else {
            document.getElementById('imageInput').value = it.best;
          }
        };
        bar.appendChild(choose);
        c.appendChild(img); c.appendChild(p); c.appendChild(bar); grid.appendChild(c);
      });
      wrap.appendChild(grid);
    }

    async function suggestImageWeb(btn){
      const slug = (document.querySelector('input[name="slug"]')?.value || '').trim();
      const name = (document.querySelector('input[name="name"]')?.value || '').trim();
      const ref  = (document.querySelector('input[name="reference"]')?.value || '').trim();
      if(!slug && !name){ alert('Renseignez un nom ou un identifiant.'); return false; }
      btn.disabled=true; const old=btn.textContent; btn.textContent='Recherche…';
      try{
        const url = '<?php echo ADMIN_BASE_PATH; ?>/suggest_image.php?web=1&slug='+encodeURIComponent(slug)+'&name='+encodeURIComponent(name)+'&ref='+encodeURIComponent(ref);
        const r = await fetch(url, {headers:{'Accept':'application/json'}});
        const j = await r.json(); if(!j.ok) throw new Error(j.error||'échec');
        buildSuggestionsGrid(j.items||[], true);
      }catch(e){ alert('Suggestions web indisponibles: '+e.message); }
      finally{ btn.disabled=false; btn.textContent=old; }
      return false;
    }
    async function composePackImage(btn){
      const slug = (document.querySelector('input[name="slug"]')?.value || '').trim(); if(!slug) return alert('Slug requis.');
      btn.disabled=true; const old=btn.textContent; btn.textContent='Composition…';
      try{
        const fd = new URLSearchParams(); fd.set('csrf','<?php echo htmlspecialchars(csrf_token()); ?>'); fd.set('slug', slug);
        const r = await fetch('<?php echo ADMIN_BASE_PATH; ?>/pack_composite.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:String(fd) });
        const j = await r.json(); if(!j.ok) throw new Error(j.error||'');
        document.getElementById('imageInput').value = j.path; alert('Image pack générée.');
      }catch(e){ alert('Échec: '+e.message+'\nVérifiez que ImageMagick est disponible.'); }
      finally{ btn.disabled=false; btn.textContent=old; }
      return false;
    }
    async function generatePackAI(btn, n){
      const slug = (document.querySelector('input[name="slug"]')?.value || '').trim(); if(!slug) return alert('Slug requis.');
      n = Math.max(1, Math.min(8, parseInt(n||4)));
      btn.disabled=true; const old=btn.textContent; btn.textContent='Génération…';
      try{
        const fd = new URLSearchParams(); fd.set('csrf','<?php echo htmlspecialchars(csrf_token()); ?>'); fd.set('slug', slug); fd.set('n', String(n));
        const r = await fetch('<?php echo ADMIN_BASE_PATH; ?>/generate_pack_ai.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:String(fd) });
        const j = await r.json(); if(!j.ok) throw new Error(j.error||'');
        await listAIVariants(btn);
        alert('Variantes IA générées.');
      }catch(e){ alert('Échec IA: '+e.message+'\nVérifiez que la clé et le fournisseur IA sont configurés dans Paramètres.'); }
      finally{ btn.disabled=false; btn.textContent=old; }
      return false;
    }
    async function listAIVariants(btn){
      const slug = (document.querySelector('input[name="slug"]')?.value || '').trim(); if(!slug) return alert('Slug requis.');
      const box = document.getElementById('aiVariants'); box.textContent='Chargement…';
      try{
        const r = await fetch('<?php echo ADMIN_BASE_PATH; ?>/pack_ai_list.php?slug='+encodeURIComponent(slug));
        const j = await r.json(); if(!j.ok) throw new Error(j.error||'');
        const items = j.items||[]; if(!items.length){ box.textContent='Aucune variante IA'; return false; }
        box.innerHTML=''; const grid=document.createElement('div'); grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px';
        items.forEach(p=>{
          const c=document.createElement('div'); c.style.cssText='border:1px solid #2a2b2f;border-radius:8px;padding:8px;background:#14161a';
          const img=document.createElement('img'); img.src='../'+p; img.style.cssText='width:100%;height:160px;object-fit:contain;background:#0f1013;border:1px solid #2a2b2f;border-radius:6px';
          const bar=document.createElement('div'); bar.style.cssText='display:flex;gap:6px;margin-top:6px;flex-wrap:wrap';
          const use=document.createElement('button'); use.className='btn'; use.textContent='Utiliser'; use.onclick=()=>{ document.getElementById('imageInput').value=p; alert('Image sélectionnée. Cliquez Enregistrer pour appliquer.'); };
          const del=document.createElement('button'); del.className='btn'; del.style.background='#7a1f1f'; del.textContent='Suppr.'; del.onclick=async()=>{ if(!confirm('Supprimer cette variante ?')) return; const fd=new URLSearchParams(); fd.set('csrf','<?php echo htmlspecialchars(csrf_token()); ?>'); fd.set('path', p); const rr=await fetch('<?php echo ADMIN_BASE_PATH; ?>/pack_ai_delete.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:String(fd)}); const jj=await rr.json(); if(jj.ok){ c.remove(); }else{ alert('Échec suppression'); } };
          bar.appendChild(use); bar.appendChild(del); c.appendChild(img); c.appendChild(bar); grid.appendChild(c);
        }); box.appendChild(grid);
      }catch(e){ box.textContent='Erreur: '+e.message; }
      return false;
    }
  </script>
</body>
</html>
