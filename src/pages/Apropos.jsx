import { Link } from 'react-router-dom';

export default function Apropos() {
  return (
    <>
      <h1 className="section-title">À propos</h1>
      <div className="card" style={{padding: '18px'}}>
        <p>CinéB — location & services audiovisuels à La Réunion. Packs prêts-à-tournage, assistance plateau, régie.</p>
        <p className="muted">Besoin d’un coup de main ? <Link to="/contact" className="btn" style={{marginLeft: '8px'}}>Contact / Devis</Link></p>
      </div>
    </>
  );
}