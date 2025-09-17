import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';
import { realisations } from '../data/index.js';

const ENABLE_SANITY_FETCH = import.meta.env.VITE_SANITY_FETCH === 'true';

function getSanityImageUrl(image) {
  try {
    return image ? urlFor(image).width(800).url() : '';
  } catch {
    return '';
  }
}

export default function Realisations() {
  const [items, setItems] = useState(realisations);
  const [loading, setLoading] = useState(ENABLE_SANITY_FETCH);

  useEffect(() => {
    if (!ENABLE_SANITY_FETCH) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadRealisations() {
      try {
        const query = `*[_type == "project"] | order(date desc)`;
        const data = await sanityClient.fetch(query);
        if (!isMounted || !Array.isArray(data) || !data.length) {
          setLoading(false);
          return;
        }
        const normalized = data.map((item) => ({
          id: item._id,
          title: item.title,
          slug: item.slug?.current,
          customer: item.customer,
          description: item.description,
          date: item.date,
          image: getSanityImageUrl(item.image),
        })).filter((item) => item.slug);

        if (normalized.length && isMounted) {
          setItems(normalized);
        }
      } catch (fetchError) {
        console.warn('[Realisations] Sanity fetch failed, using local fallback.', fetchError);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRealisations();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section>
      <header style={{ marginBottom: '18px' }}>
        <h1 className="section-title">Réalisations</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          Sélection de projets tournés avec les équipes et le matériel CinéB : brand content, clip, interview et livestream.
        </p>
      </header>

      {loading && <p className="muted">Chargement des projets…</p>}

      {!loading && (
        <div className="grid cards grid-reals">
          {items.map((item) => (
            <Link key={item.slug ?? item.id} to={`/realisation/${item.slug ?? item.id}`} className="card">
              <div className="media media-16x9">
                {item.image && <img src={item.image} alt={item.title} loading="lazy" decoding="async" />}
              </div>
              <div className="body">
                <div className="title" style={{ fontWeight: 700 }}>{item.title}</div>
                {item.customer && <div className="muted">{item.customer}</div>}
                {item.date && (
                  <div className="muted" style={{ marginTop: '6px', fontSize: '0.85rem' }}>
                    {new Date(item.date).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
