import { useState, useEffect, useMemo } from 'react';
import { Route, Plus, History, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { createRouteScore, updateRouteScore, deleteRouteScore, RouteScoreRecord } from '@/services/routeScoreService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function RouteScores() {
  const { trips, routeScores, refreshData } = useData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyRoute, setHistoryRoute] = useState<{ origin: string; dest: string } | null>(null);
  const [form, setForm] = useState({
    origin_code: '',
    destination_code: '',
    pontuacao: '1',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    observacao: '',
  });

  // Extract unique routes from trips
  const uniqueRoutes = useMemo(() => {
    const routeMap = new Map<string, { origin: string; dest: string; count: number }>();
    for (const trip of trips) {
      if (!trip.origin_code || !trip.destination_code) continue;
      const key = `${trip.origin_code}→${trip.destination_code}`;
      const existing = routeMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        routeMap.set(key, { origin: trip.origin_code, dest: trip.destination_code, count: 1 });
      }
    }
    return Array.from(routeMap.values()).sort((a, b) => a.origin.localeCompare(b.origin));
  }, [trips]);

  // Get current active score for a route
  function getActiveScore(origin: string, dest: string): RouteScoreRecord | undefined {
    const now = new Date();
    return routeScores.find(rs => {
      if (rs.origin_code !== origin || rs.destination_code !== dest) return false;
      const start = new Date(rs.data_inicio);
      const end = rs.data_fim ? new Date(rs.data_fim) : null;
      return now >= start && (!end || now <= end);
    });
  }

  // Get history for a route
  function getHistory(origin: string, dest: string): RouteScoreRecord[] {
    return routeScores
      .filter(rs => rs.origin_code === origin && rs.destination_code === dest)
      .sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
  }

  function resetForm() {
    setForm({
      origin_code: '',
      destination_code: '',
      pontuacao: '1',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      observacao: '',
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(record: RouteScoreRecord) {
    setForm({
      origin_code: record.origin_code,
      destination_code: record.destination_code,
      pontuacao: String(record.pontuacao),
      data_inicio: record.data_inicio,
      data_fim: record.data_fim || '',
      observacao: record.observacao || '',
    });
    setEditingId(record.id || null);
    setShowForm(true);
  }

  function startNewForRoute(origin: string, dest: string) {
    setForm({
      origin_code: origin,
      destination_code: dest,
      pontuacao: '1',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      observacao: '',
    });
    setEditingId(null);
    setShowForm(true);
  }

  async function handleSave() {
    const pontuacao = parseFloat(form.pontuacao);
    if (isNaN(pontuacao)) {
      toast({ title: 'Erro', description: 'Pontuação inválida', variant: 'destructive' });
      return;
    }
    if (!form.origin_code || !form.destination_code) {
      toast({ title: 'Erro', description: 'Preencha origem e destino', variant: 'destructive' });
      return;
    }

    try {
      const record = {
        origin_code: form.origin_code.toUpperCase().trim(),
        destination_code: form.destination_code.toUpperCase().trim(),
        pontuacao,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim || null,
        observacao: form.observacao || null,
      };

      if (editingId) {
        await updateRouteScore(editingId, record);
        toast({ title: 'Atualizado', description: 'Pontuação da rota atualizada.' });
      } else {
        await createRouteScore(record);
        toast({ title: 'Criado', description: 'Pontuação da rota cadastrada.' });
      }
      resetForm();
      refreshData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRouteScore(id);
      toast({ title: 'Removido', description: 'Registro removido.' });
      refreshData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Falha ao remover.', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-4 w-4 text-accent" />
            Gerenciamento de Rotas
            <span className="text-xs font-normal text-muted-foreground ml-auto">{uniqueRoutes.length} rotas</span>
            <Button size="sm" className="gap-1.5 text-xs ml-2" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-3.5 w-3.5" /> Nova Pontuação
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Origem</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Destino</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Viagens</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Pontuação Atual</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Período</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {uniqueRoutes.map((route) => {
                  const active = getActiveScore(route.origin, route.dest);
                  const history = getHistory(route.origin, route.dest);
                  return (
                    <tr key={`${route.origin}-${route.dest}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{route.origin}</td>
                      <td className="px-4 py-3 font-mono text-xs font-medium">{route.dest}</td>
                      <td className="px-4 py-3 text-center text-xs">{route.count}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={active ? 'default' : 'secondary'} className="text-xs font-mono">
                          {active ? active.pontuacao : 1} pt
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {active ? (
                          <>
                            {active.data_inicio}
                            {active.data_fim ? ` → ${active.data_fim}` : ' → atual'}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Padrão</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => startNewForRoute(route.origin, route.dest)}>
                            <Plus className="h-3 w-3" /> Pontuar
                          </Button>
                          {history.length > 0 && (
                            <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => setHistoryRoute({ origin: route.origin, dest: route.dest })}>
                              <History className="h-3 w-3" /> {history.length}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {uniqueRoutes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Nenhuma rota encontrada. Atualize os dados da planilha primeiro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Pontuação' : 'Nova Pontuação de Rota'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Origem</label>
                <Input
                  value={form.origin_code}
                  onChange={e => setForm(f => ({ ...f, origin_code: e.target.value }))}
                  placeholder="Ex: GRU"
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Destino</label>
                <Input
                  value={form.destination_code}
                  onChange={e => setForm(f => ({ ...f, destination_code: e.target.value }))}
                  placeholder="Ex: CWB"
                  className="mt-1 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pontuação base da viagem</label>
              <Input
                type="number"
                value={form.pontuacao}
                onChange={e => setForm(f => ({ ...f, pontuacao: e.target.value }))}
                className="mt-1"
                step="0.5"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Este valor substitui o ponto base (1) por completar a viagem nesta rota.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data Início</label>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data Fim (opcional)</label>
                <Input
                  type="date"
                  value={form.data_fim}
                  onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Observação</label>
              <Input
                value={form.observacao}
                onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                placeholder="Ex: Ajuste semanal"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-3.5 w-3.5 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyRoute} onOpenChange={(open) => { if (!open) setHistoryRoute(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico: {historyRoute?.origin} → {historyRoute?.dest}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Pontuação</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Início</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fim</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Obs.</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {historyRoute && getHistory(historyRoute.origin, historyRoute.dest).map((record) => (
                  <tr key={record.id} className="border-b border-border/50">
                    <td className="px-3 py-2 font-mono font-bold">{record.pontuacao} pt</td>
                    <td className="px-3 py-2 text-xs">{record.data_inicio}</td>
                    <td className="px-3 py-2 text-xs">{record.data_fim || '—'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{record.observacao || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => { setHistoryRoute(null); startEdit(record); }}>
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => handleDelete(record.id!)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
