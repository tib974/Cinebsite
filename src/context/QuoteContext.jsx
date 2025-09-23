import React, { useState, useEffect } from 'react';
import { QuoteContext } from './quoteContextDefinition.js';
import { reportError } from '../utils/errorReporter.js';

export function QuoteProvider({ children }) {
  const [quoteItems, setQuoteItems] = useState([]);

  // Charger le panier depuis le localStorage au démarrage
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('quoteCart');
      if (storedItems) {
        setQuoteItems(JSON.parse(storedItems));
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
    setQuoteItems(prevItems => {
      // Eviter les doublons
      if (prevItems.find(item => item.slug === product.slug)) {
        return prevItems;
      }
      return [...prevItems, product];
    });
  };

  const removeProductFromQuote = (productSlug) => {
    setQuoteItems(prevItems => prevItems.filter(item => item.slug !== productSlug));
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
