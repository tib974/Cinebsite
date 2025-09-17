import React, { useState, useEffect } from 'react';
import { QuoteContext } from './quoteContextDefinition.js';

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
      console.error("Erreur lors du chargement du panier depuis localStorage", error);
    }
  }, []);

  // Sauvegarder le panier dans le localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem('quoteCart', JSON.stringify(quoteItems));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du panier dans localStorage", error);
    }
  }, [quoteItems]);

  const addProductToQuote = (product) => {
    setQuoteItems(prevItems => {
      // Eviter les doublons
      if (prevItems.find(item => item._id === product._id)) {
        return prevItems;
      }
      return [...prevItems, product];
    });
  };

  const removeProductFromQuote = (productId) => {
    setQuoteItems(prevItems => prevItems.filter(item => item._id !== productId));
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
