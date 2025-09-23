import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer" style={{ padding: '24px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>© {year} CinéB — La Réunion</div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
        <Link to="/packs">Packs</Link>
        <Link to="/materiel">Matériel</Link>
        <Link to="/guides">Guides</Link>
        <Link to="/contact">Devis</Link>
        <Link to="/campagne/clip">Campagne clip</Link>
        <a href="https://calendly.com/grondin-thibaut/demande-de-reservation-cineb" target="_blank" rel="noreferrer">
          Calendly
        </a>
      </div>
    </footer>
  );
}
