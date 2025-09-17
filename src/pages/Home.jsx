import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';

function ProductPreview({ item }) {
  return (
    <Link to={`/produit/${item.slug?.current}`} className="card product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="media">
        {item.image && <img src={urlFor(item.image).width(400).height(400).url()} alt={item.name} loading="lazy" decoding="async" />}
        {item.type === 'pack' && <span className="badge badge-cat">Pack</span>}
        {item.featured && <span className="badge" style={{ right: '12px' }}>En avant</span>}
      </div>
      <div className="body">
        <div className="title">{item.name}</div>
        <div className="category">{item.category}</div>
      </div>
    </Link>
  );
}

function RealisationPreview({ item }) {
  return (
    <Link to={`/realisation/${item.slug?.current}`} className="card" style={{ textDecoration: 'none' }}>
      <div className="media media-16x9">
        {item.image && <img src={urlFor(item.image).width(600).url()} alt={item.title} loading="lazy" decoding="async" />}
      </div>
      <div className="body">
        <div className="title" style={{ fontWeight: 700 }}>{item.title}</div>
        {item.customer && <div className="muted" style={{ marginTop: '6px' }}>{item.customer}</div>}
      </div>
    </Link>
  );
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredRealisations, setFeaturedRealisations] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const productsQuery = `*[_type == "product" && featured == true][0...6]`;
        const realisationsQuery = `*[_type == "realisation" && featured == true][0...3]`;
        
        const [products, realisations] = await Promise.all([
          sanityClient.fetch(productsQuery),
          sanityClient.fetch(realisationsQuery),
        ]);

        setFeaturedProducts(products);
        setFeaturedRealisations(realisations);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <>
      <section className="card hero" style={{ padding: '24px', display: 'grid', gap: '24px', gridTemplateColumns: 'minmax(280px, 1fr) minmax(240px, 0.8fr)', alignItems: 'center' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0 }}>Location de matériel audiovisuel</h1>
          <p className="muted" style={{ marginTop: '12px', maxWidth: 560 }}>
            Packs prêts-à-tourner, caméras, lumière et audio. CinéB accompagne vos tournages sur toute l’île de La Réunion.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
            <Link className="btn" to="/packs">Voir les packs</Link>
            <Link className="btn ghost" to="/contact">Demander un devis</Link>
            <a className="btn ghost" href="https://calendly.com/grondin-thibaut/demande-de-reservation-cineb" target="_blank" rel="noreferrer">
              Réserver un créneau
            </a>
          </div>
        </div>
        <div className="media media-16x9 hero-media" style={{ border: 'none' }}>
          <img src="/assets/logo.webp" alt="CinéB — Location audiovisuelle" loading="lazy" decoding="async" />
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '18px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <strong>Rapide</strong>
          <div className="muted">Réponses claires, matériel prêt quand vous arrivez.</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <strong>Pro</strong>
          <div className="muted">Matériel vérifié, assistance plateau possible.</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <strong>Souple</strong>
          <div className="muted">Packs modulables selon votre tournage.</div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Sélection du moment</h2>
            <Link className="btn ghost" to="/packs">Tout le catalogue</Link>
          </div>
          <div className="grid cards">
            {featuredProducts.map((item) => (
              <ProductPreview key={item._id} item={item} />
            ))}
          </div>
        </section>
      )}

      {featuredRealisations.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Réalisations</h2>
            <Link className="btn ghost" to="/realisations">Voir les projets</Link>
          </div>
          <div className="grid cards grid-reals">
            {featuredRealisations.map((item) => (
              <RealisationPreview key={item._id} item={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
