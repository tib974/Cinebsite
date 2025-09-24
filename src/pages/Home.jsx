import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';
import { useQuote } from '../hooks/useQuote.js';

const HERO_SLIDES = [
  {
    id: 'pack-pret-a-tourner',
    eyebrow: 'Prix dégressifs après 3 jours',
    title: 'Pack prêt-à-tourner',
    description: 'Tournez une vidéo comme un pro avec notre pack prêt à tourner : caméra, optique lumineuse et audio HF réunis.',
    ctaLabel: 'Découvrir les packs',
    ctaHref: '/packs',
    secondaryLabel: 'Demander un devis',
    secondaryHref: '/contact',
    illustration: '/assets/hero/hero-pack.svg',
    accent: 'linear-gradient(135deg, rgba(126, 87, 194, 0.25), rgba(49, 27, 146, 0.15))',
    price: '165€ / jour',
  },
  {
    id: 'lumiere',
    eyebrow: 'Lumière modulable',
    title: 'Éclairez chaque ambiance',
    description: 'Panneaux LED bi-color, trépieds et softbox prêts à être chargés, pour des interviews nettes et homogènes.',
    ctaLabel: 'Voir la lumière',
    ctaHref: '/materiel?categorie=Lumière',
    secondaryLabel: 'Réserver un créneau',
    secondaryHref: 'https://calendly.com/grondin-thibaut/demande-de-reservation-cineb',
    illustration: '/assets/hero/hero-light.svg',
    accent: 'linear-gradient(135deg, rgba(149, 117, 205, 0.2), rgba(255, 244, 117, 0.15))',
  },
  {
    id: 'audio',
    eyebrow: 'Audio pro sur le terrain',
    title: 'Captations voix claires',
    description: 'Kits micros HF, perches et enregistreurs supervisés avant chaque sortie avec batteries chargées.',
    ctaLabel: 'Explorer l’audio',
    ctaHref: '/materiel?categorie=Audio',
    secondaryLabel: 'Ajouter au devis',
    secondaryHref: '/contact?items=audio',
    illustration: '/assets/hero/hero-audio.svg',
    accent: 'linear-gradient(135deg, rgba(123, 97, 255, 0.18), rgba(40, 47, 78, 0.2))',
  },
];
import { reportError } from '../utils/errorReporter.js';

function ProductPreview({ item }) {
  const { addProductToQuote, quoteItems } = useQuote();
  const isInQuote = useMemo(() => quoteItems.some((quoteItem) => quoteItem._id === item._id), [quoteItems, item]);

  return (
    <div className="card product-card">
      <Link
        to={`/produit/${item.slug?.current}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gap: '12px' }}
      >
        <div className="media">
          {item.image && (
            <img
              src={urlFor(item.image).width(400).height(400).url()}
              alt={item.name}
              loading="lazy"
              decoding="async"
            />
          )}
          {item.type === 'pack' && <span className="badge badge-cat">Pack</span>}
          {item.featured && <span className="badge" style={{ right: '12px' }}>En avant</span>}
        </div>
        <div className="body">
          <div className="title">{item.name}</div>
          <div className="category">{item.category}</div>
        </div>
      </Link>
      <div className="card-footer" style={{ padding: '16px' }}>
        <button
          type="button"
          className={`btn${isInQuote ? ' ghost' : ''}`}
          onClick={() => addProductToQuote(item)}
          disabled={isInQuote}
          style={{ width: '100%' }}
        >
          {isInQuote ? 'Ajouté au devis' : 'Ajouter au devis'}
        </button>
      </div>
    </div>
  );
}

function splitByType(products) {
  const packs = [];
  const singles = [];
  products.forEach((item) => {
    if (item.type === 'pack') {
      packs.push(item);
    } else {
      singles.push(item);
    }
  });
  return { packs, singles };
}

export default function Home() {
  const [productsShowcase, setProductsShowcase] = useState({ packs: [], singles: [] });
  const [hasError, setHasError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const productsQuery = `*[_type == "product" && defined(slug.current) && defined(image)][0...10]{
          _id,
          name,
          slug,
          image,
          category,
          featured,
          type,
          pricePerDay
        } | order(featured desc, pricePerDay desc)`;
        const productsRaw = await sanityClient.fetch(productsQuery);
        setProductsShowcase(splitByType(productsRaw));
      } catch (error) {
        reportError(error, { feature: 'home-featured' });
        setHasError(true);
      }
    };

    fetchFeatured();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  const handleSelectSlide = useCallback((index) => {
    setActiveSlide(index);
  }, []);

  const topSingles = useMemo(() => productsShowcase.singles.slice(0, 4), [productsShowcase]);
  const topPacks = useMemo(() => productsShowcase.packs.slice(0, 4), [productsShowcase]);

  return (
    <>
      <section className="hero-slider card">
        <div className="hero-ribbon">Prix dégressifs après 3 jours</div>
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <article key={slide.id} className={`hero-slide${isActive ? ' active' : ''}`} aria-hidden={!isActive}>
              <div className="hero-slide__content">
                <span className="badge badge-hero">{slide.eyebrow}</span>
                <h1 className="section-title" style={{ margin: '8px 0' }}>{slide.title}</h1>
                <p className="muted" style={{ marginTop: '8px', maxWidth: 540 }}>{slide.description}</p>
                {slide.price && (
                  <div className="hero-slide__price">{slide.price}</div>
                )}
                <div className="hero-slide__ctas">
                  <Link className="btn" to={slide.ctaHref}>{slide.ctaLabel}</Link>
                  {slide.secondaryHref.startsWith('http') ? (
                    <a className="btn ghost" href={slide.secondaryHref} target="_blank" rel="noreferrer">{slide.secondaryLabel}</a>
                  ) : (
                    <Link className="btn ghost" to={slide.secondaryHref}>{slide.secondaryLabel}</Link>
                  )}
                </div>
              </div>
              <div className="hero-slide__visual" aria-hidden="true" style={{ background: slide.accent }}>
                <img
                  src={slide.illustration}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="hero-slide__visual-img"
                />
              </div>
            </article>
          );
        })}
        <div className="hero-slider__dots" role="tablist" aria-label="Mises en avant">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`hero-slider__dot${index === activeSlide ? ' active' : ''}`}
              aria-label={`Voir ${slide.title}`}
              aria-selected={index === activeSlide}
              onClick={() => handleSelectSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '18px' }}>
        <Link className="card" style={{ padding: '16px', textDecoration: 'none', color: 'inherit' }} to="/materiel?categorie=Image">
          <strong>Image</strong>
          <div className="muted">Caméras, optiques et moniteurs prêts à capter vos plans.</div>
        </Link>
        <Link className="card" style={{ padding: '16px', textDecoration: 'none', color: 'inherit' }} to="/materiel?categorie=Lumière">
          <strong>Lumière</strong>
          <div className="muted">Panneaux LED, modeleurs et accessoires pour des ambiances maîtrisées.</div>
        </Link>
        <Link className="card" style={{ padding: '16px', textDecoration: 'none', color: 'inherit' }} to="/materiel?categorie=Son">
          <strong>Son</strong>
          <div className="muted">Microphones, enregistreurs et HF pour une prise de son nette.</div>
        </Link>
      </section>

      {hasError && (
        <section className="card" style={{ marginTop: '24px', padding: '18px' }}>
          <p className="muted" style={{ margin: 0 }}>
            Les sélections sont momentanément indisponibles. Réessayez dans quelques minutes ou contactez-nous si le
            problème persiste.
          </p>
        </section>
      )}

      {!hasError && topSingles.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <header className="section-header">
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Nos produits les plus loués</h2>
              <p className="muted">Matériel image, lumière et audio en rotation permanente.</p>
            </div>
            <Link className="btn ghost" to="/materiel">Voir tout le matériel</Link>
          </header>
          <div className="grid cards">
            {topSingles.map((item) => (
              <ProductPreview key={item._id} item={item} />
            ))}
          </div>
        </section>
      )}

      {!hasError && topPacks.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <header className="section-header">
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Nos packs les + demandés</h2>
              <p className="muted">Solutions complètes prêtes à tourner, adaptables à votre tournage.</p>
            </div>
            <Link className="btn ghost" to="/packs">Voir les packs</Link>
          </header>
          <div className="grid cards">
            {topPacks.map((item) => (
              <ProductPreview key={item._id} item={item} />
            ))}
          </div>
        </section>
      )}

    </>
  );
}
