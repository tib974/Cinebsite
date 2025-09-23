import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes.jsx';
import { QuoteProvider } from './context/QuoteContext.jsx';
import { initErrorMonitoring } from './utils/errorReporter.js';
import './index.css';
import './theme-poppins.css';

if (typeof window !== 'undefined') {
  initErrorMonitoring();
}

const app = (
  <React.StrictMode>
    <QuoteProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QuoteProvider>
  </React.StrictMode>
);

const container = document.getElementById('root');

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
