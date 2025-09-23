import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import sanityClient, { urlFor } from '../sanityClient.js';
import { reportError } from '../utils/errorReporter.js';

export default function RealisationDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function fetchSanityItem() {
      setLoading(true);
      setHasError(false);
      try {
        const query = `*[_type == "realisation" && slug.current == $slug][0]`;
        const data = await sanityClient.fetch(query, { slug });
        setItem(data);
      } catch (error) {
        reportError(error, { feature: 'realisations-detail', slug });
        setHasError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSanityItem();
  }, [slug]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '18px' }}>
        <p className="muted">Chargement de la réalisation…</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="card" style={{ padding: '18px' }}>
        <h1 className="section-title" style={{ marginTop: 0 }}>Indisponible</h1>
        <p className="muted">La fiche réalisation ne peut pas être chargée. Merci de réessayer plus tard.</p>
        <Link className="btn" to="/realisations" style={{ marginTop: '12px', display: 'inline-flex' }}>
          Voir toutes les réalisations
        </Link>
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
          <img src={urlFor(item.image).width(960).url()} alt={item.title} loading="lazy" decoding="async" />
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
