import { Link } from 'react-router-dom';

const STEPS = [
  {
    title: 'Brief express',
    description: '15 minutes pour valider objectifs, storyboard et contraintes techniques. Nous revenons avec un plan matériel clair.'
  },
  {
    title: 'Préparation plateau',
    description: 'Packs image + lumière prêts la veille, tests HF et contrôle batteries. Livraison ou retrait possible sur Saint-Denis.'
  },
  {
    title: 'Tournage accompagné',
    description: 'Assistance cadre/lumière en option pour sécuriser les prises, suivi du timing et repli du matériel.'
  }
];

const HIGHLIGHTS = [
  {
    title: 'Pack image cinéma',
    description: 'Caméra Super 35 (FX30 ou équivalent) + optiques lumineuses 24/70 et 50mm, monitoring HDMI SDI.'
  },
  {
    title: 'Lumière interview',
    description: '2 panneaux LED bi-color + torche keylight avec softbox, alimentation secteur ou batteries V-Mount.'
  },
  {
    title: 'Son pro propre',
    description: 'Routeur HF double émetteur + enregistreur audio autonome, perche et bonnette anti-vent.'
  }
];

const DELIVERABLES = [
  'Pack matériel complet prêt à tourner',
  'Feuille de route technique + planning D-1',
  'Assistance plateau optionnelle (cadreur, lumière)',
  'Livraison rushes sur SSD fourni ou disque client'
];

export default function CampagneClip() {
  return (
    <section className="campaign">
      <header className="campaign-hero card">
        <div className="campaign-hero__content">
          <span className="badge badge-hero">Campagne Clip</span>
          <h1 className="section-title" style={{ margin: '0 0 12px' }}>
            Tournez un clip percutant en 48h avec CinéB
          </h1>
          <p className="muted" style={{ maxWidth: 560 }}>
            Nous préparons un setup image + lumière + son calibré pour votre clip musical ou brand content et vous accompagnons du brief au shoot.
          </p>
          <div className="campaign-hero__ctas">
            <Link className="btn" to="/contact?campagne=clip">Demander un devis express</Link>
            <Link className="btn ghost" to="/packs">Voir les packs prêts</Link>
          </div>
        </div>
        <div className="campaign-hero__meta">
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Idéal pour</div>
            <ul className="campaign-list">
              <li>Clips musicaux</li>
              <li>Brand content 30-90s</li>
              <li>Interviews cinématographiques</li>
            </ul>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Créneau type</div>
            <div className="muted">Brief lundi → repérage mardi → tournage mercredi.</div>
          </div>
        </div>
      </header>

      <section className="campaign-section">
        <h2 className="section-title" style={{ margin: 0 }}>Ce que nous préparons pour vous</h2>
        <p className="muted" style={{ maxWidth: 620 }}>
          Tout est testé et prêt à l’emploi. Vous n’avez qu’à arriver sur le plateau et tourner votre plan de clip.
        </p>
        <div className="grid cards">
          {HIGHLIGHTS.map((item) => (
            <article key={item.title} className="card" style={{ minHeight: 180 }}>
              <div className="body">
                <div style={{ fontWeight: 800 }}>{item.title}</div>
                <div className="muted" style={{ marginTop: '8px' }}>{item.description}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="campaign-section">
        <h2 className="section-title" style={{ margin: 0 }}>Comment se déroule la campagne</h2>
        <div className="campaign-steps">
          {STEPS.map((step, index) => (
            <article key={step.title} className="card" style={{ padding: '20px', display: 'grid', gap: '12px' }}>
              <span className="campaign-step-number">{index + 1}</span>
              <div style={{ fontWeight: 800 }}>{step.title}</div>
              <div className="muted">{step.description}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="campaign-section">
        <div className="campaign-deliverables card">
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Livrables inclus</h2>
            <ul className="campaign-list">
              {DELIVERABLES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="campaign-deliverables__cta">
            <div style={{ fontWeight: 700 }}>Besoin d’un plan de tournage plus conséquent ?</div>
            <p className="muted" style={{ margin: '6px 0 14px' }}>
              Nous pouvons réserver un plateau, ajouter un second opérateur et gérer la post-production via nos partenaires.
            </p>
            <Link className="btn" to="/contact?campagne=clip">Parler au team CinéB</Link>
          </div>
        </div>
      </section>
    </section>
  );
}
