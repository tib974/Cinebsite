import { Link } from 'react-router-dom';

export default function Apropos() {
  return (
    <section>
      <h1 className="section-title">À propos</h1>
      <div className="card" style={{ padding: '20px', maxWidth: '840px' }}>
        <p>
          CinéB est un service de location et d’assistance audiovisuelle basé à La Réunion. Nous accompagnons les
          productions locales — films institutionnels, clips musicaux, publicités et livestreams — avec du matériel fiable et
          une présence terrain quand il faut.
        </p>
        <p className="muted">
          Caméras cinéma, optiques lumineuses, éclairages LED bi-color, HF et enregistreurs : tout est entretenu et testé
          avant chaque sortie. Besoin d’un pack prêt-à-tournage ou d’un renfort plateau ? On s’en charge.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '18px' }}>
          <Link className="btn" to="/packs">Consulter les packs</Link>
          <Link className="btn ghost" to="/materiel">Voir le matériel</Link>
        </div>
      </div>
    </section>
  );
}
