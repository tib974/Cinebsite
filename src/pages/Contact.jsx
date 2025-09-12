export default function Contact() {
  return (
    <>
      <h1 className="section-title">Contact / Demande de devis</h1>
      <div className="card" style={{ padding: '16px', maxWidth: '720px' }}>
        <form id="contactForm" action="https://formtester.goodbytes.be/post.php" method="POST">
          <input type="text" name="website" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input name="name" placeholder="Nom" required />
            <input name="email" type="email" placeholder="Email" required />
          </div>
          <input name="phone" placeholder="Téléphone (optionnel)" />
          <input name="items" placeholder="Matériel / Pack (ex: FX30 + 17–70)" />
          <input name="dates" placeholder="Dates souhaitées" />
          <input name="source" type="hidden" value="site-web-react" />
          <textarea name="message" rows={4} placeholder="Votre message…"></textarea>
          <button className="btn" type="submit">Envoyer la demande</button>
        </form>
      </div>
    </>
  );
}