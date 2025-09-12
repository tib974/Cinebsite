// calendar.js — Réserver (UX + anti-CORS) — aligné sur la config V2
const CAL_CACHE_KEY = 'cineb_cache_calendar';
const CAL_TTL_MS = 120000;
function now(){ return Date.now(); }
function getCache(){ try{ const raw=localStorage.getItem(CAL_CACHE_KEY); if(!raw) return null; const obj=JSON.parse(raw); if(obj.expireAt<now()) return null; return obj.data; }catch(_){ return null; } }
function setCache(data){ try{ localStorage.setItem(CAL_CACHE_KEY, JSON.stringify({expireAt: now()+CAL_TTL_MS, data})); }catch(_){} }
function getParam(n){ return new URL(location.href).searchParams.get(n); }
function isDateBlocked(dateStr, ranges){ if(!dateStr) return false; const d=new Date(dateStr+'T00:00:00'); return ranges.some(r=>{ const a=new Date((r.date_from||r.date||'')+'T00:00:00'); const b=new Date((r.date_to||r.date||'')+'T00:00:00'); if(isNaN(a)||isNaN(b)) return false; return d>=a && d<=b; }); }
function fmtLocal(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
document.addEventListener('DOMContentLoaded', async ()=>{
  const { WEB_APP_URL, CALENDAR_API_URL } = window.CINEB_CONFIG || {};
  const CATALOG_API_URL = (window.CINEB_CONFIG||{}).CATALOG_API_URL;
  async function fetchCalendarLive(){ if(!CALENDAR_API_URL) return []; const prod=getParam('produit'); const url = prod ? `${CALENDAR_API_URL}?item=${encodeURIComponent(prod)}` : CALENDAR_API_URL; const res = await fetch(url, { cache:'no-cache' }); if(!res.ok) throw new Error('HTTP '+res.status); const j = await res.json(); if(j && (j.ok||j.data)) return j.data||j||[]; throw new Error(j.error||'bad'); }
  const form=document.getElementById('slotForm'); const status=document.getElementById('slotStatus'); if(!form) return; const btn=form.querySelector('button[type="submit"]');
  const calHints = document.getElementById('calHints');
  const calMount = document.getElementById('calendarWidget');
  const cartList = document.getElementById('cartList');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const selectedDates = new Set();
  const priceOut = document.getElementById('priceEstimateCalendar');
  const dateRangeInfo = document.getElementById('dateRangeInfo');
  let catalog = [];
  try{ if(CATALOG_API_URL){ catalog = await (await fetch(CATALOG_API_URL)).json().then(j=>j.data||j||[]); } }catch(_){ catalog=[]; }
  const bySlug = new Map(); catalog.forEach(it=>{ if(it && it.slug) bySlug.set(String(it.slug).toLowerCase(), it); });
  function parsePriceNum(v){ if(!v) return NaN; const m=String(v).replace(',', '.').match(/\d+(?:\.\d+)?/); return m?parseFloat(m[0]):NaN; }
  function discountFactor(days){ if(days>=7) return .8; if(days>=5) return .85; if(days>=3) return .9; return 1; }
  function updatePriceEstimate(){ const days = selectedDates.size || 1; const slugs = new Set(); const urlSlug = (getParam('produit')||'').toLowerCase(); if(urlSlug) slugs.add(urlSlug); try{ const cart = JSON.parse(localStorage.getItem('cineb_cart')||'[]'); cart.forEach(x=>{ if(x && x.slug) slugs.add(String(x.slug).toLowerCase()); }); }catch(_){ } let perDay = 0; slugs.forEach(s=>{ const it=bySlug.get(s); if(it){ const p=parsePriceNum(it.price_eur_day||it.price); if(isFinite(p)) perDay += p; } }); if(perDay<=0){ if(priceOut) priceOut.textContent=''; return; } const df=discountFactor(days); const total = Math.round(perDay*df*days); const per = Math.round(perDay*df); if(priceOut){ priceOut.textContent = days>1 ? `Estimation: ~${total}€ (≈ ${per}€/jour dégressif)` : `Estimation: ~${per}€/jour`; } const hiddenEst = form.querySelector('input[name="estimate"]'); if(hiddenEst){ hiddenEst.value = String(total); } }
  function setLoading(on,msg){ if(on){ btn.disabled=true; btn.classList.add('ghost'); if(msg) status.textContent=msg; } else { btn.disabled=false; btn.classList.remove('ghost'); if(msg) status.textContent=msg;} }
  setLoading(true,'Chargement des disponibilités…'); let ranges=getCache(); if(ranges){ setLoading(false,''); try{ const fresh=await fetchCalendarLive(); setCache(fresh); ranges=fresh; }catch(_){ } } else { try{ const fresh=await fetchCalendarLive(); setCache(fresh); ranges=fresh; }catch(e){ console.error(e); ranges=[]; } finally{ setLoading(false,''); } }
  // Hints: prochaines indisponibilités (max 5)
  try{
    if(calHints && Array.isArray(ranges)){
      const upcoming = ranges.map(r=>({from:new Date((r.date_from||r.date)+'T00:00:00'),to:new Date((r.date_to||r.date)+'T00:00:00')})).filter(r=>!isNaN(r.from)).sort((a,b)=>a.from-b.from).slice(0,5);
      if(upcoming.length){ calHints.textContent = 'Prochaines indisponibilités: '+ upcoming.map(r=> `${r.from.toISOString().slice(0,10)} → ${r.to.toISOString().slice(0,10)}`).join(' · '); }
      else { calHints.textContent = 'Sélectionnez un jour disponible.'; }
    }
  }catch(_){ }
  // date min = aujourd'hui
  const dateInput = form.querySelector('input[name="date"]'); if(dateInput){ const t=new Date(); const ds=t.toISOString().slice(0,10); dateInput.min = ds; const pdate=getParam('date'); if(pdate){ dateInput.value=pdate; } }

  // Calendar widget (month view)
let rangeAnchor = '';
function buildCalendar(monthDate, ranges){
    const daysOfWeek = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const wrap = document.createElement('div');
    wrap.className = 'cal-wrap';
    const header = document.createElement('div'); header.className='cal-header';
    const prev = document.createElement('button'); prev.className='btn ghost'; prev.textContent='◀';
    const next = document.createElement('button'); next.className='btn ghost'; next.textContent='▶';
    const reset = document.createElement('button'); reset.className='btn ghost'; reset.textContent='Réinitialiser'; reset.style.marginLeft='8px';
    const title = document.createElement('div'); title.className='cal-title';
    const right = document.createElement('div'); right.style.display='flex'; right.style.alignItems='center'; right.appendChild(next); right.appendChild(reset);
    header.appendChild(prev); header.appendChild(title); header.appendChild(right);
    const grid = document.createElement('div'); grid.className='cal-grid';
    daysOfWeek.forEach(d=>{ const el=document.createElement('div'); el.className='cal-dow'; el.textContent=d; grid.appendChild(el); });

    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const start = new Date(first); const shift = (first.getDay()+6)%7; // Monday=0
    start.setDate(first.getDate()-shift);
    // multi-selection support
    function isBlockedDate(d){ return isDateBlocked(d.toISOString().slice(0,10), ranges); }
    for(let i=0;i<42;i++){
      const d = new Date(start); d.setDate(start.getDate()+i);
      const cell = document.createElement('button'); cell.type='button'; cell.className='cal-day';
      const inMonth = d.getMonth()===monthDate.getMonth();
      if(!inMonth) cell.classList.add('muted');
      const today = new Date(); today.setHours(0,0,0,0); if(d.getTime()===today.getTime()) cell.classList.add('today');
      const ds = fmtLocal(d);
      cell.textContent = String(d.getDate());
      const blocked = isBlockedDate(d);
      if(blocked || d < today){ cell.classList.add('blocked'); cell.disabled = true; }
      if(selectedDates.has(ds)) cell.classList.add('selected');
cell.addEventListener('click', ()=>{
        // Enforce continuous range between anchor and clicked date
        if(!rangeAnchor){ rangeAnchor = ds; selectedDates.clear(); selectedDates.add(ds); }
        else if (rangeAnchor === ds){ rangeAnchor=''; selectedDates.clear(); }
        else {
          const a=new Date(rangeAnchor+'T00:00:00'); const b=new Date(ds+'T00:00:00'); const from=a<b?a:b; const to=a<b?b:a;
          selectedDates.clear(); const cur=new Date(from);
          while(cur<=to){ selectedDates.add(fmtLocal(cur)); cur.setDate(cur.getDate()+1); }
        }
        render(monthDate);
        const picks = Array.from(selectedDates).sort();
        const dateIn = form.querySelector('input[name="date"]');
        const dateTo = form.querySelector('input[name="date_to"]');
        if(dateIn){ dateIn.value = picks[0] || ''; }
        if(dateTo){ dateTo.value = picks.length>1 ? picks[picks.length-1] : ''; }
        if(dateInput){ if(selectedDates.size){ dateInput.removeAttribute('required'); } else { dateInput.setAttribute('required',''); } }
        const timeInput = form.querySelector('input[name="heure"]');
        if(timeInput){ if(selectedDates.size){ timeInput.removeAttribute('required'); } else { timeInput.setAttribute('required',''); } }
        if(dateRangeInfo){
          if(picks.length>1){ const a=new Date(picks[0]+'T00:00:00'); const b=new Date(picks[picks.length-1]+'T00:00:00'); const days=Math.round((b-a)/86400000)+1; dateRangeInfo.textContent = `Période: du ${picks[0]} au ${picks[picks.length-1]} (${days} jours)`; }
          else if(picks.length===1){ dateRangeInfo.textContent = `Jour choisi: ${picks[0]}`; }
          else { dateRangeInfo.textContent = ''; }
        }
        updatePriceEstimate();
      });
      grid.appendChild(cell);
    }
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    title.textContent = months[monthDate.getMonth()]+' '+monthDate.getFullYear();
    prev.addEventListener('click', ()=>{ monthDate.setMonth(monthDate.getMonth()-1); render(monthDate); });
    next.addEventListener('click', ()=>{ monthDate.setMonth(monthDate.getMonth()+1); render(monthDate); });
    reset.addEventListener('click', ()=>{ rangeAnchor=''; selectedDates.clear(); render(monthDate); const dateIn=form.querySelector('input[name="date"]'); const dateTo=form.querySelector('input[name="date_to"]'); if(dateIn) dateIn.value=''; if(dateTo) dateTo.value=''; if(dateRangeInfo) dateRangeInfo.textContent=''; updatePriceEstimate(); });
    wrap.appendChild(header); wrap.appendChild(grid);
    return wrap;
  }
  function render(monthDate){ if(!calMount) return; calMount.innerHTML=''; calMount.appendChild(buildCalendar(new Date(monthDate), ranges)); }
  if(calMount){ const md = new Date(); md.setDate(1); render(md); }
  // Prefill produits from URL and cart; render chips
  try{
    const prodSlug = getParam('produit')||''; const prodName = getParam('itemName')||'';
    const prodInput = form.querySelector('input[name="produits"]');
    const names = [];
    if(prodName) names.push(prodName);
    const cart = JSON.parse(localStorage.getItem('cineb_cart')||'[]');
    cart.forEach(x=>{ if(x && x.name) names.push(x.name); });
    const uniq = Array.from(new Set(names)); if(prodInput && uniq.length){ prodInput.value = uniq.join(', '); }
    if(cartList){ cartList.innerHTML=''; uniq.forEach(n=>{ const b=document.createElement('button'); b.type='button'; b.className='chip'; b.textContent=n+' ✕'; b.addEventListener('click', ()=>{ try{ let c=JSON.parse(localStorage.getItem('cineb_cart')||'[]'); c=c.filter(x=>x.name!==n); localStorage.setItem('cineb_cart', JSON.stringify(c)); b.remove(); const rest=uniq.filter(x=>x!==n); if(prodInput) prodInput.value = rest.join(', '); updatePriceEstimate(); }catch(_){ } }); cartList.appendChild(b); }); }
  }catch(_){ }
  // Preselect multiple dates from URL
  try{
    const dqs = (getParam('dates')||'').split(',').map(s=>s.trim()).filter(Boolean);
    dqs.forEach(ds=> selectedDates.add(ds));
    render((new Date()).setDate(1));
    updatePriceEstimate();
    // If consecutive range, show info
    if(dateRangeInfo && dqs.length){
      const arr = dqs.map(s=> new Date(s+'T00:00:00')).sort((a,b)=>a-b);
      const first = arr[0], last = arr[arr.length-1];
      if(first && last){ const fmt = (d)=> d.toISOString().slice(0,10); const days = Math.round((last-first)/86400000)+1; dateRangeInfo.textContent = days>1 ? `Période: du ${fmt(first)} au ${fmt(last)} (${days} jours)` : `Jour choisi: ${fmt(first)}`; }
      // Prefill date field with start
      const dateInput = form.querySelector('input[name="date"]'); if(dateInput){ dateInput.value = dqs[0]; }
    }
  }catch(_){ }
  // Clear cart button
  if(clearCartBtn){ clearCartBtn.addEventListener('click', ()=>{ try{ localStorage.removeItem('cineb_cart'); if(cartList) cartList.innerHTML=''; const prodInput=form.querySelector('input[name="produits"]'); if(prodInput) prodInput.value=''; updatePriceEstimate(); }catch(_){ } }); }
  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); status.textContent=''; const fd=new FormData(form); const date=fd.get('date'); const heure=fd.get('heure'); const picks=[...selectedDates].sort(); if(picks.length===0 && (!date||!heure)){ status.textContent='Merci de choisir au moins un jour (et une heure).'; return; } if(date && isDateBlocked(date, ranges)){ status.textContent='Cette date est indisponible. Choisissez un autre jour.'; return; }
    const params = new URLSearchParams(); params.set('name', fd.get('nom')||''); params.set('email', fd.get('email')||''); let itemsVal=(fd.get('produits')||'').trim(); try{ const cart=JSON.parse(localStorage.getItem('cineb_cart')||'[]'); const names=Array.from(new Set(cart.map(x=>x.name).filter(Boolean))); if(names.length){ itemsVal = itemsVal? (itemsVal+', '+names.join(', ')) : names.join(', '); } }catch(_){ } params.set('items', itemsVal); params.set('message', fd.get('message')||''); const finalDates = picks.length? picks.join(', ') : `${date} ${heure}`; params.set('dates', finalDates); params.set('source', 'calendar');
    try{ setLoading(true,'Envoi en cours…'); const res=await fetch(WEB_APP_URL, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' }, body: params.toString() }); const j = await res.json().catch(()=>({ok:true})); if(res.ok && (j.ok!==false)){ form.reset(); status.textContent='Demande envoyée. Nous confirmons votre créneau au plus vite.'; } else { throw new Error(j.error||'Réponse invalide'); } }
    catch(err){ console.error(err); status.textContent='Envoi impossible. Vérifiez votre connexion.'; }
    finally { setLoading(false); }
  });
});
