import { useMemo } from 'react';
import { FileText, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/contexts/DataContext';
import { getRouteBasePoints } from '@/services/routeScoreService';
import { filterTripsBySelections, getDriverVinculoLabel, getRouteLabel } from '@/lib/tripFilters';

interface TripListProps {
  onEvaluate: (tripId: string) => void;
  selectedVinculos?: string[];
  selectedRoutes?: string[];
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === 'ON TIME') {
    return <Badge variant="success" className="text-[10px]">ON TIME</Badge>;
  }

  if (normalizedStatus === 'EARLY') {
    return <Badge className="text-[10px] bg-blue-500/15 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">EARLY</Badge>;
  }

  if (normalizedStatus === 'DELAY') {
    return <Badge variant="destructive" className="text-[10px]">DELAY</Badge>;
  }

  return <span className="text-xs text-muted-foreground">{status}</span>;
}

export function TripList({ onEvaluate, selectedVinculos = [], selectedRoutes = [] }: TripListProps) {
  const { trips, drivers, isLoading, routeScores } = useData();

  const driverVinculos = useMemo(() => {
    return new Map(
      drivers.map(driver => [driver.id, getDriverVinculoLabel(driver.vinculo)])
    );
  }, [drivers]);

  const filteredTrips = useMemo(() => {
    return filterTripsBySelections(trips, driverVinculos, selectedVinculos, selectedRoutes);
  }, [trips, driverVinculos, selectedVinculos, selectedRoutes]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-accent" /> Viagens Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(item => <Skeleton key={item} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-accent" />
          Viagens Recentes
          <span className="text-xs font-normal text-muted-foreground ml-auto">{filteredTrips.length} viagens</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">ID Viagem</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Vinculo</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Rota</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">ETA Orig.</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">ETA Dest.</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Ocorr.</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Pontuacao</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Acao</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map(trip => {
                const basePoints = getRouteBasePoints(routeScores, trip.origin_code, trip.destination_code, trip.data);
                const maxScore = basePoints + 2;
                const vinculo = driverVinculos.get(trip.driver_id) ?? 'Terceiros';
                const routeLabel = getRouteLabel(trip.origin_code, trip.destination_code);

                return (
                  <tr key={trip.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">{trip.id}</td>
                    <td className="px-4 py-3 font-medium min-w-[220px]">{trip.driverName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                        {vinculo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs min-w-[130px]">{routeLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{trip.data}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={trip.status_eta} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={trip.status_eta_destino} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {trip.ocorrencia ? (
                        <Badge variant="destructive" className="text-[10px]">{trip.ocorrencia_count}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${trip.score_final === maxScore ? 'text-success' : trip.score_final >= basePoints + 1 ? 'text-amber-500' : 'text-destructive'}`}>
                      {trip.score_final}/{maxScore}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant={trip.evaluated ? 'ghost' : 'outline'} className="text-xs h-7 gap-1" onClick={() => onEvaluate(trip.id)}>
                        {trip.evaluated ? (
                          <><Pencil className="h-3 w-3" /> Editar</>
                        ) : (
                          'Avaliar'
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
