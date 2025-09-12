import { useState, useEffect, useMemo } from 'react';
import { mockCatalog } from '../../_data.js';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  return (
    <Link to={`/produit/${product.slug}`} className="card">
      <div className="media">
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
      </div>
      <div className="body">
        <div className="title">{product.name}</div>
        <div className="price">{product.price_eur_day > 0 ? `${parseFloat(product.price_eur_day).toFixed(0)}€ / jour` : 'Prix sur demande'}</div>
      </div>
    </Link>
  );
}

export default function Packs() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters and sorting
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSort, setActiveSort] = useState('featured');

  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(mockCatalog);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filtering
    if (activeCategory) {
      if (activeCategory === 'Packs') {
        result = result.filter(p => p.type === 'pack');
      } else {
        result = result.filter(p => p.category === activeCategory && p.type !== 'pack');
      }
    }

    // Sorting
    switch (activeSort) {
      case 'price_asc':
        result.sort((a, b) => parseFloat(a.price_eur_day) - parseFloat(b.price_eur_day));
        break;
      case 'price_desc':
        result.sort((a, b) => parseFloat(b.price_eur_day) - parseFloat(a.price_eur_day));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return result;
  }, [products, activeCategory, activeSort]);

  const categories = ['Image', 'Lumière', 'Audio', 'Packs'];
  const sorts = {
      featured: 'En avant',
      price_asc: 'Prix ↑',
      price_desc: 'Prix ↓',
      name: 'Nom',
  };

  return (
    <>
      <h1 className="section-title">Packs & Matériel</h1>
      <div className="toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
        <div className="chips">
            <button onClick={() => setActiveCategory('')} className={`chip ${activeCategory === '' ? 'active' : ''}`}>Tout</button>
            {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`chip ${activeCategory === cat ? 'active' : ''}`}>{cat}</button>
            ))}
        </div>
        <div className="chips">
            {Object.entries(sorts).map(([key, label]) => (
                <button key={key} onClick={() => setActiveSort(key)} className={`chip ${activeSort === key ? 'active' : ''}`}>{label}</button>
            ))}
        </div>
      </div>
      <div id="grid" className="grid cards">
        {loading && <p>Chargement du catalogue...</p>}
        {!loading && filteredAndSortedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
