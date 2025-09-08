/* product.js — affiche les détails d'un produit/pack basé sur le slug dans l'URL */
(async function(){
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if(!slug) return;
  const nameEl = document.getElementById('productName');
  const imageEl = document.getElementById('productImage');
  const priceEl = document.getElementById('productPrice');
  const availEl = document.getElementById('productAvailability');
  const descEl = document.getElementById('productDescription');
  const includesEl = document.getElementById('productIncludes');
  if(!nameEl && !imageEl) return;
  if(nameEl) nameEl.textContent = 'Chargement...';
  const cfg = window.CINEB_CONFIG || {};
  const API_URL = cfg.CATALOG_API_URL;
  const CSV_URL = cfg.CATALOG_CSV_URL;
  const LOCAL = cfg.CATALOG_CSV_URL || 'data/catalogfdf.csv';
  const CAL_URL = cfg.CALENDAR_API_URL;
  async function fetchJSON(url){ const r = await fetch(url, {cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status); const j = await r.json(); if(!j.ok && j.ok!==undefined) throw new Error(j.error||'bad payload'); return j.data||j||[]; }
  async function fetchCSV(url){ const r = await fetch(url, {cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status); const t = await r.text(); return parseCSV(t); }
  function parseCSV(text){ const lines = text.trim().split(/\r?\n/); const headers = lines.shift().split(',').map(h => h.trim()); return lines.map(line => { const parts = []; let current = '', quoted = false; for(let i = 0; i < line.length; i++){ const c = line[i]; if(c === '"') quoted = !quoted; else if(c === ',' && !quoted){ parts.push(current); current = ''; } else current += c; } parts.push(current); const obj = {}; headers.forEach((h, i) => obj[h] = (parts[i] || '').replace(/^\"|\"$/g, '').trim()); return obj; }); }
  function price(v){ if(!v) return ''; let cleanValue = String(v).trim(); if(cleanValue.includes('GMT') || cleanValue.includes('2025')) { const match = cleanValue.match(/\d+([.,]\d+)?/); cleanValue = match ? match[0].replace(',', '.') : '0'; } const n = Number(cleanValue); return Number.isFinite(n) && n > 0 ? `${n.toFixed(n % 1 ? 2 : 0)}€ / jour` : 'Prix sur demande'; }
  function mapBySlug(arr){ const map = new Map(); arr.forEach(x => { if(x.slug) map.set(x.slug, x); }); return map; }
  function fmt(d){ return d.toISOString().slice(0,10); }
  function parseDate(s){ const d = new Date(String(s)+'T00:00:00'); return isNaN(d) ? null : d; }
  function computeBlockedRanges(ranges){
    // Normalize each row to {from:Date, to:Date}
    const out=[]; (ranges||[]).forEach(r=>{
      const f=parseDate(r.date_from||r.date), t=parseDate(r.date_to||r.date);
      if(f&&t) out.push({from:f,to:t});
    });
    // Sort by from
    out.sort((a,b)=>a.from-b.from);
    return out;
  }
  function today(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
  function nextAvailability(ranges){
    // If today is within a blocked range, availability is day after that range
    const t=today();
    for(const r of ranges){ if(t>=r.from && t<=r.to){ const next=new Date(r.to); next.setDate(next.getDate()+1); return next; } }
    // Otherwise, today is available unless the first block starts today
    for(const r of ranges){ if(r.from<=t && r.to>=t){ const next=new Date(r.to); next.setDate(next.getDate()+1); return next; } if(r.from>t){ return t; }
    }
    return t; // no blocks
  }
  try{
    let rows = [];
    try{ if(!API_URL) throw new Error('no api'); rows = await fetchJSON(API_URL); }
    catch(e1){ try{ if(!CSV_URL) throw new Error('no csv'); rows = await fetchCSV(CSV_URL); } catch(e2){ rows = await fetchCSV(LOCAL); } }
    rows = rows.map(r => ({ type: (r.type || '').toLowerCase(), category: r.category || '', name: r.name || '', slug: (r.slug || '').toLowerCase().trim(), price_eur_day: r.price_eur_day || r.price || '', image: r.image || '', featured: (String(r.featured || '').toUpperCase() === 'TRUE'), includes: r.includes || '', description: r.description || '' }));
    const product = rows.find(r => r.slug === slug.toLowerCase());
    if(!product){ if(nameEl) nameEl.textContent = 'Produit non trouvé'; return; }
    if(nameEl) nameEl.textContent = product.name;
    if(imageEl) {
      const container = imageEl.parentNode;
      if(container && window.CINEB_IMAGES && CINEB_IMAGES.createResponsivePicture){
        container.innerHTML = '';
        const pic = CINEB_IMAGES.createResponsivePicture(product.image, product.name, '(max-width: 900px) 100vw, 600px');
        container.appendChild(pic);
      } else {
        imageEl.alt = product.name;
        if(window.CINEB_IMAGES && CINEB_IMAGES.setBestImage){ CINEB_IMAGES.setBestImage(imageEl, product.image); }
        else { imageEl.src = product.image; }
      }
    }
    if(priceEl) priceEl.textContent = price(product.price_eur_day);
    const estimateEl = document.getElementById('priceEstimate');
    function parsePriceNum(v){ if(!v) return NaN; const m=String(v).replace(',', '.').match(/\d+(?:\.\d+)?/); return m?parseFloat(m[0]):NaN; }
    function discountFactor(days){ if(days>=7) return .8; if(days>=5) return .85; if(days>=3) return .9; return 1; }
    function updateEstimate(daysSel){ if(!estimateEl) return; const p=parsePriceNum(product.price_eur_day); if(!isFinite(p)||p<=0){ estimateEl.textContent=''; return; } if(!daysSel||daysSel<2){ estimateEl.textContent=''; return; } const d = discountFactor(daysSel); const total = Math.round(p * d * daysSel); const per = Math.round(p * d); estimateEl.textContent = `${daysSel} jours: ~${total}€ (≈ ${per}€/jour dégressif)`; }
    if(descEl) descEl.textContent = product.description || 'Aucune description disponible.';
    // Link to calendar filtered for this product
    const reserve = document.getElementById('reserveBtn');
    if(reserve){ reserve.href = `calendrier.html?produit=${encodeURIComponent(product.slug)}&itemName=${encodeURIComponent(product.name)}`; }

    // Availability: fetch calendar for this item
    if(CAL_URL && availEl){
      try{
        const cal = await fetchJSON(`${CAL_URL}?item=${encodeURIComponent(product.slug)}`);
        const ranges = computeBlockedRanges(cal);
        if(!ranges.length){ availEl.textContent = 'Disponible.'; }
        else{
          const next = nextAvailability(ranges);
          const t = today();
          if(next.getTime()===t.getTime()){
            // today available but show next blocked period snippet
            const first = ranges.find(r=>r.from>=t) || ranges[0];
            if(first && first.from>t){
              availEl.textContent = `Disponible. Prochaine indisponibilité: du ${fmt(first.from)} au ${fmt(first.to)}.`;
            } else {
              availEl.textContent = 'Disponible.';
            }
          } else {
            availEl.textContent = `Indisponible aujourd’hui. Prochaine disponibilité: ${fmt(next)}.`;
          }
        }
      }catch(_){ /* ignore */ }
    }
    if(includesEl && product.type === 'pack' && product.includes){
      const productMap = mapBySlug(rows.filter(r => r.type === 'product'));
      const list = product.includes.split(',').map(s => s.trim()).filter(Boolean);
      includesEl.innerHTML = '';
      // Move includes under the calendar on desktop
      try{ const calMount = document.getElementById('productCalendar'); if(calMount && window.matchMedia('(min-width: 901px)').matches){ calMount.insertAdjacentElement('afterend', includesEl); includesEl.classList.add('includes-inline'); } }catch(_){ }
      list.forEach(itemSlug => {
        const item = productMap.get(itemSlug);
        if(item){
          const div = document.createElement('div');
          div.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px;background:var(--panel);border:1px solid var(--line);border-radius:8px;margin:4px 0';
          const imgWrap = document.createElement('div'); imgWrap.style.cssText='width:48px;height:48px;border-radius:6px;overflow:hidden;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#3b1c5f 0%, #0e0f11 100%)';
          if(window.CINEB_IMAGES && CINEB_IMAGES.injectResponsive){ CINEB_IMAGES.injectResponsive(imgWrap, item.image||'', item.name||'', '(max-width:600px) 48px, 48px'); }
          else { const img = document.createElement('img'); img.src = item.image; img.alt = item.name; img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:6px'; imgWrap.appendChild(img); }
          const textDiv = document.createElement('div'); const nameDiv = document.createElement('div'); nameDiv.textContent = item.name; nameDiv.style.fontWeight = '600'; const priceDiv = document.createElement('div'); priceDiv.textContent = price(item.price_eur_day); priceDiv.className = 'muted'; priceDiv.style.fontSize = '0.9em'; textDiv.appendChild(nameDiv); textDiv.appendChild(priceDiv);
          div.appendChild(imgWrap); div.appendChild(textDiv); includesEl.appendChild(div);
        }
      });
    }
    document.title = `${product.name} — CinéB`;
    // Cart handling
    function getCart(){ try{ return JSON.parse(localStorage.getItem('cineb_cart')||'[]'); }catch(_){ return []; } }
    function setCart(arr){ localStorage.setItem('cineb_cart', JSON.stringify(arr)); }
    function includesList(str){ return (str||'').split(',').map(s=>s.trim()).filter(Boolean); }
    const addBtn = document.getElementById('addToCartBtn');
    if(addBtn){
      addBtn.addEventListener('click', ()=>{
        let cart = getCart();
        const exists = cart.some(x=>x.slug===product.slug);
        if(exists){ addBtn.textContent='Déjà dans la sélection'; return; }
        // Avoid duplicates between packs and items
        if(product.type==='pack'){
          const inc = includesList(product.includes);
          // remove included items if present
          cart = cart.filter(x=> !inc.includes(x.slug));
          cart.push({slug:product.slug,name:product.name,type:product.type,includes:inc});
        } else { // product
          // if any pack includes this item, do not add
          const blocked = cart.some(x=> x.type==='pack' && Array.isArray(x.includes) && x.includes.includes(product.slug));
          if(blocked){ addBtn.textContent='Inclus dans un pack'; return; }
          cart.push({slug:product.slug,name:product.name,type:product.type});
        }
        setCart(cart);
        addBtn.textContent='Ajouté ✓';
      });
    }
    // Collage media pour packs sur la fiche produit
    try{
      if(product.type==='pack' && product.includes){
        const media = imageEl.closest('.media');
        if(media){
          media.innerHTML=''; media.classList.add('has-grid');
          const list = String(product.includes).split(',').map(s=>s.trim()).filter(Boolean).slice(0,9);
          const n=list.length; const cols = n>=9?3:(n>=5?3:2); const rowsCount = Math.ceil(Math.max(1,n)/cols);
          const grid=document.createElement('div'); grid.className='media-grid'; grid.style.cssText += `grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rowsCount},1fr);`;
          list.forEach(sl=>{ const ref = rows.find(r=>String(r.slug||'').toLowerCase()===sl); const wrap=document.createElement('div'); if(window.CINEB_IMAGES && CINEB_IMAGES.injectResponsive){ CINEB_IMAGES.injectResponsive(wrap, (ref&&ref.image)||product.image||'', (ref&&ref.name)||product.name||'', '(max-width:900px) 50vw, 480px'); } else { const ii=document.createElement('img'); ii.loading='lazy'; ii.decoding='async'; ii.src=(ref&&ref.image)||product.image||''; ii.alt=(ref&&ref.name)||product.name||''; wrap.appendChild(ii);} grid.appendChild(wrap); });
          media.appendChild(grid);
        }
      }
    }catch(_){ }

    // Mini calendrier intégré (mois courant)
    const calMount = document.getElementById('productCalendar');
    if (calMount && CAL_URL){
      const cal = await fetchJSON(`${CAL_URL}?item=${encodeURIComponent(product.slug)}`);
      function isBlockedDateStr(ds){ return (cal||[]).some(r=>{ const a=(r.date_from||r.date||''), b=(r.date_to||r.date||''); if(!a||!b) return false; const d=new Date(ds+'T00:00:00'); const f=new Date(a+'T00:00:00'); const t=new Date(b+'T00:00:00'); return d>=f && d<=t; }); }
      // next blocked start
      const nextBlock = (()=>{ let min=null; (cal||[]).forEach(r=>{ const f=new Date((r.date_from||r.date||'')+'T00:00:00'); if(!isNaN(f) && (!min || f<min)) min=f; }); return min; })();
      const selected = new Set();
      const go = document.createElement('button'); go.type='button'; go.className='btn'; go.style.marginTop='8px'; go.textContent='Choisir ces jours'; go.style.display='none';
      go.addEventListener('click', ()=>{ const picks=[...selected].sort(); const dates=picks.join(','); const url=`calendrier.html?produit=${encodeURIComponent(product.slug)}&itemName=${encodeURIComponent(product.name)}${dates?`&dates=${encodeURIComponent(dates)}`:''}`; location.href=url; });
      // Also include selected dates when clicking main reserve button
      if(reserve){ reserve.addEventListener('click', (e)=>{ const picks=[...selected].sort(); if(picks.length){ e.preventDefault(); const dates=picks.join(','); const url=`calendrier.html?produit=${encodeURIComponent(product.slug)}&itemName=${encodeURIComponent(product.name)}&dates=${encodeURIComponent(dates)}`; location.href=url; } }); }
      let rangeAnchor='';
      function fmtLocal(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
      function buildCalendar(monthDate){ const daysOfWeek=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']; const wrap=document.createElement('div'); wrap.className='cal'; const header=document.createElement('div'); header.className='cal-header'; const prev=document.createElement('button'); prev.className='btn ghost'; prev.textContent='◀'; const next=document.createElement('button'); next.className='btn ghost'; next.textContent='▶'; const reset=document.createElement('button'); reset.className='btn ghost'; reset.textContent='Réinitialiser'; reset.style.marginLeft='8px'; const title=document.createElement('div'); title.className='cal-title'; const right=document.createElement('div'); right.style.display='flex'; right.style.alignItems='center'; right.appendChild(next); right.appendChild(reset); header.appendChild(prev); header.appendChild(title); header.appendChild(right); const grid=document.createElement('div'); grid.className='cal-grid'; daysOfWeek.forEach(d=>{ const el=document.createElement('div'); el.className='cal-dow'; el.textContent=d; grid.appendChild(el); }); const first=new Date(monthDate.getFullYear(),monthDate.getMonth(),1); const start=new Date(first); const shift=(first.getDay()+6)%7; start.setDate(first.getDate()-shift); const today=new Date(); today.setHours(0,0,0,0); for(let i=0;i<42;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const cell=document.createElement('button'); cell.type='button'; cell.className='cal-day'; const inMonth=d.getMonth()===monthDate.getMonth(); if(!inMonth) cell.classList.add('muted'); if(d.getTime()===today.getTime()) cell.classList.add('today'); const ds=fmtLocal(d); cell.textContent=String(d.getDate()); const blocked=isBlockedDateStr(ds); if(blocked || d<today){ cell.classList.add('blocked'); cell.disabled=true; } if(nextBlock && inMonth && ds===fmtLocal(nextBlock)) cell.classList.add('next-block'); if(selected.has(ds)) cell.classList.add('selected'); cell.addEventListener('click',()=>{ if(!rangeAnchor){ rangeAnchor=ds; selected.clear(); selected.add(ds); } else if(rangeAnchor===ds){ rangeAnchor=''; selected.clear(); } else { const a=new Date(rangeAnchor+'T00:00:00'); const b=new Date(ds+'T00:00:00'); const from=a<b?a:b; const to=a<b?b:a; selected.clear(); const cur=new Date(from); while(cur<=to){ selected.add(fmtLocal(cur)); cur.setDate(cur.getDate()+1); } } render(monthDate); go.style.display = selected.size? 'inline-flex' : 'none'; updateEstimate(selected.size); }); grid.appendChild(cell); } const months=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']; title.textContent=months[monthDate.getMonth()]+' '+monthDate.getFullYear(); prev.addEventListener('click',()=>{ monthDate.setMonth(monthDate.getMonth()-1); render(monthDate); }); next.addEventListener('click',()=>{ monthDate.setMonth(monthDate.getMonth()+1); render(monthDate); }); reset.addEventListener('click',()=>{ rangeAnchor=''; selected.clear(); render(monthDate); }); wrap.appendChild(header); wrap.appendChild(grid); return wrap; }
      function render(md){ calMount.innerHTML=''; calMount.appendChild(buildCalendar(new Date(md))); calMount.appendChild(go); }
      const md=new Date(); md.setDate(1); render(md);
    }
    // JSON-LD Product (SEO)
    try{
      const ld = {"@context":"https://schema.org","@type":"Product","name":product.name,"image":[product.image].filter(Boolean),"description":product.description||'',"sku":product.slug||'',"offers":{"@type":"Offer","priceCurrency":"EUR","price":String((product.price_eur_day||'').toString().match(/\d+(?:[\.,]\d+)?/)||''),"availability":"https://schema.org/InStock"}};
      const s=document.createElement('script'); s.type='application/ld+json'; s.textContent=JSON.stringify(ld); document.head.appendChild(s);
    }catch(_){}
  } catch(err){ console.error('product.js Error:', err); if(nameEl) nameEl.textContent = 'Erreur de chargement'; }
})();
