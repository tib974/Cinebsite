import { useState, useEffect } from 'react';

function ProductCard({ product }) {
  return (
    <a href={`/produit/${product.slug}`} className="card">
      <div className="media">
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
      </div>
      <div className="body">
        <div className="title">{product.name}</div>
        <div className="price">{product.price_eur_day > 0 ? `${product.price_eur_day}€ / jour` : 'Prix sur demande'}</div>
      </div>
    </a>
  );
}

export default function Packs() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/catalog');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.ok) {
          setProducts(result.data);
        } else {
          throw new Error(result.error || 'API returned an error');
        }
      } catch (e) {
        setError(e.message);
      }
      finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <h1 className="section-title">Packs & Matériel</h1>
      <div className="toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
        <p>Filtres et tri (en construction)...</p>
      </div>
      <div id="grid" className="grid cards">
        {loading && <p>Chargement du catalogue...</p>}
        {error && <p style={{ color: 'red' }}>Erreur: {error}</p>}
        {!loading && !error && products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
