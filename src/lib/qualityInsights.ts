import type { Driver, Trip } from '@/data/mockData';
import type { EvaluationRecord } from '@/services/supabaseService';
import { getRouteKey, getRouteLabel } from '@/lib/tripFilters';

export interface RouteQualitySummary {
  key: string;
  label: string;
  count: number;
  tripCount: number;
  rate: number;
}

export interface DriverEvaluationSummary {
  driverId: string;
  driverName: string;
  tripCount: number;
  evaluationCount: number;
  noShowCount: number;
  communicationLevel: 'Boa' | 'Regular' | 'Ruim' | 'Sem avaliacao';
  behaviorLevel: 'Adequado' | 'Atencao' | 'Critico' | 'Sem avaliacao';
  communicationBreakdown: {
    boa: number;
    regular: number;
    ruim: number;
  };
  behaviorBreakdown: {
    ok: number;
    ruim: number;
  };
}

export interface DriverQualityInsight {
  driverId: string;
  driverName: string;
  tripCount: number;
  punctualityRate: number;
  delayRate: number;
  occurrenceRate: number;
  averageScore: number;
  noShowCount: number;
  communicationLevel: DriverEvaluationSummary['communicationLevel'];
  behaviorLevel: DriverEvaluationSummary['behaviorLevel'];
  reliabilityIndex: number;
  attentionIndex: number;
  primaryInsight: string;
}

function stripDriverSuffix(driverName: string, driverId: string): string {
  return driverName.replace(new RegExp(`\\s*\\(${driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)$`), '');
}

function isDestinationStatusMatch(trip: Trip, status: 'EARLY' | 'DELAY'): boolean {
  const destinationStatus = (trip.status_eta_destino || '').trim().toUpperCase();
  return destinationStatus === status;
}

export function summarizeRouteQuality(
  trips: Trip[],
  signal: 'early' | 'delay'
): RouteQualitySummary[] {
  const routeMap = new Map<string, RouteQualitySummary>();

  for (const trip of trips) {
    const key = getRouteKey(trip.origin_code, trip.destination_code);
    const current = routeMap.get(key);

    if (!current) {
      routeMap.set(key, {
        key,
        label: getRouteLabel(trip.origin_code, trip.destination_code),
        count: 0,
        tripCount: 0,
        rate: 0,
      });
    }

    const route = routeMap.get(key)!;
    route.tripCount += 1;

    const matched = signal === 'early'
      ? isDestinationStatusMatch(trip, 'EARLY')
      : isDestinationStatusMatch(trip, 'DELAY');

    if (matched) {
      route.count += 1;
    }
  }

  return Array.from(routeMap.values())
    .map(route => ({
      ...route,
      rate: route.tripCount > 0 ? Math.round((route.count / route.tripCount) * 1000) / 10 : 0,
    }))
    .filter(route => route.count > 0)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      if (right.rate !== left.rate) {
        return right.rate - left.rate;
      }

      return left.label.localeCompare(right.label);
    });
}

export function summarizeSheetNoShowRoutes(
  allTrips: Trip[],
  noShowTrips: Trip[]
): RouteQualitySummary[] {
  const routeMap = new Map<string, RouteQualitySummary>();

  for (const trip of allTrips) {
    const key = getRouteKey(trip.origin_code, trip.destination_code);

    if (!routeMap.has(key)) {
      routeMap.set(key, {
        key,
        label: getRouteLabel(trip.origin_code, trip.destination_code),
        count: 0,
        tripCount: 0,
        rate: 0,
      });
    }

    routeMap.get(key)!.tripCount += 1;
  }

  for (const trip of noShowTrips) {
    const key = getRouteKey(trip.origin_code, trip.destination_code);

    if (!routeMap.has(key)) {
      routeMap.set(key, {
        key,
        label: getRouteLabel(trip.origin_code, trip.destination_code),
        count: 0,
        tripCount: 0,
        rate: 0,
      });
    }

    const route = routeMap.get(key)!;
    route.count += 1;

    if (route.tripCount === 0) {
      route.tripCount = 1;
    }
  }

  return Array.from(routeMap.values())
    .map(route => ({
      ...route,
      rate: route.tripCount > 0 ? Math.round((route.count / route.tripCount) * 1000) / 10 : 0,
    }))
    .filter(route => route.count > 0)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      if (right.rate !== left.rate) {
        return right.rate - left.rate;
      }

      return left.label.localeCompare(right.label);
    });
}

function getCommunicationLevel(boa: number, regular: number, ruim: number): DriverEvaluationSummary['communicationLevel'] {
  const total = boa + regular + ruim;
  if (total === 0) return 'Sem avaliacao';

  const average = ((boa * 2) + regular) / total;

  if (average >= 1.5) return 'Boa';
  if (average >= 0.75) return 'Regular';
  return 'Ruim';
}

function getBehaviorLevel(ok: number, ruim: number): DriverEvaluationSummary['behaviorLevel'] {
  const total = ok + ruim;
  if (total === 0) return 'Sem avaliacao';

  const average = ok / total;

  if (average >= 0.8) return 'Adequado';
  if (average >= 0.5) return 'Atencao';
  return 'Critico';
}

export function summarizeDriverEvaluations(
  drivers: Driver[],
  trips: Trip[],
  evaluations: EvaluationRecord[]
): DriverEvaluationSummary[] {
  const tripsByDriver = new Map<string, Trip[]>();
  const tripIds = new Set<string>();

  for (const trip of trips) {
    tripIds.add(trip.id);

    if (!tripsByDriver.has(trip.driver_id)) {
      tripsByDriver.set(trip.driver_id, []);
    }

    tripsByDriver.get(trip.driver_id)!.push(trip);
  }

  const driverNameMap = new Map(
    drivers.map(driver => [driver.id, stripDriverSuffix(driver.nome, driver.id)])
  );

  const summaries = new Map<string, DriverEvaluationSummary>();

  for (const evaluation of evaluations) {
    if (!tripIds.has(evaluation.trip_id)) continue;

    const driverTrips = tripsByDriver.get(evaluation.driver_id) ?? [];
    const driverName = driverNameMap.get(evaluation.driver_id) ?? driverTrips[0]?.driverName ?? evaluation.driver_name;

    if (!summaries.has(evaluation.driver_id)) {
      summaries.set(evaluation.driver_id, {
        driverId: evaluation.driver_id,
        driverName,
        tripCount: driverTrips.length,
        evaluationCount: 0,
        noShowCount: 0,
        communicationLevel: 'Sem avaliacao',
        behaviorLevel: 'Sem avaliacao',
        communicationBreakdown: { boa: 0, regular: 0, ruim: 0 },
        behaviorBreakdown: { ok: 0, ruim: 0 },
      });
    }

    const summary = summaries.get(evaluation.driver_id)!;
    summary.evaluationCount += 1;

    const communication = (evaluation.comunicacao || '').trim().toUpperCase();
    if (communication === 'BOA') summary.communicationBreakdown.boa += 1;
    if (communication === 'REGULAR') summary.communicationBreakdown.regular += 1;
    if (communication === 'RUIM') summary.communicationBreakdown.ruim += 1;

    const posture = (evaluation.postura || '').trim().toUpperCase();
    if (posture === 'OK') summary.behaviorBreakdown.ok += 1;
    if (posture === 'RUIM') summary.behaviorBreakdown.ruim += 1;

    if (!evaluation.atendeu) {
      summary.noShowCount += 1;
    }
  }

  return Array.from(summaries.values())
    .map(summary => ({
      ...summary,
      communicationLevel: getCommunicationLevel(
        summary.communicationBreakdown.boa,
        summary.communicationBreakdown.regular,
        summary.communicationBreakdown.ruim
      ),
      behaviorLevel: getBehaviorLevel(
        summary.behaviorBreakdown.ok,
        summary.behaviorBreakdown.ruim
      ),
    }))
    .sort((left, right) => {
      if (right.noShowCount !== left.noShowCount) {
        return right.noShowCount - left.noShowCount;
      }

      if (right.evaluationCount !== left.evaluationCount) {
        return right.evaluationCount - left.evaluationCount;
      }

      return left.driverName.localeCompare(right.driverName);
    });
}

export function getSingleDriverEvaluationSummary(
  driverId: string,
  driverName: string,
  trips: Trip[],
  evaluations: EvaluationRecord[]
): DriverEvaluationSummary {
  const fallbackDriver: Driver = {
    id: driverId,
    nome: `${driverName} (${driverId})`,
    status: 'ATIVO',
    pontuacao: 0,
    totalViagens: trips.length,
    ocorrencias: trips.filter(trip => trip.ocorrencia).length,
    created_at: trips[0]?.data ?? '',
    etaOrigMetrics: { onTime: 0, early: 0, delay: 0 },
    etaDestMetrics: { onTime: 0, early: 0, delay: 0 },
    vinculo: '—',
  };

  return summarizeDriverEvaluations([fallbackDriver], trips, evaluations).find(
    summary => summary.driverId === driverId
  ) ?? {
    driverId,
    driverName,
    tripCount: trips.length,
    evaluationCount: 0,
    noShowCount: 0,
    communicationLevel: 'Sem avaliacao',
    behaviorLevel: 'Sem avaliacao',
    communicationBreakdown: { boa: 0, regular: 0, ruim: 0 },
    behaviorBreakdown: { ok: 0, ruim: 0 },
  };
}

function getPrimaryInsight(insight: DriverQualityInsight): string {
  if (insight.noShowCount > 0) {
    return `${insight.noShowCount} no-show no recorte`;
  }

  if (insight.delayRate >= 35) {
    return 'delay elevado';
  }

  if (insight.occurrenceRate >= 35) {
    return 'muitas ocorrencias';
  }

  if (insight.punctualityRate >= 85) {
    return 'pontualidade forte';
  }

  if (insight.communicationLevel === 'Boa') {
    return 'boa comunicacao';
  }

  if (insight.behaviorLevel === 'Adequado') {
    return 'bom comportamento';
  }

  return 'operacao estavel';
}

export function summarizeDriverQualityInsights(
  drivers: Driver[],
  trips: Trip[],
  evaluations: EvaluationRecord[]
): DriverQualityInsight[] {
  const evaluationSummaries = new Map(
    summarizeDriverEvaluations(drivers, trips, evaluations).map(summary => [summary.driverId, summary])
  );

  return drivers
    .filter(driver => driver.totalViagens > 0)
    .map(driver => {
      const evaluationSummary = evaluationSummaries.get(driver.id);
      const punctualityRate = (driver.etaOrigMetrics.onTime + driver.etaDestMetrics.onTime) / 2;
      const delayRate = (driver.etaOrigMetrics.delay + driver.etaDestMetrics.delay) / 2;
      const occurrenceRate = driver.totalViagens > 0 ? (driver.ocorrencias / driver.totalViagens) * 100 : 0;
      const averageScore = driver.totalViagens > 0 ? driver.pontuacao / driver.totalViagens : 0;
      const noShowCount = evaluationSummary?.noShowCount ?? 0;
      const communicationLevel = evaluationSummary?.communicationLevel ?? 'Sem avaliacao';
      const behaviorLevel = evaluationSummary?.behaviorLevel ?? 'Sem avaliacao';

      const communicationBonus =
        communicationLevel === 'Boa'
          ? 8
          : communicationLevel === 'Regular'
            ? 3
            : communicationLevel === 'Ruim'
              ? -10
              : 0;

      const behaviorBonus =
        behaviorLevel === 'Adequado'
          ? 8
          : behaviorLevel === 'Atencao'
            ? -4
            : behaviorLevel === 'Critico'
              ? -12
              : 0;

      const reliabilityIndex =
        punctualityRate +
        (averageScore * 18) -
        delayRate -
        occurrenceRate -
        (noShowCount * 25) +
        communicationBonus +
        behaviorBonus;

      const attentionIndex =
        (noShowCount * 40) +
        delayRate +
        occurrenceRate +
        (behaviorLevel === 'Critico' ? 20 : behaviorLevel === 'Atencao' ? 10 : 0) +
        (communicationLevel === 'Ruim' ? 15 : communicationLevel === 'Regular' ? 5 : 0) -
        (punctualityRate * 0.25);

      const insight: DriverQualityInsight = {
        driverId: driver.id,
        driverName: stripDriverSuffix(driver.nome, driver.id),
        tripCount: driver.totalViagens,
        punctualityRate: Math.round(punctualityRate * 10) / 10,
        delayRate: Math.round(delayRate * 10) / 10,
        occurrenceRate: Math.round(occurrenceRate * 10) / 10,
        averageScore: Math.round(averageScore * 10) / 10,
        noShowCount,
        communicationLevel,
        behaviorLevel,
        reliabilityIndex: Math.round(reliabilityIndex * 10) / 10,
        attentionIndex: Math.round(attentionIndex * 10) / 10,
        primaryInsight: '',
      };

      return {
        ...insight,
        primaryInsight: getPrimaryInsight(insight),
      };
    });
}
