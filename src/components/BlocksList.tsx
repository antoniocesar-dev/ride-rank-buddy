import { useState } from 'react';
import { ShieldAlert, ShieldOff, Unlock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getBlockTypeLabel } from '@/data/mockData';
import { useData } from '@/contexts/DataContext';

export function BlocksList() {
  const { blocks, drivers, isLoading, unblockDriver, manualBlocks } = useData();
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const blockedDrivers = drivers.filter(d => d.status === 'BLOQUEADO');

  const handleUnblock = async (driverId: string, driverName: string) => {
    setUnblocking(driverId);
    try {
      await unblockDriver(driverId, driverName, 'Ana Costa');
    } finally {
      setUnblocking(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Bloqueios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  // Only show NO_SHOW and MANUAL blocks from DB
  const allBlocks = manualBlocks
    .filter(mb => mb.ativo)
    .map((mb, idx) => ({
      id: mb.id || `manual-${idx}`,
      driver_id: mb.driver_id,
      driverName: mb.driver_name,
      tipo: (mb.tipo === 'NO_SHOW' ? 'NO_SHOW' : 'MANUAL') as 'NO_SHOW' | 'MANUAL',
      motivo: mb.motivo,
      ativo: mb.ativo,
      data_inicio: mb.data_inicio || '',
      data_fim: mb.data_fim || null,
      created_by: mb.created_by,
    }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          Bloqueios
          <span className="text-xs font-normal text-muted-foreground ml-auto">{allBlocks.filter(b => b.ativo).length} ativos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {allBlocks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum bloqueio ativo
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motivo</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Início</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Criado por</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {allBlocks.map((block) => (
                  <tr key={block.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{block.driverName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {getBlockTypeLabel(block.tipo)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{block.motivo}</td>
                    <td className="px-4 py-3 font-mono text-xs">{block.data_inicio}</td>
                    <td className="px-4 py-3 text-center">
                      {block.ativo ? (
                        <Badge variant="destructive" className="text-[10px]">
                          <ShieldAlert className="h-3 w-3 mr-1" /> BLOQUEADO
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <ShieldOff className="h-3 w-3 mr-1" /> ENCERRADO
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{block.created_by}</td>
                    <td className="px-4 py-3 text-center">
                      {block.ativo && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          disabled={unblocking === block.driver_id}
                          onClick={() => handleUnblock(block.driver_id, block.driverName)}
                        >
                          <Unlock className="h-3 w-3" />
                          {unblocking === block.driver_id ? 'Desbloqueando...' : 'Desbloquear'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
