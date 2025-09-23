import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';
import { useQuote } from '../hooks/useQuote.js';
import { reportError } from '../utils/errorReporter.js';
import { getAvailabilitySummary } from '../utils/availability.js';

const CATEGORY_LABELS = {
  Image: 'Image',
  Son: 'Son',
  Lumière: 'Lumière',
  Accessoire: 'Accessoire',
};

const CATEGORY_ORDER = ['Image', 'Son', 'Lumière', 'Accessoire'];

function formatPrice(pricePerDay) {
  if (pricePerDay === null || pricePerDay === undefined) {
    return 'Prix sur demande';
  }
  return `${pricePerDay % 1 === 0 ? pricePerDay.toFixed(0) : pricePerDay.toFixed(2)}€ / jour`;
}

function ProductCard({ item }) {
  const { addProductToQuote, quoteItems } = useQuote();
  const isInQuote = useMemo(() => quoteItems.some((quoteItem) => quoteItem._id === item._id), [quoteItems, item]);
  const availabilitySummary = useMemo(() => getAvailabilitySummary(item.bookings), [item.bookings]);
  const hasScheduleInfo = availabilitySummary.ongoingBooking || availabilitySummary.nextBooking;
  const categoryLabel = CATEGORY_LABELS[item.displayCategory] || item.displayCategory || 'Matériel';

  return (
    <div className="card product-card pack-card">
      <Link
        to={`/produit/${item.slug?.current}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 }}
      >
        <div className="media">
          {item.image && <img src={urlFor(item.image).width(400).url()} alt={item.name} loading="lazy" decoding="async" />}
          {item.featured && <span className="badge">En avant</span>}
        </div>
        <div className="body">
          <div className="pack-card__header">
            <span className="pack-card__category">{categoryLabel}</span>
            <span
              className={`availability-chip availability-chip--${availabilitySummary.status}`}
              title={availabilitySummary.description || undefined}
            >
              {availabilitySummary.label}
            </span>
          </div>
          <div className="title">{item.name}</div>
          <div className="price">{formatPrice(item.pricePerDay)}</div>
          {hasScheduleInfo && availabilitySummary.description && (
            <div className="availability-note">{availabilitySummary.description}</div>
          )}
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
    label: 'Prix (croissant)',
    sorter: (a, b) => (a.pricePerDay ?? Number.POSITIVE_INFINITY) - (b.pricePerDay ?? Number.POSITIVE_INFINITY),
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6z" /></svg>
    ),
  },
  price_desc: {
    label: 'Prix (décroissant)',
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

export default function Materiel() {
  const [searchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Image');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const query = `*[_type == "product" && type != "pack" && defined(slug.current)]{
          _id,
          name,
          slug,
          image,
          pricePerDay,
          description,
          category,
          featured,
          type,
          "bookings": *[_type == "booking" && references(^._id) && defined(startDate) && defined(endDate) && endDate >= now()] | order(startDate asc) [0...3]{
            _id,
            startDate,
            endDate
          }
        } | order(featured desc, name asc)`;
        const products = await sanityClient.fetch(query);
        setAllProducts(products.map((product) => ({
          ...product,
          bookings: product.bookings ?? [],
          displayCategory: mapCategory(product),
        })));
      } catch (error) {
        reportError(error, { feature: 'materiel-catalog' });
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

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
    const searchFromQuery = (searchParams.get('recherche') || '').trim();
    if (searchFromQuery) {
      setSearchTerm(searchFromQuery);
    }
  }, [searchParams]);

  const categories = useMemo(() => {
    const present = new Set(allProducts.map((item) => item.displayCategory).filter(Boolean));
    return CATEGORY_ORDER.filter((key) => present.has(key));
  }, [allProducts]);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const displayedItems = useMemo(() => {
    let items = allProducts;
    if (selectedCategory) {
      items = items.filter((item) => item.displayCategory === selectedCategory);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
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
      <header className="catalog-hero">
        <div className="catalog-hero__intro">
          <h1 className="section-title">Notre matériel</h1>
          <p className="muted">
            Composez votre pack pièce par pièce : image, son, lumière et accessoires sont prêts à partir. Toutes les fiches affichent la disponibilité mise à jour.
          </p>
        </div>
        <div className="catalog-hero__note">Disponibilité mise à jour avant chaque retrait.</div>
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
        <label htmlFor="materiel-search" className="sr-only">Rechercher du matériel</label>
        <input
          id="materiel-search"
          type="search"
          placeholder="Rechercher une caméra, un objectif, un accessoire..."
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

      <h2 className="section-title" style={{ margin: '24px 0 12px' }}>Disponibilité</h2>
      <div id="grid" className="grid cards">
        {isLoading ? (
          <div className="card" style={{ padding: '18px' }}><p className="muted">Chargement du matériel...</p></div>
        ) : displayedItems.length > 0 ? (
          displayedItems.map((item) => (
            <ProductCard key={item._id} item={item} />
          ))
        ) : (
          <div className="card" style={{ padding: '18px' }}>
            <p className="muted">Aucun matériel ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function mapCategory(product) {
  const raw = product.category || '';
  if (/lumière|light/i.test(raw)) return 'Lumière';
  if (/audio|son/i.test(raw)) return 'Son';
  if (/accessoires?|rig|support/i.test(raw)) return 'Accessoire';
  if (/image|camera|optique|objectif/i.test(raw)) return 'Image';
  return 'Accessoire';
}
