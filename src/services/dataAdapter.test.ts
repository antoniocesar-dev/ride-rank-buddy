import { describe, expect, it } from 'vitest';
import { calculateDateDiffMinutes, calculateTripScore, deriveDrivers, transformSheetNoShowTrips, transformTrips } from '@/services/dataAdapter';
import type { Trip } from '@/data/mockData';
import type { SheetTrip } from '@/services/sheetsService';

describe('calculateTripScore', () => {
  it('discounts 3 points for delay on ETA origem', () => {
    expect(
      calculateTripScore(
        {
          status_eta: 'DELAY',
          status_eta_destino: 'ON TIME',
        },
        1
      )
    ).toBe(-1);
  });

  it('keeps early on ETA origem with positive score', () => {
    expect(
      calculateTripScore(
        {
          status_eta: 'EARLY',
          status_eta_destino: 'ON TIME',
        },
        1
      )
    ).toBe(3);
  });
});

describe('deriveDrivers', () => {
  it('calculates ETA percentages using only valid statuses', () => {
    const trips: Trip[] = [
      {
        id: 't1',
        driver_id: 'd1',
        driverName: 'Motorista 1',
        data: '01/04/2026 08:00:00',
        origin_code: 'GRU',
        destination_code: 'CWB',
        status_eta: 'ON TIME',
        status_eta_destino: 'ON TIME',
        status_cpt: '—',
        ocorrencia: false,
        ocorrencia_count: 0,
        ocorrencia_eta: '',
        ocorrencia_cpt: '',
        ocorrencia_eta_destino: '',
        score_final: 3,
        evaluated: false,
      },
      {
        id: 't2',
        driver_id: 'd1',
        driverName: 'Motorista 1',
        data: '01/04/2026 09:00:00',
        origin_code: 'GRU',
        destination_code: 'CWB',
        status_eta: '—',
        status_eta_destino: '—',
        status_cpt: '—',
        ocorrencia: false,
        ocorrencia_count: 0,
        ocorrencia_eta: '',
        ocorrencia_cpt: '',
        ocorrencia_eta_destino: '',
        score_final: 1,
        evaluated: false,
      },
    ];

    const [driver] = deriveDrivers(trips);

    expect(driver.etaOrigMetrics).toEqual({ onTime: 100, early: 0, delay: 0 });
    expect(driver.etaDestMetrics).toEqual({ onTime: 100, early: 0, delay: 0 });
  });
});

describe('transformTrips', () => {
  it('calculates the ETA delta in minutes from scheduled and realized timestamps', () => {
    expect(
      calculateDateDiffMinutes('01/04/2026 08:00:00', '01/04/2026 08:15:00')
    ).toBe(15);

    expect(
      calculateDateDiffMinutes('01/04/2026 12:00:00', '01/04/2026 11:45:00')
    ).toBe(-15);
  });

  it('derives ETA status from BR date strings when the source status is empty', () => {
    const sheetTrip: SheetTrip = {
      sta_origin_date: '01/04/2026 08:00:00',
      trip_number: '123',
      status_agrupado: 'FECHADA',
      solicitation_by: '',
      planned_vehicle: '',
      used_vehicle: '',
      used_agency_name: '',
      driver_id: 'd1',
      driver_name: 'Motorista 1',
      vehicle_number: '',
      origin_station_code: 'GRU',
      destination_station_code: 'CWB',
      eta_scheduled_origin_edited: '01/04/2026 08:00:00',
      cpt_scheduled_origin_edited: '',
      eta_destination_edited: '01/04/2026 12:00:00',
      id_rota: '',
      eta_realizado: '01/04/2026 08:15:00',
      status_eta: '',
      ocorrencia_eta: '',
      cpt_realizado: '',
      status_cpt: '',
      ocorrencia_cpt: '',
      eta_destino_realizado: '01/04/2026 11:45:00',
      status_eta_destino: '',
      ocorrencia_eta_destino: '',
      horario_de_descarga: '',
      sum_orders: '',
      checkin_origin_operator: '',
      checkout_origin_operator: '',
      checkin_destination_operator: '',
      eta_origin_realized: '',
      cpt_origin_realized: '',
      eta_destination_realized: '',
      atualizacao: '',
    };

    const [trip] = transformTrips([sheetTrip]);

    expect(trip.status_eta).toBe('DELAY');
    expect(trip.status_eta_destino).toBe('EARLY');
    expect(trip.eta_origin_diff_minutes).toBe(15);
    expect(trip.eta_destination_diff_minutes).toBe(-15);
  });

  it('saves no-show rows from DBLH status_agrupado for quality insights', () => {
    const sheetTrip: SheetTrip = {
      sta_origin_date: '01/04/2026 08:00:00',
      trip_number: '999',
      status_agrupado: 'NO SHOW',
      solicitation_by: '',
      planned_vehicle: '',
      used_vehicle: '',
      used_agency_name: '',
      driver_id: 'd9',
      driver_name: 'Motorista 9',
      vehicle_number: '',
      origin_station_code: 'GRU',
      destination_station_code: 'VCP',
      eta_scheduled_origin_edited: '01/04/2026 08:00:00',
      cpt_scheduled_origin_edited: '',
      eta_destination_edited: '',
      id_rota: '',
      eta_realizado: '',
      status_eta: '',
      ocorrencia_eta: '',
      cpt_realizado: '',
      status_cpt: '',
      ocorrencia_cpt: '',
      eta_destino_realizado: '',
      status_eta_destino: '',
      ocorrencia_eta_destino: '',
      horario_de_descarga: '',
      sum_orders: '',
      checkin_origin_operator: '',
      checkout_origin_operator: '',
      checkin_destination_operator: '',
      eta_origin_realized: '',
      cpt_origin_realized: '',
      eta_destination_realized: '',
      atualizacao: '',
    };

    const [trip] = transformSheetNoShowTrips([sheetTrip]);

    expect(trip.status_agrupado).toBe('NO SHOW');
    expect(trip.no_show_from_sheet).toBe(true);
    expect(trip.source_sheet_field).toBe('DBLHHISTORICO.status_agrupado');
  });
});
