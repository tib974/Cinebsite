import { Link } from 'react-router-dom';
import { getGuides } from '../content/guides.js';

const guides = getGuides();

export default function Guides() {
  return (
    <section>
      <header className="guides-header">
        <h1 className="section-title" style={{ margin: 0 }}>Guides de tournage</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          Conseils pratiques pour préparer vos locations CinéB : choix des packs, check-list matériel et astuces terrain.
          Ajoutez, modifiez ou supprimez ces guides en éditant les fichiers Markdown dans `docs/content/`.
        </p>
      </header>

      <div className="grid cards guides-list">
        {guides.map((guide) => (
          <article key={guide.slug} className="card">
            <div className="body" style={{ display: 'grid', gap: '12px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{guide.title}</div>
              {guide.excerpt && <p className="muted" style={{ margin: 0 }}>{guide.excerpt}</p>}
              <div>
                <Link className="btn ghost" to={`/guides/${guide.slug}`}>
                  Lire le guide
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
