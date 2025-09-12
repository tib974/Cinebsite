import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import Packs from './pages/Packs.jsx';
import Realisations from './pages/Realisations.jsx';
import Calendrier from './pages/Calendrier.jsx';
import Apropos from './pages/Apropos.jsx';
import Contact from './pages/Contact.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import RealisationDetail from './pages/RealisationDetail.jsx';
import './index.css';
import './theme-poppins.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'services', element: <Services /> },
      { path: 'packs', element: <Packs /> },
      { path: 'realisations', element: <Realisations /> },
      { path: 'calendrier', element: <Calendrier /> },
      { path: 'apropos', element: <Apropos /> },
      { path: 'contact', element: <Contact /> },
      // Routes pour les pages de détail
      { path: 'produit/:slug', element: <ProductDetail /> },
      { path: 'realisation/:slug', element: <RealisationDetail /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);