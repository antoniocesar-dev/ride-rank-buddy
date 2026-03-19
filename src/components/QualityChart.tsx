import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '@/contexts/DataContext';

export function QualityChart() {
  const { trips, drivers, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-5"><Skeleton className="h-[220px] w-full" /></CardContent></Card>
        <Card><CardContent className="p-5"><Skeleton className="h-[220px] w-full" /></CardContent></Card>
      </div>
    );
  }

  const total = trips.length || 1;

  const statusNorm = (s: string) => (s.toUpperCase() === 'ON TIME' || s.toUpperCase() === 'EARLY') ? 1 : 0;

  const kpiData = [
    { name: 'ETA Orig. DELAY', value: Math.round((trips.filter(t => statusNorm(t.status_eta) === 0).length / total) * 100) },
    { name: 'ETA Dest. DELAY', value: Math.round((trips.filter(t => statusNorm(t.status_eta_destino) === 0).length / total) * 100) },
    { name: 'Com Ocorrência', value: Math.round((trips.filter(t => t.ocorrencia).length / total) * 100) },
  ];

  const getBarColor = (value: number) => {
    if (value > 30) return 'hsl(0, 72%, 51%)';
    if (value > 15) return 'hsl(38, 92%, 50%)';
    return 'hsl(152, 60%, 40%)';
  };

  const maxPts = Math.max(...drivers.map(d => d.pontuacao), 1);
  const bucketSize = Math.ceil(maxPts / 5);
  const scoreDistribution = Array.from({ length: 5 }, (_, i) => {
    const lo = i * bucketSize;
    const hi = (i + 1) * bucketSize;
    return {
      range: `${lo}-${hi}`,
      count: drivers.filter(d => d.pontuacao >= lo && d.pontuacao < hi).length,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">% Viagens com Penalidade por KPI</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={kpiData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 89%)" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
              <YAxis type="category" dataKey="name" width={100} fontSize={11} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {kpiData.map((entry, idx) => (
                  <Cell key={idx} fill={getBarColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribuição de Pontuação dos Motoristas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 89%)" />
              <XAxis dataKey="range" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(220, 60%, 20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
