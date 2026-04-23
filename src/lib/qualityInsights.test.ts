import { describe, expect, it } from 'vitest';
import type { Driver, Trip } from '@/data/mockData';
import type { EvaluationRecord } from '@/services/supabaseService';
import {
  summarizeDriverEvaluations,
  summarizeDriverQualityInsights,
  summarizeSheetNoShowRoutes,
  summarizeRouteQuality,
} from '@/lib/qualityInsights';

const drivers: Driver[] = [
  {
    id: 'd1',
    nome: 'Carlos Silva (d1)',
    status: 'ATIVO',
    pontuacao: 8,
    totalViagens: 3,
    ocorrencias: 1,
    created_at: '01/04/2026 08:00:00',
    etaOrigMetrics: { onTime: 66.7, early: 0, delay: 33.3 },
    etaDestMetrics: { onTime: 33.3, early: 33.3, delay: 33.3 },
    vinculo: 'CLT',
  },
  {
    id: 'd2',
    nome: 'Marcos Lima (d2)',
    status: 'ATIVO',
    pontuacao: 12,
    totalViagens: 4,
    ocorrencias: 0,
    created_at: '03/04/2026 11:00:00',
    etaOrigMetrics: { onTime: 100, early: 0, delay: 0 },
    etaDestMetrics: { onTime: 75, early: 25, delay: 0 },
    vinculo: 'CLT',
  },
];

const trips: Trip[] = [
  {
    id: 't1',
    driver_id: 'd1',
    driverName: 'Carlos Silva',
    data: '01/04/2026 08:00:00',
    origin_code: 'GRU',
    destination_code: 'CWB',
    status_eta: 'EARLY',
    status_eta_destino: 'ON TIME',
    status_cpt: '—',
    ocorrencia: false,
    ocorrencia_count: 0,
    ocorrencia_eta: '',
    ocorrencia_cpt: '',
    ocorrencia_eta_destino: '',
    score_final: 3,
    evaluated: true,
  },
  {
    id: 't2',
    driver_id: 'd1',
    driverName: 'Carlos Silva',
    data: '02/04/2026 09:00:00',
    origin_code: 'GRU',
    destination_code: 'CWB',
    status_eta: 'DELAY',
    status_eta_destino: 'DELAY',
    status_cpt: '—',
    ocorrencia: true,
    ocorrencia_count: 1,
    ocorrencia_eta: 'Atraso',
    ocorrencia_cpt: '',
    ocorrencia_eta_destino: '',
    score_final: -5,
    evaluated: true,
  },
  {
    id: 't3',
    driver_id: 'd1',
    driverName: 'Carlos Silva',
    data: '03/04/2026 10:00:00',
    origin_code: 'GRU',
    destination_code: 'POA',
    status_eta: 'ON TIME',
    status_eta_destino: 'EARLY',
    status_cpt: '—',
    ocorrencia: false,
    ocorrencia_count: 0,
    ocorrencia_eta: '',
    ocorrencia_cpt: '',
    ocorrencia_eta_destino: '',
    score_final: 2,
    evaluated: true,
  },
  {
    id: 't4',
    driver_id: 'd2',
    driverName: 'Marcos Lima',
    data: '03/04/2026 11:00:00',
    origin_code: 'GRU',
    destination_code: 'VCP',
    status_eta: 'ON TIME',
    status_eta_destino: 'ON TIME',
    status_cpt: '—',
    ocorrencia: false,
    ocorrencia_count: 0,
    ocorrencia_eta: '',
    ocorrencia_cpt: '',
    ocorrencia_eta_destino: '',
    score_final: 3,
    evaluated: true,
  },
  {
    id: 't5',
    driver_id: 'd2',
    driverName: 'Marcos Lima',
    data: '04/04/2026 11:00:00',
    origin_code: 'GRU',
    destination_code: 'VCP',
    status_eta: 'ON TIME',
    status_eta_destino: 'EARLY',
    status_cpt: '—',
    ocorrencia: false,
    ocorrencia_count: 0,
    ocorrencia_eta: '',
    ocorrencia_cpt: '',
    ocorrencia_eta_destino: '',
    score_final: 3,
    evaluated: true,
  },
  {
    id: 't6',
    driver_id: 'd2',
    driverName: 'Marcos Lima',
    data: '05/04/2026 11:00:00',
    origin_code: 'GRU',
    destination_code: 'VCP',
    status_eta: 'ON TIME',
    status_eta_destino: 'ON TIME',
    status_cpt: '—',
    ocorrencia: false,
    ocorrencia_count: 0,
    ocorrencia_eta: '',
    ocorrencia_cpt: '',
    ocorrencia_eta_destino: '',
    score_final: 3,
    evaluated: true,
  },
  {
    id: 't7',
    driver_id: 'd2',
    driverName: 'Marcos Lima',
    data: '06/04/2026 11:00:00',
    origin_code: 'GRU',
    destination_code: 'VCP',
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
];

const evaluations: EvaluationRecord[] = [
  {
    trip_id: 't1',
    driver_id: 'd1',
    driver_name: 'Carlos Silva',
    comunicacao: 'BOA',
    atendeu: true,
    desvio_rota: 'NENHUM',
    postura: 'OK',
    ajuste_manual: 0,
    observacao: '',
    operador: 'Ana',
  },
  {
    trip_id: 't2',
    driver_id: 'd1',
    driver_name: 'Carlos Silva',
    comunicacao: 'RUIM',
    atendeu: false,
    desvio_rota: 'LEVE',
    postura: 'RUIM',
    ajuste_manual: 0,
    observacao: '',
    operador: 'Ana',
  },
  {
    trip_id: 't4',
    driver_id: 'd2',
    driver_name: 'Marcos Lima',
    comunicacao: 'BOA',
    atendeu: true,
    desvio_rota: 'NENHUM',
    postura: 'OK',
    ajuste_manual: 0,
    observacao: '',
    operador: 'Ana',
  },
];

describe('qualityInsights', () => {
  it('summarizes top routes by early, delay and no-show', () => {
    expect(summarizeRouteQuality(trips, 'early')).toEqual([
      { key: 'GRU::POA', label: 'GRU -> POA', count: 1, tripCount: 1, rate: 100 },
      { key: 'GRU::VCP', label: 'GRU -> VCP', count: 1, tripCount: 4, rate: 25 },
    ]);

    expect(summarizeRouteQuality(trips, 'delay')).toEqual([
      { key: 'GRU::CWB', label: 'GRU -> CWB', count: 1, tripCount: 2, rate: 50 },
    ]);
  });

  it('summarizes communication and behavior per driver', () => {
    expect(summarizeDriverEvaluations(drivers, trips, evaluations)).toEqual([
      {
        driverId: 'd1',
        driverName: 'Carlos Silva',
        tripCount: 3,
        evaluationCount: 2,
        noShowCount: 1,
        communicationLevel: 'Regular',
        behaviorLevel: 'Atencao',
        communicationBreakdown: { boa: 1, regular: 0, ruim: 1 },
        behaviorBreakdown: { ok: 1, ruim: 1 },
      },
      {
        driverId: 'd2',
        driverName: 'Marcos Lima',
        tripCount: 4,
        evaluationCount: 1,
        noShowCount: 0,
        communicationLevel: 'Boa',
        behaviorLevel: 'Adequado',
        communicationBreakdown: { boa: 1, regular: 0, ruim: 0 },
        behaviorBreakdown: { ok: 1, ruim: 0 },
      },
    ]);
  });

  it('builds driver quality insights for destaque and atencao rankings', () => {
    const insights = summarizeDriverQualityInsights(drivers, trips, evaluations);

    expect(insights.find(insight => insight.driverId === 'd2')).toMatchObject({
      driverName: 'Marcos Lima',
      noShowCount: 0,
      communicationLevel: 'Boa',
      behaviorLevel: 'Adequado',
      primaryInsight: 'pontualidade forte',
    });

    expect(insights.find(insight => insight.driverId === 'd1')).toMatchObject({
      driverName: 'Carlos Silva',
      noShowCount: 1,
      communicationLevel: 'Regular',
      behaviorLevel: 'Atencao',
      primaryInsight: '1 no-show no recorte',
    });
  });

  it('summarizes no-show routes using the DBLH status_agrupado source', () => {
    const noShowTrips: Trip[] = [
      {
        id: 'sheet-no-show',
        driver_id: 'd1',
        driverName: 'Carlos Silva',
        data: '07/04/2026 10:00:00',
        origin_code: 'GRU',
        destination_code: 'CWB',
        status_agrupado: 'NO SHOW',
        no_show_from_sheet: true,
        source_sheet_field: 'DBLHHISTORICO.status_agrupado',
        status_eta: '—',
        status_eta_destino: '—',
        status_cpt: '—',
        ocorrencia: false,
        ocorrencia_count: 0,
        ocorrencia_eta: '',
        ocorrencia_cpt: '',
        ocorrencia_eta_destino: '',
        score_final: 0,
        evaluated: false,
      },
    ];

    expect(summarizeSheetNoShowRoutes([...trips, ...noShowTrips], noShowTrips)).toEqual([
      { key: 'GRU::CWB', label: 'GRU -> CWB', count: 1, tripCount: 3, rate: 33.3 },
    ]);
  });
});
