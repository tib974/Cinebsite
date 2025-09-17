import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';

function formatPrice(pricePerDay) {
  if (pricePerDay === null || pricePerDay === undefined) {
    return 'Prix sur demande';
  }
  return `${pricePerDay % 1 === 0 ? pricePerDay.toFixed(0) : pricePerDay.toFixed(2)}€ / jour`;
}

function IncludedItems({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby="pack-includes" style={{ marginTop: '18px' }}>
      <h2 id="pack-includes" style={{ fontSize: '18px', marginBottom: '12px' }}>Inclus dans le pack</h2>
      <div className="grid cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {items.map((item) => (
          <Link key={item._id} to={`/produit/${item.slug?.current}`} className="card" style={{ textDecoration: 'none' }}>
            <div className="media">
              {item.image && <img src={urlFor(item.image).width(300).url()} alt={item.name} loading="lazy" decoding="async" />}
            </div>
            <div className="body">
              <div className="title" style={{ fontWeight: 700 }}>{item.name}</div>
              <div className="muted" style={{ fontSize: '0.85rem', marginTop: '6px' }}>{formatPrice(item.pricePerDay)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const query = `*[_type == "product" && slug.current == $slug][0] {
          ...,
          "includes": includes[]->
        }`;
        const result = await sanityClient.fetch(query, { slug });
        setProduct(result);
      } catch (error) {
        console.error("Erreur lors de la récupération du produit :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return <div className="card" style={{ padding: '18px' }}>Chargement...</div>;
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

  return (
    <article className="card" style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <div className="product-grid" style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'minmax(260px, 1fr) 1.2fr' }}>
        <div className="media" style={{ maxHeight: 400, margin: 0 }}>
          {product.image && <img src={urlFor(product.image).width(800).url()} alt={product.name} loading="lazy" decoding="async" />}
        </div>
        <div>
          <Link to="/packs" className="btn ghost" style={{ marginBottom: '12px', display: 'inline-flex' }}>
            ← Retour au catalogue
          </Link>
          <h1 className="section-title" style={{ marginTop: 0 }}>{product.name}</h1>
          <div className="price" style={{ margin: '12px 0' }}>{formatPrice(product.pricePerDay)}</div>
          <p className="muted" style={{ whiteSpace: 'pre-line' }}>{product.description || 'Description à venir.'}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '18px' }}>
            <Link className="btn" to={`/calendrier?produit=${product.slug?.current}`}>
              Réserver / Vérifier les dates
            </Link>
            <Link className="btn ghost" to={`/contact?items=${product.slug?.current}`}>
              Demander un devis
            </Link>
          </div>
        </div>
      </div>
      <IncludedItems items={product.includes} />
    </article>
  );
}
