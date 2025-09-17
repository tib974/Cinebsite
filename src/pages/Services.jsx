import { Link } from 'react-router-dom';

const SERVICES = [
  {
    title: 'Installation & sécurisation',
    description: 'Montage complet des setups image, son et lumière avec sécurisation (liaisons, câbles, alimentation).',
  },
  {
    title: 'Assistance réalisateur',
    description: 'Un second regard pour piloter la caméra, la mise au point et la continuité lors des tournages serrés.',
  },
  {
    title: 'Régie & logistique',
    description: 'Coordination des équipes, gestion des accessoires et préparation du matériel pour une journée fluide.',
  },
  {
    title: 'Location sur mesure',
    description: 'Configuration de packs personnalisés selon votre scénario et vos contraintes techniques.',
  },
];

export default function Services() {
  return (
    <section>
      <header style={{ marginBottom: '18px' }}>
        <h1 className="section-title">Services</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          Au-delà de la location sèche, CinéB accompagne vos projets : préparation du plan de tournage, installation sur site,
          assistance plateau et régie matériel.
        </p>
      </header>

      <div className="grid cards">
        {SERVICES.map((service) => (
          <article key={service.title} className="card" style={{ minHeight: 160 }}>
            <div className="body">
              <div style={{ fontWeight: 800 }}>{service.title}</div>
              <div className="muted" style={{ marginTop: '8px' }}>{service.description}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="card" style={{ padding: '18px', marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Besoin d’un accompagnement complet ?</div>
          <div className="muted">Expliquez-nous votre projet : nous préparons une proposition en moins de 24h.</div>
        </div>
        <Link className="btn" to="/contact">Parler à CinéB</Link>
      </div>
    </section>
  );
}
