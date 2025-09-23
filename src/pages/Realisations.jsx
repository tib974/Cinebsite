import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';
import { reportError } from '../utils/errorReporter.js';

export default function Realisations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadRealisations() {
      setLoading(true);
      setHasError(false);
      try {
        const query = `*[_type == "realisation"] | order(date desc)`;
        const data = await sanityClient.fetch(query);
        setItems(data || []);
      } catch (fetchError) {
        reportError(fetchError, { feature: 'realisations-list' });
        setHasError(true);
      } finally {
        setLoading(false);
      }
    }

    loadRealisations();
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

      {!loading && hasError && (
        <div className="card" style={{ padding: '18px' }}>
          <p className="muted" style={{ margin: 0 }}>Les réalisations ne peuvent pas être chargées pour le moment.</p>
        </div>
      )}

      {!loading && !hasError && (
        <div className="grid cards grid-reals">
          {items.map((item) => (
            <Link key={item._id} to={`/realisation/${item.slug?.current}`} className="card">
              <div className="media media-16x9">
                {item.image && <img src={urlFor(item.image).width(600).url()} alt={item.title} loading="lazy" decoding="async" />}
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
