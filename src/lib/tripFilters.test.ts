import { describe, expect, it } from 'vitest';
import { filterTripsBySelections, getDriverVinculoLabel, getRouteKey, getRouteLabel } from '@/lib/tripFilters';

describe('tripFilters', () => {
  it('creates a stable route key from origin and destination', () => {
    expect(getRouteKey('GRU', 'CWB')).toBe('GRU::CWB');
  });

  it('formats a readable route label', () => {
    expect(getRouteLabel('GRU', 'CWB')).toBe('GRU -> CWB');
  });

  it('maps empty vinculo values to Terceiros', () => {
    expect(getDriverVinculoLabel('\u2014')).toBe('Terceiros');
    expect(getDriverVinculoLabel('')).toBe('Terceiros');
  });

  it('preserves named vinculos', () => {
    expect(getDriverVinculoLabel('Agregado')).toBe('Agregado');
  });

  it('filters trips by vinculo and route together', () => {
    const trips = [
      { id: '1', driver_id: 'd1', origin_code: 'GRU', destination_code: 'CWB' },
      { id: '2', driver_id: 'd1', origin_code: 'GRU', destination_code: 'POA' },
      { id: '3', driver_id: 'd2', origin_code: 'GRU', destination_code: 'CWB' },
    ];
    const driverVinculos = new Map([
      ['d1', 'Agregado'],
      ['d2', 'Terceiros'],
    ]);

    const filtered = filterTripsBySelections(
      trips,
      driverVinculos,
      ['Agregado'],
      [getRouteKey('GRU', 'CWB')]
    );

    expect(filtered).toEqual([{ id: '1', driver_id: 'd1', origin_code: 'GRU', destination_code: 'CWB' }]);
  });
});
