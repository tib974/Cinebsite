import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuote } from '../hooks/useQuote.js';

const LINKS = [
  { to: '/packs', label: 'Catalogue' },
  { to: '/realisations', label: 'Réalisations' },
  { to: '/services', label: 'Services' },
  { to: '/apropos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
];

function QuoteStatus() {
  const { quoteItems } = useQuote();
  
  return (
    <Link className="btn ghost" to="/contact" title="Voir la sélection pour le devis">
      Devis {quoteItems.length > 0 && `(${quoteItems.length})`}
    </Link>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      if (!menuOpen) return;
      const nav = document.getElementById('navMain');
      if (!nav) return;
      if (nav.contains(event.target)) return;
      if (event.target.closest('.nav-toggle')) return;
      setMenuOpen(false);
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen);
  }, [menuOpen]);

  return (
    <header className="header">
      <div className="container">
        <Link className="brand" to="/" aria-label="Retour à l’accueil">
          <img src="/assets/logo.webp" alt="CinéB" className="logo" width="1024" height="1024" />
        </Link>
        <button
          type="button"
          className="btn ghost nav-toggle"
          aria-label="Ouvrir le menu"
          aria-controls="navMain"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          Menu
        </button>
        <nav id="navMain" className={`nav-center${menuOpen ? ' open' : ''}`} role="navigation" aria-label="Navigation principale">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-cta">
          <QuoteStatus />
          <Link className="btn" to="/calendrier">
            Calendrier
          </Link>
        </div>
      </div>
    </header>
  );
}
