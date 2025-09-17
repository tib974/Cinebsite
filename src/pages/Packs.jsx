import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';

function formatPrice(pricePerDay) {
  if (pricePerDay === null || pricePerDay === undefined) {
    return 'Prix sur demande';
  }
  return `${pricePerDay % 1 === 0 ? pricePerDay.toFixed(0) : pricePerDay.toFixed(2)}€ / jour`;
}

function ProductCard({ item }) {
  return (
    <Link to={`/produit/${item.slug?.current}`} className="card" style={{ textDecoration: 'none' }}>
      <div className="media">
        {item.image && <img src={urlFor(item.image).width(400).url()} alt={item.name} loading="lazy" decoding="async" />}
        {item.type === 'pack' && (
          <span className="badge badge-cat" style={{ left: '12px', right: 'auto' }}>Pack</span>
        )}
        {item.featured && <span className="badge">En avant</span>}
      </div>
      <div className="body">
        <div className="title" style={{ fontWeight: 700 }}>{item.name}</div>
        <div className="muted" style={{ fontSize: '0.85rem', marginTop: '6px' }}>{item.category}</div>
        <div className="price" style={{ marginTop: '10px' }}>{formatPrice(item.pricePerDay)}</div>
      </div>
    </Link>
  );
}

const sorters = {
  featured: {
    label: 'En avant',
    sorter: (a, b) => Number(b.featured) - Number(a.featured),
  },
  price_asc: {
    label: 'Prix ↑',
    sorter: (a, b) => (a.pricePerDay ?? Number.POSITIVE_INFINITY) - (b.pricePerDay ?? Number.POSITIVE_INFINITY),
  },
  price_desc: {
    label: 'Prix ↓',
    sorter: (a, b) => (b.pricePerDay ?? -1) - (a.pricePerDay ?? -1),
  },
  name: {
    label: 'Nom',
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
};

export default function Packs() {
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const query = `*[_type == "product"]`;
        const products = await sanityClient.fetch(query);
        setAllProducts(products);
      } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const fromData = new Set(allProducts.map((item) => item.category).filter(Boolean));
    return ['Image', 'Lumière', 'Audio', 'Accessoires', 'Packs'].filter((c) => fromData.has(c) || c === 'Packs');
  }, [allProducts]);

  const featuredCatalogItems = useMemo(() => allProducts.filter(p => p.featured), [allProducts]);

  const displayedItems = useMemo(() => {
    let items = allProducts;
    if (selectedCategory === 'Packs') {
      items = items.filter((item) => item.type === 'pack');
    } else if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory && item.type !== 'pack');
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.includes && item.includes.some((i) => i._ref.includes(query)))
      );
    }

    const sorter = sorters[selectedSort]?.sorter ?? sorters.featured.sorter;
    return [...items].sort(sorter);
  }, [allProducts, selectedCategory, selectedSort, searchTerm]);

  return (
    <section>
      <header style={{ marginBottom: '18px' }}>
        <h1 className="section-title">Packs &amp; Matériel</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          Matériel image, lumière et audio prêt à tourner. Ajoutez les produits à votre sélection, puis demandez un devis en
          quelques clics.
        </p>
      </header>

      <div className="toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
        <div className="chips" role="tablist" aria-label="Catégories">
          <button type="button" onClick={() => setSelectedCategory('all')} className={`chip ${selectedCategory === 'all' ? 'active' : ''}`}>
            Tout
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`chip ${selectedCategory === category ? 'active' : ''}`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="chips" aria-label="Tri">
          {Object.entries(sorters).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedSort(key)}
              className={`chip ${selectedSort === key ? 'active' : ''}`}>
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Rechercher un matériel ou un pack"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={{ flexGrow: 1, minWidth: 220, padding: '10px 12px', borderRadius: '999px', border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)' }}
        />
      </div>

      {featuredCatalogItems.length > 0 && selectedCategory === 'all' && !searchTerm && (
        <section className="card" style={{ padding: '18px', marginBottom: '18px' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>Mises en avant</h2>
          <div className="grid cards">
            {featuredCatalogItems.map((item) => (
              <ProductCard key={`featured-${item._id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      <div id="grid" className="grid cards">
        {displayedItems.map((item) => (
          <ProductCard key={item._id} item={item} />
        ))}
        {!displayedItems.length && (
          <div className="card" style={{ padding: '18px' }}>
            <p className="muted">Aucun résultat ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </section>
  );
}
