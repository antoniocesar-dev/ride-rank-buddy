import type { Driver, Trip } from '@/data/mockData';
import { getRouteKey, getRouteLabel } from '@/lib/tripFilters';
import type { DriverEvaluationSummary } from '@/lib/qualityInsights';
import { parseDateBR } from '@/services/dataAdapter';

export interface DriverRouteSummary {
  key: string;
  label: string;
  tripCount: number;
  totalScore: number;
  averageScore: number;
  occurrenceCount: number;
  evaluatedCount: number;
  lastTripDate: string;
}

export interface DriverAnalysis {
  title: string;
  tone: 'success' | 'warning' | 'danger';
  summary: string;
  statusLabel: string;
  recommendation: string;
  highlights: Array<{
    label: string;
    value: string;
    helper: string;
    tone: 'success' | 'warning' | 'danger' | 'neutral';
  }>;
}

export interface DriverRankingSnapshot {
  position: number;
  total: number;
}

export function stripDriverIdSuffix(driverName: string, driverId: string): string {
  return driverName.replace(new RegExp(`\\s*\\(${driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)$`), '');
}

export function formatDriverRank(position?: number | null, total?: number | null): string {
  if (!position || !total || position < 1 || total < 1) {
    return 'Sem rank';
  }

  return `#${position} de ${total}`;
}

function getRankHighlightTone(position: number, total: number): 'success' | 'warning' | 'danger' {
  const percentile = position / total;

  if (percentile <= 0.2) return 'success';
  if (percentile <= 0.5) return 'warning';
  return 'danger';
}

function getRankHelper(position: number, total: number): string {
  if (position === 1) return 'lider do ranking desta rota';
  if (position <= Math.max(3, Math.ceil(total * 0.2))) return 'entre os melhores desta rota';
  if (position <= Math.ceil(total * 0.5)) return 'faixa intermediaria nesta rota';
  return 'abaixo da metade superior nesta rota';
}

function joinEvidence(items: string[]): string {
  const filteredItems = items.filter(Boolean).slice(0, 3);

  if (filteredItems.length === 0) return '';
  if (filteredItems.length === 1) return filteredItems[0];
  if (filteredItems.length === 2) return `${filteredItems[0]} e ${filteredItems[1]}`;
  return `${filteredItems[0]}, ${filteredItems[1]} e ${filteredItems[2]}`;
}

function getRankEvidence(position: number, total: number): string {
  const rankLabel = formatDriverRank(position, total);
  const percentile = position / total;

  if (position === 1) return `lider do ranking nesta rota (${rankLabel})`;
  if (percentile <= 0.2) return `entre os melhores do ranking nesta rota (${rankLabel})`;
  if (percentile <= 0.5) return `na metade superior do ranking nesta rota (${rankLabel})`;
  return `na metade inferior do ranking nesta rota (${rankLabel})`;
}

function getRouteScopeLabel(routeSummaries: DriverRouteSummary[]): string {
  if (routeSummaries.length === 1) {
    return `na rota ${routeSummaries[0].label}`;
  }

  return 'nas rotas filtradas';
}

export function sortTripsByLatest(trips: Trip[]): Trip[] {
  return [...trips].sort((left, right) => {
    const rightTime = parseDateBR(right.data)?.getTime() ?? 0;
    const leftTime = parseDateBR(left.data)?.getTime() ?? 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return right.id.localeCompare(left.id);
  });
}

export function summarizeDriverRoutes(trips: Trip[]): DriverRouteSummary[] {
  const routeMap = new Map<string, DriverRouteSummary>();

  for (const trip of trips) {
    const key = getRouteKey(trip.origin_code, trip.destination_code);
    const current = routeMap.get(key);

    if (!current) {
      routeMap.set(key, {
        key,
        label: getRouteLabel(trip.origin_code, trip.destination_code),
        tripCount: 1,
        totalScore: trip.score_final,
        averageScore: trip.score_final,
        occurrenceCount: trip.ocorrencia_count,
        evaluatedCount: trip.evaluated ? 1 : 0,
        lastTripDate: trip.data,
      });
      continue;
    }

    current.tripCount += 1;
    current.totalScore += trip.score_final;
    current.occurrenceCount += trip.ocorrencia_count;
    current.evaluatedCount += trip.evaluated ? 1 : 0;

    const currentDate = parseDateBR(current.lastTripDate)?.getTime() ?? 0;
    const tripDate = parseDateBR(trip.data)?.getTime() ?? 0;

    if (tripDate >= currentDate) {
      current.lastTripDate = trip.data;
    }
  }

  return Array.from(routeMap.values())
    .map(route => ({
      ...route,
      averageScore: Math.round((route.totalScore / route.tripCount) * 10) / 10,
    }))
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }

      return left.label.localeCompare(right.label);
    });
}

export function buildDriverAnalysis(
  driver: Driver,
  trips: Trip[],
  evaluationSummary: DriverEvaluationSummary,
  ranking?: DriverRankingSnapshot | null
): DriverAnalysis {
  const routeSummaries = summarizeDriverRoutes(trips);
  const routeCount = routeSummaries.length;
  const routeScopeLabel = getRouteScopeLabel(routeSummaries);

  if (trips.length === 0) {
    return {
      title: 'Sem historico suficiente para esta rota',
      tone: 'warning',
      statusLabel: 'Sem base',
      summary: 'Nao ha base confiavel para aprovar ou reprovar este motorista na rota filtrada.',
      recommendation: 'Nao tome a decisao so com esta rota. Amplie o filtro ou aguarde novas viagens.',
      highlights: [
        { label: 'On-time destino', value: '--', helper: 'sem base', tone: 'neutral' },
        { label: 'Early destino', value: '--', helper: 'sem base', tone: 'neutral' },
        { label: 'Delay destino', value: '--', helper: 'sem base', tone: 'neutral' },
        { label: 'Ocorrencias', value: '--', helper: 'sem base', tone: 'neutral' },
        { label: 'No-show', value: '--', helper: 'sem base', tone: 'neutral' },
      ],
    };
  }

  const averageScore = driver.pontuacao / trips.length;
  const occurrenceRate = (driver.ocorrencias / trips.length) * 100;
  const destinationOnTime = driver.etaDestMetrics.onTime;
  const destinationEarly = driver.etaDestMetrics.early;
  const destinationDelay = driver.etaDestMetrics.delay;
  const noShowCount = evaluationSummary.noShowCount;
  const evaluationHelper = evaluationSummary.evaluationCount > 0
    ? `${evaluationSummary.evaluationCount} avaliacoes`
    : 'sem avaliacoes';
  const isRouteLeader = ranking?.position === 1;
  const rankEvidence = ranking ? getRankEvidence(ranking.position, ranking.total) : '';
  const onTimeEvidence = `${destinationOnTime.toFixed(1)}% on-time no destino`;
  const earlyEvidence = destinationEarly > 0
    ? `${destinationEarly.toFixed(1)}% early no destino`
    : 'sem early no destino';
  const occurrenceEvidence = occurrenceRate === 0
    ? 'sem ocorrencias nesta rota'
    : `${occurrenceRate.toFixed(1)}% de viagens com ocorrencia`;
  const delayEvidence = `${destinationDelay.toFixed(1)}% de delay no destino`;

  let title: DriverAnalysis['title'] = 'Escala com cautela nesta rota';
  let tone: DriverAnalysis['tone'] = 'warning';
  let statusLabel = 'Escalar com atencao';
  let verdict =
    isRouteLeader
      ? `Pode receber carga ${routeScopeLabel}, e hoje ele lidera o ranking desta rota, mas ainda exige atencao antes da escala.`
      : `Pode receber carga ${routeScopeLabel}, mas hoje existem opcoes melhores nesta rota.`;
  let recommendation = 'Se precisar escalar, use carga com folga de horario e acompanhe de perto a chegada no destino.';
  let evidence = joinEvidence([rankEvidence, onTimeEvidence, earlyEvidence, delayEvidence]);

  if (
    driver.status === 'BLOQUEADO' ||
    noShowCount > 0 ||
    evaluationSummary.behaviorLevel === 'Critico' ||
    evaluationSummary.communicationLevel === 'Ruim' ||
    destinationDelay >= 25 ||
    destinationOnTime < 55
  ) {
    title = 'Nao escalar nesta rota';
    tone = 'danger';
    statusLabel = 'Nao escalar';
    verdict = `Nao e recomendado atribuir nova carga para este motorista ${routeScopeLabel}.`;
    recommendation = 'Segure a escala nesta rota ate revisar os atrasos e os desvios mais recentes.';
    evidence = joinEvidence([
      noShowCount > 0 ? `${noShowCount} no-show nesta rota` : '',
      driver.status === 'BLOQUEADO' ? 'motorista bloqueado no sistema' : '',
      evaluationSummary.behaviorLevel === 'Critico' ? 'leitura comportamental critica' : '',
      evaluationSummary.communicationLevel === 'Ruim' ? 'comunicacao ruim nas avaliacoes' : '',
      onTimeEvidence,
      earlyEvidence,
      delayEvidence,
      occurrenceEvidence,
      rankEvidence,
    ]);
  } else if (
    averageScore >= 0.5 &&
    occurrenceRate <= 20 &&
    destinationOnTime >= 80 &&
    destinationEarly <= 10 &&
    destinationDelay <= 10 &&
    noShowCount === 0
  ) {
    title = 'Boa opcao para esta rota';
    tone = 'success';
    statusLabel = 'Escalar';
    verdict = `Pode atribuir carga para este motorista ${routeScopeLabel} com seguranca operacional normal.`;
    recommendation = 'Recomendado para operacao regular nesta rota. O on-time esta sustentando bem a decisao.';
    evidence = joinEvidence([
      rankEvidence,
      onTimeEvidence,
      earlyEvidence,
      delayEvidence,
      occurrenceEvidence,
      noShowCount === 0 ? 'sem no-show nesta rota' : '',
    ]);
  } else {
    evidence = joinEvidence([
      rankEvidence,
      onTimeEvidence,
      earlyEvidence,
      delayEvidence,
      occurrenceEvidence,
    ]);
  }

  const evidenceSummary = evidence ? ` Nesta analise de rota, o motorista mostra ${evidence}.` : '';

  return {
    title,
    tone,
    statusLabel,
    summary: `${verdict}${evidenceSummary}`.trim(),
    recommendation,
    highlights: [
      ...(ranking
        ? [{
            label: 'Rank no filtro',
            value: formatDriverRank(ranking.position, ranking.total),
            helper: getRankHelper(ranking.position, ranking.total),
            tone: getRankHighlightTone(ranking.position, ranking.total),
          }]
        : []),
      {
        label: 'On-time destino',
        value: `${destinationOnTime.toFixed(1)}%`,
        helper: 'principal metrica de rota',
        tone: destinationOnTime >= 80 ? 'success' : destinationOnTime >= 60 ? 'warning' : 'danger',
      },
      {
        label: 'Early destino',
        value: `${destinationEarly.toFixed(1)}%`,
        helper: 'quanto menor, melhor',
        tone: destinationEarly <= 10 ? 'success' : destinationEarly <= 20 ? 'warning' : 'danger',
      },
      {
        label: 'Delay destino',
        value: `${destinationDelay.toFixed(1)}%`,
        helper: 'quanto menor, melhor',
        tone: destinationDelay <= 10 ? 'success' : destinationDelay <= 20 ? 'warning' : 'danger',
      },
      {
        label: 'Ocorrencias',
        value: `${occurrenceRate.toFixed(1)}%`,
        helper: 'viagens com alerta nesta rota',
        tone: occurrenceRate <= 20 ? 'success' : occurrenceRate <= 40 ? 'warning' : 'danger',
      },
      {
        label: 'No-show',
        value: `${noShowCount}`,
        helper: `${routeCount} rota${routeCount === 1 ? '' : 's'} em analise`,
        tone: noShowCount === 0 ? 'success' : noShowCount === 1 ? 'warning' : 'danger',
      },
      {
        label: 'Comportamento',
        value: evaluationSummary.behaviorLevel,
        helper: evaluationHelper,
        tone:
          evaluationSummary.behaviorLevel === 'Adequado'
            ? 'success'
            : evaluationSummary.behaviorLevel === 'Atencao'
              ? 'warning'
              : evaluationSummary.behaviorLevel === 'Critico'
                ? 'danger'
                : 'neutral',
      },
    ],
  };
}
