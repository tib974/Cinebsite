const DAY_IN_MS = 1000 * 60 * 60 * 24;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function differenceInDays(dateA, dateB) {
  const start = startOfDay(dateA).getTime();
  const end = startOfDay(dateB).getTime();
  return Math.round((start - end) / DAY_IN_MS);
}

function formatDate(date) {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function formatRange(startDate, endDate) {
  const startLabel = formatDate(startDate);
  const endLabel = formatDate(endDate);
  if (startLabel === endLabel) {
    return startLabel;
  }
  return `${startLabel} → ${endLabel}`;
}

function normalizeBookings(rawBookings = []) {
  return rawBookings
    .map((booking) => {
      const start = parseDate(booking.startDate || booking.start);
      const end = parseDate(booking.endDate || booking.end);
      if (!start || !end) {
        return null;
      }
      return {
        ...booking,
        start,
        end,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function getAvailabilitySummary(rawBookings = []) {
  const bookings = normalizeBookings(rawBookings);
  const now = new Date();
  const ongoing = bookings.find((booking) => startOfDay(booking.start) <= now && now <= endOfDay(booking.end)) || null;
  const next = bookings.find((booking) => startOfDay(booking.start) > now) || null;
  const daysUntilNext = next ? differenceInDays(next.start, now) : null;

  let status = 'available';
  let label = 'Disponible';
  let description = bookings.length === 0 ? 'Pas de réservation à venir' : null;

  if (ongoing) {
    status = 'busy';
    label = 'En tournage';
    description = `Jusqu'au ${formatDate(ongoing.end)}`;
  } else if (next) {
    if (daysUntilNext !== null && daysUntilNext <= 3) {
      status = 'reserved';
      label = 'Réservé bientôt';
    }
    description = `Prochain tournage : ${formatRange(next.start, next.end)}`;
  }

  return {
    status,
    label,
    description,
    ongoingBooking: ongoing,
    nextBooking: next,
    bookings,
  };
}

export function formatBookingRange(booking) {
  if (!booking) return '';
  return formatRange(booking.start, booking.end);
}

export function formatBookingDate(date) {
  return formatDate(date);
}

export function addDays(date, amount) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + amount);
  return newDate;
}

