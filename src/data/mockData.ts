export type DriverStatus = 'ATIVO' | 'BLOQUEADO';
export type Comunicacao = 'BOA' | 'REGULAR' | 'RUIM';
export type DesvioRota = 'NENHUM' | 'LEVE' | 'GRAVE';
export type Postura = 'OK' | 'RUIM';
export type BlockType = 'NO_SHOW' | 'MANUAL';

export interface StatusMetrics {
  onTime: number;
  early: number;
  delay: number;
}

export interface Driver {
  id: string;
  nome: string;
  status: DriverStatus;
  pontuacao: number;
  totalViagens: number;
  ocorrencias: number;
  created_at: string;
  etaOrigMetrics: StatusMetrics;
  etaDestMetrics: StatusMetrics;
  vinculo: string;
}

export interface Trip {
  id: string;
  driver_id: string;
  driverName: string;
  data: string;
  origin_code: string;
  destination_code: string;
  status_agrupado?: string;
  no_show_from_sheet?: boolean;
  source_sheet_field?: string;
  eta_origin_scheduled?: string;
  eta_origin_realized?: string;
  eta_origin_diff_minutes?: number | null;
  eta_destination_scheduled?: string;
  eta_destination_realized?: string;
  eta_destination_diff_minutes?: number | null;
  status_eta: string;
  status_eta_destino: string;
  status_cpt: string;
  ocorrencia: boolean;
  ocorrencia_count: number;
  ocorrencia_eta: string;
  ocorrencia_cpt: string;
  ocorrencia_eta_destino: string;
  score_final: number;
  evaluated: boolean;
}

export interface OperatorEvaluation {
  id: string;
  trip_id: string;
  comunicacao: Comunicacao;
  atendeu: boolean;
  desvio_rota: DesvioRota;
  postura: Postura;
  ajuste_manual: number;
  observacao: string;
  created_by: string;
  created_at: string;
}

export interface Block {
  id: string;
  driver_id: string;
  driverName: string;
  tipo: BlockType;
  motivo: string;
  ativo: boolean;
  data_inicio: string;
  data_fim: string | null;
  created_by: string;
}

const defaultMetrics: StatusMetrics = { onTime: 0, early: 0, delay: 0 };

const driverNames = [
  'Carlos Silva', 'João Oliveira', 'Pedro Santos', 'Lucas Ferreira',
  'Marcos Souza', 'Rafael Costa', 'André Lima', 'Felipe Almeida',
  'Bruno Ribeiro', 'Gustavo Martins', 'Roberto Gomes', 'Diego Araújo',
  'Thiago Pereira', 'Rodrigo Barbosa', 'Eduardo Carvalho'
];

export const mockDrivers: Driver[] = driverNames.map((nome, i) => {
  const totalViagens = Math.floor(15 + Math.random() * 50);
  const pontuacao = Math.floor(totalViagens * 1.5 + Math.random() * totalViagens);
  return {
    id: `d${i + 1}`,
    nome,
    status: 'ATIVO' as DriverStatus,
    pontuacao,
    totalViagens,
    ocorrencias: Math.floor(Math.random() * 5),
    created_at: '2025-01-15',
    etaOrigMetrics: defaultMetrics,
    etaDestMetrics: defaultMetrics,
    vinculo: '—',
  };
}).sort((a, b) => b.pontuacao - a.pontuacao);

export const mockTrips: Trip[] = [];
for (let i = 0; i < 40; i++) {
  const driver = mockDrivers[Math.floor(Math.random() * mockDrivers.length)];

  const statuses = ['ON TIME', 'EARLY', 'DELAY'];
  const sEta = statuses[Math.floor(Math.random() * 3)];
  const sDest = statuses[Math.floor(Math.random() * 3)];
  const sCpt = statuses[Math.floor(Math.random() * 3)];
  const ocorrencia = Math.random() > 0.7;
  const ocorrencia_count = ocorrencia ? Math.ceil(Math.random() * 3) : 0;

  const etaVal = (sEta === 'ON TIME' || sEta === 'EARLY') ? 1 : 0;
  const destVal = (sDest === 'ON TIME' || sDest === 'EARLY') ? 1 : 0;
  const cptVal = (sCpt === 'ON TIME' || sCpt === 'EARLY') ? 1 : 0;
  const score = Math.max(0, (etaVal * 30) + (cptVal * 30) + (destVal * 40) - (ocorrencia_count * 10));

  const ocTexts = ['Morosidade no carregamento', 'Chuva', 'Problema mecânico', 'Trânsito'];
  const ocEta = ocorrencia && Math.random() > 0.5 ? ocTexts[Math.floor(Math.random() * ocTexts.length)] : '-';
  const ocCpt = ocorrencia && Math.random() > 0.5 ? ocTexts[Math.floor(Math.random() * ocTexts.length)] : '-';
  const ocDest = ocorrencia && Math.random() > 0.5 ? ocTexts[Math.floor(Math.random() * ocTexts.length)] : '-';

  mockTrips.push({
    id: `t${i + 1}`,
    driver_id: driver.id,
    driverName: driver.nome,
    data: `2025-03-${String(1 + (i % 17)).padStart(2, '0')} 07:00`,
    origin_code: 'ORI',
    destination_code: 'DST',
    status_agrupado: 'FECHADA',
    no_show_from_sheet: false,
    source_sheet_field: 'DBLHHISTORICO.status_agrupado',
    eta_origin_scheduled: `2025-03-${String(1 + (i % 17)).padStart(2, '0')} 07:00`,
    eta_origin_realized: `2025-03-${String(1 + (i % 17)).padStart(2, '0')} 07:${String((i * 3) % 60).padStart(2, '0')}`,
    eta_origin_diff_minutes: sEta === 'DELAY' ? 15 : sEta === 'EARLY' ? -10 : 0,
    eta_destination_scheduled: `2025-03-${String(1 + (i % 17)).padStart(2, '0')} 12:00`,
    eta_destination_realized: `2025-03-${String(1 + (i % 17)).padStart(2, '0')} 12:${String((i * 5) % 60).padStart(2, '0')}`,
    eta_destination_diff_minutes: sDest === 'DELAY' ? 20 : sDest === 'EARLY' ? -12 : 0,
    status_eta: sEta,
    status_eta_destino: sDest,
    status_cpt: sCpt,
    ocorrencia,
    ocorrencia_count,
    ocorrencia_eta: ocEta,
    ocorrencia_cpt: ocCpt,
    ocorrencia_eta_destino: ocDest,
    score_final: score,
    evaluated: Math.random() > 0.4,
  });
}

export const mockBlocks: Block[] = [
  {
    id: 'b1', driver_id: 'd12', driverName: 'Diego Araújo',
    tipo: 'NO_SHOW', motivo: 'Não compareceu à viagem #t12',
    ativo: true, data_inicio: '2025-03-10', data_fim: null, created_by: 'Operador Ana',
  },
  {
    id: 'b3', driver_id: 'd11', driverName: 'Roberto Gomes',
    tipo: 'MANUAL', motivo: 'Comportamento inadequado reportado pelo cliente',
    ativo: false, data_inicio: '2025-02-20', data_fim: '2025-03-01', created_by: 'Gestor Paulo',
  },
];

export function getScoreColor(score: number): string {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
}

export function getStatusVariant(status: DriverStatus) {
  switch (status) {
    case 'ATIVO': return 'success' as const;
    case 'BLOQUEADO': return 'destructive' as const;
  }
}

export function getBlockTypeLabel(tipo: BlockType) {
  switch (tipo) {
    case 'NO_SHOW': return 'No-Show';
    case 'MANUAL': return 'Manual';
  }
}
