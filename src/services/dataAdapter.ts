import { SheetTrip } from '@/services/sheetsService';
import { RouteScoreRecord, getRouteBasePoints } from '@/services/routeScoreService';
import type { Driver, DriverStatus, Trip, Block, StatusMetrics } from '@/data/mockData';

export function parseDateBR(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  const parts = dateStr.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '00:00:00';
  const [day, month, year] = datePart.split('/');
  if (!day || !month || !year) return null;
  const d = new Date(`${year}-${month}-${day}T${timePart}`);
  return isNaN(d.getTime()) ? null : d;
}

function calculateStatusFromDates(scheduled: string, realized: string): string | null {
  if (!scheduled || !realized || scheduled === '-' || realized === '-') return null;
  const scheduledDate = new Date(scheduled);
  const realizedDate = new Date(realized);
  if (isNaN(scheduledDate.getTime()) || isNaN(realizedDate.getTime())) return null;
  const diff = realizedDate.getTime() - scheduledDate.getTime();
  if (diff < 0) return 'EARLY';
  if (diff === 0) return 'ON TIME';
  return 'DELAY';
}

function resolveStatus(existing: string, scheduled: string, realized: string): string {
  const trimmed = (existing || '').trim();
  if (trimmed && trimmed !== '—') return trimmed;
  return calculateStatusFromDates(scheduled, realized) || '';
}

// Points for ETA Origem: ON TIME = 1, EARLY = 1, DELAY = 0
function statusPointOrigem(status: string): number {
  const s = (status || '').trim().toUpperCase();
  if (s === 'ON TIME' || s === 'EARLY') return 1;
  return 0;
}

// Points for ETA Destino: ON TIME = 1, EARLY = 0, DELAY = 0
function statusPointDestino(status: string): number {
  const s = (status || '').trim().toUpperCase();
  if (s === 'ON TIME') return 1;
  if (s === 'DELAY') return -3;
  if (s === 'EARLY') return -1;
  return 0;
}

// Trip score = base (from route config, default 1) + origin + destination points
export function calculateTripScore(trip: { status_eta: string; status_eta_destino: string }, basePoints: number = 1): number {
  return basePoints + statusPointOrigem(trip.status_eta) + statusPointDestino(trip.status_eta_destino);
}

function isOcorrenciaValida(value: string, ignoredList: string[]): number {
  if (!value || value.trim() === '' || value.trim() === '-') return 0;
  if (ignoredList.includes(value.trim())) return 0;
  return 1;
}

export function extractUniqueOccurrences(sheetTrips: SheetTrip[]): string[] {
  const set = new Set<string>();
  for (const t of sheetTrips) {
    for (const field of [t.ocorrencia_eta, t.ocorrencia_cpt, t.ocorrencia_eta_destino]) {
      const v = (field || '').trim();
      if (v && v !== '-') set.add(v);
    }
  }
  return Array.from(set).sort();
}

export function transformTrips(sheetTrips: SheetTrip[], ignoredOccurrences: string[] = [], routeScores: RouteScoreRecord[] = []): Trip[] {
  const validTrips = sheetTrips.filter(st => {
    if (!st.driver_id || st.driver_id === '0') return false;
    const statusAgrupado = (st.status_agrupado || '').trim().toUpperCase();
    return statusAgrupado === 'FECHADA';
  });

  return validTrips.map((st, idx) => {
    const ocEta = (st.ocorrencia_eta || '').trim();
    const ocCpt = (st.ocorrencia_cpt || '').trim();
    const ocDest = (st.ocorrencia_eta_destino || '').trim();

    const ocorrencia_count =
      isOcorrenciaValida(ocEta, ignoredOccurrences) +
      isOcorrenciaValida(ocCpt, ignoredOccurrences) +
      isOcorrenciaValida(ocDest, ignoredOccurrences);

    const resolvedStatusEta = resolveStatus(st.status_eta, st.eta_scheduled_origin_edited, st.eta_realizado);
    const resolvedStatusDest = resolveStatus(st.status_eta_destino, st.eta_destination_edited, st.eta_destino_realizado);
    const resolvedStatusCpt = (st.status_cpt || '').trim();

    const originCode = (st.origin_station_code || '').trim();
    const destCode = (st.destination_station_code || '').trim();
    const tripDate = st.eta_scheduled_origin_edited || st.sta_origin_date || '';

    // Get route-specific base points
    const basePoints = getRouteBasePoints(routeScores, originCode, destCode, tripDate || undefined);

    const score_final = calculateTripScore({ status_eta: resolvedStatusEta, status_eta_destino: resolvedStatusDest }, basePoints);

    return {
      id: st.trip_number || `t${idx + 1}`,
      driver_id: st.driver_id,
      driverName: st.driver_name && st.driver_name !== '-' ? st.driver_name : st.used_agency_name || 'Não atribuído',
      data: tripDate,
      origin_code: originCode,
      destination_code: destCode,
      status_eta: resolvedStatusEta || '—',
      status_eta_destino: resolvedStatusDest || '—',
      status_cpt: resolvedStatusCpt || '—',
      ocorrencia: ocorrencia_count > 0,
      ocorrencia_count,
      ocorrencia_eta: ocEta,
      ocorrencia_cpt: ocCpt,
      ocorrencia_eta_destino: ocDest,
      score_final,
      evaluated: false,
    };
  });
}

function calcStatusMetrics(trips: Trip[], field: 'status_eta' | 'status_eta_destino'): StatusMetrics {
  const total = trips.length;
  if (total === 0) return { onTime: 0, early: 0, delay: 0 };
  const count = (val: string) => trips.filter(t => t[field].toUpperCase() === val).length;
  return {
    onTime: Math.round((count('ON TIME') / total) * 1000) / 10,
    early: Math.round((count('EARLY') / total) * 1000) / 10,
    delay: Math.round((count('DELAY') / total) * 1000) / 10,
  };
}

// Points-based scoring: 1pt per trip + 1pt ETA origin ON TIME + 1pt ETA dest ON TIME
export function deriveDrivers(trips: Trip[]): Driver[] {
  const driverMap = new Map<string, Trip[]>();

  for (const trip of trips) {
    const key = trip.driver_id;
    if (!driverMap.has(key)) driverMap.set(key, []);
    driverMap.get(key)!.push(trip);
  }

  const drivers: Driver[] = [];

  for (const [driverId, driverTrips] of driverMap) {
    const nome = driverTrips[0].driverName;
    const ocorrencias = driverTrips.filter(t => t.ocorrencia).length;

    // Points: sum of trip scores (ETA Orig + ETA Dest per trip)
    let pontuacao = 0;
    for (const trip of driverTrips) {
      pontuacao += calculateTripScore({ status_eta: trip.status_eta, status_eta_destino: trip.status_eta_destino });
    }

    drivers.push({
      id: driverId,
      nome: `${nome} (${driverId})`,
      status: 'ATIVO' as DriverStatus,
      pontuacao,
      totalViagens: driverTrips.length,
      ocorrencias,
      created_at: driverTrips[0]?.data || '',
      etaOrigMetrics: calcStatusMetrics(driverTrips, 'status_eta'),
      etaDestMetrics: calcStatusMetrics(driverTrips, 'status_eta_destino'),
    });
  }

  return drivers.sort((a, b) => b.pontuacao - a.pontuacao);
}

export function deriveBlocks(_drivers: Driver[]): Block[] {
  // Blocks are only from NO_SHOW and MANUAL - no auto score-based blocks
  return [];
}
