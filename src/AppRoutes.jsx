import { Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Packs from './pages/Packs.jsx';
import Materiel from './pages/Materiel.jsx';
import Calendrier from './pages/Calendrier.jsx';
import Apropos from './pages/Apropos.jsx';
import Contact from './pages/Contact.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import CampagneClip from './pages/CampagneClip.jsx';
import Guides from './pages/Guides.jsx';
import GuideDetail from './pages/GuideDetail.jsx';
import NotFound from './pages/NotFound.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="packs" element={<Packs />} />
        <Route path="materiel" element={<Materiel />} />
        <Route path="calendrier" element={<Calendrier />} />
        <Route path="campagne/clip" element={<CampagneClip />} />
        <Route path="guides" element={<Guides />} />
        <Route path="guides/:slug" element={<GuideDetail />} />
        <Route path="apropos" element={<Apropos />} />
        <Route path="contact" element={<Contact />} />
        <Route path="produit/:slug" element={<ProductDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
