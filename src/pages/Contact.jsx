import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogBySlug } from '../data/index.js';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const presetItem = useMemo(() => {
    const queryItem = (searchParams.get('items') || '').trim();
    if (!queryItem) return '';
    const product = catalogBySlug.get(queryItem.toLowerCase());
    return product?.name ?? queryItem;
  }, [searchParams]);
  const presetDates = useMemo(() => (searchParams.get('dates') || '').trim(), [searchParams]);

  return (
    <section style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'minmax(280px, 1fr) 1fr' }}>
      <div className="card" style={{ padding: '20px' }}>
        <h1 className="section-title" style={{ marginTop: 0 }}>Contact / Devis</h1>
        <p className="muted">
          Partagez-nous votre projet : dates souhaitées, matériel envisagé, contraintes de tournage. Réponse rapide et devis
          personnalisé dans la journée.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px', display: 'grid', gap: '12px' }}>
          <li>
            <strong>Email :</strong>{' '}
            <a href="mailto:grondin.thibaut@gmail.com">grondin.thibaut@gmail.com</a>
          </li>
          <li>
            <strong>Localisation :</strong> Basé à La Réunion, déplacements possibles partout sur l’île.
          </li>
          <li>
            <strong>Disponibilités :</strong> Consultez le <a href="/calendrier">calendrier</a> pour bloquer un créneau.
          </li>
        </ul>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <form id="contactForm" action="https://formtester.goodbytes.be/post.php" method="POST" style={{ display: 'grid', gap: '12px' }}>
          <input type="text" name="website" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
            <input name="name" placeholder="Nom" required autoComplete="name" />
            <input name="email" type="email" placeholder="Email" required autoComplete="email" />
          </div>
          <input name="phone" placeholder="Téléphone (optionnel)" autoComplete="tel" />
          <input name="items" placeholder="Matériel / Pack souhaité" defaultValue={presetItem} />
          <input name="dates" placeholder="Dates ou période" defaultValue={presetDates} />
          <input name="source" type="hidden" value="site-web-react" />
          <textarea name="message" rows={4} placeholder="Votre message…" />
          <button className="btn" type="submit">Envoyer la demande</button>
        </form>
      </div>
    </section>
  );
}
