// realisation.js — Fiche réalisation (V2: via REALISATIONS_API_URL + cache local)
const REAL_TTL_MS = 120000;
const REAL_CACHE_PREFIX = 'cineb_cache_real:';
function now(){ return Date.now(); }
function getCache(key){ try{ const raw=localStorage.getItem(key); if(!raw) return null; const obj=JSON.parse(raw); if(obj.expireAt<now()) return null; return obj.data; }catch(_){ return null; } }
function setCache(key,data){ try{ localStorage.setItem(key, JSON.stringify({expireAt: now()+REAL_TTL_MS, data})); }catch(_){} }
function getParam(n){ return new URL(location.href).searchParams.get(n); }
function esc(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function skeleton(){ return `<div class='wrap'><div class="media media-16x9"></div><div><div class="skeleton" style="height:26px;width:50%"></div><div class="skeleton" style="height:14px;width:80%;margin-top:10px"></div><div class="skeleton" style="height:14px;width:70%;margin-top:8px"></div><div class="skeleton" style="height:40px;width:180px;margin-top:16px;border-radius:1rem"></div></div></div>`; }

document.addEventListener('DOMContentLoaded', async ()=>{
  const el = document.getElementById('real');
  const slug = (getParam('id')||'').toLowerCase();
  if(!el){ return; }
  if(!slug){ el.innerHTML='<p>Réalisation introuvable.</p>'; return; }
  el.innerHTML = skeleton();
  const { REALISATIONS_API_URL } = window.CINEB_CONFIG || {};
  async function fetchList(){
    try{ if(!REALISATIONS_API_URL) throw new Error('no api'); const res = await fetch(REALISATIONS_API_URL, { cache:'no-cache' }); if(!res.ok) throw new Error('HTTP '+res.status); const j = await res.json(); if(!j.ok) throw new Error(j.error||'bad'); return j.data||[]; }
    catch(_){ const r = await fetch('data/realisations.csv', { cache:'no-cache' }); if(!r.ok) throw new Error('HTTP '+r.status); const t = await r.text(); const lines = t.trim().split(/\r?\n/); const headers = lines.shift().split(',').map(h=>h.trim()); return lines.map(line=>{ const parts=[]; let cur='',q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"') q=!q; else if(c===','&&!q){ parts.push(cur); cur=''; } else cur+=c; } parts.push(cur); const o={}; headers.forEach((h,i)=>o[h]=(parts[i]||'').replace(/^\"|\"$/g,'').trim()); return o; }); }
  }
  const cacheKey = REAL_CACHE_PREFIX + slug;
  let cached = getCache(cacheKey);
  if(cached){ render(cached); }
  try{ const list = await fetchList(); const norm = list.map(r=>({ title: r.title||'', slug: (r.slug||'').toLowerCase().trim(), image: r.image||r.image_url||'', url: r.url||r.lien||'', date: r.date||'', description: r.description||'' })); const real = norm.find(x=>x.slug===slug); if(!real){ el.innerHTML='<p>Réalisation introuvable.</p>'; return; } setCache(cacheKey, real); render(real); }
  catch(e){ console.error(e); if(!cached) el.innerHTML='<p>Réalisation introuvable.</p>'; }
  function render(r){ el.innerHTML = `
      <div class="wrap">
        <div>
          ${r.url && r.url.includes('http') && (r.url.includes('youtube')||r.url.includes('vimeo'))
            ? `<div class="video" style="aspect-ratio:16/9;border:1px solid var(--line);border-radius:1rem;overflow:hidden">
                 <iframe src="${r.url}" title="${esc(r.title)}" allow="autoplay; encrypted-media" frameborder="0" style="width:100%;height:100%"></iframe>
               </div>`
            : (r.image ? `<div class="media media-16x9"><img src="${r.image}" alt="${esc(r.title)}" loading="lazy" decoding="async" /></div>` : '')}
        </div>
        <div>
          <h1>${esc(r.title||'Réalisation')}</h1>
          ${r.date ? `<p><b>Date :</b> ${esc(r.date)}</p>` : ''}
          ${r.url ? `<p><a class=\"btn\" target=\"_blank\" href=\"${r.url}\">Voir le projet</a></p>` : ''}
          <p class="muted">${esc(r.description||'')}</p>
        </div>
      </div>`; }
});

