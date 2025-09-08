/* featured.js — affiche les éléments marqués comme "featured" sur la page d'accueil */
(async function(){
  const grid = document.getElementById('featuredGrid'); if(!grid) return;
  for(let i=0;i<4;i++){ const s=document.createElement('article'); s.className='card skeleton'; s.style.height='260px'; grid.appendChild(s); }
  const cfg = window.CINEB_CONFIG || {};
  const API_URL = cfg.CATALOG_API_URL;
  const CSV_URL = cfg.CATALOG_CSV_URL || 'data/catalogfdf.csv';
  const LOCAL = 'data/catalogfdf.csv';
  async function fetchJSON(url){ const c=new AbortController(); const to=setTimeout(()=>c.abort(),3000); try{ const r=await fetch(url,{signal:c.signal,cache:'default'}); clearTimeout(to); if(!r.ok) throw new Error('HTTP '+r.status); const j=await r.json(); if(!j.ok && j.ok!==undefined) throw new Error(j.error||'bad payload'); return j.data||j||[]; }catch(e){clearTimeout(to); throw e;} }
  async function fetchCSV(url){ const r=await fetch(url,{cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status); const t=await r.text(); return parseCSV(t); }
  function parseCSV(text){ const lines=text.trim().split(/\r?\n/); const headers=lines.shift().split(',').map(h=>h.trim()); return lines.map(line=>{ const parts=[]; let current='',quoted=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"') quoted=!quoted; else if(c===','&&!quoted){ parts.push(current); current=''; } else current+=c; } parts.push(current); const obj={}; headers.forEach((h,i)=>obj[h]=(parts[i]||'').replace(/^"|"$/g,'').trim()); return obj; }); }
  function price(v){ if(!v) return ''; let clean=String(v).trim(); if(clean.includes('GMT')||clean.includes('2025')){ const m=clean.match(/\d+([.,]\d+)?/); clean=m?m[0].replace(',', '.'): '0'; } const n=Number(clean); return Number.isFinite(n)&&n>0?`${n.toFixed(n%1?2:0)}€ / jour`:'Prix sur demande'; }
  function catIcon(label){ const svgMap={
    'Pack':'<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4z" fill="currentColor" opacity=".7"/><path d="M3 7v10l9 4 9-4V7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'Image':'<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="12" r="2" fill="currentColor"/><path d="M13 14l2-2 4 4" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    'Lumière':'<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3z" fill="currentColor"/><rect x="9" y="18" width="6" height="2" rx="1" fill="currentColor"/></svg>',
    'Audio':'<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="10" rx="3" fill="currentColor"/><path d="M5 12v1a7 7 0 0 0 14 0v-1" stroke="currentColor" stroke-width="2" fill="none"/></svg>'
  }; return svgMap[label]||''; }
function createCard(item){
  const a=document.createElement('a'); a.href='produit.php?slug='+encodeURIComponent(item.slug); a.className='card';
  const media=document.createElement('div'); media.className='media';
  if(item.featured){ const badge=document.createElement('div'); badge.className='badge'; badge.textContent='En avant'; media.appendChild(badge);} 
  const catLabel=(item.type==='pack')?'Pack':(item.category||''); if(catLabel){ const cb=document.createElement('div'); cb.className='badge badge-cat'; cb.innerHTML=catIcon(catLabel)+' '+catLabel; try{ cb.classList.add(catLabel); }catch(_){ } media.appendChild(cb);} 
  if(item.type==='pack' && item.includes){
    const list=String(item.includes).split(',').map(s=>s.trim()).filter(Boolean).slice(0,9);
    const n=list.length;
    if(n){
      media.classList.add('has-grid');
      const cols = n>=9?3:(n>=5?3:2); const rows = Math.ceil(n/cols);
      const g=document.createElement('div'); g.className='media-grid'; g.style.cssText+=`grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);`;
      list.forEach(sl=>{ const ref=(sl&&String(sl))? pmap.get(String(sl).toLowerCase()) : null; const wrap=document.createElement('div'); if(window.CINEB_IMAGES&&CINEB_IMAGES.injectResponsive){ CINEB_IMAGES.injectResponsive(wrap, (ref&&ref.image)||item.image||'', (ref&&ref.name)||item.name||'', '(max-width:600px) 50vw, 260px'); } else { const ii=document.createElement('img'); ii.alt=(ref&&ref.name)||item.name||''; ii.loading='lazy'; ii.decoding='async'; ii.src=(ref&&ref.image)||item.image||''; wrap.appendChild(ii); } g.appendChild(wrap); });
      media.appendChild(g);
    } else {
      if(window.CINEB_IMAGES&&CINEB_IMAGES.injectResponsive){ CINEB_IMAGES.injectResponsive(media, item.image||'', item.name||'', '(max-width:600px) 50vw, 260px'); } else { const img=document.createElement('img'); img.alt=item.name||''; img.loading='lazy'; img.decoding='async'; img.src=item.image||''; media.appendChild(img); }
    }
  } else {
    if(window.CINEB_IMAGES&&CINEB_IMAGES.injectResponsive){ CINEB_IMAGES.injectResponsive(media, item.image||'', item.name||'', '(max-width:600px) 50vw, 260px'); } else { const img=document.createElement('img'); img.alt=item.name||''; img.loading='lazy'; img.decoding='async'; img.src=item.image||''; media.appendChild(img); }
  }
  const body=document.createElement('div'); body.className='body';
  const title=document.createElement('div'); title.style.fontWeight='800'; title.textContent=item.name||''; body.appendChild(title);
  if(item.description){ const desc=document.createElement('div'); desc.className='muted'; desc.style.marginTop='6px'; desc.textContent=item.description; body.appendChild(desc);} 
  const priceEl=document.createElement('div'); priceEl.className='price'; priceEl.textContent=price(item.price_eur_day); body.appendChild(priceEl);
  a.appendChild(media); a.appendChild(body); return a;
}
  try{
    let rows=[]; const cacheKey='featured-data'; const cached=window.CINEB_CACHE?window.CINEB_CACHE.get(cacheKey):null; if(cached){ rows=cached; } else { try{ if(!API_URL) throw new Error('no api'); rows=await fetchJSON(API_URL); if(window.CINEB_CACHE){ window.CINEB_CACHE.set(cacheKey, rows, window.CINEB_CACHE.TTL.catalog); } } catch(e1){ try{ if(!CSV_URL) throw new Error('no csv'); rows=await fetchCSV(CSV_URL); if(window.CINEB_CACHE){ window.CINEB_CACHE.set(cacheKey, rows, 30000); } } catch(e2){ rows=await fetchCSV(LOCAL); if(window.CINEB_CACHE){ window.CINEB_CACHE.set(cacheKey, rows, 30000); } } } }
    rows = rows.map(r=>({ type:(r.type||'').toLowerCase(), category:r.category||'', name:r.name||'', slug:(r.slug||'').toLowerCase().trim(), price_eur_day:r.price_eur_day||r.price||'', image:r.image||'', featured:(String(r.featured||'').toUpperCase()==='TRUE'), includes:r.includes||'', description:r.description||'' }));
    const featuredItems = rows.filter(r=> r.featured && (r.type==='product'||r.type==='pack'));
    const pmap = new Map(); rows.forEach(r=>{ if(r.slug) pmap.set(String(r.slug).toLowerCase(), r); });
    grid.innerHTML='';
    if(featuredItems.length){ featuredItems.forEach(item=>{
      // Inject real collage: rebuild media for packs with includes to actual images
      const card = (function(){ const a=document.createElement('a'); a.href='produit.php?slug='+encodeURIComponent(item.slug); a.className='card'; const media=document.createElement('div'); media.className='media'; if(item.featured){ const badge=document.createElement('div'); badge.className='badge'; badge.textContent='En avant'; media.appendChild(badge);} const catLabel=(item.type==='pack')?'Pack':(item.category||''); if(catLabel){ const cb=document.createElement('div'); cb.className='badge badge-cat'; cb.innerHTML=catIcon(catLabel)+' '+catLabel; try{ cb.classList.add(catLabel); }catch(_){ } media.appendChild(cb);} if(item.type==='pack' && item.includes){ const list=String(item.includes).split(',').map(s=>s.trim()).filter(Boolean).slice(0,9); const n=list.length; if(n){ const cols = n>=9?3:(n>=5?3:2); const rowsC = Math.ceil(n/cols); const g=document.createElement('div'); g.className='media-grid'; g.style.cssText+=`grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rowsC},1fr);`; list.forEach(sl=>{ const ref=pmap.get(String(sl).toLowerCase()); const ii=document.createElement('img'); ii.alt=(ref&&ref.name)||item.name||''; if(window.CINEB_IMAGES&&CINEB_IMAGES.setBestImage){ CINEB_IMAGES.setBestImage(ii, (ref&&ref.image)||item.image||''); } else { ii.loading='lazy'; ii.decoding='async'; ii.src=(ref&&ref.image)||item.image||''; } g.appendChild(ii); }); media.appendChild(g); } else { const img=document.createElement('img'); img.alt=item.name||''; if(window.CINEB_IMAGES&&CINEB_IMAGES.setBestImage){ CINEB_IMAGES.setBestImage(img, item.image||''); } else { img.loading='lazy'; img.decoding='async'; img.src=item.image||''; } media.appendChild(img);} } else { const img=document.createElement('img'); img.alt=item.name||''; if(window.CINEB_IMAGES&&CINEB_IMAGES.setBestImage){ CINEB_IMAGES.setBestImage(img, item.image||''); } else { img.loading='lazy'; img.decoding='async'; img.src=item.image||''; } media.appendChild(img);} const body=document.createElement('div'); body.className='body'; const title=document.createElement('div'); title.style.fontWeight='800'; title.textContent=item.name||''; body.appendChild(title); if(item.description){ const desc=document.createElement('div'); desc.className='muted'; desc.style.marginTop='6px'; desc.textContent=item.description; body.appendChild(desc);} const priceEl=document.createElement('div'); priceEl.className='price'; priceEl.textContent=price(item.price_eur_day); body.appendChild(priceEl); a.appendChild(media); a.appendChild(body); return a; })();
      grid.appendChild(card);
    }); }
    else { const p=document.createElement('p'); p.className='muted'; p.textContent='Aucun élément en avant pour le moment.'; grid.appendChild(p); }
  }catch(err){ console.error('featured.js Error:', err); grid.innerHTML='<p class="muted">Erreur de chargement des éléments en avant.</p>'; }
})();
