import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import sanityClient from '../sanityClient.js';
import { useQuote } from '../context/QuoteContext.jsx';

// --- Logique de calcul de prix ---
function getProgressiveDiscount(duration) {
  if (duration >= 7) return 0.60; // 40% de réduction
  if (duration >= 5) return 0.70; // 30% de réduction
  if (duration >= 3) return 0.85; // 15% de réduction
  return 1; // Plein tarif
}

function calculatePrice(dailyPrice, duration) {
  if (!dailyPrice) return 0;
  const discount = getProgressiveDiscount(duration);
  return dailyPrice * duration * discount;
}
// --------------------------------

function calculateDuration(start, end) {
  if (!start || !end) return 1;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (endDate < startDate) return 1;
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  return Math.round(duration) + 1;
}

function QuoteSummary({ items, onClear }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const duration = useMemo(() => calculateDuration(startDate, endDate), [startDate, endDate]);
  const totalPrice = useMemo(() => {
    if (items.length === 0) return 0;
    const totalPerDay = items.reduce((sum, item) => sum + (item.pricePerDay || 0), 0);
    return calculatePrice(totalPerDay, duration);
  }, [items, duration]);

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
      <div style={{ borderTop: '1px solid var(--line)', marginTop: '16px', paddingTop: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Estimer le coût total</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
          <label htmlFor="start-date" style={{fontSize: '0.8rem'}}>Début</label>
          <label htmlFor="end-date" style={{fontSize: '0.8rem'}}>Fin</label>
          <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{padding: '8px'}}/>
          <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{padding: '8px'}}/>
        </div>
        {totalPrice > 0 && (
          <div style={{marginTop: '16px', textAlign: 'right'}}>
            <span className="muted">{duration} jour{duration > 1 ? 's' : ''} : </span>
            <strong style={{fontSize: '1.2rem', color: 'var(--primary)'}}>{totalPrice.toFixed(2)}€</strong>
          </div>
        )}
      </div>
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
        <form id="contactForm" action="https://formspree.io/f/xandgvea" method="POST" style={{ display: 'grid', gap: '12px' }}>
          <input type="text" name="website" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
            <input name="name" placeholder="Nom" required autoComplete="name" />
            <input name="email" type="email" placeholder="Email" required autoComplete="email" />
          </div>
          <input name="phone" type="tel" placeholder="Téléphone (optionnel)" autoComplete="tel" />
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
