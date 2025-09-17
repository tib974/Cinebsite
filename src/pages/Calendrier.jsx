import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import { catalogBySlug } from '../data/index.js';
import 'react-calendar/dist/Calendar.css';

function formatDate(date) {
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Calendrier() {
  const [searchParams] = useSearchParams();
  const preselectedSlug = (searchParams.get('produit') || '').toLowerCase();
  const product = catalogBySlug.get(preselectedSlug) || null;
  const [date, setDate] = useState(new Date());
  const [formData, setFormData] = useState({ nom: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const summary = useMemo(() => {
    if (!product) return null;
    return {
      name: product.name,
      price: product.pricePerDay,
      url: `/produit/${product.slug}`,
    };
  }, [product]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    setStatus(`Demande enregistrée pour le ${formatDate(date)}. Nous revenons vers vous rapidement.`);
    console.info('Calendrier — envoi simulé', { date: date.toISOString(), ...formData, produit: product?.slug });
    setFormData({ nom: '', email: '', message: '' });
  };

  return (
    <section>
      <header style={{ marginBottom: '18px' }}>
        <h1 className="section-title">Réserver un créneau</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Sélectionnez une date indicative pour votre location ou demande d’assistance. Nous confirmons ensuite par email en
          fonction des disponibilités réelles.
        </p>
      </header>

      <div className="grid cal-layout" style={{ gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <Calendar onChange={setDate} value={date} locale="fr-FR" />
        </div>
        <div className="card" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Demande rapide</h2>
            <p className="muted" style={{ margin: 0 }}>Date sélectionnée : <strong>{formatDate(date)}</strong></p>
          </div>
          <form id="slotForm" onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '12px' }}>
            <input name="nom" placeholder="Nom" value={formData.nom} onChange={handleFormChange} required />
            <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleFormChange} required />
            <textarea
              name="message"
              rows={3}
              placeholder="Précisions (matériel, horaires, lieu…)"
              value={formData.message}
              onChange={handleFormChange}
            />
            <button type="submit" className="btn">
              Pré-réserver cette date
            </button>
          </form>
          {status && <div className="muted" style={{ color: '#9ae6b4' }}>{status}</div>}
        </div>
      </div>

      {summary && (
        <div className="card" style={{ padding: '18px', marginTop: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800 }}>Produit associé à votre demande</div>
            <div className="muted">{summary.name}</div>
            {summary.price !== null && <div className="muted" style={{ marginTop: '6px' }}>~ {summary.price}€ / jour</div>}
          </div>
          <Link className="btn ghost" to={summary.url}>
            Voir la fiche produit
          </Link>
          <Link className="btn" to={`/contact?items=${product.slug}`}>Finaliser la demande</Link>
        </div>
      )}
    </section>
  );
}
