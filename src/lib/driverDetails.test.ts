import { describe, expect, it } from 'vitest';
import { buildDriverAnalysis, formatDriverRank, sortTripsByLatest, stripDriverIdSuffix, summarizeDriverRoutes } from '@/lib/driverDetails';
import type { Driver, Trip } from '@/data/mockData';
import type { DriverEvaluationSummary } from '@/lib/qualityInsights';

const sampleTrips: Trip[] = [
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
    ocorrencia: true,
    ocorrencia_count: 2,
    ocorrencia_eta: 'Atraso',
    ocorrencia_cpt: '',
    ocorrencia_eta_destino: '',
    score_final: 3,
    evaluated: true,
  },
  {
    id: 't2',
    driver_id: 'd1',
    driverName: 'Motorista 1',
    data: '02/04/2026 09:00:00',
    origin_code: 'GRU',
    destination_code: 'CWB',
    status_eta: 'DELAY',
    status_eta_destino: 'EARLY',
    status_cpt: '—',
    ocorrencia: false,
    ocorrencia_count: 0,
    ocorrencia_eta: '',
    ocorrencia_cpt: '',
    ocorrencia_eta_destino: '',
    score_final: -3,
    evaluated: false,
  },
  {
    id: 't3',
    driver_id: 'd1',
    driverName: 'Motorista 1',
    data: '03/04/2026 10:00:00',
    origin_code: 'GRU',
    destination_code: 'POA',
    status_eta: 'ON TIME',
    status_eta_destino: 'DELAY',
    status_cpt: '—',
    ocorrencia: true,
    ocorrencia_count: 1,
    ocorrencia_eta: '',
    ocorrencia_cpt: 'Transito',
    ocorrencia_eta_destino: '',
    score_final: -1,
    evaluated: true,
  },
];

const sampleDriver: Driver = {
  id: 'd1',
  nome: 'Motorista 1 (d1)',
  status: 'ATIVO',
  pontuacao: -1,
  totalViagens: 3,
  ocorrencias: 2,
  created_at: '01/04/2026 08:00:00',
  etaOrigMetrics: { onTime: 66.7, early: 0, delay: 33.3 },
  etaDestMetrics: { onTime: 33.3, early: 33.3, delay: 33.3 },
  vinculo: 'CLT',
};

const sampleEvaluationSummary: DriverEvaluationSummary = {
  driverId: 'd1',
  driverName: 'Motorista 1',
  tripCount: 3,
  evaluationCount: 2,
  noShowCount: 0,
  communicationLevel: 'Regular',
  behaviorLevel: 'Adequado',
  communicationBreakdown: { boa: 1, regular: 1, ruim: 0 },
  behaviorBreakdown: { ok: 2, ruim: 0 },
};

describe('driverDetails', () => {
  it('removes the driver id suffix from ranking names', () => {
    expect(stripDriverIdSuffix('Motorista 1 (d1)', 'd1')).toBe('Motorista 1');
  });

  it('sorts trips by latest date first', () => {
    expect(sortTripsByLatest(sampleTrips).map(trip => trip.id)).toEqual(['t3', 't2', 't1']);
  });

  it('formats the rank label for the driver summary', () => {
    expect(formatDriverRank(3, 42)).toBe('#3 de 42');
    expect(formatDriverRank(null, 42)).toBe('Sem rank');
  });

  it('aggregates route summaries from driver trips', () => {
    expect(summarizeDriverRoutes(sampleTrips)).toEqual([
      {
        key: 'GRU::CWB',
        label: 'GRU -> CWB',
        tripCount: 2,
        totalScore: 0,
        averageScore: 0,
        occurrenceCount: 2,
        evaluatedCount: 1,
        lastTripDate: '02/04/2026 09:00:00',
      },
      {
        key: 'GRU::POA',
        label: 'GRU -> POA',
        tripCount: 1,
        totalScore: -1,
        averageScore: -1,
        occurrenceCount: 1,
        evaluatedCount: 1,
        lastTripDate: '03/04/2026 10:00:00',
      },
    ]);
  });

  it('builds a narrative analysis for the driver summary modal', () => {
    const analysis = buildDriverAnalysis(sampleDriver, sampleTrips, sampleEvaluationSummary, { position: 3, total: 18 });

    expect(analysis.title).toBe('Nao escalar nesta rota');
    expect(analysis.tone).toBe('danger');
    expect(analysis.statusLabel).toBe('Nao escalar');
    expect(analysis.summary).toContain('nas rotas filtradas');
    expect(analysis.summary).toContain('33.3% on-time no destino');
    expect(analysis.summary).toContain('33.3% early no destino');
    expect(analysis.summary).toContain('33.3% de delay no destino');
    expect(analysis.recommendation).toContain('Segure a escala');
    expect(analysis.highlights).toHaveLength(7);
    expect(analysis.highlights[0]).toMatchObject({
      label: 'Rank no filtro',
      value: '#3 de 18',
    });
    expect(analysis.highlights[1]).toMatchObject({
      label: 'On-time destino',
      value: '33.3%',
    });
  });

  it('does not say there is a better option when the driver is top 1 on the route', () => {
    const warningDriver: Driver = {
      ...sampleDriver,
      pontuacao: 2,
      ocorrencias: 1,
      etaOrigMetrics: { onTime: 80, early: 0, delay: 20 },
      etaDestMetrics: { onTime: 70, early: 15, delay: 15 },
    };

    const analysis = buildDriverAnalysis(warningDriver, sampleTrips, sampleEvaluationSummary, { position: 1, total: 18 });

    expect(analysis.statusLabel).toBe('Escalar com atencao');
    expect(analysis.summary).toContain('lidera o ranking desta rota');
    expect(analysis.summary).not.toContain('opcoes melhores');
  });
});
