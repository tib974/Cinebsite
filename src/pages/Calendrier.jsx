import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Styles par défaut du calendrier

export default function Calendrier() {
  // Garde en mémoire la date sélectionnée
  const [date, setDate] = useState(new Date());

  // Garde en mémoire les données du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    message: ''
  });

  // Met à jour le state du formulaire quand l'utilisateur tape
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gère l'envoi du formulaire
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Pour l'instant, on affiche une alerte. Plus tard, on enverra à une API.
    alert(`Demande envoyée pour le ${date.toLocaleDateString('fr-FR')} par ${formData.nom}`);
    console.log({ date, ...formData });
  };

  return (
    <>
      <h1 className="section-title">Réserver un créneau</h1>
      <div className="grid cal-layout">
        <div className="card" style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
          <Calendar
            onChange={setDate}
            value={date}
            locale="fr-FR" // Affiche le calendrier en français
          />
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <h3>Demande rapide</h3>
          <form id="slotForm" onSubmit={handleFormSubmit}>
            <input
              name="nom"
              placeholder="Nom"
              value={formData.nom}
              onChange={handleFormChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleFormChange}
              required
            />
            <p className="muted" style={{fontSize: '0.9em'}}>Date sélectionnée : <strong>{date.toLocaleDateString('fr-FR')}</strong></p>
            <textarea
              name="message"
              rows={3}
              placeholder="Précisions (optionnel)"
              value={formData.message}
              onChange={handleFormChange}
            ></textarea>
            <button type="submit" className="btn">Envoyer la demande</button>
          </form>
        </div>
      </div>
    </>
  );
}
