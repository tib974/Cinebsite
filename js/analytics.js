(() => {
  try{
    const path = location.pathname + location.search;
    const ref = document.referrer || '';
    const fd = new URLSearchParams();
    fd.set('path', path);
    fd.set('ref', ref);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('api/track.php', fd);
    } else {
      fetch('api/track.php', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:String(fd)}).catch(()=>{});
    }
  }catch(_){ }
})();

