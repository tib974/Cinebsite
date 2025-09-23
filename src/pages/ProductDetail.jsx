import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';
import { useQuote } from '../hooks/useQuote.js';
import { reportError } from '../utils/errorReporter.js';
import {
  getAvailabilitySummary,
  formatBookingRange,
  formatBookingDate,
  addDays,
} from '../utils/availability.js';

function formatPrice(pricePerDay) {
  if (pricePerDay === null || pricePerDay === undefined) {
    return 'Prix sur demande';
  }
  const value = pricePerDay % 1 === 0 ? pricePerDay.toFixed(0) : pricePerDay.toFixed(2);
  return `${value}€ / jour`;
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
          <Link key={item._id} to={`/produit/${item.slug?.current}`} className="card" style={{ textDecoration: 'none' }}>
            <div className="media">
              {item.image && <img src={urlFor(item.image).width(360).url()} alt={item.name} loading="lazy" decoding="async" />}
              {item.type === 'pack' && <span className="badge badge-cat">Pack</span>}
            </div>
            <div className="body">
              <div className="title">{item.name}</div>
              {item.pricePerDay !== undefined && (
                <div className="muted" style={{ marginTop: '6px' }}>{formatPrice(item.pricePerDay)}</div>
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
          <Link key={pack._id} to={`/produit/${pack.slug?.current}`} className="card" style={{ textDecoration: 'none' }}>
            <div className="media">
              {pack.image && <img src={urlFor(pack.image).width(320).url()} alt={pack.name} loading="lazy" decoding="async" />}
              <span className="badge badge-cat">Pack</span>
            </div>
            <div className="body">
              <div className="title">{pack.name}</div>
              {pack.pricePerDay !== undefined && (
                <div className="muted" style={{ marginTop: '6px' }}>{formatPrice(pack.pricePerDay)}</div>
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
          .filter((product) => product.slug?.current !== currentSlug)
          .map((product) => (
            <Link key={product._id} to={`/produit/${product.slug?.current}`} className="card" style={{ textDecoration: 'none' }}>
              <div className="media">
                {product.image && <img src={urlFor(product.image).width(320).url()} alt={product.name} loading="lazy" decoding="async" />}
              </div>
              <div className="body">
                <div className="title">{product.name}</div>
                {product.pricePerDay !== undefined && (
                  <div className="muted" style={{ marginTop: '6px' }}>{formatPrice(product.pricePerDay)}</div>
                )}
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}

function AvailabilityPanel({ summary, productSlug }) {
  const nextFreeDate = useMemo(() => {
    if (summary.ongoingBooking) {
      return addDays(summary.ongoingBooking.end, 1);
    }
    if (summary.nextBooking) {
      return addDays(summary.nextBooking.end, 1);
    }
    return null;
  }, [summary]);

  return (
    <div className="availability-panel">
      <div className={`availability-chip availability-chip--${summary.status}`}>{summary.label}</div>
      {summary.description && <p className="availability-panel__description">{summary.description}</p>}

      {summary.bookings.length > 0 && (
        <div>
          <div className="availability-panel__label">Réservations à venir</div>
          <ul className="availability-panel__list">
            {summary.bookings.slice(0, 3).map((booking) => (
              <li key={booking._id || `${booking.start.toISOString()}-${booking.end.toISOString()}`}>
                {formatBookingRange(booking)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {nextFreeDate && (
        <div className="availability-panel__next">
          Prochain créneau libre : <strong>{formatBookingDate(nextFreeDate)}</strong>
        </div>
      )}

      <div className="availability-panel__actions">
        <Link className="btn ghost" to={`/calendrier?produit=${productSlug}`}>
          Vérifier un créneau
        </Link>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { addProductToQuote, quoteItems } = useQuote();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function fetchProduct() {
      setLoading(true);
      setHasError(false);
      try {
        const query = `*[_type == "product" && slug.current == $slug][0]{
          _id,
          name,
          slug,
          image,
          pricePerDay,
          description,
          category,
          featured,
          type,
          includes[]->{
            _id,
            name,
            slug,
            image,
            pricePerDay,
            type
          },
          "bookings": *[_type == "booking" && references(^._id) && defined(startDate) && defined(endDate) && endDate >= now()] | order(startDate asc) {
            _id,
            startDate,
            endDate
          },
          "includedBy": *[_type == "product" && type == "pack" && references(^._id)]{
            _id,
            name,
            slug,
            image,
            pricePerDay,
            type
          },
          "related": *[_type == "product" && slug.current != $slug && category == ^.category][0...4]{
            _id,
            name,
            slug,
            image,
            pricePerDay,
            type
          }
        }`;
        const data = await sanityClient.fetch(query, { slug });
        if (data) {
          setProduct({
            ...data,
            bookings: data.bookings ?? [],
            includes: data.includes ?? [],
            includedBy: data.includedBy ?? [],
            related: data.related ?? [],
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        reportError(error, { feature: 'product-detail', slug });
        setHasError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug]);

  const isInQuote = useMemo(() => product && quoteItems.some((quoteItem) => quoteItem._id === product._id), [quoteItems, product]);
  const availabilitySummary = useMemo(() => getAvailabilitySummary(product?.bookings), [product?.bookings]);

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

  const productSlug = product.slug?.current;
  const backHref = product.type === 'pack' ? '/packs' : '/materiel';

  return (
    <article className="product-detail">
      <div className="card product-detail__card">
        <div className="product-detail__grid">
          <div className="product-detail__media">
            {product.image && <img src={urlFor(product.image).width(1000).url()} alt={product.name} loading="lazy" decoding="async" />}
          </div>
          <div className="product-detail__content">
            <Link to={backHref} className="btn ghost product-detail__back">← Retour catalogue</Link>
            <div className="product-detail__tags">
              {product.category && <span className="badge badge-outline">{product.category}</span>}
              {product.type === 'pack' && <span className="badge badge-outline">Pack complet</span>}
              {product.featured && <span className="badge">Mis en avant</span>}
            </div>
            <h1 className="section-title" style={{ marginTop: 0 }}>{product.name}</h1>
            <div className="product-detail__price">{formatPrice(product.pricePerDay)}</div>
            <p className="muted" style={{ whiteSpace: 'pre-line' }}>{product.description || 'Description à venir.'}</p>

            <div className="product-detail__actions">
              <button
                className={`btn ${isInQuote ? 'ghost' : ''}`}
                onClick={() => addProductToQuote(product)}
                disabled={isInQuote}
              >
                {isInQuote ? 'Ajouté au devis' : 'Ajouter au devis'}
              </button>
              <Link className="btn ghost" to={`/contact?items=${productSlug || ''}`}>
                Demander un devis
              </Link>
            </div>

            <div className="product-detail__availability">
              <h2>Disponibilité</h2>
              <AvailabilityPanel summary={availabilitySummary} productSlug={productSlug} />
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
        {product.type === 'pack' && <IncludedItems items={product.includes} />}
        {product.type !== 'pack' && <CompatiblePacks packs={product.includedBy} />}
        <RelatedProducts products={product.related} currentSlug={productSlug} />
      </div>
    </article>
  );
}
