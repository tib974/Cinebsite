import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import sanityClient from '../sanityClient.js';
import 'react-calendar/dist/Calendar.css';

function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function calculateDuration(range) {
  if (!Array.isArray(range) || !range[0] || !range[1]) return 1;
  const [start, end] = range;
  const duration = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
  return Math.round(duration) + 1;
}

export default function Calendrier() {
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [dateRange, setDateRange] = useState([new Date(), new Date()]);
  const [formData, setFormData] = useState({ nom: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const preselectedSlug = (searchParams.get('produit') || '').toLowerCase();
    if (!preselectedSlug) return;

    const fetchProduct = async () => {
      try {
        const query = `*[_type == "product" && slug.current == $slug][0]`;
        const result = await sanityClient.fetch(query, { slug: preselectedSlug });
        setProduct(result);
      } catch (error) {
        console.error("Erreur lors de la récupération du produit pour le calendrier :", error);
      }
    };

    fetchProduct();
  }, [searchParams]);

  const summary = useMemo(() => {
    if (!product) return null;
    const duration = calculateDuration(dateRange);
    const totalPrice = product.pricePerDay ? product.pricePerDay * duration : null;
    return {
      name: product.name,
      price: product.pricePerDay,
      duration,
      totalPrice,
      url: `/produit/${product.slug?.current}`,
    };
  }, [product, dateRange]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const message = `Demande pour ${summary?.name || 'un produit'} du ${formatDate(dateRange[0])} au ${formatDate(dateRange[1])} (${summary?.duration || 1} jours).`;
    setStatus(`Demande enregistrée. Nous revenons vers vous rapidement.`);
    console.info('Calendrier — envoi simulé', { dateRange, ...formData, produit: product?.slug?.current, message });
    setFormData({ nom: '', email: '', message });
  };

  return (
    <section>
      <header style={{ marginBottom: '18px' }}>
        <h1 className="section-title">Réserver un créneau</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Sélectionnez une date de début et de fin pour votre location. Nous confirmons ensuite par email en
          fonction des disponibilités réelles.
        </p>
      </header>

      <div className="grid cal-layout" style={{ gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <Calendar onChange={setDateRange} value={dateRange} selectRange={true} locale="fr-FR" />
        </div>
        <div className="card" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Demande rapide</h2>
            <p className="muted" style={{ margin: 0 }}>Du <strong>{formatDate(dateRange[0])}</strong> au <strong>{formatDate(dateRange[1])}</strong></p>
            {summary?.totalPrice && <p style={{ margin: '8px 0 0 0' }}>Estimation : <strong>{summary.totalPrice}€</strong> ({summary.duration} jours)</p>}
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
              Pré-réserver cette période
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
          </div>
          <Link className="btn ghost" to={summary.url}>
            Voir la fiche produit
          </Link>
          <Link className="btn" to={`/contact?items=${product.slug?.current}&dates=${formatDate(dateRange[0])} - ${formatDate(dateRange[1])}`}>
            Finaliser la demande de devis
          </Link>
        </div>
      )}
    </section>
  );
}
