import { Outlet } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AnalyticsConsentBanner from './components/AnalyticsConsentBanner.jsx';
import AnalyticsTracker from './components/AnalyticsTracker.jsx';
import './App.css';

export default function App() {
  return (
    <>
      <AnalyticsTracker />
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <Header />
      <main id="contenu" className="container">
        <Outlet />
      </main>
      <Footer />
      <AnalyticsConsentBanner />
    </>
  );
}
