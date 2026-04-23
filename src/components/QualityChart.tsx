import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '@/contexts/DataContext';
import type { Driver, Trip } from '@/data/mockData';
import {
  summarizeDriverEvaluations,
  summarizeDriverQualityInsights,
  summarizeSheetNoShowRoutes,
  summarizeRouteQuality,
  type DriverEvaluationSummary,
  type DriverQualityInsight,
  type RouteQualitySummary,
} from '@/lib/qualityInsights';

interface QualityChartProps {
  filteredTrips?: Trip[];
  filteredDrivers?: Driver[];
  filteredNoShowTrips?: Trip[];
}

function getBarColor(value: number) {
  if (value > 30) return 'hsl(0, 72%, 51%)';
  if (value > 15) return 'hsl(38, 92%, 50%)';
  return 'hsl(152, 60%, 40%)';
}

function RouteSignalList({
  title,
  emptyLabel,
  routes,
  tone,
}: {
  title: string;
  emptyLabel: string;
  routes: RouteQualitySummary[];
  tone: 'info' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-destructive'
      : tone === 'warning'
        ? 'text-amber-600'
        : 'text-blue-600';

  return (
    <div className="rounded-xl border bg-muted/10 p-4">
      <div className={`text-sm font-semibold ${toneClass}`}>{title}</div>
      <div className="mt-3 space-y-2">
        {routes.length === 0 ? (
          <div className="text-sm text-muted-foreground">{emptyLabel}</div>
        ) : (
          routes.slice(0, 5).map((route, index) => (
            <div key={route.key} className="flex items-start justify-between gap-3 rounded-lg border bg-background px-3 py-2">
              <div>
                <div className="text-xs text-muted-foreground">#{index + 1}</div>
                <div className="font-mono text-xs">{route.label}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold">{route.count}</div>
                <div className="text-[11px] text-muted-foreground">{route.rate.toFixed(1)}%</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DriverLevelBadges({ summary }: { summary: DriverEvaluationSummary }) {
  const communicationVariant =
    summary.communicationLevel === 'Boa'
      ? 'success'
      : summary.communicationLevel === 'Regular'
        ? 'secondary'
        : summary.communicationLevel === 'Ruim'
          ? 'destructive'
          : 'outline';

  const behaviorVariant =
    summary.behaviorLevel === 'Adequado'
      ? 'success'
      : summary.behaviorLevel === 'Atencao'
        ? 'secondary'
        : summary.behaviorLevel === 'Critico'
          ? 'destructive'
          : 'outline';

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={communicationVariant} className="text-[10px]">
        Comunicacao: {summary.communicationLevel}
      </Badge>
      <Badge variant={behaviorVariant} className="text-[10px]">
        Comportamento: {summary.behaviorLevel}
      </Badge>
      {summary.noShowCount > 0 ? (
        <Badge variant="destructive" className="text-[10px]">
          No-show: {summary.noShowCount}
        </Badge>
      ) : null}
    </div>
  );
}

function InsightRow({
  insight,
  mode,
}: {
  insight: DriverQualityInsight;
  mode: 'positive' | 'warning';
}) {
  const badgeVariant = mode === 'positive' ? 'success' : 'destructive';
  const leadMetric =
    mode === 'positive'
      ? `${insight.punctualityRate.toFixed(1)}% pontual`
      : `${insight.delayRate.toFixed(1)}% delay`;

  return (
    <div className="rounded-xl border bg-background px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{insight.driverName}</div>
          <div className="mt-1 text-xs text-muted-foreground">{insight.primaryInsight}</div>
        </div>
        <Badge variant={badgeVariant} className="text-[10px]">
          {mode === 'positive' ? 'Destaque' : 'Atencao'}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline" className="text-[10px]">{leadMetric}</Badge>
        <Badge variant="outline" className="text-[10px]">{insight.occurrenceRate.toFixed(1)}% ocorr.</Badge>
        <Badge variant="outline" className="text-[10px]">{insight.tripCount} viagens</Badge>
        {insight.noShowCount > 0 ? (
          <Badge variant="destructive" className="text-[10px]">{insight.noShowCount} no-show</Badge>
        ) : null}
      </div>
    </div>
  );
}

function InsightPanel({
  title,
  subtitle,
  emptyLabel,
  insights,
  mode,
}: {
  title: string;
  subtitle: string;
  emptyLabel: string;
  insights: DriverQualityInsight[];
  mode: 'positive' | 'warning';
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          insights.slice(0, 5).map(insight => (
            <InsightRow key={insight.driverId} insight={insight} mode={mode} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function QualityChart({ filteredTrips, filteredDrivers, filteredNoShowTrips }: QualityChartProps) {
  const { trips: allTrips, drivers: allDrivers, evaluations, isLoading } = useData();

  const trips = filteredTrips ?? allTrips;
  const drivers = filteredDrivers ?? allDrivers;
  const noShowTrips = filteredNoShowTrips ?? [];

  const total = trips.length || 1;

  const kpiData = useMemo(() => {
    const hasDelay = (status: string) => (status || '').trim().toUpperCase() === 'DELAY';

    return [
      { name: 'ETA Orig. Delay', value: Math.round((trips.filter(trip => hasDelay(trip.status_eta)).length / total) * 100) },
      { name: 'ETA Dest. Delay', value: Math.round((trips.filter(trip => hasDelay(trip.status_eta_destino)).length / total) * 100) },
      { name: 'Com Ocorrencia', value: Math.round((trips.filter(trip => trip.ocorrencia).length / total) * 100) },
    ];
  }, [trips, total]);

  const scoreDistribution = useMemo(() => {
    const maxPts = Math.max(...drivers.map(driver => driver.pontuacao), 1);
    const bucketSize = Math.ceil(maxPts / 5);

    return Array.from({ length: 5 }, (_, index) => {
      const low = index * bucketSize;
      const high = (index + 1) * bucketSize;

      return {
        range: `${low}-${high}`,
        count: drivers.filter(driver => driver.pontuacao >= low && driver.pontuacao < high).length,
      };
    });
  }, [drivers]);

  const earlyRoutes = useMemo(() => summarizeRouteQuality(trips, 'early'), [trips]);
  const delayRoutes = useMemo(() => summarizeRouteQuality(trips, 'delay'), [trips]);
  const noShowRoutes = useMemo(
    () => summarizeSheetNoShowRoutes([...trips, ...noShowTrips], noShowTrips),
    [trips, noShowTrips]
  );
  const driverEvaluationSummaries = useMemo(
    () => summarizeDriverEvaluations(drivers, trips, evaluations),
    [drivers, trips, evaluations]
  );
  const driverQualityInsights = useMemo(
    () => summarizeDriverQualityInsights(drivers, trips, evaluations),
    [drivers, trips, evaluations]
  );

  const topReliableDrivers = useMemo(() => {
    return [...driverQualityInsights]
      .filter(insight => insight.noShowCount === 0)
      .sort((left, right) => right.reliabilityIndex - left.reliabilityIndex);
  }, [driverQualityInsights]);

  const attentionDrivers = useMemo(() => {
    return [...driverQualityInsights]
      .filter(insight => insight.attentionIndex > 0)
      .sort((left, right) => right.attentionIndex - left.attentionIndex);
  }, [driverQualityInsights]);

  const evaluationTotals = useMemo(() => {
    return driverEvaluationSummaries.reduce(
      (acc, summary) => {
        acc.avaliacoes += summary.evaluationCount;
        acc.noShows += summary.noShowCount;
        acc.boas += summary.communicationBreakdown.boa;
        acc.regulares += summary.communicationBreakdown.regular;
        acc.ruins += summary.communicationBreakdown.ruim;
        acc.comportamentoOk += summary.behaviorBreakdown.ok;
        acc.comportamentoRuim += summary.behaviorBreakdown.ruim;
        return acc;
      },
      {
        avaliacoes: 0,
        noShows: 0,
        boas: 0,
        regulares: 0,
        ruins: 0,
        comportamentoOk: 0,
        comportamentoRuim: 0,
      }
    );
  }, [driverEvaluationSummaries]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card><CardContent className="p-5"><Skeleton className="h-[220px] w-full" /></CardContent></Card>
          <Card><CardContent className="p-5"><Skeleton className="h-[220px] w-full" /></CardContent></Card>
        </div>
        <Card><CardContent className="p-5"><Skeleton className="h-[260px] w-full" /></CardContent></Card>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card><CardContent className="p-5"><Skeleton className="h-[260px] w-full" /></CardContent></Card>
          <Card><CardContent className="p-5"><Skeleton className="h-[260px] w-full" /></CardContent></Card>
        </div>
        <Card><CardContent className="p-5"><Skeleton className="h-[320px] w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">% Viagens com penalidade por KPI</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={kpiData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 89%)" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={value => `${value}%`} fontSize={11} />
                <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {kpiData.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuicao de pontuacao dos motoristas</CardTitle>
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Rotas com mais early, delay e no-show</CardTitle>
          <div className="text-xs text-muted-foreground">
            Early e delay consideram apenas a chegada no destino. No-show vem direto da planilha DBLH, quando a viagem esta marcada como NO SHOW.
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <RouteSignalList
            title="Mais early"
            emptyLabel="Nenhuma rota com early no recorte atual."
            routes={earlyRoutes}
            tone="info"
          />
          <RouteSignalList
            title="Mais delay"
            emptyLabel="Nenhuma rota com delay no recorte atual."
            routes={delayRoutes}
            tone="warning"
          />
          <RouteSignalList
            title="Mais no-show"
            emptyLabel="Nenhuma rota com no-show no recorte atual."
            routes={noShowRoutes}
            tone="danger"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightPanel
          title="Motoristas destaque do recorte"
          subtitle="Melhor combinacao entre pontualidade, score e baixo risco operacional."
          emptyLabel="Nao ha motoristas suficientes para destacar neste recorte."
          insights={topReliableDrivers}
          mode="positive"
        />
        <InsightPanel
          title="Motoristas que pedem atencao"
          subtitle="Mais delay, ocorrencias, no-show ou sinais comportamentais de risco."
          emptyLabel="Nenhum motorista com alerta forte neste recorte."
          insights={attentionDrivers}
          mode="warning"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Nivel de comportamento e comunicacao dos motoristas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-lg border bg-muted/10 px-3 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avaliacoes</div>
              <div className="mt-1 font-mono text-lg font-semibold">{evaluationTotals.avaliacoes}</div>
            </div>
            <div className="rounded-lg border bg-muted/10 px-3 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Comunicacao boa</div>
              <div className="mt-1 font-mono text-lg font-semibold text-success">{evaluationTotals.boas}</div>
            </div>
            <div className="rounded-lg border bg-muted/10 px-3 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Comunicacao ruim</div>
              <div className="mt-1 font-mono text-lg font-semibold text-destructive">{evaluationTotals.ruins}</div>
            </div>
            <div className="rounded-lg border bg-muted/10 px-3 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Postura OK</div>
              <div className="mt-1 font-mono text-lg font-semibold text-success">{evaluationTotals.comportamentoOk}</div>
            </div>
            <div className="rounded-lg border bg-muted/10 px-3 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Postura ruim</div>
              <div className="mt-1 font-mono text-lg font-semibold text-destructive">{evaluationTotals.comportamentoRuim}</div>
            </div>
            <div className="rounded-lg border bg-muted/10 px-3 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">No-shows</div>
              <div className="mt-1 font-mono text-lg font-semibold text-destructive">{evaluationTotals.noShows}</div>
            </div>
          </div>

          {driverEvaluationSummaries.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
              Ainda nao ha avaliacoes suficientes para montar o quadro comportamental dos motoristas neste recorte.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Leitura</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Avaliacoes</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Viagens</th>
                  </tr>
                </thead>
                <tbody>
                  {driverEvaluationSummaries.map(summary => (
                    <tr key={summary.driverId} className="border-b border-border/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{summary.driverName}</div>
                        <div className="text-xs text-muted-foreground">
                          Boa {summary.communicationBreakdown.boa} • Regular {summary.communicationBreakdown.regular} • Ruim {summary.communicationBreakdown.ruim}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <DriverLevelBadges summary={summary} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{summary.evaluationCount}</td>
                      <td className="px-4 py-3 text-right font-mono">{summary.tripCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
