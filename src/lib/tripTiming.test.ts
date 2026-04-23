import { describe, expect, it } from 'vitest';
import {
  formatTripDelta,
  formatTripDeltaCompact,
  formatTripTimeline,
  formatTripTime,
  getTripDeltaTone,
} from '@/lib/tripTiming';

describe('tripTiming', () => {
  it('formats ETA comparison text in a human-readable way', () => {
    expect(formatTripDelta(15)).toBe('Atrasou 15 min em relacao ao previsto');
    expect(formatTripDelta(-8)).toBe('Adiantou 8 min em relacao ao previsto');
    expect(formatTripDelta(0)).toBe('No horario previsto');
    expect(formatTripDelta(null)).toBe('Sem comparativo com o previsto');
  });

  it('formats compact ETA labels without relying on plus and minus signs', () => {
    expect(formatTripDeltaCompact(15)).toBe('Atrasou 15 min');
    expect(formatTripDeltaCompact(-8)).toBe('Adiantou 8 min');
    expect(formatTripDeltaCompact(0)).toBe('No horario');
    expect(formatTripDeltaCompact(undefined)).toBe('Sem comparativo');
  });

  it('formats planned and realized times as a timeline', () => {
    expect(formatTripTime('01/04/2026 08:15:00')).toBe('08:15');
    expect(formatTripTime('2026-04-01T12:45:00')).toBe('12:45');
    expect(formatTripTimeline('01/04/2026 08:00:00', '01/04/2026 08:15:00')).toBe('08:00 -> 08:15');
  });

  it('maps ETA deltas to the expected visual tone', () => {
    expect(getTripDeltaTone(10)).toBe('danger');
    expect(getTripDeltaTone(-4)).toBe('info');
    expect(getTripDeltaTone(0)).toBe('success');
    expect(getTripDeltaTone(undefined)).toBe('muted');
  });
});
