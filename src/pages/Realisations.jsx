import { useState, useEffect } from 'react';
import sanityClient, { urlFor } from '../sanityClient';

function RealisationCard({ item }) {
  const imageUrl = item.image ? urlFor(item.image).width(400).url() : '';

  return (
    <a href={`/realisation/${item.slug.current}`} className="card">
      <div className="media">
        {imageUrl && <img src={imageUrl} alt={item.title} loading="lazy" decoding="async" />}
      </div>
      <div className="body">
        <div className="title">{item.title}</div>
        <div className="muted">{item.customer}</div>
      </div>
    </a>
  );
}

export default function Realisations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = `*[_type == "project"]`;
    sanityClient.fetch(query)
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <h1 className="section-title">Réalisations</h1>
      <div id="realisationsGrid" className="grid grid-reals">
        {loading ? <p>Chargement...</p> : items.map(item => (
          <RealisationCard key={item._id} item={item} />
        ))}
      </div>
    </>
  );
}
