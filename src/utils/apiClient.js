const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function withBase(url) {
  if (!url) return url;
  if (typeof url !== 'string') return url;
  if (API_BASE && url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }
  return url;
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(withBase(url), options);
  if (!response.ok) {
    const error = new Error(`Requête échouée (${response.status})`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export function mapApiPackItem(raw) {
  if (!raw) return null;
  const slug = typeof raw.slug === 'string' ? raw.slug : raw.slug?.current ?? '';
  return {
    id: raw.productId ?? raw.id ?? null,
    productId: raw.productId ?? raw.id ?? null,
    slug,
    name: raw.name ?? '',
    dailyPrice: raw.dailyPrice ?? raw.pricePerDay ?? null,
    imageUrl: raw.imageUrl ?? raw.image ?? null,
    type: raw.type ?? 'product',
    category: raw.category ?? raw.displayCategory ?? '',
  };
}

export function mapApiPack(raw) {
  if (!raw) return null;
  const slug = typeof raw.slug === 'string' ? raw.slug : raw.slug?.current ?? '';
  return {
    id: raw.id ?? null,
    slug,
    name: raw.name ?? '',
    description: raw.description ?? '',
    dailyPrice: raw.dailyPrice ?? raw.pricePerDay ?? null,
    imageUrl: raw.imageUrl ?? raw.image ?? null,
    type: raw.type ?? 'pack',
    featured: Boolean(raw.featured),
    items: Array.isArray(raw.items) ? raw.items.map(mapApiPackItem).filter(Boolean) : [],
  };
}

export function mapApiProduct(raw) {
  if (!raw) return null;
  const slug = typeof raw.slug === 'string' ? raw.slug : raw.slug?.current ?? '';
  return {
    id: raw.id ?? null,
    slug,
    name: raw.name ?? '',
    description: raw.description ?? '',
    category: raw.category ?? '',
    type: raw.type ?? 'product',
    featured: Boolean(raw.featured),
    dailyPrice: raw.dailyPrice ?? raw.pricePerDay ?? null,
    imageUrl: raw.imageUrl ?? raw.image ?? null,
    stock: raw.stock ?? null,
    availability: Array.isArray(raw.availability) ? raw.availability : [],
    packs: Array.isArray(raw.packs) ? raw.packs.map(mapApiPack).filter(Boolean) : [],
  };
}

export async function fetchProductOrPackBySlug(slug) {
  if (!slug) {
    return null;
  }
  const encoded = encodeURIComponent(slug);
  try {
    const product = await fetchJson(`/api/products/slug/${encoded}`);
    return mapApiProduct({ ...product, type: 'product' });
  } catch (error) {
    if (error.status && error.status !== 404) {
      throw error;
    }
  }

  try {
    const pack = await fetchJson(`/api/packs/slug/${encoded}`);
    return mapApiPack({ ...pack, type: 'pack' });
  } catch (error) {
    if (error.status && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function mapApiRealisation(raw) {
  if (!raw) return null;
  const slug = typeof raw.slug === 'string' ? raw.slug : raw.slug?.current ?? raw.id ?? '';
  return {
    id: (raw.id ?? slug) || null,
    slug,
    title: raw.title ?? '',
    description: raw.description ?? '',
    customer: raw.customer ?? raw.tags ?? null,
    url: raw.url ?? null,
    date: raw.date ?? null,
    featured: Boolean(raw.featured),
    imageUrl: raw.imageUrl ?? raw.image ?? null,
  };
}

export async function fetchRealisations() {
  const items = await fetchJson('/api/realisations');
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map(mapApiRealisation).filter(Boolean);
}

export async function fetchRealisationBySlug(slug) {
  if (!slug) return null;
  const encoded = encodeURIComponent(slug);
  try {
    const item = await fetchJson(`/api/realisations/slug/${encoded}`);
    return mapApiRealisation(item);
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}
