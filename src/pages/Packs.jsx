import { useState, useEffect } from 'react';
import sanityClient, { urlFor } from '../sanityClient'; // Importation de notre client et du helper d'image

function ProductCard({ product }) {
  const imageUrl = product.image ? urlFor(product.image).width(300).url() : '';

  return (
    <a href={`/produit/${product.slug.current}`} className="card">
      <div className="media">
        {imageUrl && <img src={imageUrl} alt={product.name} loading="lazy" decoding="async" />}
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
    const query = `*[_type == "product"]`; // Requête GROQ pour récupérer tous les produits

    sanityClient.fetch(query)
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Erreur lors de la récupération des données depuis le CMS.");
        setLoading(false);
      });
  }, []);

  return (
    <>
      <h1 className="section-title">Packs & Matériel</h1>
      <div className="toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
        <p>Filtres et tri (en construction)...</p>
      </div>
      <div id="grid" className="grid cards">
        {loading && <p>Chargement du catalogue...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </>
  );
}