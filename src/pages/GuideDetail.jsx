import { Link, useParams } from 'react-router-dom';
import { getGuide } from '../content/guides.js';

export default function GuideDetail() {
  const { slug } = useParams();
  const guide = getGuide(slug);

  if (!guide) {
    return (
      <section className="card" style={{ padding: '24px' }}>
        <h1 className="section-title" style={{ marginTop: 0 }}>Guide introuvable</h1>
        <p className="muted">Le guide demandé n’existe pas ou a été déplacé.</p>
        <Link className="btn" to="/guides">Retour aux guides</Link>
      </section>
    );
  }

  return (
    <article className="card guide-detail">
      <header className="guide-detail__header">
        <Link className="btn ghost" to="/guides" style={{ justifySelf: 'flex-start' }}>
          ← Retour aux guides
        </Link>
        <h1 className="section-title" style={{ marginBottom: 0 }}>{guide.title}</h1>
        {guide.excerpt && <p className="muted" style={{ marginBottom: 0 }}>{guide.excerpt}</p>}
      </header>

      <div
        className="guide-detail__content"
        dangerouslySetInnerHTML={{ __html: guide.html }}
      />
    </article>
  );
}
