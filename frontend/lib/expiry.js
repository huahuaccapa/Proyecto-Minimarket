const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

export const parseDateOnly = (value) => {
  if (!value) return null;

  const [year, month, day] = String(value)
    .split('-')
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const getExpiryStatus = (
  expirationDate,
  referenceDate = new Date()
) => {
  const expiryDate = parseDateOnly(expirationDate);

  if (!expiryDate) {
    return {
      status: 'none',
      label: 'Sin fecha de vencimiento',
      daysRemaining: null,
    };
  }

  const today = startOfDay(referenceDate);

  const warningLimit = new Date(today);
  warningLimit.setMonth(
    warningLimit.getMonth() + 2
  );

  const daysRemaining = Math.ceil(
    (expiryDate - today) / DAY_IN_MS
  );

  if (expiryDate < today) {
    const expiredDays = Math.abs(daysRemaining);

    return {
      status: 'expired',
      label: `Vencido hace ${expiredDays} día${
        expiredDays === 1 ? '' : 's'
      }`,
      daysRemaining,
    };
  }

  if (expiryDate <= warningLimit) {
    return {
      status: 'expiring',
      label:
        daysRemaining === 0
          ? 'Vence hoy'
          : `Vence en ${daysRemaining} día${
              daysRemaining === 1 ? '' : 's'
            }`,
      daysRemaining,
    };
  }

  return {
    status: 'valid',
    label: 'Vigente',
    daysRemaining,
  };
};

export const formatExpirationDate = (value) => {
  const date = parseDateOnly(value);

  if (!date) {
    return 'No registrada';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};