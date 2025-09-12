// layout.js — Global layout engine + simple overlay editor
(function(){
  const PAGE_KEY = (function(){
    const p = location.pathname.split('/').pop() || 'index.html';
    return p.toLowerCase();
  })();

  async function loadJSON(url){ try{ const r=await fetch(url+'?v='+(Date.now()%9999), {cache:'no-cache'}); if(!r.ok) return null; return await r.json(); }catch(_){ return null; } }

  function applyMoves(moves){ if(!Array.isArray(moves)) return; moves.forEach(m=>{
    try{
      const el = document.querySelector(m.target);
      if(!el) return;
      if(m.appendTo){ const dst=document.querySelector(m.appendTo); if(dst) dst.appendChild(el); }
      else if(m.insertBefore){ const ref=document.querySelector(m.insertBefore); if(ref && ref.parentNode) ref.parentNode.insertBefore(el, ref); }
      else if(m.insertAfter){ const ref=document.querySelector(m.insertAfter); if(ref && ref.parentNode) ref.parentNode.insertBefore(el, ref.nextSibling); }
    }catch(_){ }
  }); }

  function applyOrders(orders){ if(!Array.isArray(orders)) return; orders.forEach(o=>{
    try{
      const c = document.querySelector(o.container); if(!c) return;
      // order by selectors list
      const fr = document.createDocumentFragment();
      (o.children||[]).forEach(sel=>{ const n = c.querySelector(sel); if(n) fr.appendChild(n); });
      // append the rest
      Array.from(c.children).forEach(ch=>{ if(!fr.contains(ch)) fr.appendChild(ch); });
      c.innerHTML=''; c.appendChild(fr);
    }catch(_){ }
  }); }

  function applyContents(contents){ if(!Array.isArray(contents)) return; contents.forEach(c=>{
    try{ const el=document.querySelector(c.selector); if(!el) return; if(typeof c.html==='string') el.innerHTML=c.html; }catch(_){ }
  }); }

  function matchMQ(q){ try{ return window.matchMedia(q).matches; }catch(_){ return false; } }
  function collectSegments(def){
    const out = { moves:[], order:[], content:[] };
    if(!def) return out;
    // legacy flat form
    if(Array.isArray(def.moves)||Array.isArray(def.order)||Array.isArray(def.content)){
      if(def.moves) out.moves=out.moves.concat(def.moves);
      if(def.order) out.order=out.order.concat(def.order);
      if(def.content) out.content=out.content.concat(def.content);
    }
    // conditional form: { conditions: [ { mq:'(min-width:901px)', moves, order }, ... ] }
    if(Array.isArray(def.conditions)){
      def.conditions.forEach(c=>{ if(!c||!c.mq) return; if(matchMQ(c.mq)){ if(c.moves) out.moves=out.moves.concat(c.moves); if(c.order) out.order=out.order.concat(c.order); if(c.content) out.content=out.content.concat(c.content); } });
    }
    return out;
  }
  function applyLayout(layout){ if(!layout) return; const def = layout['default']; const pageDef = layout[PAGE_KEY]; const seg1 = collectSegments(def); const seg2 = collectSegments(pageDef);
    const moves=seg1.moves.concat(seg2.moves), orders=seg1.order.concat(seg2.order), contents=seg1.content.concat(seg2.content);
    applyMoves(moves); applyOrders(orders); applyContents(contents); }

  // ---------- Theme override helpers ----------
  const THEME_STORE_KEY = 'cineb_theme_override_css';
  function getThemeStyleEl(){
    let el = document.getElementById('cineb_theme_override');
    if(!el){ el=document.createElement('style'); el.id='cineb_theme_override'; document.head.appendChild(el); }
    return el;
  }
  function loadThemeOverride(){ try{ const css = localStorage.getItem(THEME_STORE_KEY)||''; if(css){ getThemeStyleEl().textContent = css; } }catch(_){ }
  function saveThemeOverride(css){ try{ localStorage.setItem(THEME_STORE_KEY, css||''); }catch(_){ } }
  loadThemeOverride();

  // ---------- Overlay editor (simple) ----------
  function selectorFor(el){ if(!el) return null; if(el.id) return '#'+CSS.escape(el.id); const cn = (el.classList||[])[0]; if(cn) return el.tagName.toLowerCase()+'.'+CSS.escape(cn); // fallback to tag:nth-of-type
    const i = Array.from(el.parentNode.children).filter(e=>e.tagName===el.tagName).indexOf(el)+1; return el.tagName.toLowerCase()+`:nth-of-type(${i})`; }

  function buildEditor(layout){
    const page = layout[PAGE_KEY] || (layout[PAGE_KEY]={}); if(!page.order) page.order=[]; if(!page.moves) page.moves=[];
    const panel = document.createElement('div'); panel.style.cssText='position:fixed;top:10px;right:10px;z-index:100000;background:#111216;color:#eaeaea;border:1px solid #2a2b2f;border-radius:10px;padding:10px;max-width:320px;font:14px system-ui';
    panel.innerHTML = '<div style="font-weight:800;margin-bottom:6px">Éditeur de mise en page</div>' +
      '<div class="muted" style="font-size:12px;margin-bottom:6px">Sélectionnez un conteneur, réordonnez par glisser-déposer, puis exportez le JSON.</div>';
    const sel = document.createElement('select'); sel.style.width='100%'; sel.innerHTML = '';
    const containers = [
      {label:'Sections principales', q:'main .container'},
      {label:'Grille produit (.product-grid)', q:'.product-grid'},
      {label:'Entête (.header .container)', q:'.header .container'}
    ];
    containers.forEach(c=>{ const el=document.querySelector(c.q); if(el){ const opt=document.createElement('option'); opt.value=c.q; opt.textContent=c.label+' — '+c.q; sel.appendChild(opt);} });
    const rowAdd = document.createElement('div'); rowAdd.style.cssText='display:flex;gap:6px;margin-top:6px';
    const addInp = document.createElement('input'); addInp.placeholder='Ajouter conteneur (sélecteur CSS)'; addInp.style.flex='1';
    const addBtn = document.createElement('button'); addBtn.className='btn ghost'; addBtn.textContent='Ajouter'; addBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    rowAdd.appendChild(addInp); rowAdd.appendChild(addBtn); panel.appendChild(sel); panel.appendChild(rowAdd);
    const modeRow = document.createElement('div'); modeRow.style.cssText='display:flex;gap:6px;align-items:center;margin-top:6px';
    const mqSel = document.createElement('select'); mqSel.innerHTML='<option value="">Sans condition</option><option value="(min-width:901px)">Desktop (≥901px)</option><option value="(max-width:900px)">Mobile (≤900px)</option>';
    modeRow.appendChild(document.createTextNode('Condition (optionnel):')); modeRow.appendChild(mqSel); panel.appendChild(modeRow);

    const listsWrap = document.createElement('div'); listsWrap.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px'; panel.appendChild(listsWrap);
    const list = document.createElement('div'); list.style.cssText='min-height:120px;max-height:240px;overflow:auto;border:1px solid #2a2b2f;border-radius:8px;padding:6px';
    const list2 = document.createElement('div'); list2.style.cssText='min-height:120px;max-height:240px;overflow:auto;border:1px solid #2a2b2f;border-radius:8px;padding:6px';
    const listLbl1=document.createElement('div'); listLbl1.className='muted'; listLbl1.textContent='Conteneur courant';
    const listLbl2=document.createElement('div'); listLbl2.className='muted'; listLbl2.textContent='Autre conteneur (déplacez ici)';
    listsWrap.appendChild(listLbl1); listsWrap.appendChild(listLbl2); listsWrap.appendChild(list); listsWrap.appendChild(list2);
    const controls = document.createElement('div'); controls.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:8px';
    const saveBtn = document.createElement('button'); saveBtn.className='btn'; saveBtn.textContent='Exporter JSON'; saveBtn.style.cssText='padding:6px 10px;background:#6a4bc7;border:none;border-radius:8px;color:#fff;font-weight:700';
    const publishBtn = document.createElement('button'); publishBtn.className='btn'; publishBtn.textContent='Publier'; publishBtn.style.cssText='padding:6px 10px;background:#2f8147;border:none;border-radius:8px;color:#fff;font-weight:700';
    const closeBtn = document.createElement('button'); closeBtn.className='btn ghost'; closeBtn.textContent='Fermer'; closeBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    const importBtn = document.createElement('button'); importBtn.className='btn ghost'; importBtn.textContent='Importer JSON'; importBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    const file = document.createElement('input'); file.type='file'; file.accept='application/json'; file.style.display='none';
    const persistBtn = document.createElement('button'); persistBtn.className='btn ghost'; persistBtn.textContent='Enregistrer (Local)'; persistBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    const loadBtn = document.createElement('button'); loadBtn.className='btn ghost'; loadBtn.textContent='Charger (Local)'; loadBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    const editBtn = document.createElement('button'); editBtn.className='btn ghost'; editBtn.textContent='Éditer le contenu'; editBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    const viewRulesBtn = document.createElement('button'); viewRulesBtn.className='btn ghost'; viewRulesBtn.textContent='Voir règles (JSON)'; viewRulesBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    const moveSelBtn = document.createElement('button'); moveSelBtn.className='btn ghost'; moveSelBtn.textContent='Déplacer vers conteneur'; moveSelBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    controls.appendChild(saveBtn); controls.appendChild(publishBtn); controls.appendChild(closeBtn); panel.appendChild(controls);
    const previewToggle = document.createElement('button'); previewToggle.className='btn ghost'; previewToggle.textContent = (sessionStorage.getItem('cineb_layout_preview')==='1')? 'Aperçu local: ON' : 'Aperçu local: OFF'; previewToggle.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    controls.appendChild(importBtn); panel.appendChild(file); controls.appendChild(persistBtn); controls.appendChild(loadBtn); controls.appendChild(editBtn); controls.appendChild(moveSelBtn); controls.appendChild(viewRulesBtn); controls.appendChild(previewToggle);
    document.body.appendChild(panel);

    // --------- Extra tools: Block library, Grid control, Theme presets, UX guide ---------
    const sep = document.createElement('div'); sep.style.cssText='margin:10px 0;border-top:1px solid #2a2b2f'; panel.appendChild(sep);
    const h2 = document.createElement('div'); h2.style.cssText='font-weight:800;margin:8px 0 4px'; h2.textContent='Bibliothèque de blocs'; panel.appendChild(h2);
    const tgtRow = document.createElement('div'); tgtRow.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:6px';
    const tgt = document.createElement('input'); tgt.placeholder='Conteneur cible (ex: main .container)'; tgt.style.flex='1'; tgt.value = sel.value || 'main .container';
    const pickBtn = document.createElement('button'); pickBtn.textContent='Choisir'; pickBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea;cursor:pointer';
    tgtRow.appendChild(tgt); tgtRow.appendChild(pickBtn); panel.appendChild(tgtRow);
    const blkSel = document.createElement('select'); blkSel.style.cssText='width:100%'; panel.appendChild(blkSel);
    const blkBar = document.createElement('div'); blkBar.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:6px'; panel.appendChild(blkBar);
    const bInsEnd=document.createElement('button'); bInsEnd.textContent='Insérer (fin)'; bInsEnd.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#1a1c21;color:#eaeaea;cursor:pointer';
    const bInsStart=document.createElement('button'); bInsStart.textContent='Insérer (début)'; bInsStart.style.cssText=bInsEnd.style.cssText;
    const bCopy=document.createElement('button'); bCopy.textContent='Copier HTML'; bCopy.style.cssText=bInsEnd.style.cssText;
    blkBar.appendChild(bInsEnd); blkBar.appendChild(bInsStart); blkBar.appendChild(bCopy);
    // Built-in blocks
    const BLOCKS=[
      {id:'hero', name:'Hero texte + image', html:`<section class="card hero" style="padding:16px;display:grid;grid-template-columns:1.2fr .8fr;gap:14px;align-items:center;margin-top:16px">\n  <div>\n    <h1 class=\"section-title\" style=\"margin:0 0 8px 0\">Titre accrocheur</h1>\n    <p class=\"muted\">Sous-titre court et clair. Expliquez la valeur en une phrase.</p>\n    <div style=\"display:flex;gap:10px;margin-top:14px;flex-wrap:wrap\">\n      <a class=\"btn\" href=\"#\">Action principale</a>\n      <a class=\"btn ghost\" href=\"#\">Action secondaire</a>\n    </div>\n  </div>\n  <div class=\"media media-16x9\" style=\"border:none\"><img src=\"assets/logo.webp\" alt=\"Visuel\" loading=\"lazy\"></div>\n</section>`},
      {id:'features3', name:'3 avantages en grille', html:`<section class=\"grid\" style=\"grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:18px\">\n  <div class=\"card\" style=\"padding:16px\"><b>Rapide</b><div class=\"muted\">Explication courte</div></div>\n  <div class=\"card\" style=\"padding:16px\"><b>Pro</b><div class=\"muted\">Explication courte</div></div>\n  <div class=\"card\" style=\"padding:16px\"><b>Souple</b><div class=\"muted\">Explication courte</div></div>\n</section>`},
      {id:'cta', name:'Bandeau CTA', html:`<section class=\"card\" style=\"padding:16px;margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:12px\">\n  <div>\n    <div style=\"font-weight:800\">Prêt à démarrer ?</div>\n    <div class=\"muted\">Contactez-nous pour un devis rapide.</div>\n  </div>\n  <a class=\"btn\" href=\"contact.html\">Demander un devis</a>\n</section>`},
      {id:'gallery', name:'Galerie média (4 colonnes)', html:`<section class=\"grid cards\" style=\"grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px\">\n  <div class=\"media\"><img src=\"assets/logo.webp\" alt=\"\"/></div>\n  <div class=\"media\"><img src=\"assets/logo.webp\" alt=\"\"/></div>\n  <div class=\"media\"><img src=\"assets/logo.webp\" alt=\"\"/></div>\n  <div class=\"media\"><img src=\"assets/logo.webp\" alt=\"\"/></div>\n</section>`},
      {id:'faq', name:'FAQ (accordéons)', html:`<section class=\"card\" style=\"padding:14px;margin-top:18px\">\n  <h2 class=\"section-title\">FAQ</h2>\n  <details style=\"margin:8px 0\"><summary style=\"cursor:pointer\">Question 1</summary><div class=\"muted\">Réponse concise et utile.</div></details>\n  <details style=\"margin:8px 0\"><summary style=\"cursor:pointer\">Question 2</summary><div class=\"muted\">Réponse concise et utile.</div></details>\n</section>`}
    ];
    // Custom blocks (from LocalStorage)
    const CUSTOM_BLOCKS_KEY='cineb_blocks_custom';
    function loadCustomBlocks(){ try{ return JSON.parse(localStorage.getItem(CUSTOM_BLOCKS_KEY)||'[]')||[]; }catch(_){ return []; } }
    function saveCustomBlocks(list){ try{ localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(list)); }catch(_){ } }
    function refreshBlockOptions(){
      blkSel.innerHTML='';
      // custom first
      const customs = loadCustomBlocks();
      customs.forEach(b=>{ const o=document.createElement('option'); o.value='custom:'+b.id; o.textContent='★ '+b.name; blkSel.appendChild(o); });
      if(customs.length){ const sep=document.createElement('option'); sep.disabled=true; sep.textContent='────────'; blkSel.appendChild(sep); }
      BLOCKS.forEach(b=>{ const o=document.createElement('option'); o.value=b.id; o.textContent=b.name; blkSel.appendChild(o); });
    }
    refreshBlockOptions();
    function getBlockById(id){ if(id.startsWith('custom:')){ const cid=id.split(':',2)[1]; return (loadCustomBlocks().find(x=>x.id===cid)||null); } return BLOCKS.find(b=>b.id===id)||null; }
    function curBlock(){ const sel=blkSel.value; const b=getBlockById(sel); if(b&&b.html) return b; return BLOCKS[0]; }
    function getT(){ try{ return document.querySelector(tgt.value); }catch(_){ return null; } }
    bInsEnd.onclick=()=>{ const t=getT(); const b=curBlock(); if(!t||!b) return alert('Cible introuvable'); const wrap=document.createElement('div'); wrap.innerHTML=b.html; t.appendChild(wrap.firstElementChild); };
    bInsStart.onclick=()=>{ const t=getT(); const b=curBlock(); if(!t||!b) return alert('Cible introuvable'); const wrap=document.createElement('div'); wrap.innerHTML=b.html; t.insertBefore(wrap.firstElementChild, t.firstChild); };
    bCopy.onclick=()=>{ const b=curBlock(); navigator.clipboard?.writeText?.(b.html).then(()=> alert('Copié !')).catch(()=> alert('Impossible de copier.')); };
    // Save element as custom block
    const saveBlockBtn=document.createElement('button'); saveBlockBtn.textContent='Enregistrer élément → bloc'; saveBlockBtn.style.cssText=bInsEnd.style.cssText; blockBtns.appendChild(saveBlockBtn);
    const delBlockBtn=document.createElement('button'); delBlockBtn.textContent='Supprimer bloc'; delBlockBtn.style.cssText=bInsEnd.style.cssText; blockBtns.appendChild(delBlockBtn);
    saveBlockBtn.onclick=()=>{
      alert('Cliquez l’élément à sauvegarder comme bloc. Échap pour annuler.');
      const hl=document.createElement('div'); hl.style.cssText='position:fixed;pointer-events:none;border:2px solid #4ade80;z-index:100001'; document.body.appendChild(hl);
      function move(e){ const el=e.target.closest('section, article, .card, .grid, main .container, .product-grid'); if(!el) return; const r=el.getBoundingClientRect(); Object.assign(hl.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'}); }
      function click(e){ e.preventDefault(); const el=e.target.closest('section, article, .card, .grid, main .container, .product-grid'); if(!el) return; const name=prompt('Nom du bloc:','Mon bloc'); if(!name) return cleanup(); const id=(name||'bloc').toLowerCase().replace(/[^a-z0-9]+/g,'-'); const html=el.outerHTML; const list=loadCustomBlocks(); const exists=list.find(x=>x.id===id); if(exists){ if(!confirm('Un bloc avec ce nom existe. Remplacer ?')) return cleanup(); exists.name=name; exists.html=html; } else { list.push({id,name,html}); } saveCustomBlocks(list); refreshBlockOptions(); alert('Bloc enregistré.'); cleanup(); }
      function esc(e){ if(e.key==='Escape') cleanup(); }
      function cleanup(){ document.removeEventListener('mousemove',move,true); document.removeEventListener('click',click,true); document.removeEventListener('keydown',esc,true); hl.remove(); }
      document.addEventListener('mousemove',move,true); document.addEventListener('click',click,true); document.addEventListener('keydown',esc,true);
    };
    delBlockBtn.onclick=()=>{ const v=blkSel.value||''; if(!v.startsWith('custom:')) return alert('Sélectionnez d’abord un bloc personnalisé.'); const cid=v.split(':',2)[1]; const list=loadCustomBlocks().filter(x=>x.id!==cid); saveCustomBlocks(list); refreshBlockOptions(); alert('Bloc supprimé.'); };
    pickBtn.onclick=()=>{
      alert('Cliquez un conteneur cible (Échap pour annuler)');
      const hl=document.createElement('div'); hl.style.cssText='position:fixed;pointer-events:none;border:2px solid #6a4bc7;z-index:100001'; document.body.appendChild(hl);
      function move(e){ const el=e.target.closest('main, .container, section, .grid'); if(!el) return; const r=el.getBoundingClientRect(); Object.assign(hl.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'}); }
      function click(e){ e.preventDefault(); const el=e.target.closest('main, .container, section, .grid'); if(el){ const s=selectorFor(el); if(s) tgt.value=s; cleanup(); } }
      function esc(e){ if(e.key==='Escape') cleanup(); }
      function cleanup(){ document.removeEventListener('mousemove',move,true); document.removeEventListener('click',click,true); document.removeEventListener('keydown',esc,true); hl.remove(); }
      document.addEventListener('mousemove',move,true); document.addEventListener('click',click,true); document.addEventListener('keydown',esc,true);
    };

    // Grid control
    const h3 = document.createElement('div'); h3.style.cssText='font-weight:800;margin:10px 0 4px'; h3.textContent='Grille (visuel)'; panel.appendChild(h3);
    const pickGrid=document.createElement('button'); pickGrid.textContent='Sélectionner une grille'; pickGrid.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea;cursor:pointer'; panel.appendChild(pickGrid);
    const gridCtrl = document.createElement('div'); gridCtrl.style.cssText='display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:6px'; panel.appendChild(gridCtrl);
    gridCtrl.innerHTML = '<label>Colonnes</label><input id="gCols" type="range" min="1" max="12" value="4">\n<label>Type</label><select id="gType"><option value="fixed">fixe (1fr)</option><option value="auto">auto-fit min 220px</option></select>\n<label>Gap (px)</label><input id="gGap" type="range" min="0" max="40" value="16">';
    const gStatus=document.createElement('div'); gStatus.className='muted'; gStatus.style.cssText='font-size:12px;margin-top:4px'; panel.appendChild(gStatus);
    let curGrid=null; function applyGrid(){ if(!curGrid) return; const cols=Number(gridCtrl.querySelector('#gCols').value||4); const type=gridCtrl.querySelector('#gType').value; const gap=Number(gridCtrl.querySelector('#gGap').value||16); curGrid.style.gap=gap+'px'; curGrid.style.gridTemplateColumns = (type==='fixed')? `repeat(${cols}, 1fr)` : 'repeat(auto-fit, minmax(220px, 1fr))'; gStatus.textContent='Appliqué: '+(selectorFor(curGrid)||'.grid')+' • '+curGrid.style.gridTemplateColumns+', gap '+gap+'px'; }
    gridCtrl.addEventListener('input', applyGrid);
    pickGrid.onclick=()=>{
      alert('Cliquez une grille (.grid). Échap pour annuler');
      const hl=document.createElement('div'); hl.style.cssText='position:fixed;pointer-events:none;border:2px dashed #6a4bc7;z-index:100001'; document.body.appendChild(hl);
      function move(e){ const el=e.target.closest('.grid'); if(!el) return; const r=el.getBoundingClientRect(); Object.assign(hl.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'}); }
      function click(e){ e.preventDefault(); const el=e.target.closest('.grid'); if(el){ curGrid=el; applyGrid(); cleanup(); } }
      function esc(e){ if(e.key==='Escape') cleanup(); }
      function cleanup(){ document.removeEventListener('mousemove',move,true); document.removeEventListener('click',click,true); document.removeEventListener('keydown',esc,true); hl.remove(); }
      document.addEventListener('mousemove',move,true); document.addEventListener('click',click,true); document.addEventListener('keydown',esc,true);
    };

    // Page-wide design grid overlay (for alignment aid)
    const overlayWrap=document.createElement('div'); overlayWrap.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9998;display:none';
    const overlay=document.createElement('div'); overlay.style.cssText='height:100%;margin:0 auto;max-width:1600px;opacity:.25;background-size:calc((100% - (11 * 16px)) / 12) 100%, 16px 100%;background-image: linear-gradient(to right, rgba(107,55,212,.6) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,.2) 1px, transparent 1px)'; overlayWrap.appendChild(overlay); document.body.appendChild(overlayWrap);
    const overlayBar=document.createElement('div'); overlayBar.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:6px'; panel.appendChild(overlayBar);
    const toggleOverlay=document.createElement('button'); toggleOverlay.textContent='Overlay grille (ON/OFF)'; toggleOverlay.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea;cursor:pointer';
    const ovCols=document.createElement('input'); ovCols.type='range'; ovCols.min='2'; ovCols.max='16'; ovCols.value='12'; ovCols.title='Colonnes';
    const ovGutter=document.createElement('input'); ovGutter.type='range'; ovGutter.min='0'; ovGutter.max='48'; ovGutter.value='16'; ovGutter.title='Gouttière (px)';
    overlayBar.appendChild(toggleOverlay); overlayBar.appendChild(document.createTextNode('Colonnes')); overlayBar.appendChild(ovCols); overlayBar.appendChild(document.createTextNode('Gouttière')); overlayBar.appendChild(ovGutter);
    function renderOverlay(){ const cols=Number(ovCols.value), gut=Number(ovGutter.value); overlay.style.backgroundSize = `calc((100% - (${cols-1} * ${gut}px)) / ${cols}) 100%, ${gut}px 100%`; }
    ovCols.addEventListener('input', renderOverlay); ovGutter.addEventListener('input', renderOverlay); renderOverlay();
    toggleOverlay.onclick=()=>{ overlayWrap.style.display = (overlayWrap.style.display==='none')? 'block':'none'; };

    // Theme presets
    const h4=document.createElement('div'); h4.style.cssText='font-weight:800;margin:10px 0 4px'; h4.textContent='Thèmes (UX)'; panel.appendChild(h4);
    const themeRow=document.createElement('div'); themeRow.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px'; panel.appendChild(themeRow);
    themeRow.innerHTML = '<label>Accent</label><input id="thAccent" type="color" value="#6b37d4">\n<label>Accent 2</label><input id="thAccent2" type="color" value="#b993ff">\n<label>Rayon (px)</label><input id="thRadius" type="range" min="0" max="28" value="16">\n<label>Contraste</label><select id="thContrast"><option value="normal">Normal</option><option value="haute">Haut</option></select>\n<label>Fond</label><select id="thBg"><option value="sombre">Sombre</option><option value="clair">Clair</option></select>\n<label>Taille (%)</label><input id="thScale" type="range" min="90" max="120" value="100">\n<label>Fonte</label><select id="thFont"><option value="poppins">Poppins</option><option value="system">Système</option></select>';
    const themeBar=document.createElement('div'); themeBar.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:6px'; panel.appendChild(themeBar);
    const presets=[
      {name:'Sombre violet', v:{bg:'#0a0b0d',panel:'#111216',line:'#1e2127',text:'#e8ebf0',muted:'#a8b0bb',accent:'#6b37d4',accent2:'#b993ff'}},
      {name:'Noir/Vert', v:{bg:'#0a0b0b',panel:'#101313',line:'#202525',text:'#e6ffef',muted:'#a8d0bb',accent:'#00d08a',accent2:'#00ffa6'}},
      {name:'Clair', v:{bg:'#fafafa',panel:'#fff',line:'#e6e6e6',text:'#0a0b0d',muted:'#5f6672',accent:'#6b37d4',accent2:'#b993ff'}},
      {name:'Nocturne', v:{bg:'#050608',panel:'#0b0c0e',line:'#1a1c21',text:'#f0f3f8',muted:'#96a0ad',accent:'#5ad',accent2:'#9cf'}},
      {name:'Contrasté', v:{bg:'#000',panel:'#0d0d0d',line:'#333',text:'#fff',muted:'#aaa',accent:'#ff3d6e',accent2:'#ffd166'}}
    ];
    function applyThemeVars(vars){
      const scale = Number(themeRow.querySelector('#thScale').value||100)/100;
      const contrast = themeRow.querySelector('#thContrast').value;
      const bgMode = themeRow.querySelector('#thBg').value;
      const radius = Number(themeRow.querySelector('#thRadius').value||16);
      const acc = themeRow.querySelector('#thAccent').value || vars.accent;
      const acc2 = themeRow.querySelector('#thAccent2').value || vars.accent2;
      let text=vars.text, muted=vars.muted;
      if(contrast==='haute'){ text = (bgMode==='clair')? '#000' : '#fff'; muted = (bgMode==='clair')? '#333' : '#cbd3dc'; }
      const fontSel = themeRow.querySelector('#thFont').value;
      const fontFamily = fontSel==='system' ? 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' : '"Poppins", system-ui, sans-serif';
      const css = `:root{--bg:${vars.bg};--panel:${vars.panel};--line:${vars.line};--text:${text};--muted:${muted};--accent:${acc};--accent-2:${acc2};--radius:${radius}px} html,body{font-size:${Math.round(16*scale)}px; font-family:${fontFamily} }`;
      getThemeStyleEl().textContent = css; saveThemeOverride(css);
    }
    presets.forEach(p=>{ const b=document.createElement('button'); b.textContent=p.name; b.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#1a1c21;color:#eaeaea;cursor:pointer'; b.onclick=()=> applyThemeVars(p.v); themeBar.appendChild(b); });
    // Brand button using current computed CSS variables
    const brandBtn=document.createElement('button'); brandBtn.textContent='Couleurs actuelles (CinéB)'; brandBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#384053;color:#eaeaea;cursor:pointer'; brandBtn.onclick=()=>{ const cs=getComputedStyle(document.documentElement); const v=(n)=> cs.getPropertyValue(n).trim(); applyThemeVars({ bg:v('--bg'), panel:v('--panel'), line:v('--line'), text:v('--text'), muted:v('--muted'), accent:v('--accent'), accent2:v('--accent-2') }); }; themeBar.appendChild(brandBtn);
    const thSave=document.createElement('button'); thSave.textContent='Sauver thème'; thSave.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea;cursor:pointer'; themeBar.appendChild(thSave);
    const thReset=document.createElement('button'); thReset.textContent='Réinitialiser'; thReset.style.cssText=thSave.style.cssText; themeBar.appendChild(thReset);
    thSave.onclick=()=> saveThemeOverride(getThemeStyleEl().textContent||'');
    thReset.onclick=()=>{ getThemeStyleEl().textContent=''; saveThemeOverride(''); alert('Thème réinitialisé'); };
    themeRow.addEventListener('input', ()=>{ const cur=presets[0].v; applyThemeVars(cur); });

    // ---------- Assistant (Audit & Auto-fix) ----------
    const aH=document.createElement('div'); aH.style.cssText='font-weight:800;margin:10px 0 4px'; aH.textContent='Assistant'; panel.appendChild(aH);
    const aHelp=document.createElement('div'); aHelp.className='muted'; aHelp.style.cssText='font-size:12px;margin-bottom:6px'; aHelp.textContent='Audit rapide + corrections automatiques (sécurisées).'; panel.appendChild(aHelp);
    const aBar=document.createElement('div'); aBar.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px'; panel.appendChild(aBar);
    const btn=(txt)=>{ const b=document.createElement('button'); b.textContent=txt; b.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea;cursor:pointer'; return b; };
    const runAudit=btn('Auditer la page'); const fixSafe=btn('Corriger (sécurisé)'); const fixImages=btn('Images → responsives'); const fixDims=btn('Fixer width/height'); const fixContrast=btn('Auto-contraste (AA)');
    aBar.appendChild(runAudit); aBar.appendChild(fixSafe); aBar.appendChild(fixImages); aBar.appendChild(fixDims); aBar.appendChild(fixContrast);
    const aOut=document.createElement('div'); aOut.style.cssText='font-size:13px;white-space:pre-wrap;background:#0f1013;border:1px solid #2a2b2f;border-radius:8px;padding:8px;max-height:240px;overflow:auto'; panel.appendChild(aOut);

    function isExternalLink(a){ try{ const u=new URL(a.href, location.origin); return u.origin!==location.origin; }catch(_){ return false; } }
    function nearestHeadingText(el){ let n=el; const max=5; let i=0; while(n && i++<max){ const h=n.querySelector?.('h1,h2,h3'); if(h&&h.textContent.trim()) return h.textContent.trim(); n=n.parentElement; } return document.title||'Image'; }
    function audit(){
      const imgs=[...document.querySelectorAll('img')];
      const missingAlt=imgs.filter(img=>!img.hasAttribute('alt')||img.getAttribute('alt')==='');
      const missingDims=imgs.filter(img=>!(img.getAttribute('width')&&img.getAttribute('height')));
      const exts=[...document.querySelectorAll('a[href]')].filter(a=> isExternalLink(a) && !(String(a.rel||'').includes('noopener')));
      const cs=getComputedStyle(document.documentElement); const v=n=> cs.getPropertyValue(n).trim();
      const parse=c=>{ const m=String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i); if(m){ return {r:+m[1],g:+m[2],b:+m[3]}; } const hx=String(c).replace('#',''); if(hx.length===6){ return {r:parseInt(hx.slice(0,2),16),g:parseInt(hx.slice(2,4),16),b:parseInt(hx.slice(4,6),16)} } return {r:255,g:255,b:255}; };
      const lum=o=>{ const f=x=>{x/=255; return x<=0.03928? x/12.92: Math.pow((x+0.055)/1.055,2.4)}; const R=f(o.r), G=f(o.g), B=f(o.b); return 0.2126*R+0.7152*G+0.0722*B; };
      const ratio=(a,b)=>{ const L1=Math.max(a,b), L2=Math.min(a,b); return (L1+0.05)/(L2+0.05); };
      const bg=parse(v('--bg')||'#000'), tx=parse(v('--text')||'#fff'); const contrast = ratio(lum(bg), lum(tx));
      const report = [];
      report.push(`Images: ${imgs.length}`);
      report.push(`• Sans alt: ${missingAlt.length}`);
      report.push(`• Sans width/height: ${missingDims.length}`);
      report.push(`Liens externes sans rel=noopener: ${exts.length}`);
      report.push(`Contraste texte/fond: ${contrast.toFixed(2)} (attendu ≥ 4.5)`);
      aOut.textContent = report.join('\n');
      return {imgs, missingAlt, missingDims, exts, contrast};
    }
    runAudit.onclick = audit;
    fixSafe.onclick = ()=>{
      document.querySelectorAll('img').forEach(img=>{
        if(!img.hasAttribute('alt')){ const txt=nearestHeadingText(img) || ''; img.setAttribute('alt', txt? txt : ''); }
        try{ if(!img.closest('.brand')){ if(!img.hasAttribute('loading')) img.loading='lazy'; } img.decoding='async'; }catch(_){ }
      });
      document.querySelectorAll('a[href]').forEach(a=>{ if(isExternalLink(a)){ a.rel = String(a.rel||'').split(/\s+/).filter(Boolean).concat(['noopener','noreferrer']).filter((v,i,arr)=>arr.indexOf(v)===i).join(' '); } });
      try{ window.CINEB_IMAGES && window.CINEB_IMAGES.optimize && window.CINEB_IMAGES.optimize(); }catch(_){ }
      audit(); alert('Corrections appliquées.');
    };
    fixImages.onclick = ()=>{
      try{ const imgs=[...document.querySelectorAll('img')]; imgs.forEach(img=>{ const src=img.getAttribute('src')||img.dataset.src; if(src && window.CINEB_IMAGES && CINEB_IMAGES.setBestImage){ CINEB_IMAGES.setBestImage(img, src); } }); alert('Images remplacées par les meilleures variantes disponibles.'); }catch(_){ alert('Optimiseur indisponible.'); }
      audit();
    };
    fixDims.onclick = ()=>{
      const imgs=[...document.querySelectorAll('img')]; let fixed=0; imgs.forEach(img=>{ const apply=()=>{ if(img.naturalWidth && img.naturalHeight){ if(!img.getAttribute('width')) img.setAttribute('width', String(img.naturalWidth)); if(!img.getAttribute('height')) img.setAttribute('height', String(img.naturalHeight)); fixed++; } }; if(img.complete) apply(); else { img.addEventListener('load', apply, {once:true}); } }); setTimeout(audit, 300); alert('Attributs width/height ajoutés lorsque possible.');
    };
    fixContrast.onclick = ()=>{
      const cs=getComputedStyle(document.documentElement); const v=n=> cs.getPropertyValue(n).trim();
      const parse=c=>{ const m=String(c).match(/rgba?\((\d+),(\d+),(\d+)/i); if(m){ return {r:+m[1],g:+m[2],b:+m[3]}; } const hx=String(c).replace('#',''); if(hx.length===6){ return {r:parseInt(hx.slice(0,2),16),g:parseInt(hx.slice(2,4),16),b:parseInt(hx.slice(4,6),16)} } return {r:255,g:255,b:255}; };
      const lum=o=>{ const {r,g,b}=o; const f=x=>{x/=255; return x<=0.03928? x/12.92: Math.pow((x+0.055)/1.055,2.4)}; const R=f(r), G=f(g), B=f(b); return 0.2126*R+0.7152*G+0.0722*B; };
      const bg=parse(v('--bg')||'#0a0b0d'); const tx=parse(v('--text')||'#e8ebf0'); const darker = lum(bg) < 0.5; const newText = darker? '#ffffff' : '#000000'; const newMuted = darker? '#cbd3dc' : '#333333';
      const css = (getThemeStyleEl().textContent||'') + `\n:root{--text:${newText};--muted:${newMuted}}`;
      getThemeStyleEl().textContent = css; saveThemeOverride(css); audit(); alert('Contraste renforcé.');
    };

    // Advanced CSS editor for finer control
    const cssBtn=document.createElement('button'); cssBtn.textContent='CSS avancé'; cssBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea;cursor:pointer'; themeBar.appendChild(cssBtn);
    cssBtn.onclick=()=>{
      const dlg=document.createElement('div'); dlg.style.cssText='position:fixed;top:50px;left:50%;transform:translateX(-50%);z-index:100002;width:760px;max-width:95vw;background:#0f1013;border:1px solid #2a2b2f;border-radius:10px;padding:10px;color:#eaeaea';
      dlg.innerHTML='<div style="font-weight:800;margin-bottom:6px">CSS personnalisé</div>';
      const ta=document.createElement('textarea'); ta.style.cssText='width:100%;height:320px'; ta.value = getThemeStyleEl().textContent||'';
      const ok=document.createElement('button'); ok.className='btn'; ok.textContent='Appliquer'; ok.style.cssText='margin-top:6px;margin-right:6px';
      const close=document.createElement('button'); close.className='btn ghost'; close.textContent='Fermer'; close.style.cssText='margin-top:6px';
      dlg.appendChild(ta); dlg.appendChild(ok); dlg.appendChild(close); document.body.appendChild(dlg);
      ok.onclick=()=>{ getThemeStyleEl().textContent = ta.value; saveThemeOverride(ta.value); };
      close.onclick=()=> dlg.remove();
    };

    // Create preset from current CSS variables
    const makePresetBtn=document.createElement('button'); makePresetBtn.textContent='Créer preset (couleurs actuelles)'; makePresetBtn.style.cssText=thSave.style.cssText; themeBar.appendChild(makePresetBtn);
    const PRESETS_STORE='cineb_theme_custom_presets';
    const loadPresets=()=>{ try{ return JSON.parse(localStorage.getItem(PRESETS_STORE)||'[]')||[]; }catch(_){ return []; } };
    const savePresets=(arr)=>{ try{ localStorage.setItem(PRESETS_STORE, JSON.stringify(arr)); }catch(_){ } };
    function computedPreset(){
      const cs=getComputedStyle(document.documentElement);
      const v=(n)=> cs.getPropertyValue(n).trim();
      const radius=v('--radius')||'16px';
      return {
        bg:v('--bg')||'#0a0b0d', panel:v('--panel')||'#111216', line:v('--line')||'#1e2127',
        text:v('--text')||'#e8ebf0', muted:v('--muted')||'#a8b0bb', accent:v('--accent')||'#6b37d4', accent2:v('--accent-2')||'#b993ff',
        radius: radius.replace('px','')
      };
    }
    function addPresetToBar(p){ const b=document.createElement('button'); b.textContent=p.name; b.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#243042;color:#eaeaea;cursor:pointer'; b.onclick=()=> applyThemeVars({bg:p.bg,panel:p.panel,line:p.line,text:p.text,muted:p.muted,accent:p.accent,accent2:p.accent2}); themeBar.appendChild(b); }
    function renderCustomPresets(){ const list=loadPresets(); list.forEach(addPresetToBar); }
    renderCustomPresets();
    makePresetBtn.onclick=()=>{ const base=computedPreset(); const name=prompt('Nom du preset (ex: Couleurs CinéB)','Couleurs CinéB'); if(!name) return; const list=loadPresets(); const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-'); const ex=list.find(x=>x.id===id); const entry={id,name,...base}; if(ex){ Object.assign(ex, entry); } else { list.push(entry); } savePresets(list); alert('Preset créé. Il apparaît maintenant dans la liste.'); themeBar.innerHTML=''; presets.forEach(p=>{ const b=document.createElement('button'); b.textContent=p.name; b.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#1a1c21;color:#eaeaea;cursor:pointer'; b.onclick=()=> applyThemeVars(p.v); themeBar.appendChild(b); }); themeBar.appendChild(thSave); themeBar.appendChild(thReset); themeBar.appendChild(cssBtn); themeBar.appendChild(makePresetBtn); renderCustomPresets(); };

    // UX guide
    const h5=document.createElement('div'); h5.style.cssText='font-weight:800;margin:10px 0 4px'; h5.textContent='Guide UX'; panel.appendChild(h5);
    const guide=document.createElement('div'); guide.style.cssText='font-size:12px;color:#a8b0bb;line-height:1.4'; guide.innerHTML='• Typo: h1>h2>h3, 1.4–1.6 ligne.<br>• Espacements: 4/8/12/16/24/32.<br>• Contraste: AA minimum.<br>• Grilles: 2–4 colonnes desktop, auto-fit mobile.<br>• CTAs: 1 primaire, 1 secondaire.<br>• Accessibilité: focus visible, cible ≥ 44px.'; panel.appendChild(guide);
    const applyUX=document.createElement('button'); applyUX.textContent='Appliquer recommandations'; applyUX.style.cssText='margin-top:6px;padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#1a1c21;color:#eaeaea;cursor:pointer'; panel.appendChild(applyUX);
    applyUX.onclick=()=>{ const css=(getThemeStyleEl().textContent||'')+'\n:root{scroll-behavior:smooth} button, .btn{min-height:44px} .section-title{letter-spacing:.2px}'; getThemeStyleEl().textContent=css; saveThemeOverride(css); alert('Recommandations appliquées'); };

    // ---------- Autosave toggle ----------
    const autoRow=document.createElement('div'); autoRow.style.cssText='display:flex;gap:8px;align-items:center;margin-top:8px';
    const autoLbl=document.createElement('label'); const autoChk=document.createElement('input'); autoChk.type='checkbox';
    autoLbl.textContent='Autosave brouillon (LocalStorage)'; autoLbl.style.cssText='font-size:12px;color:#a8b0bb'; autoLbl.prepend(autoChk);
    panel.appendChild(autoRow); autoRow.appendChild(autoLbl);
    const AUTO_KEY='cineb_layout_autosave'; const autoVal=(localStorage.getItem(AUTO_KEY)!=='0'); window.__cineb_autosave = autoVal; autoChk.checked = autoVal; autoChk.onchange=()=>{ window.__cineb_autosave = !!autoChk.checked; localStorage.setItem(AUTO_KEY, autoChk.checked? '1':'0'); };

    function refresh(){
      list.innerHTML=''; list2.innerHTML=''; const c=document.querySelector(sel.value); if(!c){ list.textContent='Conteneur introuvable.'; return; }
      const others = Array.from(new Set([].concat(containers.map(x=>x.q), [addInp.value]).filter(Boolean)) ).filter(q=> q && q!==sel.value);
      const targetQ = others.find(q=> document.querySelector(q));
      if(targetQ){ const h=document.createElement('div'); h.className='muted'; h.textContent=targetQ; listLbl2.textContent='Autre conteneur: '+targetQ; }
      let dragging=null;
      const selectedRows = new Set();
      Array.from(c.children).forEach(ch=>{
        const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:6px;margin:4px 0;padding:6px;border:1px solid #2a2b2f;border-radius:6px;background:#17181c;cursor:grab';
        row.draggable=true; row.dataset.selector = selectorFor(ch) || '';
        const lab=document.createElement('div'); lab.textContent = ch.id?('#'+ch.id): (ch.className?('.'+ch.className.split(' ')[0]): ch.tagName.toLowerCase()); lab.style.flex='1';
        row.appendChild(lab); list.appendChild(row);
        row.addEventListener('click', (e)=>{ if(e.metaKey||e.ctrlKey){ if(row.classList.toggle('sel')) selectedRows.add(row); else selectedRows.delete(row); } });
        row.addEventListener('mouseenter', ()=>{ try{ ch.style.outline='2px solid #6a4bc7'; ch.scrollIntoView({block:'nearest'});}catch(_){ } });
        row.addEventListener('mouseleave', ()=>{ ch.style.outline=''; });
        row.addEventListener('dragstart', (e)=>{ dragging=row; row.style.opacity='0.6'; });
        row.addEventListener('dragend', ()=>{ dragging=null; row.style.opacity=''; saveOrderFromUI(); });
        row.addEventListener('dragover', (e)=>{ e.preventDefault(); if(!dragging||dragging===row) return; const rect=row.getBoundingClientRect(); const after=(e.clientY-rect.top)>(rect.height/2); row.parentNode.insertBefore(dragging, after? row.nextSibling : row); });

      });
      // Fill secondary list with target container children if any
      if(targetQ){ const tc=document.querySelector(targetQ); Array.from(tc.children).forEach(ch=>{ const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:6px;margin:4px 0;padding:6px;border:1px solid #2a2b2f;border-radius:6px;background:#17181c;cursor:grab'; row.draggable=true; row.dataset.selector=selectorFor(ch)||''; const lab=document.createElement('div'); lab.textContent= ch.id?('#'+ch.id): (ch.className?('.'+ch.className.split(' ')[0]): ch.tagName.toLowerCase()); lab.style.flex='1'; row.appendChild(lab); list2.appendChild(row); row.addEventListener('dragover', (e)=>{ e.preventDefault(); if(!dragging||dragging===row) return; const rect=row.getBoundingClientRect(); const after=(e.clientY-rect.top)>(rect.height/2); row.parentNode.insertBefore(dragging, after? row.nextSibling : row); }); });
        // Allow dropping into empty space
        list2.addEventListener('dragover', (e)=>{ e.preventDefault(); if(!dragging) return; list2.appendChild(dragging); });
      }
      function saveOrderFromUI(){ const c=document.querySelector(sel.value); if(!c) return; const map=new Map(); Array.from(c.children).forEach(el=> map.set(selectorFor(el), el)); const ordered=[]; Array.from(list.children).forEach(row=>{ const selr=row.dataset.selector; const el=map.get(selr); if(el) ordered.push(el); }); ordered.forEach(el=> c.appendChild(el)); pushHistory(); }
    }
    sel.onchange=refresh; refresh();
    closeBtn.onclick=()=> panel.remove();
    addBtn.onclick=()=>{ const v=(addInp.value||'').trim(); if(!v) return; containers.push({label:v,q:v}); const opt=document.createElement('option'); opt.value=v; opt.textContent=v; sel.appendChild(opt); sel.value=v; refresh(); };
    // WYSIWYG content editor
    editBtn.onclick=()=>{ try{ const c=document.querySelector(sel.value); if(!c) return; const first = c.firstElementChild; if(!first) return alert('Aucun élément dans ce conteneur.'); const target = first; const srcHTML = target.innerHTML; const box=document.createElement('div'); box.style.cssText='position:fixed;top:50px;left:50%;transform:translateX(-50%);z-index:100001;background:#0f1013;color:#eaeaea;border:1px solid #2a2b2f;border-radius:10px;width:720px;max-width:95vw;padding:10px'; box.innerHTML='<div style="font-weight:800;margin-bottom:6px">Éditer le contenu (premier élément)</div>'; const tb=document.createElement('div'); tb.style.cssText='display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap'; const btn=(t,fn)=>{ const b=document.createElement('button'); b.className='btn ghost'; b.textContent=t; b.style.cssText='padding:4px 8px;border:1px solid #2a2b2f;border-radius:6px;background:#0f1013;color:#eaeaea'; b.onclick=fn; return b; }; tb.appendChild(btn('B',()=>document.execCommand('bold'))); tb.appendChild(btn('I',()=>document.execCommand('italic'))); tb.appendChild(btn('U',()=>document.execCommand('underline'))); tb.appendChild(btn('P',()=>document.execCommand('formatBlock',false,'P'))); tb.appendChild(btn('H1',()=>document.execCommand('formatBlock',false,'H1'))); tb.appendChild(btn('H2',()=>document.execCommand('formatBlock',false,'H2'))); tb.appendChild(btn('H3',()=>document.execCommand('formatBlock',false,'H3'))); tb.appendChild(btn('Effacer',()=>document.execCommand('removeFormat'))); const link=document.createElement('button'); link.className='btn ghost'; link.textContent='Lien'; link.style.cssText='padding:4px 8px;border:1px solid #2a2b2f;border-radius:6px;background:#0f1013;color:#eaeaea'; link.onclick=()=>{ const u=prompt('URL du lien:','https://'); if(u) document.execCommand('createLink',false,u); }; tb.appendChild(link); tb.appendChild(btn('• Liste',()=>document.execCommand('insertUnorderedList'))); tb.appendChild(btn('1. Liste',()=>document.execCommand('insertOrderedList'))); tb.appendChild(btn('Image',()=>{ const u=prompt('URL de l\'image:','https://'); if(!u) return; const alt=prompt('Texte alternatif:',''); document.execCommand('insertHTML',false, `<img src="${u}" alt="${alt||''}" style="max-width:100%">` ); })); const area=document.createElement('div'); area.contentEditable='true'; area.style.cssText='width:100%;min-height:260px;border:1px solid #2a2b2f;border-radius:8px;padding:8px;background:#111216'; area.innerHTML = srcHTML; const ok=document.createElement('button'); ok.className='btn'; ok.textContent='Appliquer'; ok.style.cssText='margin-top:6px'; const cancel=document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Annuler'; cancel.style.cssText='margin-left:6px'; box.appendChild(tb); box.appendChild(area); box.appendChild(ok); box.appendChild(cancel); document.body.appendChild(box); cancel.onclick=()=> box.remove(); ok.onclick=()=>{ try{ target.innerHTML=area.innerHTML; const mq=(mqSel.value||''); const page = layout[PAGE_KEY] || (layout[PAGE_KEY]={}); if(mq){ page.conditions=page.conditions||[]; let cond=page.conditions.find(x=>x.mq===mq); if(!cond){ cond={mq:mq}; page.conditions.push(cond); } cond.content=cond.content||[]; cond.content=cond.content.filter(x=>x.selector===selectorFor(target)? false: true); cond.content.push({selector: selectorFor(target), html: area.innerHTML}); } else { page.content=page.content||[]; page.content=page.content.filter(x=>x.selector===selectorFor(target)? false: true); page.content.push({selector: selectorFor(target), html: area.innerHTML}); } pushHistory(); alert('Contenu intégré au layout. Exportez/Publiez pour le rendre persistant.'); box.remove(); }catch(e){ alert('Impossible d\'appliquer: '+e.message); } } }catch(_){ alert('Édition impossible ici.'); } };
    viewRulesBtn.onclick=()=>{ const page = layout[PAGE_KEY]||{}; const flat = { moves: page.moves||[], order: page.order||[], content: page.content||[], conditions: page.conditions||[] }; const dlg=document.createElement('div'); dlg.style.cssText='position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:100002;width:720px;max-width:95vw;background:#0f1013;border:1px solid #2a2b2f;border-radius:10px;padding:10px;color:#eaeaea'; const ta=document.createElement('textarea'); ta.style.cssText='width:100%;height:300px'; ta.value=JSON.stringify(flat,null,2); const apply=document.createElement('button'); apply.className='btn'; apply.textContent='Appliquer (local)'; apply.style.cssText='margin-top:6px;margin-right:6px'; const close=document.createElement('button'); close.className='btn ghost'; close.textContent='Fermer'; close.style.cssText='margin-top:6px'; dlg.appendChild(ta); dlg.appendChild(apply); dlg.appendChild(close); document.body.appendChild(dlg); close.onclick=()=> dlg.remove(); apply.onclick=()=>{ try{ const edited=JSON.parse(ta.value); const pageLay = layout[PAGE_KEY] || (layout[PAGE_KEY]={}); pageLay.moves=edited.moves||[]; pageLay.order=edited.order||[]; pageLay.content=edited.content||[]; pageLay.conditions=edited.conditions||[]; pushHistory(); alert('Règles mises à jour (local). Exportez/Publiez pour prendre effet.'); }catch(_){ alert('JSON invalide'); } }; };
    moveSelBtn.onclick=()=>{ const c=document.querySelector(sel.value); if(!c) return; const picks=Array.from(list.querySelectorAll('.sel')); if(!picks.length) return alert('Sélectionnez un ou plusieurs éléments (Ctrl/Cmd‑clic).'); const dst=(addInp.value||'').trim(); if(!dst) return alert('Indiquez le conteneur cible dans la zone "Ajouter conteneur".'); const page = layout[PAGE_KEY] || (layout[PAGE_KEY]={}); const mq=(mqSel.value||''); const moves=picks.map(row=>({ target: row.dataset.selector, appendTo: dst })); if(mq){ page.conditions=page.conditions||[]; let cond=page.conditions.find(x=>x.mq===mq); if(!cond){ cond={mq:mq}; page.conditions.push(cond);} cond.moves=(cond.moves||[]).concat(moves); } else { page.moves=(page.moves||[]).concat(moves); } alert('Règles de déplacement ajoutées. Exportez/Publiez pour appliquer au chargement.'); pushHistory(); };

    // History management (undo/redo)
    const hist=[]; let hIdx=-1; function pushHistory(){ try{ hist.splice(hIdx+1); hist.push(JSON.stringify(layout)); hIdx=hist.length-1; if(window.__cineb_autosave){ try{ localStorage.setItem('cineb_layout_draft', JSON.stringify(layout)); }catch(_){ } } }catch(_){ } }
    const undoBtn=document.createElement('button'); undoBtn.className='btn ghost'; undoBtn.textContent='Annuler'; undoBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    const redoBtn=document.createElement('button'); redoBtn.className='btn ghost'; redoBtn.textContent='Rétablir'; redoBtn.style.cssText='padding:6px 10px;border:1px solid #2a2b2f;border-radius:8px;background:#0f1013;color:#eaeaea';
    controls.appendChild(undoBtn); controls.appendChild(redoBtn);
    undoBtn.onclick=()=>{ if(hIdx>0){ hIdx--; try{ const snap=JSON.parse(hist[hIdx]); Object.assign(layout, snap); alert('Annulé. Rechargez pour voir l’effet.'); }catch(_){ } } };
    redoBtn.onclick=()=>{ if(hIdx<hist.length-1){ hIdx++; try{ const snap=JSON.parse(hist[hIdx]); Object.assign(layout, snap); alert('Rétabli. Rechargez pour voir l’effet.'); }catch(_){ } } };
    saveBtn.onclick=()=>{
      const containerSel = sel.value; const c=document.querySelector(containerSel); if(!c) return;
      const childrenSelectors = Array.from(c.children).map(ch=> selectorFor(ch));
      const pageLay = layout[PAGE_KEY] || (layout[PAGE_KEY]={}); pageLay.order = pageLay.order||[];
      // replace any existing order for this container
      pageLay.order = pageLay.order.filter(o=> o.container!==containerSel);
      pageLay.order.push({ container: containerSel, children: childrenSelectors });
      const blob=new Blob([JSON.stringify(layout,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='layout.json'; a.click(); URL.revokeObjectURL(a.href);
    };
    publishBtn.onclick=async ()=>{
      try{
        const r = await fetch('/office/layout_save.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(layout) });
        if(!r.ok){ const t=await r.text().catch(()=> ''); throw new Error('HTTP '+r.status+' '+t); }
        alert('Layout publié côté serveur.');
      }catch(e){ alert('Échec publication (non connecté ?). Utilisez Exporter JSON puis déposez-le dans data/layout.json.\nDétail: '+e.message); }
    };
    importBtn.onclick=()=> file.click();
    file.onchange= async ()=>{ const f=file.files[0]; if(!f) return; try{ const text=await f.text(); const j=JSON.parse(text); Object.assign(layout, j); alert('Layout importé. Rechargez la page pour l’appliquer.'); }catch(e){ alert('Fichier invalide.'); } };
    persistBtn.onclick=()=>{ try{ localStorage.setItem('cineb_layout_draft', JSON.stringify(layout)); alert('Brouillon sauvegardé (LocalStorage).'); }catch(_){ alert('Impossible de sauvegarder localement.'); } };
    loadBtn.onclick=()=>{ try{ const raw=localStorage.getItem('cineb_layout_draft'); if(!raw) return alert('Aucun brouillon.'); const j=JSON.parse(raw); Object.assign(layout,j); alert('Brouillon chargé. Exportez pour générer layout.json.'); }catch(_){ alert('Chargement impossible.'); } };
    previewToggle.onclick=()=>{ const cur = sessionStorage.getItem('cineb_layout_preview')==='1'; sessionStorage.setItem('cineb_layout_preview', cur?'0':'1'); previewToggle.textContent = cur? 'Aperçu local: OFF':'Aperçu local: ON'; location.reload(); };
  }

  async function init(){
    const serverLayout = await loadJSON('data/layout.json')||{};
    let layout = JSON.parse(JSON.stringify(serverLayout));
    window.__cineb_layout_current = layout;
    // Optionally merge local draft for preview/edit modes
    const params = new URLSearchParams(location.search);
    const localRaw = localStorage.getItem('cineb_layout_draft');
    const localDraft = localRaw ? (JSON.parse(localRaw)||{}) : null;
    const previewFlag = sessionStorage.getItem('cineb_layout_preview')==='1';
    const useDraft = (params.get('layout')==='edit' || params.get('layout')==='preview' || previewFlag) && localDraft;
    if(useDraft){ layout = Object.assign({}, layout, localDraft); }
    applyLayout(layout);
    if(params.get('layout')==='edit'){ buildEditor(layout); }
    // If admin logged in, show floating button to open editor quickly
    try{
      const r = await fetch('/office/whoami.php', {cache:'no-store'});
      if(r.ok){ const btn=document.createElement('button'); btn.textContent='Éditer la mise en page'; btn.style.cssText='position:fixed;bottom:14px;right:14px;z-index:100000;background:#6a4bc7;color:#fff;border:none;border-radius:999px;padding:10px 14px;font-weight:800;box-shadow:0 10px 30px rgba(0,0,0,.4)'; btn.onclick=()=> buildEditor(window.__cineb_layout_current||{}); document.body.appendChild(btn);} }
    catch(_){ }
    // Expose control API & messaging
    window.CINEB_LAYOUT = {
      openEditor: ()=> buildEditor(window.__cineb_layout_current||{}),
      getLayout: ()=> JSON.parse(JSON.stringify(window.__cineb_layout_current||{})),
      setLayout: (j)=>{ try{ if(j&&typeof j==='object'){ window.__cineb_layout_current=j; localStorage.setItem('cineb_layout_draft', JSON.stringify(j)); location.reload(); } }catch(_){ } },
      export: ()=>{ const j=window.__cineb_layout_current||{}; const blob=new Blob([JSON.stringify(j,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='layout.json'; a.click(); URL.revokeObjectURL(a.href); },
      publish: async ()=>{ try{ const r=await fetch('/office/layout_save.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(window.__cineb_layout_current||{})}); return r.ok; }catch(_){ return false; } },
      setPreview: (on)=>{ sessionStorage.setItem('cineb_layout_preview', on?'1':'0'); location.reload(); },
      saveDraft: ()=>{ try{ localStorage.setItem('cineb_layout_draft', JSON.stringify(window.__cineb_layout_current||{})); return true; }catch(_){ return false; } },
      loadDraft: ()=>{ try{ const raw=localStorage.getItem('cineb_layout_draft'); return raw? JSON.parse(raw): null; }catch(_){ return null; } }
    };
    window.addEventListener('message', (e)=>{ const d=e.data||{}; if(d&&d.type==='cineb_layout'){ const act=d.action; if(act==='open_editor') window.CINEB_LAYOUT.openEditor(); else if(act==='export') window.CINEB_LAYOUT.export(); else if(act==='publish') window.CINEB_LAYOUT.publish().then(ok=> e.source.postMessage({type:'cineb_layout_reply', action:'publish', ok}, e.origin)); else if(act==='set_preview') window.CINEB_LAYOUT.setPreview(!!d.on); else if(act==='set_layout') window.CINEB_LAYOUT.setLayout(d.payload); else if(act==='get_layout') e.source.postMessage({type:'cineb_layout_reply', action:'get_layout', payload: window.CINEB_LAYOUT.getLayout()}, e.origin); } });
    // Keyboard shortcuts: Ctrl+L (legacy) or Ctrl+Alt+E to open editor
    window.addEventListener('keydown', (e)=>{
      const k = e.key.toLowerCase();
      if ((e.ctrlKey||e.metaKey) && k==='l') { e.preventDefault(); buildEditor(layout); }
      if ((e.ctrlKey||e.metaKey) && e.altKey && k==='e'){ e.preventDefault(); buildEditor(layout); }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
