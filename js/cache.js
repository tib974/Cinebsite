/* cache.js - Système de cache global pour optimiser les performances */
window.CINEB_CACHE = {
  data: new Map(),
  timeouts: new Map(),
  TTL: { catalog: 5 * 60 * 1000, realisations: 10 * 60 * 1000, default: 2 * 60 * 1000 },
  set(key, data, ttl = null) { const now = Date.now(); const expiry = now + (ttl || this.TTL.default); this.data.set(key,{data,timestamp:now,expiry}); const timeoutId=setTimeout(()=>{this.data.delete(key);this.timeouts.delete(key);}, ttl||this.TTL.default); this.timeouts.set(key, timeoutId); },
  get(key) { const item=this.data.get(key); if(!item) return null; const now=Date.now(); if(now>item.expiry){ this.data.delete(key); const id=this.timeouts.get(key); if(id){clearTimeout(id); this.timeouts.delete(key);} return null;} return item.data; },
  has(key){ return this.get(key)!==null; },
  clear(key=null){ if(key){ this.data.delete(key); const id=this.timeouts.get(key); if(id){clearTimeout(id); this.timeouts.delete(key);} } else { this.data.clear(); this.timeouts.forEach(id=>clearTimeout(id)); this.timeouts.clear(); } },
  stats(){ const items=Array.from(this.data.entries()).map(([key,item])=>({key,age:Math.round((Date.now()-item.timestamp)/1000),expires_in:Math.round((item.expiry-Date.now())/1000)})); return {count:this.data.size, items};}
};

