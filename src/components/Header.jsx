import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <Link className="brand" to="/" aria-label="Retour à l’accueil">
          <img src="/assets/logo.webp" alt="CinéB" className="logo" width="1024" height="1024" />
        </Link>
        <button className="btn ghost nav-toggle" aria-label="Ouvrir le menu" aria-controls="navMain" aria-expanded="false">Menu</button>
        <nav id="navMain" className="nav-center" role="navigation" aria-label="Navigation principale">
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/packs">Packs & Matériel</NavLink>
          <NavLink to="/realisations">Réalisations</NavLink>
          <NavLink to="/calendrier">Calendrier</NavLink>
          <NavLink to="/apropos">À propos</NavLink>
        </nav>
        <div className="nav-cta">
          <Link className="btn ghost" to="/calendrier" title="Voir ma sélection">Voir ma sélection</Link>
          <Link className="btn" to="/contact">Contact / Devis</Link>
        </div>
      </div>
    </header>
  );
}
