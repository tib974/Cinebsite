// src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { mockCatalog } from '../../_data.js'; // On utilise les données de test

export default function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { slug } = useParams(); // Récupère le 'slug' depuis l'URL

  useEffect(() => {
    // Simule la recherche du produit par son slug
    const foundProduct = mockCatalog.find(p => p.slug === slug);
    setProduct(foundProduct);
    setLoading(false);
  }, [slug]);

  if (loading) {
    return <p>Chargement du produit...</p>;
  }

  if (!product) {
    return <p>Produit non trouvé.</p>;
  }

  return (
    <div>
      <h1 className="section-title">{product.name}</h1>
      <img src={product.image} alt={product.name} style={{maxWidth: '400px', borderRadius: 'var(--radius)'}} />
      <p>{product.description}</p>
      <div className="price">{product.price_eur_day > 0 ? `${product.price_eur_day}€ / jour` : 'Prix sur demande'}</div>
    </div>
  );
}
