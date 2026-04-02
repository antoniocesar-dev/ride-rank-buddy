import { useState } from 'react';
import { Trophy, AlertCircle, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/DataContext';
import { upsertDrivers } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import type { Driver } from '@/data/mockData';

function MetricCell({ value, type }: { value: number; type: 'onTime' | 'early' | 'delay' }) {
  const color = type === 'onTime'
    ? 'text-success'
    : type === 'early'
      ? 'text-blue-500'
      : 'text-destructive';
  return <span className={`font-mono text-xs ${color}`}>{value.toFixed(1)}%</span>;
}

interface DriverRankingProps {
  filteredDrivers: Driver[];
}

export function DriverRanking({ filteredDrivers }: DriverRankingProps) {
  const { isLoading, refreshData } = useData();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (driverId: string, currentName: string) => {
    // Strip the "(driverId)" suffix that dataAdapter appends
    const cleanName = currentName.replace(new RegExp(`\\s*\\(${driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)$`), '');
    setEditingId(driverId);
    setEditName(cleanName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (driverId: string) => {
    if (!editName.trim()) return;
    try {
      await upsertDrivers([{ driver_id: driverId, driver_name: editName.trim() }]);
      toast({ title: 'Nome atualizado', description: `Motorista renomeado para ${editName.trim()}.` });
      refreshData();
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-accent" /> Ranking de Motoristas
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
        <CardTitle className="flex items-center gap-2 text-base flex-wrap">
          <Trophy className="h-4 w-4 text-accent" />
          Ranking de Motoristas
          <div className="flex items-center gap-2 ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                  <Filter className="h-3 w-3" />
                  Vínculo
                  {selectedVinculos.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {selectedVinculos.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-2.5 border-b">
                  <span className="text-sm font-medium">Filtrar por vínculo</span>
                  {selectedVinculos.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedVinculos([])}>
                      <X className="h-3 w-3 mr-1" /> Limpar
                    </Button>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  {vinculoTypes.map(v => (
                    <label key={v} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={selectedVinculos.includes(v)}
                        onCheckedChange={() => toggleVinculo(v)}
                      />
                      <span className="text-xs">{v}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-xs font-normal text-muted-foreground">{filteredDrivers.length} motoristas</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">#</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Pontos</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Vínculo</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Viagens</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Ocorr.</th>
                <th className="px-2 py-2.5 text-center font-medium text-muted-foreground border-l" colSpan={3}>
                  <span className="text-[10px] uppercase tracking-wider">ETA Origem</span>
                </th>
                <th className="px-2 py-2.5 text-center font-medium text-muted-foreground border-l" colSpan={3}>
                  <span className="text-[10px] uppercase tracking-wider">ETA Destino</span>
                </th>
              </tr>
              <tr className="border-b bg-muted/30">
                <th colSpan={6}></th>
                <th className="px-2 py-1 text-center text-[10px] text-muted-foreground border-l">On Time</th>
                <th className="px-2 py-1 text-center text-[10px] text-muted-foreground">Early</th>
                <th className="px-2 py-1 text-center text-[10px] text-muted-foreground">Delay</th>
                <th className="px-2 py-1 text-center text-[10px] text-muted-foreground border-l">On Time</th>
                <th className="px-2 py-1 text-center text-[10px] text-muted-foreground">Early</th>
                <th className="px-2 py-1 text-center text-[10px] text-muted-foreground">Delay</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver, idx) => (
                <tr key={driver.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-3">
                    <span className={`font-mono font-bold text-xs ${idx < 3 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {editingId === driver.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm w-40"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(driver.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => saveEdit(driver.id)}>
                          <Check className="h-3 w-3 text-success" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEdit}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group">
                        <span className="font-medium">{driver.nome}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEdit(driver.id, driver.nome)}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-foreground">
                    {driver.pontuacao}
                  </td>
                  <td className="px-3 py-3 text-left text-xs text-muted-foreground">{!driver.vinculo || driver.vinculo === '—' ? 'Terceiros' : driver.vinculo}</td>
                  <td className="px-3 py-3 text-right font-mono text-muted-foreground">{driver.totalViagens}</td>
                  <td className="px-3 py-3 text-right">
                    {driver.ocorrencias > 0 ? (
                      <span className="inline-flex items-center gap-1 text-destructive font-mono font-medium">
                        <AlertCircle className="h-3 w-3" /> {driver.ocorrencias}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-mono">0</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center border-l"><MetricCell value={driver.etaOrigMetrics.onTime} type="onTime" /></td>
                  <td className="px-2 py-3 text-center"><MetricCell value={driver.etaOrigMetrics.early} type="early" /></td>
                  <td className="px-2 py-3 text-center"><MetricCell value={driver.etaOrigMetrics.delay} type="delay" /></td>
                  <td className="px-2 py-3 text-center border-l"><MetricCell value={driver.etaDestMetrics.onTime} type="onTime" /></td>
                  <td className="px-2 py-3 text-center"><MetricCell value={driver.etaDestMetrics.early} type="early" /></td>
                  <td className="px-2 py-3 text-center"><MetricCell value={driver.etaDestMetrics.delay} type="delay" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
