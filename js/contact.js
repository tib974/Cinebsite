/* contact.js — envoi formulaire vers Apps Script (POST x-www-form-urlencoded) */
(function(){
  const form = document.querySelector('form#contactForm');
  const msg  = document.getElementById('contactMsg');
  if(!form) return;
  const { WEB_APP_URL } = window.CINEB_CONFIG || {};
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => { input.addEventListener('keydown', (e) => { if(e.key === 'Enter') { if(input.tagName.toLowerCase() === 'textarea') { if(e.ctrlKey || e.metaKey) { e.preventDefault(); isSubmittingViaButton = true; form.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true})); } return; } if(input.type !== 'submit') { e.preventDefault(); const formElements = Array.from(form.elements); const currentIndex = formElements.indexOf(input); const nextElement = formElements[currentIndex + 1]; if(nextElement && nextElement.type !== 'submit') { nextElement.focus(); } } } }); });
  let isSubmittingViaButton = false;
  const submitButton = form.querySelector('button[type="submit"]');
  if(submitButton) { submitButton.addEventListener('click', () => { isSubmittingViaButton = true; }); }
  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); if(!isSubmittingViaButton) return; isSubmittingViaButton = false; msg.textContent = 'Envoi en cours...';
    const fd = new URLSearchParams();
    ['name','email','phone','message','items','dates','source'].forEach(k=>{ const el=form.querySelector(`[name="${k}"]`); if(el) fd.set(k, el.value); });
    try{ const res = await fetch(WEB_APP_URL, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' }, body: fd.toString() }); if(!res.ok){ throw new Error('HTTP '+res.status); } const j = await res.json().catch(()=>({ok:true})); if(j && j.ok!==false){ msg.textContent = 'Merci ! Votre demande a bien été envoyée.'; form.reset(); } else { throw new Error(j.error||'Erreur inconnue'); } }
    catch(err){ console.error(err); msg.textContent = "Oups, envoi impossible. Vérifiez votre connexion et réessayez."; }
  });
})();
