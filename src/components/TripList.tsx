import { FileText, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getScoreColor } from '@/data/mockData';
import { useData } from '@/contexts/DataContext';

interface TripListProps {
  onEvaluate: (tripId: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === 'ON TIME') return <Badge variant="success" className="text-[10px]">ON TIME</Badge>;
  if (s === 'EARLY') return <Badge className="text-[10px] bg-blue-500/15 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">EARLY</Badge>;
  if (s === 'DELAY') return <Badge variant="destructive" className="text-[10px]">DELAY</Badge>;
  return <span className="text-xs text-muted-foreground">{status}</span>;
}

export function TripList({ onEvaluate }: TripListProps) {
  const { trips, isLoading } = useData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-accent" /> Viagens Recentes
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
          <FileText className="h-4 w-4 text-accent" />
          Viagens Recentes
          <span className="text-xs font-normal text-muted-foreground ml-auto">{trips.length} viagens</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">ID Viagem</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Driver ID</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">ETA Orig.</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">ETA Dest.</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Ocorr.</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Pontuação</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">{trip.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{trip.driver_id}</td>
                  <td className="px-4 py-3 font-medium">{trip.driverName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{trip.data}</td>
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
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${trip.score_final === 3 ? 'text-success' : trip.score_final >= 2 ? 'text-amber-500' : 'text-destructive'}`}>
                    {trip.score_final}/3
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" variant={trip.evaluated ? "ghost" : "outline"} className="text-xs h-7 gap-1" onClick={() => onEvaluate(trip.id)}>
                      {trip.evaluated ? (
                        <><Pencil className="h-3 w-3" /> Editar</>
                      ) : (
                        'Avaliar'
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
