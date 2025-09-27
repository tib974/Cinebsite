import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useQuote } from '../hooks/useQuote.js';
import { reportError } from '../utils/errorReporter.js';
import { fetchJson, fetchProductOrPackBySlug, mapApiProduct, mapApiPack } from '../utils/apiClient.js';

function formatPrice(pricePerDay) {
  if (pricePerDay === null || pricePerDay === undefined) {
    return 'Prix sur demande';
  }
  const value = pricePerDay % 1 === 0 ? pricePerDay.toFixed(0) : pricePerDay.toFixed(2);
  return `${value}€ / jour`;
}

function formatDateLabel(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function IncludedItems({ items, title = 'Inclus dans le pack' }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="product-detail__section" aria-labelledby="pack-includes">
      <div className="product-detail__section-header">
        <h2 id="pack-includes">{title}</h2>
        <p className="muted">Chaque élément est testé avant votre tournage.</p>
      </div>
      <div className="grid cards product-detail__items-grid">
        {items.map((item) => (
          <Link key={item.slug} to={`/produit/${item.slug}`} className="card" style={{ textDecoration: 'none' }}>
            <div className="media">
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" />}
              {item.type === 'pack' && <span className="badge badge-cat">Pack</span>}
            </div>
            <div className="body">
              <div className="title">{item.name}</div>
              {item.dailyPrice !== undefined && item.dailyPrice !== null && (
                <div className="muted" style={{ marginTop: '6px' }}>{formatPrice(item.dailyPrice)}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CompatiblePacks({ packs }) {
  if (!packs || packs.length === 0) return null;

  return (
    <section className="product-detail__section" aria-labelledby="compatible-packs">
      <div className="product-detail__section-header">
        <h2 id="compatible-packs">Disponible dans ces packs</h2>
        <p className="muted">Combinez ce matériel avec d’autres éléments prêts à tourner.</p>
      </div>
      <div className="grid cards product-detail__items-grid">
        {packs.map((pack) => (
          <Link key={pack.slug} to={`/produit/${pack.slug}`} className="card" style={{ textDecoration: 'none' }}>
            <div className="media">
              {pack.imageUrl && <img src={pack.imageUrl} alt={pack.name} loading="lazy" decoding="async" />}
              <span className="badge badge-cat">Pack</span>
            </div>
            <div className="body">
              <div className="title">{pack.name}</div>
              {pack.dailyPrice !== undefined && pack.dailyPrice !== null && (
                <div className="muted" style={{ marginTop: '6px' }}>{formatPrice(pack.dailyPrice)}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RelatedProducts({ products, currentSlug }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="product-detail__section" aria-labelledby="related-products">
      <div className="product-detail__section-header">
        <h2 id="related-products">Idées pour compléter votre setup</h2>
        <p className="muted">Accessoires suggérés dans la même catégorie.</p>
      </div>
      <div className="grid cards product-detail__items-grid">
        {products
          .filter((product) => product.slug !== currentSlug)
          .map((product) => (
            <Link key={product.slug} to={`/produit/${product.slug}`} className="card" style={{ textDecoration: 'none' }}>
              <div className="media">
                {product.imageUrl && <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" />}
              </div>
              <div className="body">
                <div className="title">{product.name}</div>
                {product.dailyPrice !== undefined && product.dailyPrice !== null && (
                  <div className="muted" style={{ marginTop: '6px' }}>{formatPrice(product.dailyPrice)}</div>
                )}
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}

function AvailabilityPanel({ summary, busyDays }) {
  return (
    <div className="availability-panel">
      <div className={`availability-chip availability-chip--${summary.status}`}>{summary.label}</div>
      {summary.description && <p className="availability-panel__description">{summary.description}</p>}

      {busyDays.length > 0 && (
        <div>
          <div className="availability-panel__label">Jours avec réservations</div>
          <ul className="availability-panel__list">
            {busyDays.map((entry) => (
              <li key={entry.date}>
                {formatDateLabel(entry.date)} · {entry.reservedQuantity} réservation{entry.reservedQuantity > 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function buildAvailabilitySummary(product) {
  const stock = typeof product.stock === 'number' ? product.stock : null;
  const entries = Array.isArray(product.availability) ? product.availability : [];

  if (stock === null) {
    return {
      status: 'reserved',
      label: 'Disponibilité sur demande',
      description: 'Contactez-nous pour confirmer les créneaux disponibles.',
      busyDays: entries.slice(0, 5),
    };
  }

  if (stock <= 0) {
    return {
      status: 'busy',
      label: 'Sur demande',
      description: 'Ce matériel est actuellement en préparation. Nous vous recontactons rapidement.',
      busyDays: entries.slice(0, 5),
    };
  }

  const busyDays = entries
    .filter((entry) => (entry.reservedQuantity ?? 0) >= stock)
    .slice(0, 5);

  if (busyDays.length === 0) {
    return {
      status: 'available',
      label: 'Disponible',
      description: `${stock} exemplaire${stock > 1 ? 's' : ''} immédiatement disponibles`,
      busyDays: [],
    };
  }

  const firstBusy = busyDays[0];
  return {
    status: 'reserved',
    label: 'Réservé prochainement',
    description: `Complet le ${formatDateLabel(firstBusy.date)}. Réservez tôt pour garantir votre tournage.`,
    busyDays,
  };
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { addProductToQuote, quoteItems } = useQuote();

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setProduct(null);
      setRelated([]);
      setLoading(false);
      return () => {};
    }

    async function fetchData() {
      setLoading(true);
      setHasError(false);
      try {
        const fetched = await fetchProductOrPackBySlug(slug);
        if (cancelled) return;
        if (!fetched) {
          setProduct(null);
          setRelated([]);
          setHasError(true);
          return;
        }
        setProduct(fetched);

        if (fetched.type === 'product' && fetched.category) {
          try {
            const relatedResponse = await fetchJson(`/api/products?category=${encodeURIComponent(fetched.category)}`);
            if (!cancelled) {
              const relatedProducts = relatedResponse
                .map(mapApiProduct)
                .filter((item) => item && item.slug !== fetched.slug)
                .slice(0, 4);
              setRelated(relatedProducts);
            }
          } catch (relatedError) {
            if (!cancelled) {
              reportError(relatedError, { feature: 'product-detail-related', category: fetched.category });
              setRelated([]);
            }
          }
        } else if (fetched.type === 'pack') {
          try {
            const relatedResponse = await fetchJson(`/api/packs`);
            if (!cancelled) {
              const relatedPacks = relatedResponse
                .map(mapApiPack)
                .filter((item) => item && item.slug !== fetched.slug)
                .slice(0, 4);
              setRelated(relatedPacks);
            }
          } catch (relatedPackError) {
            if (!cancelled) {
              reportError(relatedPackError, { feature: 'product-detail-related-pack' });
              setRelated([]);
            }
          }
        } else {
          setRelated([]);
        }
      } catch (error) {
        if (!cancelled) {
          reportError(error, { feature: 'product-detail', slug });
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isInQuote = useMemo(() => product && quoteItems.some((quoteItem) => quoteItem.slug === product.slug), [quoteItems, product]);
  const availabilityInfo = useMemo(() => (product ? buildAvailabilitySummary(product) : null), [product]);
  const busyDays = availabilityInfo?.busyDays ?? [];

  if (loading) {
    return (
      <div className="card" style={{ padding: '18px' }}>
        <p className="muted">Chargement du produit...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="card" style={{ padding: '18px' }}>
        <h1 className="section-title" style={{ marginTop: 0 }}>Indisponible pour le moment</h1>
        <p className="muted">La fiche produit ne peut pas être chargée. Merci de vérifier votre connexion et de réessayer.</p>
        <Link className="btn" to="/packs" style={{ marginTop: '12px', display: 'inline-flex' }}>
          Retour au catalogue
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card" style={{ padding: '18px' }}>
        <h1 className="section-title" style={{ marginTop: 0 }}>Produit introuvable</h1>
        <p className="muted">Ce produit n’est plus disponible ou le lien est incorrect.</p>
        <Link className="btn" to="/packs" style={{ marginTop: '12px', display: 'inline-flex' }}>
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const backHref = product.type === 'pack' ? '/packs' : '/materiel';
  const imageSrc = product.imageUrl || '/assets/placeholders/product-placeholder.webp';
  const dailyPrice = product.dailyPrice ?? null;
  const packs = product.packs ?? [];
  const includedItems = product.type === 'pack' ? (product.items ?? []) : [];
  const compatiblePacks = product.type !== 'pack' ? packs : [];
  const relatedProducts = product.type === 'product' ? related : related;
  const stockLabel = typeof product.stock === 'number' ? `${product.stock} en stock` : 'Disponibilité sur demande';

  return (
    <article className="product-detail">
      <div className="card product-detail__card">
        <div className="product-detail__grid">
          <div className="product-detail__media">
            {imageSrc && <img src={imageSrc} alt={product.name} loading="lazy" decoding="async" />}
          </div>
          <div className="product-detail__content">
            <Link to={backHref} className="btn ghost product-detail__back">← Retour catalogue</Link>
            <div className="product-detail__tags">
              {product.category && <span className="badge badge-outline">{product.category}</span>}
              {product.type === 'pack' && <span className="badge badge-outline">Pack complet</span>}
              {product.featured && <span className="badge">Mis en avant</span>}
            </div>
            <h1 className="section-title" style={{ marginTop: 0 }}>{product.name}</h1>
            {dailyPrice !== null && <div className="product-detail__price">{formatPrice(dailyPrice)}</div>}
            <p className="muted" style={{ whiteSpace: 'pre-line' }}>{product.description || 'Description à venir.'}</p>
            <p className="muted" style={{ marginTop: '8px' }}>{stockLabel}</p>

            <div className="product-detail__actions">
              <button
                className={`btn ${isInQuote ? 'ghost' : ''}`}
                onClick={() => addProductToQuote(product)}
                disabled={isInQuote}
              >
                {isInQuote ? 'Ajouté au devis' : 'Ajouter au devis'}
              </button>
              <Link className="btn ghost" to={`/contact?items=${product.slug || ''}`}>
                Demander un devis
              </Link>
            </div>

            <div className="product-detail__availability">
              <h2>Disponibilité</h2>
              {availabilityInfo && (
                <AvailabilityPanel summary={availabilityInfo} busyDays={busyDays} />
              )}
            </div>
            <div className="product-detail__pricing-info">
              <h2>Informations sur le prix selon la durée</h2>
              <ul>
                <li>1 à 2 jours : tarif plein affiché</li>
                <li>3 à 4 jours : -15% appliqué automatiquement</li>
                <li>5 à 6 jours : -30%</li>
                <li>7 jours et + : -40%</li>
              </ul>
              <p className="muted">Les remises se calculent lors de l’édition du devis en fonction des dates choisies.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="product-detail__sections">
        {product.type === 'pack' && <IncludedItems items={includedItems} />}
        {product.type !== 'pack' && <CompatiblePacks packs={compatiblePacks} />}
        <RelatedProducts products={relatedProducts} currentSlug={product.slug} />
      </div>
    </article>
  );
}
