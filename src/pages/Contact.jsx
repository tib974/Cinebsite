import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuote } from '../hooks/useQuote.js';
import { reportError } from '../utils/errorReporter.js';
import 'react-calendar/dist/Calendar.css';

const Calendar = lazy(() => import('react-calendar'));

const MONTHS = {
  janvier: 0,
  fevrier: 1,
  février: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  août: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
  décembre: 11,
};

function normalizeMonthKey(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function parseFrenchDate(value) {
  if (!value) return null;
  const parts = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ');
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  if (!Number.isFinite(day)) return null;
  const monthIndex = MONTHS[normalizeMonthKey(parts[1])];
  if (monthIndex === undefined) return null;
  const year = parts.length >= 3 ? parseInt(parts[2], 10) : new Date().getFullYear();
  if (!Number.isFinite(year)) return null;
  const parsed = new Date(Date.UTC(year, monthIndex, day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseIsoRange(value) {
  if (!value) return null;
  const matches = value.match(/\d{4}-\d{2}-\d{2}/g);
  if (!matches || matches.length === 0) return null;
  const [start, end] = matches;
  return {
    start,
    end: end || start,
  };
}

function parseHumanRange(value) {
  if (!value) return null;
  const sanitized = value.replace(/\s*(?:-|–|au)\s*/gi, '|');
  const [first, second] = sanitized.split('|');
  const startDate = parseFrenchDate(first);
  const endDate = parseFrenchDate(second || first);
  if (!startDate || !endDate) return null;
  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  };
}

function formatDateLabel(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateRangeLabel(range) {
  if (!range.start && !range.end) return '';
  const startLabel = formatDateLabel(range.start);
  const endLabel = range.end ? formatDateLabel(range.end) : '';
  if (!startLabel) return '';
  if (!endLabel || range.start === range.end) {
    return startLabel;
  }
  return `${startLabel} - ${endLabel}`;
}

function getProgressiveDiscount(duration) {
  if (duration >= 7) return 0.60;
  if (duration >= 5) return 0.70;
  if (duration >= 3) return 0.85;
  return 1;
}

function calculatePrice(dailyPrice, duration) {
  if (!dailyPrice || duration <= 0) return 0;
  const discount = getProgressiveDiscount(duration);
  return dailyPrice * duration * discount;
}

function calculateDuration(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  if (endDate < startDate) return 0;
  const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  return Math.round(diff) + 1;
}

function toCalendarValue(range) {
  const start = range.start ? new Date(range.start) : null;
  const end = range.end ? new Date(range.end) : null;
  if (start && end) {
    return [start, end];
  }
  if (start) {
    return [start, start];
  }
  const today = new Date();
  return [today, today];
}

function QuoteSummary({ items, dateRange, onDatesChange, onClear }) {
  const totalPerDay = useMemo(() => items.reduce((sum, item) => sum + (item.pricePerDay || 0), 0), [items]);
  const duration = useMemo(() => calculateDuration(dateRange.start, dateRange.end), [dateRange.start, dateRange.end]);
  const hasEstimate = duration > 0 && items.length > 0;
  const totalPrice = hasEstimate ? calculatePrice(totalPerDay, duration) : 0;

  if (items.length === 0) return null;

  return (
    <div className="card quote-summary">
      <div className="quote-summary__header">
        <h2>Votre sélection</h2>
        <button onClick={onClear} className="btn ghost" style={{ fontSize: '0.8rem' }}>Vider</button>
      </div>
      <ul className="quote-summary__list">
        {items.map((item) => (
          <li key={item._id}>
            <span>{item.name}</span>
            <span className="muted">{item.pricePerDay ? `${item.pricePerDay}€/j` : 'Sur devis'}</span>
          </li>
        ))}
      </ul>
      <div className="quote-summary__dates">
        <label htmlFor="quote-start">Début</label>
        <label htmlFor="quote-end">Fin</label>
        <input
          id="quote-start"
          type="date"
          value={dateRange.start}
          onChange={(event) => onDatesChange({ start: event.target.value })}
        />
        <input
          id="quote-end"
          type="date"
          value={dateRange.end}
          onChange={(event) => onDatesChange({ end: event.target.value })}
        />
      </div>
      {hasEstimate && (
        <div className="quote-summary__estimate">
          <span className="muted">{duration} jour{duration > 1 ? 's' : ''}</span>
          <strong>{totalPrice.toFixed(2)}€</strong>
        </div>
      )}
    </div>
  );
}

export default function Contact() {
  const [searchParams] = useSearchParams();
  const { quoteItems, clearQuote } = useQuote();
  const [presetItem, setPresetItem] = useState('');
  const [formStatus, setFormStatus] = useState({ state: 'idle', message: '' });
  const formStartRef = useRef(Date.now());
  const [itemsInput, setItemsInput] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [manualDatesLabel, setManualDatesLabel] = useState('');

  const handleDatesChange = (updates) => {
    setManualDatesLabel('');
    setDateRange((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  useEffect(() => {
    const queryItemSlug = (searchParams.get('items') || '').trim();
    if (!queryItemSlug || quoteItems.length > 0) return;
    setPresetItem(queryItemSlug);
  }, [searchParams, quoteItems]);

  const presetDates = useMemo(() => (searchParams.get('dates') || '').trim(), [searchParams]);

  useEffect(() => {
    if (!presetDates) return;
    const isoRange = parseIsoRange(presetDates);
    if (isoRange) {
      setManualDatesLabel('');
      setDateRange(isoRange);
      return;
    }
    const humanRange = parseHumanRange(presetDates);
    if (humanRange) {
      setManualDatesLabel('');
      setDateRange(humanRange);
      return;
    }
    setManualDatesLabel(presetDates);
  }, [presetDates]);

  const itemsForForm = useMemo(() => {
    if (quoteItems.length > 0) {
      return quoteItems.map((item) => item.name).join(', ');
    }
    return presetItem;
  }, [quoteItems, presetItem]);

  useEffect(() => {
    setItemsInput(itemsForForm);
  }, [itemsForForm]);

  const formattedDates = useMemo(() => {
    const label = formatDateRangeLabel(dateRange);
    if (label) return label;
    return manualDatesLabel;
  }, [dateRange, manualDatesLabel]);

  const handleCalendarChange = (value) => {
    if (Array.isArray(value)) {
      const [start, end] = value;
      const isoStart = start ? start.toISOString().slice(0, 10) : '';
      const isoEnd = end ? end.toISOString().slice(0, 10) : isoStart;
      setManualDatesLabel('');
      setDateRange({ start: isoStart, end: isoEnd });
    }
  };

  const formatedCalendarValue = useMemo(() => toCalendarValue(dateRange), [dateRange]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const elapsed = Date.now() - formStartRef.current;
    if (elapsed < 3000) {
      setFormStatus({ state: 'error', message: 'Merci de patienter quelques secondes avant d’envoyer votre demande.' });
      return;
    }

    setFormStatus({ state: 'loading', message: '' });

    const form = event.target;
    const formData = new FormData(form);
    formData.append('submittedAt', new Date().toISOString());
    formData.set('dates', formattedDates);
    formData.append('datesStart', dateRange.start);
    formData.append('datesEnd', dateRange.end);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Formspree a répondu ${response.status}`);
      }

      setFormStatus({ state: 'success', message: 'Merci ! Votre demande est bien envoyée. Nous revenons vers vous rapidement.' });
      form.reset();
      setPresetItem('');
      setItemsInput('');
      setDateRange({ start: '', end: '' });
      setManualDatesLabel('');
      formStartRef.current = Date.now();
      if (quoteItems.length > 0) {
        clearQuote();
      }
    } catch (error) {
      reportError(error, { feature: 'contact-form-submit' });
      setFormStatus({ state: 'error', message: 'Une erreur est survenue. Merci de réessayer ou de nous contacter directement par email.' });
    }
  };

  return (
    <section className="contact-grid">
      <div className="contact-grid__sidebar">
        <div className="card contact-intro">
          <h1 className="section-title" style={{ marginTop: 0 }}>Contact</h1>
          <p className="muted">Partagez-nous votre projet : dates, matériel, contenu prévu.</p>
          <ul className="contact-intro__list">
            <li><strong>Email :</strong> <a href="mailto:contact@cineb.re">contact@cineb.re</a></li>
            <li><strong>Téléphone :</strong> <a href="tel:+262692340321">+262 692 34 03 21</a></li>
            <li><strong>Localisation :</strong> Saint-Denis, La Réunion.</li>
          </ul>
        </div>

        <div className="card contact-calendar">
          <div className="contact-calendar__header">
            <h2>Calendrier</h2>
            <p className="muted">Choisissez une plage : le champ "Dates" se mettra à jour automatiquement.</p>
          </div>
          <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Chargement du calendrier…</div>}>
            <Calendar selectRange onChange={handleCalendarChange} value={formatedCalendarValue} locale="fr-FR" />
          </Suspense>
        </div>

        <QuoteSummary items={quoteItems} dateRange={dateRange} onDatesChange={handleDatesChange} onClear={clearQuote} />
      </div>

      <div className="contact-grid__main">
        <div className="card contact-form">
          <form
            id="contactForm"
            action="https://formspree.io/f/xandgvea"
            method="POST"
            onSubmit={handleSubmit}
            className="contact-form__layout"
          >
            <input type="text" name="website" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
            <input type="hidden" name="formLoadedAt" value={formStartRef.current} />
            <div className="contact-form__group">
              <label htmlFor="contact-name">Nom</label>
              <input id="contact-name" name="name" placeholder="Nom" required autoComplete="family-name" />
            </div>
            <div className="contact-form__group">
              <label htmlFor="contact-firstname">Prénom</label>
              <input id="contact-firstname" name="firstname" placeholder="Prénom" autoComplete="given-name" />
            </div>
            <div className="contact-form__group">
              <label htmlFor="contact-email">Email</label>
              <input id="contact-email" name="email" type="email" placeholder="Email" required autoComplete="email" />
            </div>
            <div className="contact-form__group">
              <label htmlFor="contact-phone">Téléphone</label>
              <input id="contact-phone" name="phone" type="tel" placeholder="Téléphone (optionnel)" autoComplete="tel" />
            </div>
            <div className="contact-form__group contact-form__group--full">
              <label htmlFor="contact-items">Matériel / Pack souhaité</label>
              <input
                id="contact-items"
                name="items"
                placeholder="Matériel / Pack souhaité"
                value={itemsInput}
                onChange={(event) => setItemsInput(event.target.value)}
                readOnly={quoteItems.length > 0}
              />
            </div>
            <div className="contact-form__group contact-form__group--full">
              <label htmlFor="contact-dates">Dates ou période</label>
              <input
                id="contact-dates"
                name="dates"
                placeholder="Sélectionnez vos dates dans le calendrier"
                value={formattedDates}
                readOnly
              />
            </div>
            <div className="contact-form__group contact-form__group--full">
              <label htmlFor="contact-message">Votre message</label>
              <textarea id="contact-message" name="message" rows={4} placeholder="Votre message…" required />
            </div>
            <input name="source" type="hidden" value="site-web-react" />
            <button className="btn contact-form__submit" type="submit" disabled={formStatus.state === 'loading'}>
              {formStatus.state === 'loading' ? 'Envoi…' : 'Envoyer demande devis'}
            </button>
            {formStatus.message && (
              <p
                className="muted"
                style={{ margin: 0, color: formStatus.state === 'error' ? '#ff6b6b' : undefined }}
                aria-live="polite"
              >
                {formStatus.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
