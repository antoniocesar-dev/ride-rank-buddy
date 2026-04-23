export function formatTripDelta(deltaMinutes?: number | null): string {
  if (deltaMinutes === null || deltaMinutes === undefined) {
    return 'Sem comparativo com o previsto';
  }

  if (deltaMinutes === 0) {
    return 'No horario previsto';
  }

  const minutes = Math.abs(deltaMinutes);
  return deltaMinutes > 0
    ? `Atrasou ${minutes} min em relacao ao previsto`
    : `Adiantou ${minutes} min em relacao ao previsto`;
}

export function formatTripDeltaCompact(deltaMinutes?: number | null): string {
  if (deltaMinutes === null || deltaMinutes === undefined) {
    return 'Sem comparativo';
  }

  if (deltaMinutes === 0) {
    return 'No horario';
  }

  return deltaMinutes > 0
    ? `Atrasou ${Math.abs(deltaMinutes)} min`
    : `Adiantou ${Math.abs(deltaMinutes)} min`;
}

export function getTripDeltaTone(deltaMinutes?: number | null): 'success' | 'info' | 'danger' | 'muted' {
  if (deltaMinutes === null || deltaMinutes === undefined) {
    return 'muted';
  }

  if (deltaMinutes === 0) {
    return 'success';
  }

  return deltaMinutes > 0 ? 'danger' : 'info';
}

export function formatTripTime(dateTime?: string | null): string {
  const normalized = (dateTime || '').trim();
  if (!normalized || normalized === '-') {
    return '--';
  }

  const timePart = normalized.split(/[ T]/)[1] || '';
  if (!timePart) {
    return '--';
  }

  return timePart.slice(0, 5);
}

export function formatTripTimeline(scheduled?: string | null, realized?: string | null): string {
  return `${formatTripTime(scheduled)} -> ${formatTripTime(realized)}`;
}
