// seo.js — normalize canonical + og:url (runtime fallback)
(function(){
  function origin(){ try{ return (window.CINEB_CONFIG && CINEB_CONFIG.SITE_ORIGIN) ? CINEB_CONFIG.SITE_ORIGIN.replace(/\/$/,'') : location.origin; }catch(_){ return location.origin; } }
  function abs(url){ try{ if(!url) return ''; const u = new URL(url, origin()); return u.href; }catch(_){ return url; } }
  function ensureCanonical(){
    let link = document.querySelector('link[rel="canonical"]');
    const href = origin() + location.pathname + (location.search||'');
    if(!link){ link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = href;
  }
  function ensureOG(){
    let og = document.querySelector('meta[property="og:url"]');
    const href = origin() + location.pathname + (location.search||'');
    if(!og){ og = document.createElement('meta'); og.setAttribute('property','og:url'); document.head.appendChild(og); }
    og.setAttribute('content', href);
    const img = document.querySelector('meta[property="og:image"]');
    if(img){ img.setAttribute('content', abs(img.getAttribute('content'))); }
    if(!document.querySelector('meta[name="twitter:card"]')){
      const tc=document.createElement('meta'); tc.name='twitter:card'; tc.content='summary_large_image'; document.head.appendChild(tc);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ ensureCanonical(); ensureOG(); }); else { ensureCanonical(); ensureOG(); }
})();
