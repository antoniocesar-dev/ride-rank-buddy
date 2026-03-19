import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchEvaluationLogs, EvaluationLogRecord } from '@/services/supabaseService';
import { useData } from '@/contexts/DataContext';

function ActionBadge({ acao }: { acao: string }) {
  if (acao === 'CRIAÇÃO') return <Badge variant="success" className="text-[10px]">CRIAÇÃO</Badge>;
  if (acao === 'EDIÇÃO') return <Badge className="text-[10px] bg-blue-500/15 text-blue-600 border-blue-500/20">EDIÇÃO</Badge>;
  if (acao === 'DESBLOQUEIO') return <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/20">DESBLOQUEIO</Badge>;
  return <Badge variant="outline" className="text-[10px]">{acao}</Badge>;
}

export function EvaluationLogList() {
  const [logs, setLogs] = useState<EvaluationLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { evaluations } = useData(); // trigger refresh when evaluations change

  useEffect(() => {
    setLoading(true);
    fetchEvaluationLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [evaluations]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-4 w-4 text-accent" /> Log de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="h-4 w-4 text-accent" />
          Log de Avaliações
          <span className="text-xs font-normal text-muted-foreground ml-auto">{logs.length} registros</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum registro de auditoria
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Data/Hora</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Ação</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Viagem</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Operador</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const date = log.created_at ? new Date(log.created_at) : null;
                  const formattedDate = date
                    ? `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    : '—';

                  const details = log.dados_depois
                    ? Object.entries(log.dados_depois)
                        .filter(([k]) => !['trip_id', 'driver_id', 'driver_name', 'operador'].includes(k))
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')
                    : '—';

                  return (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{formattedDate}</td>
                      <td className="px-4 py-3"><ActionBadge acao={log.acao} /></td>
                      <td className="px-4 py-3 font-mono text-xs">{log.trip_id || '—'}</td>
                      <td className="px-4 py-3 text-sm">{log.driver_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{log.operador}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[300px] truncate">{details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
