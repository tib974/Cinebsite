import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useQuote } from '../hooks/useQuote.js';
import { reportError } from '../utils/errorReporter.js';
import { fetchJson, mapApiPack } from '../utils/apiClient.js';

const CATEGORY_LABELS = {
  Combo: 'Packs complets',
  Image: 'Packs image',
  Lumière: 'Packs lumière',
  Audio: 'Packs audio',
  Accessoires: 'Packs accessoires',
};

const CATEGORY_ORDER = ['Combo', 'Image', 'Lumière', 'Audio', 'Accessoires'];

function formatPrice(pricePerDay) {
  if (pricePerDay === null || pricePerDay === undefined) {
    return 'Prix sur demande';
  }
  return `${pricePerDay % 1 === 0 ? pricePerDay.toFixed(0) : pricePerDay.toFixed(2)}€ / jour`;
}

function ProductCard({ item }) {
  const { addProductToQuote, quoteItems } = useQuote();
  const isInQuote = useMemo(
    () => quoteItems.some((quoteItem) => quoteItem.slug === item.slug),
    [quoteItems, item.slug],
  );
  const categoryLabel = CATEGORY_LABELS[item.displayCategory] || item.displayCategory || 'Pack';
  const imageSrc = item.imageUrl || '/assets/placeholders/product-placeholder.webp';
  const availabilityLabel = item.stock > 0 ? 'Disponible' : 'Sur demande';
  const availabilityStatus = item.stock > 0 ? 'available' : 'busy';
  const availabilityDescription = item.stock > 0
    ? `${item.stock} pack${item.stock > 1 ? 's' : ''} en stock`
    : 'Contactez-nous pour une mise à disposition rapide';

  return (
    <div className="card product-card pack-card">
      <Link to={`/produit/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div className="media">
          {imageSrc && <img src={imageSrc} alt={item.name} loading="lazy" decoding="async" />}
          {item.type === 'pack' && (
            <span className="badge badge-cat" style={{ left: '12px', right: 'auto' }}>Pack</span>
          )}
          {item.featured && <span className="badge">En avant</span>}
        </div>
        <div className="body">
          <div className="pack-card__header">
            <span className="pack-card__category">{categoryLabel}</span>
            <span
              className={`availability-chip availability-chip--${availabilityStatus}`}
              title={availabilityDescription}
            >
              {availabilityLabel}
            </span>
          </div>
          <div className="title">{item.name}</div>
          <div className="price">{formatPrice(item.dailyPrice)}</div>
          <div className="availability-note">{availabilityDescription}</div>
        </div>
      </Link>
      <div className="card-footer">
        <button 
          className={`btn ${isInQuote ? 'ghost' : ''}`} 
          style={{ width: '100%' }} 
          onClick={() => addProductToQuote(item)}
          disabled={isInQuote}
        >
          {isInQuote ? 'Ajouté au devis' : 'Ajouter au devis'}
        </button>
      </div>
    </div>
  );
}

const sorters = {
  featured: {
    label: 'En avant',
    sorter: (a, b) => Number(b.featured) - Number(a.featured),
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" /></svg>
    ),
  },
  price_asc: {
    label: 'Prix',
    sorter: (a, b) => (a.pricePerDay ?? Number.POSITIVE_INFINITY) - (b.pricePerDay ?? Number.POSITIVE_INFINITY),
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6z" /></svg>
    ),
  },
  price_desc: {
    label: 'Prix',
    sorter: (a, b) => (b.pricePerDay ?? -1) - (a.pricePerDay ?? -1),
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-6 1.41-1.41L12 13.17l4.59-4.58L18 10l-6 6z" /></svg>
    ),
  },
  name: {
    label: 'Nom',
    sorter: (a, b) => a.name.localeCompare(b.name),
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z" /></svg>
    ),
  },
};

export default function Packs() {
  const [searchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Combo');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await fetchJson('/api/packs');
        const packs = response
          .map(mapApiPack)
          .filter(Boolean)
          .map((pack) => ({
            ...pack,
            displayCategory: derivePackCategory(pack),
          }));
        setAllProducts(packs);
      } catch (error) {
        reportError(error, { feature: 'packs-catalog' });
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const present = new Set(allProducts.map((item) => item.displayCategory).filter(Boolean));
    return CATEGORY_ORDER.filter((key) => present.has(key));
  }, [allProducts]);

  useEffect(() => {
    const fromQuery = (searchParams.get('categorie') || '').trim();
    if (!fromQuery) return;
    const normalized = fromQuery.toLowerCase();
    const entry = CATEGORY_ORDER.find((category) => category.toLowerCase() === normalized);
    if (entry) {
      setSelectedCategory(entry);
    }
  }, [searchParams]);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const featuredCatalogItems = useMemo(() => allProducts.filter((p) => p.featured).slice(0, 4), [allProducts]);

  const displayedItems = useMemo(() => {
    let items = allProducts;
    if (selectedCategory) {
      items = items.filter((item) => item.displayCategory === selectedCategory);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.includes && item.includes.some((included) => included?.slug?.current?.toLowerCase().includes(query)))
      );
    }

    const sorter = sorters[selectedSort]?.sorter ?? sorters.featured.sorter;
    return [...items].sort(sorter);
  }, [allProducts, selectedCategory, selectedSort, searchTerm]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  return (
    <section>
      <header className="packs-hero">
        <div className="packs-hero__intro">
          <h1 className="section-title">Packs prêts à tourner</h1>
          <p className="muted">
            Des configurations complètes image, lumière et audio prêtes à être chargées. Choisissez votre combo, ajoutez-le au devis et gagnez du temps sur le tournage.
          </p>
        </div>
        <ul className="packs-hero__list">
          <li>Préparation et tests avant retrait</li>
          <li>Compatibilités validées par CinéB</li>
          <li>Remises dès 3 jours de location</li>
        </ul>
      </header>

      <div className="category-tabs" role="tablist" aria-label="Catégories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-tab${selectedCategory === category ? ' active' : ''}`}
            onClick={() => handleCategorySelect(category)}
          >
            <span>{CATEGORY_LABELS[category] || category}</span>
            <small>{allProducts.filter((item) => item.displayCategory === category).length}</small>
          </button>
        ))}
      </div>

      <div className="toolbar packs-toolbar">
        <div className="chips" aria-label="Tri">
          {Object.entries(sorters).map(([key, { label, icon }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedSort(key)}
              className={`sort-btn ${selectedSort === key ? 'active' : ''}`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
        <label htmlFor="search-input" className="sr-only">Rechercher un pack</label>
        <input
          id="search-input"
          type="search"
          placeholder="Rechercher un pack complet"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {hasError && !isLoading && (
        <section className="card" style={{ padding: '18px', marginBottom: '18px' }}>
          <p className="muted" style={{ margin: 0 }}>
            Le catalogue ne peut pas être affiché pour le moment. Merci de vérifier votre connexion ou de réessayer plus tard.
          </p>
        </section>
      )}

      {!hasError && !isLoading && !searchTerm && featuredCatalogItems.length > 0 && (
        <section className="card" style={{ padding: '18px', marginBottom: '18px' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>En ce moment</h2>
          <div className="grid cards">
            {featuredCatalogItems.map((item) => (
              <ProductCard key={`featured-${item.slug}`} item={item} />
            ))}
          </div>
        </section>
      )}

      <div id="grid" className="grid cards">
        {isLoading ? (
          <div className="card" style={{ padding: '18px' }}><p className="muted">Chargement du catalogue...</p></div>
        ) : displayedItems.length > 0 ? (
          displayedItems.map((item) => (
            <ProductCard key={item.slug} item={item} />
          ))
        ) : (
          <div className="card" style={{ padding: '18px' }}>
            <p className="muted">Aucun résultat ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function derivePackCategory(product) {
  const includeCategories = (product.items || [])
    .map((item) => item?.category || '')
    .filter(Boolean);

  const hasImage = includeCategories.some((value) => /image|camera|optique|objectif/i.test(value));
  const hasLight = includeCategories.some((value) => /lumière|light/i.test(value));
  const hasAudio = includeCategories.some((value) => /audio|son/i.test(value));
  const hasAccessories = includeCategories.some((value) => /accessoires?|rig|support/i.test(value));

  const signals = [hasImage, hasLight, hasAudio].filter(Boolean).length;

  if (signals > 1) {
    return 'Combo';
  }

  if (hasImage) return 'Image';
  if (hasLight) return 'Lumière';
  if (hasAudio) return 'Audio';
  if (hasAccessories) return 'Accessoires';

  return 'Combo';
}
