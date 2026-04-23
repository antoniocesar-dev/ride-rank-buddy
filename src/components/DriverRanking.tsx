import { useMemo, useState } from 'react';
import { AlertCircle, Check, Pencil, Trophy, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/DataContext';
import { upsertDrivers } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { DriverDetailsDialog } from '@/components/DriverDetailsDialog';
import { getDriverVinculoLabel } from '@/lib/tripFilters';
import { stripDriverIdSuffix } from '@/lib/driverDetails';
import type { Driver, Trip } from '@/data/mockData';

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
  filteredTrips: Trip[];
}

export function DriverRanking({ filteredDrivers, filteredTrips }: DriverRankingProps) {
  const { isLoading, refreshData } = useData();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const selectedDriver = useMemo(
    () => filteredDrivers.find(driver => driver.id === selectedDriverId) ?? null,
    [filteredDrivers, selectedDriverId]
  );

  const selectedDriverTrips = useMemo(() => {
    if (!selectedDriverId) return [];
    return filteredTrips.filter(trip => trip.driver_id === selectedDriverId);
  }, [filteredTrips, selectedDriverId]);

  const selectedDriverRank = useMemo(() => {
    if (!selectedDriverId) return null;

    const index = filteredDrivers.findIndex(driver => driver.id === selectedDriverId);
    return index >= 0 ? index + 1 : null;
  }, [filteredDrivers, selectedDriverId]);

  const startEdit = (driverId: string, currentName: string) => {
    const cleanName = stripDriverIdSuffix(currentName, driverId);
    setEditingId(driverId);
    setEditName(cleanName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const openDriverDetails = (driverId: string) => {
    if (editingId === driverId) return;
    setSelectedDriverId(driverId);
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
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-accent" />
            Ranking de Motoristas
            <span className="text-xs font-normal text-muted-foreground ml-auto">{filteredDrivers.length} motoristas</span>
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
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Vinculo</th>
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
                  <tr
                    key={driver.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openDriverDetails(driver.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDriverDetails(driver.id);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Ver resumo do motorista ${driver.nome}`}
                  >
                    <td className="px-3 py-3">
                      <span className={`font-mono font-bold text-xs ${idx < 3 ? 'text-accent' : 'text-muted-foreground'}`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {editingId === driver.id ? (
                        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                          <Input
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            className="h-7 text-sm w-40"
                            autoFocus
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') saveEdit(driver.id);
                              if (event.key === 'Escape') cancelEdit();
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(event) => {
                              event.stopPropagation();
                              void saveEdit(driver.id);
                            }}
                          >
                            <Check className="h-3 w-3 text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(event) => {
                              event.stopPropagation();
                              cancelEdit();
                            }}
                          >
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
                            onClick={(event) => {
                              event.stopPropagation();
                              startEdit(driver.id, driver.nome);
                            }}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground">
                      {driver.pontuacao}
                    </td>
                    <td className="px-3 py-3 text-left text-xs text-muted-foreground">{getDriverVinculoLabel(driver.vinculo)}</td>
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

      <DriverDetailsDialog
        driver={selectedDriver}
        driverTrips={selectedDriverTrips}
        driverRank={selectedDriverRank}
        totalDriversInRanking={filteredDrivers.length}
        open={Boolean(selectedDriver)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDriverId(null);
          }
        }}
      />
    </>
  );
}
