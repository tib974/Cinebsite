import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview, initAnalytics } from '../utils/analytics.js';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageview(`${location.pathname}${location.search}`);
  }, [location]);

  return null;
}

