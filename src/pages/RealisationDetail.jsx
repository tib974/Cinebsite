import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';
import { realisationsBySlug } from '../data/index.js';

const ENABLE_SANITY_FETCH = import.meta.env.VITE_SANITY_FETCH === 'true';

function buildSanityItem(raw) {
  if (!raw) return null;
  return {
    title: raw.title,
    slug: raw.slug?.current?.toLowerCase(),
    customer: raw.customer,
    description: raw.description,
    date: raw.date,
    image: raw.image ? urlFor(raw.image).width(960).url() : '',
    url: raw.url,
  };
}

export default function RealisationDetail() {
  const { slug = '' } = useParams();
  const normalizedSlug = slug.toLowerCase();
  const initial = realisationsBySlug.get(normalizedSlug) || null;
  const [item, setItem] = useState(initial);
  const [loading, setLoading] = useState(!initial && ENABLE_SANITY_FETCH);

  useEffect(() => {
    if (initial || !ENABLE_SANITY_FETCH) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchSanityItem() {
      try {
        const query = `*[_type == "project" && slug.current == $slug][0]`;
        const data = await sanityClient.fetch(query, { slug: normalizedSlug });
        if (!isMounted) return;
        const parsed = buildSanityItem(data);
        if (parsed) setItem(parsed);
      } catch (error) {
        console.warn('[RealisationDetail] Sanity fetch failed, showing fallback message.', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSanityItem();

    return () => {
      isMounted = false;
    };
  }, [initial, normalizedSlug]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '18px' }}>
        <p className="muted">Chargement de la réalisation…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="card" style={{ padding: '18px' }}>
        <h1 className="section-title" style={{ marginTop: 0 }}>Réalisation introuvable</h1>
        <p className="muted">Ce projet n’existe plus ou a été renommé.</p>
        <Link className="btn" to="/realisations" style={{ marginTop: '12px', display: 'inline-flex' }}>
          Voir toutes les réalisations
        </Link>
      </div>
    );
  }

  return (
    <article className="card" style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <Link to="/realisations" className="btn ghost" style={{ marginBottom: '12px', display: 'inline-flex' }}>
        ← Retour aux réalisations
      </Link>
      <h1 className="section-title" style={{ marginTop: 0 }}>{item.title}</h1>
      {item.date && <p className="muted">{new Date(item.date).toLocaleDateString('fr-FR')}</p>}
      {item.image && (
        <div className="media media-16x9" style={{ marginTop: '18px' }}>
          <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
        </div>
      )}
      {item.description && <p style={{ marginTop: '18px' }}>{item.description}</p>}
      {item.url && (
        <a className="btn" href={item.url} target="_blank" rel="noreferrer" style={{ marginTop: '18px', display: 'inline-flex' }}>
          Voir le projet
        </a>
      )}
    </article>
  );
}
