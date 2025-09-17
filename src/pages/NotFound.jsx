import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="card" style={{ padding: '24px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <h1 className="section-title" style={{ marginTop: 0 }}>Page introuvable</h1>
      <p className="muted">La page demandée n’existe pas ou a été déplacée.</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '18px' }}>
        <Link className="btn" to="/">
          Retour à l’accueil
        </Link>
        <Link className="btn ghost" to="/packs">
          Voir le catalogue
        </Link>
      </div>
    </section>
  );
}

