// src/pages/RealisationDetail.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { mockRealisations } from '../../_data.js';

export default function RealisationDetail() {
  const [item, setItem] = useState(null);
  const { slug } = useParams();

  useEffect(() => {
    const foundItem = mockRealisations.find(p => p.slug === slug);
    setItem(foundItem);
  }, [slug]);

  if (!item) {
    return <p>Réalisation non trouvée.</p>;
  }

  return (
    <div>
      <h1 className="section-title">{item.title}</h1>
      <img src={item.image} alt={item.title} style={{maxWidth: '400px', borderRadius: 'var(--radius)'}} />
      <p>Client: {item.customer}</p>
    </div>
  );
}
