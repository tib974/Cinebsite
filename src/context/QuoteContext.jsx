import React, { useState, useEffect } from 'react';
import { QuoteContext } from './quoteContextDefinition.js';
import { reportError } from '../utils/errorReporter.js';

function normalizeQuoteItem(item) {
  if (!item) return null;
  const slug = typeof item.slug === 'string' ? item.slug : item.slug?.current ?? '';
  if (!slug) {
    return null;
  }
  return {
    id: item.id ?? item._id ?? null,
    slug,
    name: item.name ?? '',
    type: item.type ?? 'product',
    dailyPrice: item.dailyPrice ?? item.pricePerDay ?? null,
  };
}

export function QuoteProvider({ children }) {
  const [quoteItems, setQuoteItems] = useState([]);

  // Charger le panier depuis le localStorage au démarrage
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('quoteCart');
      if (storedItems) {
        const parsed = JSON.parse(storedItems);
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map(normalizeQuoteItem)
            .filter(Boolean);
          setQuoteItems(normalized);
        }
      }
    } catch (error) {
      reportError(error, { feature: 'quote-context-load' });
    }
  }, []);

  // Sauvegarder le panier dans le localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem('quoteCart', JSON.stringify(quoteItems));
    } catch (error) {
      reportError(error, { feature: 'quote-context-save' });
    }
  }, [quoteItems]);

  const addProductToQuote = (product) => {
    const normalized = normalizeQuoteItem(product);
    if (!normalized) {
      return;
    }
    setQuoteItems((prevItems) => {
      if (prevItems.some((item) => item.slug === normalized.slug)) {
        return prevItems;
      }
      return [...prevItems, normalized];
    });
  };

  const removeProductFromQuote = (productSlug) => {
    setQuoteItems((prevItems) => prevItems.filter((item) => item.slug !== productSlug));
  };

  const clearQuote = () => {
    setQuoteItems([]);
  };

  const value = {
    quoteItems,
    addProductToQuote,
    removeProductFromQuote,
    clearQuote,
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
}
