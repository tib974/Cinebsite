/* image-optimizer.js - Optimisation des images et lazy loading */
(function() {
  'use strict';
  const config = { lazyClass: 'lazy-image', loadedClass: 'lazy-loaded', errorClass: 'lazy-error', placeholderColor: '#f0f0f0', intersectionRootMargin: '50px' };
  function createPlaceholder(width = 300, height = 200, text = '') {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${config.placeholderColor}"/>
        <text x="50%" y="50%" font-family="system-ui" font-size="14" fill="#999" text-anchor="middle" dy="0.3em">${text || 'Loading...'}</text>
      </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  const imageObserver = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { const img = entry.target; loadImage(img); observer.unobserve(img); } }); }, { rootMargin: config.intersectionRootMargin });
  function loadImage(img, attempt = 1) { const src = img.dataset.src; if (!src) return; const newImg = new Image(); newImg.onload = function() { img.style.transition = 'opacity 0.3s ease'; img.style.opacity = '0'; setTimeout(() => { img.src = src; img.classList.add(config.loadedClass); img.classList.remove(config.lazyClass); img.style.opacity = '1'; delete img.dataset.src; }, 50); }; newImg.onerror = function() { if (attempt < 3) { setTimeout(() => loadImage(img, attempt + 1), 1000 * attempt); } else { img.classList.add(config.errorClass); img.src = createPlaceholder(img.offsetWidth || 300, img.offsetHeight || 200, 'Image unavailable'); } }; newImg.src = src; }
  function initLazyLoading() { const images = document.querySelectorAll(`img[data-src]:not(.${config.loadedClass})`); images.forEach(img => { img.classList.add(config.lazyClass); if (!img.src || img.src === '') { const width = img.offsetWidth || img.getAttribute('width') || 300; const height = img.offsetHeight || img.getAttribute('height') || 200; img.src = createPlaceholder(width, height); } imageObserver.observe(img); }); }
  function preloadCriticalImages() { const criticalImages = document.querySelectorAll('img[data-critical="true"]'); criticalImages.forEach(img => { if (img.dataset.src) { loadImage(img); } }); }
  function optimizeExistingImages() { const images = document.querySelectorAll('img:not([data-src])'); images.forEach(img => { if (!img.hasAttribute('data-critical')) { img.loading = 'lazy'; } img.decoding = 'async'; }); }

  // Load manifest of precomputed best variants (built by scripts/build-image-manifest.sh)
  let IMAGE_MANIFEST = null; let manifestLoaded = false;
  async function loadManifest(){
    if (manifestLoaded) return IMAGE_MANIFEST;
    manifestLoaded = true;
    try {
      const c = new AbortController(); const to=setTimeout(()=>c.abort(), 2000);
      const res = await fetch('data/image_manifest.json', {cache:'no-cache', signal:c.signal});
      clearTimeout(to);
      if (res.ok) { IMAGE_MANIFEST = await res.json(); }
    } catch(_) { IMAGE_MANIFEST = null; }
    return IMAGE_MANIFEST;
  }

  // Prefer best available variant for a given base image path
  // Order tried: -nobg.avif, -nobg.webp, -nobg.png, .avif, .webp, original
  function setBestImage(img, originalPath) {
    if (!originalPath || !img) return;
    try{ img.loading = img.loading || 'lazy'; img.decoding = 'async'; }catch(_){ }
    // Use manifest when available to avoid 404 chains
    if (IMAGE_MANIFEST && IMAGE_MANIFEST[originalPath]) {
      img.src = IMAGE_MANIFEST[originalPath];
      img.onerror = null; return;
    }
    // Lazy load manifest in background (first time)
    if (!manifestLoaded) { loadManifest().then(()=>{ if(IMAGE_MANIFEST && IMAGE_MANIFEST[originalPath]) { img.src = IMAGE_MANIFEST[originalPath]; } }).catch(()=>{}); }
    // Fallback chain if manifest not ready
    const m = String(originalPath).match(/^(.*)\.([a-z0-9]+)$/i);
    const base = m ? m[1] : originalPath;
    const fallbacks = [ base+'-nobg.avif', base+'-nobg.webp', base+'-nobg.png', base+'.avif', base+'.webp', originalPath ];
    let i = 0; const tryNext = () => { if (i >= fallbacks.length) { img.onerror = null; return; } const url = fallbacks[i++]; img.onerror = tryNext; img.src = url; };
    tryNext();
  }
  function getImageStats() { const total = document.querySelectorAll('img').length; const lazy = document.querySelectorAll(`.${config.lazyClass}`).length; const loaded = document.querySelectorAll(`.${config.loadedClass}`).length; const errors = document.querySelectorAll(`.${config.errorClass}`).length; return { total, lazy, loaded, errors, loadedPercent: total > 0 ? Math.round((loaded / total) * 100) : 0 }; }
  function buildResponsive(img, originalPath, sizes){
    if(!originalPath||!img) return;
    if(!IMAGE_MANIFEST){ loadManifest().then(()=>buildResponsive(img, originalPath, sizes)).catch(()=>{}); return; }
    const entry = IMAGE_MANIFEST[originalPath];
    if(!entry){ setBestImage(img, originalPath); return; }
    const sizesStr = sizes || '(max-width: 600px) 50vw, 300px';
    const im = entry.sizes||{}; const av=im.avif||''; const wp=im.webp||'';
    if(av){ img.srcset = av; img.sizes = sizesStr; img.src = entry.best || originalPath; return; }
    if(wp){ img.srcset = wp; img.sizes = sizesStr; img.src = entry.best || originalPath; return; }
    setBestImage(img, originalPath);
  }
  function createResponsivePicture(originalPath, alt, sizes){
    const pic = document.createElement('picture');
    const entry = IMAGE_MANIFEST && IMAGE_MANIFEST[originalPath];
    const im = entry && entry.sizes || {};
    if(im.avif){ const s=document.createElement('source'); s.type='image/avif'; s.srcset=im.avif; if(sizes) s.sizes=sizes; pic.appendChild(s); }
    if(im.webp){ const s=document.createElement('source'); s.type='image/webp'; s.srcset=im.webp; if(sizes) s.sizes=sizes; pic.appendChild(s); }
    const img = document.createElement('img'); img.alt = alt||''; img.loading='lazy'; img.decoding='async'; img.src = (entry && entry.best) || originalPath; pic.appendChild(img); return pic;
  }
  function injectResponsive(container, originalPath, alt, sizes){ const p=createResponsivePicture(originalPath, alt, sizes); container.appendChild(p); return p; }
  window.CINEB_IMAGES = { init: initLazyLoading, preloadCritical: preloadCriticalImages, optimize: optimizeExistingImages, stats: getImageStats, createPlaceholder: createPlaceholder, setBestImage: setBestImage, buildResponsive: buildResponsive, createResponsivePicture: createResponsivePicture, injectResponsive: injectResponsive };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { optimizeExistingImages(); preloadCriticalImages(); initLazyLoading(); }); }
  else { optimizeExistingImages(); preloadCriticalImages(); initLazyLoading(); }
})();
