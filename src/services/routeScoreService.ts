import { supabase } from '@/integrations/supabase/client';

export interface RouteScoreRecord {
  id?: string;
  origin_code: string;
  destination_code: string;
  pontuacao: number;
  data_inicio: string;
  data_fim: string | null;
  observacao: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function fetchRouteScores(): Promise<RouteScoreRecord[]> {
  const { data, error } = await supabase
    .from('route_scores')
    .select('*')
    .order('origin_code')
    .order('data_inicio', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as RouteScoreRecord[];
}

export async function createRouteScore(record: Omit<RouteScoreRecord, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase.from('route_scores').insert(record as any);
  if (error) throw error;
}

export async function updateRouteScore(id: string, record: Partial<RouteScoreRecord>): Promise<void> {
  const { error } = await supabase
    .from('route_scores')
    .update({ ...record, updated_at: new Date().toISOString() } as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRouteScore(id: string): Promise<void> {
  const { error } = await supabase.from('route_scores').delete().eq('id', id);
  if (error) throw error;
}

/** Get active score for a route on a given date */
export function getRouteBasePoints(
  routeScores: RouteScoreRecord[],
  originCode: string,
  destinationCode: string,
  tripDate?: string
): number {
  const matching = routeScores.filter(
    rs => rs.origin_code === originCode && rs.destination_code === destinationCode
  );

  if (matching.length === 0) return 1; // default

  // Find the active record for the trip date
  const refDate = tripDate ? new Date(tripDate) : new Date();

  for (const rs of matching) {
    const start = new Date(rs.data_inicio);
    const end = rs.data_fim ? new Date(rs.data_fim) : null;
    if (refDate >= start && (!end || refDate <= end)) {
      return rs.pontuacao;
    }
  }

  // If no date match, return latest
  return matching[0]?.pontuacao ?? 1;
}
