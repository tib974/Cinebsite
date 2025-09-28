export async function loadCatalog() {
  const response = await fetch('./data/catalog.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Impossible de charger catalog.json (${response.status})`);
  }
  return response.json();
}

export function formatPrice(value) {
  if (value === null || value === undefined) return 'Prix sur demande';
  return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: value % 1 ? 2 : 0 })}€ / jour`;
}

export function findProduct(catalog, slug) {
  return catalog.products.find((item) => item.slug === slug);
}

export function findPack(catalog, slug) {
  return catalog.packs.find((item) => item.slug === slug);
}

export function findAnyItem(catalog, slug) {
  return findProduct(catalog, slug) || findPack(catalog, slug);
}

export function resolvePackItems(catalog, pack) {
  if (!pack) return [];
  return (pack.items || []).map((productSlug) => findProduct(catalog, productSlug)).filter(Boolean);
}

export function queryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
