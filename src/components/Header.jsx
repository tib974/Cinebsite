import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuote } from '../hooks/useQuote.js';

const LINKS = [
  { to: '/materiel', label: 'Notre matériel' },
  { to: '/packs', label: 'Packs' },
  { to: '/contact', label: 'Contact / Devis' },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchValue.trim()) return;
    setSearchOpen(false);
    navigate(`/materiel?recherche=${encodeURIComponent(searchValue.trim())}`);
    setSearchValue('');
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    if (searchOpen) {
      window.addEventListener('keydown', handleKey);
    }
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

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
          <button
            type="button"
            className="btn ghost nav-search"
            aria-label="Rechercher dans le catalogue"
            onClick={() => {
              setSearchOpen(true);
              setMenuOpen(false);
            }}
          >
            🔍
          </button>
          <QuoteStatus />
          <Link className="btn" to="/calendrier">
            Calendrier
          </Link>
        </div>
      </div>
      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true">
          <form className="search-overlay__box" onSubmit={handleSearchSubmit}>
            <label htmlFor="headerSearch" className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Rechercher un produit ou pack
            </label>
            <input
              id="headerSearch"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="FX30, pack lumière, carte SD…"
              autoFocus
            />
            <div className="search-overlay__actions">
              <button type="button" className="btn ghost" onClick={() => setSearchOpen(false)}>
                Fermer
              </button>
              <button type="submit" className="btn">
                Rechercher
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
