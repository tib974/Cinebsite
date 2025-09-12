/* JSON (Apps Script) first, CSV/local fallback + packs affichent miniatures incluses */
(async function(){
  const grid = document.getElementById('grid'); if(!grid) return;
  for(let i=0;i<8;i++){ const s=document.createElement('article'); s.className='card skeleton'; s.style.height='260px'; grid.appendChild(s); }
  const cfg = window.CINEB_CONFIG || {};
  const API_URL = cfg.CATALOG_API_URL;
  const CSV_URL = cfg.CATALOG_CSV_URL;
  const CAL_URL = (window.CINEB_CONFIG||{}).CALENDAR_API_URL;
  const LOCAL   = cfg.CATALOG_CSV_URL || 'data/catalogfdf.csv';
  async function fetchJSON(url){ const controller=new AbortController(); const timeoutId=setTimeout(()=>controller.abort(),3000); try{ const r=await fetch(url,{signal:controller.signal,cache:'default'}); clearTimeout(timeoutId); if(!r.ok) throw new Error('HTTP '+r.status); const j=await r.json(); if(!j.ok && j.ok!==undefined) throw new Error(j.error||'bad payload'); return j.data||j||[]; } catch(error) { clearTimeout(timeoutId); throw error; } }
  async function fetchCSV(url){ const r=await fetch(url,{cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status); const t=await r.text(); return parseCSV(t); }
  function parseCSV(text){ const L=text.trim().split(/\r?\n/); const H=L.shift().split(',').map(h=>h.trim()); return L.map(line=>{ const P=[]; let cur='',q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"') q=!q; else if(c===','&&!q){ P.push(cur); cur=''; } else cur+=c; } P.push(cur); const o={}; H.forEach((h,i)=>o[h]=(P[i]||'').replace(/^\"|\"$/g,'').trim()); return o; }); }
  function mapBySlug(a){ const m=new Map(); a.forEach(x=>{ if(x.slug) m.set(x.slug,x);}); return m; }
  function price(v){ if(!v) return ''; let cleanValue=String(v).trim(); if(cleanValue.includes('GMT')||cleanValue.includes('2025')){ const match=cleanValue.match(/\d+([.,]\d+)?/); cleanValue=match?match[0].replace(',', '.'):'0'; } const n=Number(cleanValue); return Number.isFinite(n)&&n>0?`${n.toFixed(n%1?2:0)}€ / jour`:'Prix sur demande'; }
  function mini(src,alt){ const w=document.createElement('div'); Object.assign(w.style,{width:'52px',height:'52px',borderRadius:'12px',overflow:'hidden',border:'1px solid var(--line)',background:'linear-gradient(180deg,#3b1c5f 0%, #0e0f11 100%)',display:'flex',alignItems:'center',justifyContent:'center'}); const i=document.createElement('img'); i.alt=alt||''; Object.assign(i.style,{width:'100%',height:'100%',objectFit:'contain'}); if(window.CINEB_IMAGES&&CINEB_IMAGES.setBestImage){ CINEB_IMAGES.setBestImage(i, src||''); } else { i.loading='lazy'; i.decoding='async'; i.src=src||''; } w.appendChild(i); return w; }
  function includedStrip(pack, pmap){ const wrap=document.createElement('div'); Object.assign(wrap.style,{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'8px'}); (pack.includes||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(sl=>{ const p=pmap.get(sl); if(p){ const t=mini(p.image,p.name); t.title=p.name; wrap.appendChild(t);} }); return wrap; }
  function catIcon(label){ const svgMap={
    'Pack':'<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4z" fill="currentColor" opacity=".7"/><path d="M3 7v10l9 4 9-4V7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'Image':'<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="12" r="2" fill="currentColor"/><path d="M13 14l2-2 4 4" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    'Lumière':'<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3z" fill="currentColor"/><rect x="9" y="18" width="6" height="2" rx="1" fill="currentColor"/></svg>',
    'Audio':'<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="10" rx="3" fill="currentColor"/><path d="M5 12v1a7 7 0 0 0 14 0v-1" stroke="currentColor" stroke-width="2" fill="none"/></svg>'
  }; return svgMap[label]||''; }
function card(x, pmap, availMap){ const a=document.createElement('a'); a.href='produit.php?slug='+encodeURIComponent(x.slug); a.className='card'; const m=document.createElement('div'); m.className='media'; if(x.featured){ const badge=document.createElement('div'); badge.className='badge'; badge.textContent='En avant'; m.appendChild(badge);} const hasAvail = availMap && availMap.has(x.slug) ? availMap.get(x.slug) : null; if(hasAvail!==null){ const ab=document.createElement('div'); ab.className='badge ' + (hasAvail? 'badge-available':'badge-unavailable'); ab.textContent= hasAvail? 'Disponible' : 'Indisponible'; ab.style.right='8px'; ab.style.left='auto'; m.appendChild(ab);} const catLabel = (x.type==='pack') ? 'Pack' : (x.category||''); if(catLabel){ const cb=document.createElement('div'); cb.className='badge badge-cat'; cb.innerHTML=catIcon(catLabel)+' '+catLabel; try{ cb.classList.add(catLabel); }catch(_){ } m.appendChild(cb);} if(x.type==='pack' && x.includes){ const list = x.includes.split(',').map(s=>s.trim()).filter(Boolean).slice(0,9); const n=list.length; if(n){ const cols = n>=9?3:(n>=5?3:2); const rows = Math.ceil(n/cols); const g=document.createElement('div'); g.className='media-grid'; g.style.cssText+=`grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);`; list.forEach(sl=>{ const p=pmap.get(sl); const wrap=document.createElement('div'); if(window.CINEB_IMAGES&&CINEB_IMAGES.injectResponsive){ CINEB_IMAGES.injectResponsive(wrap, (p&&p.image)||'', p?p.name:'', '(max-width:600px) 50vw, 260px'); } else { const img=document.createElement('img'); img.alt=p?p.name:''; img.loading='lazy'; img.decoding='async'; img.src=(p&&p.image)||''; wrap.appendChild(img);} g.appendChild(wrap); }); m.appendChild(g); } else { if(window.CINEB_IMAGES&&CINEB_IMAGES.injectResponsive){ CINEB_IMAGES.injectResponsive(m, x.image||'', x.name||'', '(max-width:600px) 50vw, 260px'); } else { const im=document.createElement('img'); im.alt=x.name||''; im.loading='lazy'; im.decoding='async'; im.src=x.image||''; m.appendChild(im);} } } else { if(window.CINEB_IMAGES&&CINEB_IMAGES.injectResponsive){ CINEB_IMAGES.injectResponsive(m, x.image||'', x.name||'', '(max-width:600px) 50vw, 260px'); } else { const im=document.createElement('img'); im.alt=x.name||''; im.loading='lazy'; im.decoding='async'; im.src=x.image||''; m.appendChild(im);} } const b=document.createElement('div'); b.className='body'; const t=document.createElement('div'); t.style.fontWeight='800'; t.textContent=x.name||''; const pr=document.createElement('div'); pr.className='price'; pr.textContent=price(x.price_eur_day); b.appendChild(t); if(x.type==='pack'){ /* no included strip on cards now */ } else if(x.description){ const d=document.createElement('div'); d.className='muted'; d.style.marginTop='6px'; d.textContent=x.description; b.appendChild(d); } b.appendChild(pr); a.appendChild(m); a.appendChild(b); return a; }
  function priceNum(v){ if(!v) return NaN; const s=String(v).replace(',', '.'); const m=s.match(/\d+(?:\.\d+)?/); return m?parseFloat(m[0]):NaN; }
  function parseDate(s){ const d=new Date(String(s)+'T00:00:00'); return isNaN(d)?null:d; }
  function today(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
  function buildAvailMap(cal){
    const t=today();
    const map=new Map();
    const globalBlocks = cal.filter(r=>!r.item_slug);
    function isBlocked(r){ const f=parseDate(r.date_from||r.date), to=parseDate(r.date_to||r.date); if(!f||!to) return false; return t>=f && t<=to; }
    const globalBlocked = globalBlocks.some(isBlocked);
    const byItem = new Map();
    cal.forEach(r=>{ if(r.item_slug){ if(!byItem.has(r.item_slug)) byItem.set(r.item_slug, []); byItem.get(r.item_slug).push(r); } });
    return {
      has(slug){ if(!slug) return null; const itemBlocked = (byItem.get(slug)||[]).some(isBlocked); const blocked = itemBlocked || globalBlocked; return !blocked; },
      get(slug){ return this.has(slug); }
    };
  }
  function render(list,pmap,avail){ grid.innerHTML=''; const chips=document.getElementById('catChips'); let cat=''; const active=chips?chips.querySelector('.chip.active'):null; if(active){ cat=active.dataset.cat||''; } const q=(document.getElementById('search')||{}).value||''; const sortChips=document.getElementById('sortChips'); let mode='featured'; if(sortChips){ const a=sortChips.querySelector('.chip.active'); if(a) mode=a.dataset.sort||'featured'; } const qn=q.toLowerCase().trim(); let items=list.filter(x=>!cat||x.category===cat||(cat==='Packs'&&x.type==='pack')).filter(x=>!qn||(x.name||'').toLowerCase().includes(qn)); if(mode==='price_asc'){ items=items.slice().sort((a,b)=>(priceNum(a.price_eur_day)||1e9)-(priceNum(b.price_eur_day)||1e9)); } else if(mode==='price_desc'){ items=items.slice().sort((a,b)=>(priceNum(b.price_eur_day)||-1e9)-(priceNum(a.price_eur_day)||-1e9)); } else if(mode==='name'){ items=items.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))); } else if(mode==='avail' && avail){ items=items.slice().sort((a,b)=> (avail.get(b.slug)?1:0)-(avail.get(a.slug)?1:0)); } else { items=items.slice().sort((a,b)=> (b.featured===true)-(a.featured===true)); } items.forEach(x=>grid.appendChild(card(x,pmap,avail))); if(!grid.children.length){ const p=document.createElement('p'); p.className='muted'; p.textContent='Aucun résultat'; grid.appendChild(p); } }
  try{
    let rows=[];
    try{ if(!API_URL) throw new Error('no api'); rows = await fetchJSON(API_URL); }
    catch(e1){ try{ if(!CSV_URL) throw new Error('no csv'); rows = await fetchCSV(CSV_URL); } catch(e2){ rows = await fetchCSV(LOCAL); } }
    rows = rows.map(r=>({ type:(r.type||'').toLowerCase(), category:r.category||'', name:r.name||'', slug:(r.slug||'').toLowerCase().trim(), price_eur_day:r.price_eur_day||r.price||'', image:r.image||'', featured:(String(r.featured||'').toUpperCase()==='TRUE'), includes:r.includes||'', description:r.description||'' }));
    const pmap = mapBySlug(rows.filter(r=>r.type==='product'));
    const list = rows.filter(r=>r.type==='product'||r.type==='pack');
    const s=document.getElementById('search'); const sortChips=document.getElementById('sortChips'); const chips=document.getElementById('catChips');
    let availMap = null;
    try{ if(CAL_URL){ const calData = await fetchJSON(CAL_URL); const helper = buildAvailMap(calData); availMap = new Map(); list.forEach(it=>{ availMap.set(it.slug, helper.get(it.slug)); }); } }catch(_){ }
    if(chips) chips.addEventListener('click', (e)=>{ const b=e.target.closest('.chip'); if(!b) return; chips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active')); b.classList.add('active'); render(list,pmap,availMap); });
    if(sortChips) sortChips.addEventListener('click', (e)=>{ const b=e.target.closest('.chip'); if(!b) return; const already=b.classList.contains('active'); const isFeatured=b.dataset.sort==='featured'; if(already && !isFeatured){ b.classList.remove('active'); const def=sortChips.querySelector('.chip[data-sort="featured"]'); if(def){ def.classList.add('active'); } } else { sortChips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active')); b.classList.add('active'); } render(list,pmap,availMap); });
    if(s) s.addEventListener('input',()=>render(list,pmap,availMap));
    // Masonry for wider screens
    function applyLayout(){ if(window.innerWidth>=900){ grid.classList.add('masonry'); } else { grid.classList.remove('masonry'); } }
    applyLayout(); window.addEventListener('resize', applyLayout);
    render(list,pmap,availMap);
  }catch(err){ console.error('catalog.js Error:', err); grid.innerHTML='<p class="muted">Erreur de chargement du catalogue.</p>'; }
})();
