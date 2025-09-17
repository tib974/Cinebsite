import { useContext } from 'react';
import { QuoteContext } from '../context/quoteContextDefinition.js';

export function useQuote() {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}