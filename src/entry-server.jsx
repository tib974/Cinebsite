import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { QuoteProvider } from './context/QuoteContext.jsx';
import AppRoutes from './AppRoutes.jsx';
import './index.css';
import './theme-poppins.css';

export function render(url) {
  const html = renderToString(
    <React.StrictMode>
      <QuoteProvider>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </QuoteProvider>
    </React.StrictMode>
  );

  return { html };
}
