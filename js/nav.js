
// nav.js v5 — burger robuste + close-on-click + aria + fallback button if missing
(function(){
  function ready(fn){
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fn);} else {fn();}
  }
  ready(function(){
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-center a').forEach(a=>{
      if(a.getAttribute('href')===path){ a.classList.add('active'); a.setAttribute('aria-current','page'); }
    });

    let btn = document.querySelector('.nav-toggle') || document.getElementById('navToggle');
    const nav = document.querySelector('.nav-center');
    const header = document.querySelector('.header .container') || document.querySelector('.header');
    if(!btn && header){
      btn = document.createElement('button');
      btn.className = 'btn ghost nav-toggle';
      btn.type = 'button';
      btn.textContent = 'Menu';
      header.insertBefore(btn, header.children[1]||null);
    }
    if(!btn || !nav) return;

    function recalcHeader(){ try{ const h=(document.querySelector('.header')||{}).getBoundingClientRect?.().height||60; document.documentElement.style.setProperty('--header-real', h+'px'); }catch(_){ document.documentElement.style.setProperty('--header-real','60px'); } }
    window.addEventListener('resize', recalcHeader, {passive:true});
    window.addEventListener('orientationchange', recalcHeader);
    recalcHeader();

    const setOpen = (open)=>{
      if(open){ recalcHeader(); }
      nav.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', open?'true':'false');
    };
    const toggle = ()=> setOpen(!nav.classList.contains('open'));

    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); }});
    btn.addEventListener('touchstart', e=>{ e.preventDefault(); toggle(); }, {passive:false});

    nav.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> setOpen(false)));
    document.addEventListener('click', e=>{
      if(!nav.classList.contains('open')) return;
      if(e.target.closest('.nav-center') || e.target.closest('.nav-toggle')) return;
      setOpen(false);
    });
    window.__cineb_nav = {open:()=>setOpen(true),close:()=>setOpen(false),toggle};
    // Lazy-load layout engine (applies per-page JSON + editor)
    const s=document.createElement('script'); s.src='js/layout.js'; s.defer=true; document.head.appendChild(s);
  });
  // Register Service Worker for PWA/offline
  ready(function(){
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(()=>{});
    }
  });
  // Cart counter in header
  ready(function(){
    function getCount(){ try{ return (JSON.parse(localStorage.getItem('cineb_cart')||'[]')||[]).length }catch(_){ return 0 } }
    const link = document.querySelector('.nav-cta a[title="Voir ma sélection"]');
    if(!link) return;
    const badge = document.createElement('span');
    badge.style.cssText='margin-left:6px;background:#fff;color:#000;border-radius:999px;padding:2px 6px;font-weight:800;font-size:12px';
    function render(){ const n=getCount(); badge.textContent=String(n); badge.style.display = n? 'inline-block':'none'; }
    render();
    link.appendChild(badge);
    window.addEventListener('storage', (e)=>{ if(e.key==='cineb_cart') render(); });
  });
})();
