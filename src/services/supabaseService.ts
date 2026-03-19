import { supabase } from '@/integrations/supabase/client';

export interface EvaluationRecord {
  id?: string;
  trip_id: string;
  driver_id: string;
  driver_name: string;
  comunicacao: string;
  atendeu: boolean;
  desvio_rota: string;
  postura: string;
  ajuste_manual: number;
  observacao: string;
  operador: string;
  created_at?: string;
  updated_at?: string;
}

export interface DriverBlockRecord {
  id?: string;
  driver_id: string;
  driver_name: string;
  tipo: string;
  motivo: string;
  ativo: boolean;
  manual_override: boolean;
  data_inicio?: string;
  data_fim?: string | null;
  created_by: string;
  updated_at?: string;
}

export interface EvaluationLogRecord {
  id?: string;
  trip_id?: string;
  driver_id?: string;
  driver_name?: string;
  operador: string;
  acao: string;
  dados_antes?: Record<string, unknown> | null;
  dados_depois?: Record<string, unknown> | null;
  created_at?: string;
}

// --- Evaluations ---

export async function fetchEvaluations(): Promise<EvaluationRecord[]> {
  const { data, error } = await supabase.from('evaluations').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as EvaluationRecord[];
}

export async function upsertEvaluation(evaluation: Omit<EvaluationRecord, 'id' | 'created_at' | 'updated_at'>): Promise<EvaluationRecord> {
  // Check if evaluation already exists for this trip
  const { data: existing } = await supabase.from('evaluations').select('*').eq('trip_id', evaluation.trip_id).maybeSingle();
  
  if (existing) {
    const { data, error } = await supabase
      .from('evaluations')
      .update({ ...evaluation, updated_at: new Date().toISOString() } as any)
      .eq('trip_id', evaluation.trip_id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as EvaluationRecord;
  } else {
    const { data, error } = await supabase
      .from('evaluations')
      .insert(evaluation as any)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as EvaluationRecord;
  }
}

// --- Driver Blocks ---

export async function fetchDriverBlocks(): Promise<DriverBlockRecord[]> {
  const { data, error } = await supabase.from('driver_blocks').select('*').order('data_inicio', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as DriverBlockRecord[];
}

export async function unblockDriver(driverId: string, operador: string): Promise<void> {
  const { error } = await supabase
    .from('driver_blocks')
    .update({ ativo: false, manual_override: true, data_fim: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
    .eq('driver_id', driverId)
    .eq('ativo', true);
  if (error) throw error;
}

export async function resetManualOverride(driverIds: string[]): Promise<void> {
  if (driverIds.length === 0) return;
  const { error } = await supabase
    .from('driver_blocks')
    .update({ manual_override: false, updated_at: new Date().toISOString() } as any)
    .in('driver_id', driverIds)
    .eq('manual_override', true);
  if (error) throw error;
}

export async function blockDriver(block: Omit<DriverBlockRecord, 'id' | 'updated_at'>): Promise<void> {
  const { error } = await supabase.from('driver_blocks').insert(block as any);
  if (error) throw error;
}

// --- Drivers ---

export interface DriverRecord {
  id?: string;
  driver_id: string;
  driver_name: string;
}

export async function fetchDrivers(): Promise<DriverRecord[]> {
  // Fetch all drivers (may exceed default 1000 limit)
  const allDrivers: DriverRecord[] = [];
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allDrivers.push(...(data as unknown as DriverRecord[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  return allDrivers;
}

export async function upsertDrivers(drivers: { driver_id: string; driver_name: string }[]): Promise<void> {
  // Upsert in batches of 100
  for (let i = 0; i < drivers.length; i += 100) {
    const batch = drivers.slice(i, i + 100).map(d => ({
      driver_id: d.driver_id,
      driver_name: d.driver_name,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('drivers')
      .upsert(batch as any, { onConflict: 'driver_id' });
    if (error) throw error;
  }
}

// --- Evaluation Logs ---

export async function fetchEvaluationLogs(): Promise<EvaluationLogRecord[]> {
  const { data, error } = await supabase.from('evaluation_logs').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return (data || []) as unknown as EvaluationLogRecord[];
}

export async function createEvaluationLog(log: Omit<EvaluationLogRecord, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('evaluation_logs').insert(log as any);
  if (error) throw error;
}
