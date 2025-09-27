import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { reportError } from '../utils/errorReporter.js';
import { fetchProductOrPackBySlug } from '../utils/apiClient.js';
import 'react-calendar/dist/Calendar.css';

const Calendar = lazy(() => import('react-calendar'));

// --- Logique de calcul de prix ---
function getProgressiveDiscount(duration) {
  if (duration >= 7) return 0.60; // 40% de réduction
  if (duration >= 5) return 0.70; // 30% de réduction
  if (duration >= 3) return 0.85; // 15% de réduction
  return 1; // Plein tarif
}

function calculatePrice(dailyPrice, duration) {
  if (!dailyPrice) return null;
  const discount = getProgressiveDiscount(duration);
  return dailyPrice * duration * discount;
}
// --------------------------------

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
  const [hasError, setHasError] = useState(false);
  const [formStatus, setFormStatus] = useState({ state: 'idle', message: '' });
  const formStartRef = useRef(Date.now());

  useEffect(() => {
    const preselectedSlug = (searchParams.get('produit') || '').toLowerCase();
    if (!preselectedSlug) return;

    const fetchProduct = async () => {
      try {
        const result = await fetchProductOrPackBySlug(preselectedSlug);
        if (result && result.type === 'product') {
          setProduct(result);
          setHasError(false);
        } else {
          setProduct(null);
          setHasError(true);
        }
      } catch (error) {
        reportError(error, { feature: 'calendar-preselect', slug: preselectedSlug });
        setProduct(null);
        setHasError(true);
      }
    };

    fetchProduct();
  }, [searchParams]);

  const summary = useMemo(() => {
    const duration = calculateDuration(dateRange);
    const totalPrice = product ? calculatePrice(product.dailyPrice, duration) : null;
    return {
      name: product?.name,
      price: product?.dailyPrice,
      duration,
      totalPrice,
      url: product ? `/produit/${product.slug}` : null,
    };
  }, [product, dateRange]);

  const prefilledMessage = `Bonjour,\n\nJe serais intéressé(e) pour louer ${product ? `le produit suivant : ${product.name}` : 'du matériel'} pour la période du ${formatDate(dateRange[0])} au ${formatDate(dateRange[1])} (${summary.duration} jours).\n\nPourriez-vous me confirmer la disponibilité ?\n\nCordialement.`;

  const contactDatesParam = useMemo(() => {
    if (!Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) return '';
    const startIso = dateRange[0].toISOString().slice(0, 10);
    const endIso = dateRange[1].toISOString().slice(0, 10);
    return `${startIso}_${endIso}`;
  }, [dateRange]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const elapsed = Date.now() - formStartRef.current;
    if (elapsed < 3000) {
      setFormStatus({ state: 'error', message: 'Merci de patienter quelques secondes avant d’envoyer la demande.' });
      return;
    }

    setFormStatus({ state: 'loading', message: '' });

    const form = event.target;
    const formData = new FormData(form);
    formData.append('requestedRange', `${formatDate(dateRange[0])} → ${formatDate(dateRange[1])}`);
    formData.append('submittedAt', new Date().toISOString());

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Formspree a répondu ${response.status}`);
      }

      setFormStatus({ state: 'success', message: 'Merci ! Votre demande a été envoyée. Nous confirmons la disponibilité au plus vite.' });
      form.reset();
      formStartRef.current = Date.now();
    } catch (error) {
      reportError(error, { feature: 'calendar-form-submit', slug: product?.slug });
      setFormStatus({ state: 'error', message: 'Impossible d’envoyer la demande pour le moment. Écrivez-nous à grondin.thibaut@gmail.com.' });
    }
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
          <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', width: '100%' }}>Chargement du calendrier…</div>}>
            <Calendar onChange={setDateRange} value={dateRange} selectRange locale="fr-FR" />
          </Suspense>
        </div>
        <div className="card" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Demande rapide</h2>
            <p className="muted" style={{ margin: 0 }}>Du <strong>{formatDate(dateRange[0])}</strong> au <strong>{formatDate(dateRange[1])}</strong></p>
            {summary.totalPrice !== null && <p style={{ margin: '8px 0 0 0' }}>Estimation : <strong style={{color: 'var(--primary)'}}>{summary.totalPrice.toFixed(2)}€</strong> ({summary.duration} jours)</p>}
          </div>
          {hasError && (
            <p className="muted" style={{ margin: 0 }}>
              Le produit associé n'a pas pu être chargé automatiquement. Vous pouvez tout de même envoyer une demande en
              précisant le matériel souhaité.
            </p>
          )}

          <form
            id="slotForm"
            action="https://formspree.io/f/xandgvea"
            method="POST"
            onSubmit={handleSubmit}
            style={{ display: 'grid', gap: '12px' }}
          >
            <input type="text" name="website" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
            <input type="hidden" name="_subject" value={`CinéB - Demande de pré-réservation pour ${summary.name || 'matériel'}`} />
            <input type="hidden" name="source" value="site-web-react-calendrier" />
            <input type="hidden" name="formLoadedAt" value={formStartRef.current} />

            <input name="nom" placeholder="Nom" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="telephone" type="tel" placeholder="Téléphone (facultatif)" inputMode="tel" autoComplete="tel" />
            <textarea
              name="message"
              rows={5}
              placeholder="Précisions (matériel, horaires, lieu…)"
              defaultValue={prefilledMessage}
            />
            <button type="submit" className="btn" disabled={formStatus.state === 'loading'}>
              {formStatus.state === 'loading' ? 'Envoi…' : 'Envoyer la demande'}
            </button>
            {formStatus.message && (
              <p style={{ margin: 0, color: formStatus.state === 'error' ? '#ff6b6b' : undefined }} aria-live="polite">
                {formStatus.message}
              </p>
            )}
          </form>
        </div>
      </div>

      {summary.name && (
        <div className="card" style={{ padding: '18px', marginTop: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800 }}>Produit associé à votre demande</div>
            <div className="muted">{summary.name}</div>
          </div>
          <Link className="btn ghost" to={summary.url}>
            Voir la fiche produit
          </Link>
          <Link className="btn" to={`/contact?items=${encodeURIComponent(product.slug)}&dates=${contactDatesParam}`}>
            Finaliser la demande de devis
          </Link>
        </div>
      )}
    </section>
  );
}
