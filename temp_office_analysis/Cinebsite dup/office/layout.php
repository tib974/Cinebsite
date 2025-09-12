<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Layout — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f;display:flex;align-items:center;justify-content:space-between}
    .wrap{display:grid;grid-template-columns:320px 1fr;gap:12px;padding:12px}
    @media(max-width:1000px){ .wrap{grid-template-columns:1fr} }
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:12px}
    .muted{color:#a0a3a8}
    input,select,button{padding:10px;border-radius:8px;border:1px solid #2a2b2f;background:#0f1013;color:#eaeaea}
    button.btn{background:#6a4bc7;border:none;color:#fff;font-weight:700;cursor:pointer}
    .row{display:flex;gap:8px;align-items:center;margin:6px 0}
    iframe{width:100%;height:70vh;border:1px solid #2a2b2f;border-radius:12px;background:#000}
    .group{margin-bottom:10px}
  </style>
</head>
<body>
  <header>
    <a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a>
    <div>Mise en page — Outil visuel</div>
    <div></div>
  </header>
  <?php $initial = isset($_GET['page']) ? trim($_GET['page']) : '/index.html'; if($initial==='') $initial='/index.html'; ?>
  <div class="wrap">
    <div class="card">
      <div class="group">
        <label class="muted">Page à éditer</label>
        <div class="row">
          <select id="pageSelect" style="flex:1">
            <option value="/index.html" <?php if($initial==='/index.html') echo 'selected'; ?>>/index.html</option>
            <option value="/packs.html" <?php if($initial==='/packs.html') echo 'selected'; ?>>/packs.html</option>
            <option value="/calendrier.html" <?php if($initial==='/calendrier.html') echo 'selected'; ?>>/calendrier.html</option>
            <option value="/realisations.html" <?php if($initial==='/realisations.html') echo 'selected'; ?>>/realisations.html</option>
            <option value="/services.html" <?php if($initial==='/services.html') echo 'selected'; ?>>/services.html</option>
          </select>
        </div>
      </div>
      <div class="group">
        <label class="muted">Taille d’écran</label>
        <div class="row">
          <button class="btn ghost" data-size="1280x800">Desktop</button>
          <button class="btn ghost" data-size="820x600">Tablette</button>
          <button class="btn ghost" data-size="390x700">Mobile</button>
        </div>
      </div>
      <div class="group">
        <label class="muted">Actions</label>
        <div class="row" style="flex-wrap:wrap">
          <button class="btn" id="openEditor">Ouvrir l’éditeur</button>
          <button class="btn" id="togglePreview">Aperçu local: OFF</button>
          <button class="btn" id="exportBtn">Exporter JSON</button>
          <button class="btn" id="importBtn">Importer JSON</button>
          <input id="importFile" type="file" accept="application/json" style="display:none">
          <button class="btn" id="publishBtn" style="background:#2f8147">Publier</button>
          <button class="btn ghost" id="saveDraftBtn">Sauver (local)</button>
          <button class="btn ghost" id="loadDraftBtn">Charger (local)</button>
        </div>
        <div class="muted" style="font-size:12px;margin-top:6px">Astuce: la page en aperçu contient l’éditeur intégré en surcouche.</div>
      </div>
    </div>
    <div class="card">
      <iframe id="preview" src="<?php echo htmlspecialchars($initial); ?>?layout=edit"></iframe>
    </div>
  </div>
  <script>
    const pageSel = document.getElementById('pageSelect');
    const iframe = document.getElementById('preview');
    const openBtn = document.getElementById('openEditor');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const publishBtn = document.getElementById('publishBtn');
    const togglePreview = document.getElementById('togglePreview');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const loadDraftBtn = document.getElementById('loadDraftBtn');
    document.querySelectorAll('[data-size]').forEach(b=> b.addEventListener('click', ()=>{
      const [w,h] = b.dataset.size.split('x').map(Number); iframe.style.width=w+'px'; iframe.style.height=h+'px';
    }));
    pageSel.addEventListener('change', ()=>{ iframe.src = pageSel.value + '?layout=edit'; });
    openBtn.onclick = ()=> iframe.contentWindow.postMessage({type:'cineb_layout', action:'open_editor'}, location.origin);
    exportBtn.onclick = ()=> iframe.contentWindow.postMessage({type:'cineb_layout', action:'export'}, location.origin);
    publishBtn.onclick = ()=> iframe.contentWindow.postMessage({type:'cineb_layout', action:'publish'}, location.origin);
    importBtn.onclick = ()=> importFile.click();
    importFile.onchange = async ()=>{ const f=importFile.files[0]; if(!f) return; const txt=await f.text(); try{ const j=JSON.parse(txt); iframe.contentWindow.postMessage({type:'cineb_layout', action:'set_layout', payload:j}, location.origin); }catch(_){ alert('Fichier invalide'); } };
    saveDraftBtn.onclick = ()=> iframe.contentWindow.postMessage({type:'cineb_layout', action:'get_layout'}, location.origin);
    loadDraftBtn.onclick = ()=> iframe.contentWindow.postMessage({type:'cineb_layout', action:'set_layout', payload: JSON.parse(localStorage.getItem('cineb_layout_draft')||'{}')}, location.origin);
    togglePreview.onclick = ()=>{ const on = togglePreview.textContent.includes('OFF'); iframe.contentWindow.postMessage({type:'cineb_layout', action:'set_preview', on}, location.origin); togglePreview.textContent = on? 'Aperçu local: ON' : 'Aperçu local: OFF'; };
    window.addEventListener('message', (e)=>{
      const d=e.data||{}; if(d.type==='cineb_layout_reply' && d.action==='publish'){ alert(d.ok? 'Publié.':'Échec publication (connectez-vous à l\'admin).'); }
      if(d.type==='cineb_layout_reply' && d.action==='get_layout'){ try{ localStorage.setItem('cineb_layout_draft', JSON.stringify(d.payload||{})); alert('Brouillon sauvegardé.'); }catch(_){ alert('Sauvegarde locale impossible.'); } }
    });
  </script>
</body>
</html>
