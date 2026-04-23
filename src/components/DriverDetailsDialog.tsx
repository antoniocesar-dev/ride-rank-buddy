import { useMemo } from 'react';
import { Activity, AlertCircle, Building2, CalendarDays, FileText, MapPinned, Route, ShieldAlert, ShieldCheck, TimerReset, Trophy } from 'lucide-react';
import type { Driver, Trip } from '@/data/mockData';
import { buildDriverAnalysis, formatDriverRank, summarizeDriverRoutes, sortTripsByLatest, stripDriverIdSuffix } from '@/lib/driverDetails';
import { getSingleDriverEvaluationSummary } from '@/lib/qualityInsights';
import { formatTripDelta } from '@/lib/tripTiming';
import { getDriverVinculoLabel, getRouteLabel } from '@/lib/tripFilters';
import { getRouteBasePoints } from '@/services/routeScoreService';
import { useData } from '@/contexts/DataContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DriverDetailsDialogProps {
  driver: Driver | null;
  driverTrips: Trip[];
  driverRank: number | null;
  totalDriversInRanking: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MetricPill({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'danger' }) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-amber-600'
        : 'text-destructive';

  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-base font-semibold ${toneClass}`}>{value.toFixed(1)}%</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === 'ON TIME') {
    return <Badge variant="success" className="text-[10px]">ON TIME</Badge>;
  }

  if (normalizedStatus === 'EARLY') {
    return <Badge className="text-[10px] bg-amber-500/15 text-amber-700 border-amber-500/20 hover:bg-amber-500/20">EARLY</Badge>;
  }

  if (normalizedStatus === 'DELAY') {
    return <Badge variant="destructive" className="text-[10px]">DELAY</Badge>;
  }

  return <Badge variant="outline" className="text-[10px]">{status || 'Sem status'}</Badge>;
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/10 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium break-words">{value}</div>
    </div>
  );
}

function AnalysisHighlightCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-success/20 bg-success/5 text-success'
      : tone === 'warning'
        ? 'border-amber-500/25 bg-amber-500/8 text-amber-700'
        : tone === 'danger'
          ? 'border-destructive/20 bg-destructive/5 text-destructive'
          : 'border-border bg-muted/10 text-foreground';

  return (
    <div className={`rounded-xl border px-3 py-3 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-wider opacity-75">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="mt-1 text-[11px] opacity-75">{helper}</div>
    </div>
  );
}

export function DriverDetailsDialog({
  driver,
  driverTrips,
  driverRank,
  totalDriversInRanking,
  open,
  onOpenChange,
}: DriverDetailsDialogProps) {
  const { evaluations, routeScores } = useData();

  const sortedTrips = useMemo(() => sortTripsByLatest(driverTrips), [driverTrips]);
  const routeSummaries = useMemo(() => summarizeDriverRoutes(driverTrips), [driverTrips]);
  const displayName = driver ? stripDriverIdSuffix(driver.nome, driver.id) : '';
  const vinculo = driver ? getDriverVinculoLabel(driver.vinculo) : 'Terceiros';
  const routeCount = routeSummaries.length;
  const hasRank = driverRank !== null && driverRank > 0 && totalDriversInRanking > 0;
  const rankLabel = formatDriverRank(driverRank, totalDriversInRanking);
  const evaluationSummary = useMemo(
    () => driver
      ? getSingleDriverEvaluationSummary(driver.id, displayName, driverTrips, evaluations)
      : {
          driverId: '',
          driverName: '',
          tripCount: 0,
          evaluationCount: 0,
          noShowCount: 0,
          communicationLevel: 'Sem avaliacao' as const,
          behaviorLevel: 'Sem avaliacao' as const,
          communicationBreakdown: { boa: 0, regular: 0, ruim: 0 },
          behaviorBreakdown: { ok: 0, ruim: 0 },
        },
    [displayName, driver, driverTrips, evaluations]
  );
  const driverAnalysis = useMemo(
    () => driver
      ? buildDriverAnalysis(
          driver,
          driverTrips,
          evaluationSummary,
          hasRank ? { position: driverRank, total: totalDriversInRanking } : null
        )
      : {
          title: 'Sem viagens no recorte',
          tone: 'warning' as const,
          statusLabel: 'Sem base',
          summary: 'Nao ha dados disponiveis para analisar este motorista.',
          recommendation: 'Sem base suficiente para leitura operacional.',
          highlights: [],
        },
    [driver, driverRank, driverTrips, evaluationSummary, hasRank, totalDriversInRanking]
  );

  if (!driver) return null;
  const analysisToneClass =
    driverAnalysis.tone === 'success'
      ? 'border-success/20 bg-gradient-to-br from-success/12 via-success/6 to-background'
      : driverAnalysis.tone === 'danger'
        ? 'border-destructive/20 bg-gradient-to-br from-destructive/12 via-destructive/6 to-background'
        : 'border-amber-500/20 bg-gradient-to-br from-amber-500/12 via-amber-500/6 to-background';
  const statusBadgeClass =
    driverAnalysis.tone === 'success'
      ? 'bg-success text-success-foreground'
      : driverAnalysis.tone === 'danger'
        ? 'bg-destructive text-destructive-foreground'
        : 'bg-amber-500 text-amber-950';
  const StatusIcon = driverAnalysis.tone === 'success' ? ShieldCheck : ShieldAlert;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-xl">{displayName}</DialogTitle>
              <DialogDescription>
                Resumo do motorista com foco na rota filtrada e no desempenho operacional para decisao de escala.
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge variant={driver.status === 'ATIVO' ? 'success' : 'destructive'}>{driver.status}</Badge>
              <Badge variant="secondary">ID {driver.id}</Badge>
              <Badge variant="outline">{vinculo}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[85vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-amber-500/12 p-2 text-amber-700">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rank no filtro</div>
                  <div className="font-mono text-xl font-bold">{rankLabel}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Pontuacao</div>
                  <div className="font-mono text-xl font-bold">{driver.pontuacao}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Viagens</div>
                  <div className="font-mono text-xl font-bold">{driver.totalViagens}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Ocorrencias</div>
                  <div className="font-mono text-xl font-bold">{driver.ocorrencias}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-secondary p-2 text-secondary-foreground">
                  <Route className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rotas</div>
                  <div className="font-mono text-xl font-bold">{routeCount}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="resumo" className="mt-6 space-y-4">
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-card border p-1">
              <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
              <TabsTrigger value="rotas" className="text-xs">Rotas</TabsTrigger>
              <TabsTrigger value="viagens" className="text-xs">Viagens</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4">
              <Card className={analysisToneClass}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-accent" /> Analise da Lamonica
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${statusBadgeClass}`}>
                        <StatusIcon className="h-4 w-4" />
                        {driverAnalysis.statusLabel}
                      </div>
                      {hasRank ? <Badge variant="outline">Rank: {rankLabel}</Badge> : null}
                      <Badge variant="outline">Avaliacoes: {evaluationSummary.evaluationCount}</Badge>
                      <Badge variant="outline">No-show: {evaluationSummary.noShowCount}</Badge>
                      <Badge variant="outline">Comunicacao: {evaluationSummary.communicationLevel}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xl font-semibold tracking-tight">{driverAnalysis.title}</div>
                      <p className="text-sm leading-6 text-foreground/90">{driverAnalysis.summary}</p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Decisao operacional</div>
                      <div className="mt-1 text-sm font-medium">{driverAnalysis.recommendation}</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {driverAnalysis.highlights.map(highlight => (
                      <AnalysisHighlightCard
                        key={highlight.label}
                        label={highlight.label}
                        value={highlight.value}
                        helper={highlight.helper}
                        tone={highlight.tone}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TimerReset className="h-4 w-4 text-accent" /> ETA Origem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3">
                    <MetricPill label="On Time" value={driver.etaOrigMetrics.onTime} tone="success" />
                    <MetricPill label="Early" value={driver.etaOrigMetrics.early} tone="warning" />
                    <MetricPill label="Delay" value={driver.etaOrigMetrics.delay} tone="danger" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-accent" /> ETA Destino
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3">
                    <MetricPill label="On Time" value={driver.etaDestMetrics.onTime} tone="success" />
                    <MetricPill label="Early" value={driver.etaDestMetrics.early} tone="warning" />
                    <MetricPill label="Delay" value={driver.etaDestMetrics.delay} tone="danger" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-accent" /> Panorama Rapido
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem label="Motorista" value={displayName} />
                  <DetailItem label="Rank no Filtro" value={rankLabel} />
                  <DetailItem label="Status" value={driver.status} />
                  <DetailItem label="Vinculo" value={vinculo} />
                  <DetailItem label="Rotas Distintas" value={routeCount} />
                  <DetailItem label="Comunicacao" value={evaluationSummary.communicationLevel} />
                  <DetailItem label="Comportamento" value={evaluationSummary.behaviorLevel} />
                  <DetailItem label="Avaliacoes" value={evaluationSummary.evaluationCount} />
                  <DetailItem label="No-show" value={evaluationSummary.noShowCount} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rotas">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Route className="h-4 w-4 text-accent" /> Rotas do Motorista
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Rota</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Viagens</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Pontos</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Media</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Ocorrencias</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Avaliadas</th>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Ultima Viagem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routeSummaries.map(routeSummary => (
                          <tr key={routeSummary.key} className="border-b border-border/50">
                            <td className="px-4 py-3 font-mono text-xs">{routeSummary.label}</td>
                            <td className="px-4 py-3 text-right font-mono">{routeSummary.tripCount}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold">{routeSummary.totalScore}</td>
                            <td className="px-4 py-3 text-right font-mono">{routeSummary.averageScore.toFixed(1)}</td>
                            <td className="px-4 py-3 text-right font-mono">{routeSummary.occurrenceCount}</td>
                            <td className="px-4 py-3 text-right font-mono">{routeSummary.evaluatedCount}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{routeSummary.lastTripDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="viagens">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" /> Viagens e Informacoes Completas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="rounded-lg border">
                    {sortedTrips.map(trip => {
                      const routeLabel = getRouteLabel(trip.origin_code, trip.destination_code);
                      const basePoints = getRouteBasePoints(routeScores, trip.origin_code, trip.destination_code, trip.data);
                      const maxScore = basePoints + 2;

                      return (
                        <AccordionItem key={trip.id} value={trip.id} className="px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between md:pr-4">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs text-muted-foreground">{trip.id}</span>
                                  <Badge variant={trip.evaluated ? 'secondary' : 'outline'} className="text-[10px]">
                                    {trip.evaluated ? 'Avaliada' : 'Pendente'}
                                  </Badge>
                                  {trip.ocorrencia ? (
                                    <Badge variant="destructive" className="text-[10px]">
                                      {trip.ocorrencia_count} ocorr.
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="font-medium">{routeLabel}</div>
                                <div className="text-xs text-muted-foreground">{trip.data}</div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                <StatusBadge status={trip.status_eta} />
                                <StatusBadge status={trip.status_eta_destino} />
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  {trip.score_final}/{maxScore}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-5">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <DetailItem label="ID da Viagem" value={trip.id} />
                              <DetailItem label="Data" value={trip.data || '-'} />
                              <DetailItem label="Rota" value={routeLabel} />
                              <DetailItem label="Pontuacao" value={`${trip.score_final}/${maxScore}`} />
                              <DetailItem label="ETA Origem" value={trip.status_eta || '-'} />
                              <DetailItem label="ETA Destino" value={trip.status_eta_destino || '-'} />
                              <DetailItem label="Comparativo ETA Origem" value={formatTripDelta(trip.eta_origin_diff_minutes)} />
                              <DetailItem label="Comparativo ETA Destino" value={formatTripDelta(trip.eta_destination_diff_minutes)} />
                              <DetailItem label="ETA Origem Previsto" value={trip.eta_origin_scheduled || '-'} />
                              <DetailItem label="ETA Origem Realizado" value={trip.eta_origin_realized || '-'} />
                              <DetailItem label="ETA Destino Previsto" value={trip.eta_destination_scheduled || '-'} />
                              <DetailItem label="ETA Destino Realizado" value={trip.eta_destination_realized || '-'} />
                              <DetailItem label="Status Agrupado DBLH" value={trip.status_agrupado || '-'} />
                              <DetailItem label="Fonte do Campo" value={trip.source_sheet_field || '-'} />
                              <DetailItem label="CPT" value={trip.status_cpt || '-'} />
                              <DetailItem label="Vinculo" value={vinculo} />
                              <DetailItem label="Ocorrencias" value={trip.ocorrencia_count} />
                              <DetailItem label="Ocorrencia ETA" value={trip.ocorrencia_eta || '-'} />
                              <DetailItem label="Ocorrencia CPT" value={trip.ocorrencia_cpt || '-'} />
                              <DetailItem label="Ocorrencia ETA Destino" value={trip.ocorrencia_eta_destino || '-'} />
                              <DetailItem label="Origem" value={trip.origin_code || '-'} />
                              <DetailItem label="Destino" value={trip.destination_code || '-'} />
                              <DetailItem label="Base da Rota" value={basePoints} />
                              <DetailItem label="Avaliacao" value={trip.evaluated ? 'Avaliada' : 'Pendente'} />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
