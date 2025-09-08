/* realisations.js — affiche les réalisations depuis Apps Script */
(async function(){
  const mount = document.getElementById('realisationsGrid'); if(!mount) return;
  for(let i=0;i<6;i++){ const s=document.createElement('article'); s.className='featured-card skeleton'; s.style.height='140px'; mount.appendChild(s); }
  const cfg = window.CINEB_CONFIG || {};
  const api = cfg.REALISATIONS_API_URL;
  function card(x){ const a=document.createElement('a'); a.className='card real-card'; a.href='realisation.php?id='+encodeURIComponent(x.slug||''); const m=document.createElement('div'); m.className='media media-16x9'; if(x.tags){ const tag=document.createElement('div'); tag.className='badge'; tag.textContent=(x.tags.split(',')[0]||'').trim()||'Projet'; m.appendChild(tag);} const ov=document.createElement('div'); ov.className='ov'; ov.textContent=x.title||''; m.appendChild(ov); const img=document.createElement('img'); img.loading='lazy'; img.decoding='async'; img.src=x.image||''; img.alt=x.title||''; m.appendChild(img); const b=document.createElement('div'); b.className='body'; const inf=document.createElement('div'); inf.className='muted'; inf.textContent=x.date?('Publié: '+x.date):''; const d=document.createElement('div'); d.className='muted'; d.textContent=x.description||''; if(inf.textContent) b.appendChild(inf); b.appendChild(d); a.appendChild(m); a.appendChild(b); return a; }
  async function fetchCSV(url){ const r = await fetch(url, {cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status); const t = await r.text(); return parseCSV(t); }
  function parseCSV(text){ const lines = text.trim().split(/\r?\n/); const headers = lines.shift().split(',').map(h => h.trim()); return lines.map(line => { const parts = []; let current = '', quoted = false; for(let i = 0; i < line.length; i++){ const c = line[i]; if(c === '"') quoted = !quoted; else if(c === ',' && !quoted){ parts.push(current); current = ''; } else current += c; } parts.push(current); const obj = {}; headers.forEach((h, i) => obj[h] = (parts[i] || '').replace(/^\"|\"$/g, '').trim()); return obj; }); }
  try{
    let data = [];
    try { const res = await fetch(api, {cache:'no-cache'}); if(!res.ok) throw new Error('HTTP '+res.status); const j = await res.json(); if(!j.ok && j.ok!==undefined) throw new Error(j.error||'bad'); data = j.data || j || []; }
    catch(apiError) { try { data = await fetchCSV('data/realisations.csv'); } catch(csvError) { console.error('Fallback CSV en échec:', csvError); throw new Error('Aucune source de données disponible'); } }
    // tri par date (desc) si possible
    data.sort((a,b)=>{ const da=Date.parse(a.date||'')||0, db=Date.parse(b.date||'')||0; return db-da; });
    mount.innerHTML=''; data.forEach(x => mount.appendChild(card(x))); if(!mount.children.length){ mount.innerHTML='<p class="muted">Aucune réalisation.</p>'; }
  }catch(e){ console.error('realisations.js Error:', e); mount.innerHTML='<p class="muted">Erreur de chargement des réalisations.</p>'; }
})();
