import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import sanityClient from '../sanityClient.js';
import { useQuote } from '../context/QuoteContext.jsx';

function QuoteSummary({ items, onClear }) {
  if (items.length === 0) return null;

  return (
    <div className="card" style={{ padding: '20px', background: 'var(--panel-translucent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Votre sélection</h2>
        <button onClick={onClear} className="btn ghost" style={{ fontSize: '0.8rem' }}>Vider</button>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
        {items.map(item => (
          <li key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{item.name}</span>
            <span className="muted">{item.pricePerDay}€/j</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Contact() {
  const [searchParams] = useSearchParams();
  const { quoteItems, clearQuote } = useQuote();
  const [presetItem, setPresetItem] = useState('');

  const itemsForForm = useMemo(() => {
    if (quoteItems.length > 0) {
      return quoteItems.map(item => item.name).join(', ');
    }
    return presetItem;
  }, [quoteItems, presetItem]);

  useEffect(() => {
    const queryItem = (searchParams.get('items') || '').trim();
    if (!queryItem || quoteItems.length > 0) return;

    const fetchProduct = async () => {
      try {
        const query = `*[_type == "product" && slug.current == $slug][0]`;
        const product = await sanityClient.fetch(query, { slug: queryItem.toLowerCase() });
        setPresetItem(product?.name || queryItem);
      } catch (error) {
        console.error("Erreur lors de la récupération du produit pour le contact :", error);
        setPresetItem(queryItem);
      }
    };

    fetchProduct();
  }, [searchParams, quoteItems]);

  const presetDates = useMemo(() => (searchParams.get('dates') || '').trim(), [searchParams]);

  return (
    <section style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'minmax(280px, 1fr) 1fr' }}>
      <div style={{ display: 'grid', gap: '24px', alignContent: 'start' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h1 className="section-title" style={{ marginTop: 0 }}>Contact / Devis</h1>
          <p className="muted">
            Partagez-nous votre projet : dates souhaitées, matériel envisagé, contraintes de tournage. Réponse rapide et devis
            personnalisé dans la journée.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px', display: 'grid', gap: '12px' }}>
            <li><strong>Email :</strong> <a href="mailto:grondin.thibaut@gmail.com">grondin.thibaut@gmail.com</a></li>
            <li><strong>Localisation :</strong> Basé à La Réunion, déplacements possibles.</li>
          </ul>
        </div>
        <QuoteSummary items={quoteItems} onClear={clearQuote} />
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <form id="contactForm" action="https://formspree.io/f/your_form_id" method="POST" style={{ display: 'grid', gap: '12px' }}>
          <input type="text" name="website" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
            <input name="name" placeholder="Nom" required autoComplete="name" />
            <input name="email" type="email" placeholder="Email" required autoComplete="email" />
          </div>
          <input name="phone" placeholder="Téléphone (optionnel)" autoComplete="tel" />
          <input name="items" placeholder="Matériel / Pack souhaité" value={itemsForForm} readOnly={quoteItems.length > 0} />
          <input name="dates" placeholder="Dates ou période" defaultValue={presetDates} />
          <input name="source" type="hidden" value="site-web-react" />
          <textarea name="message" rows={4} placeholder="Votre message…" required />
          <button className="btn" type="submit">Envoyer la demande</button>
        </form>
      </div>
    </section>
  );
}
