import { useMemo, useState } from 'react';
import { Activity, BarChart3, FileText, RefreshCw, Route, ScrollText, ShieldAlert, Trophy } from 'lucide-react';
import { BlocksList } from '@/components/BlocksList';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { DriverImport } from '@/components/DriverImport';
import { DriverRanking } from '@/components/DriverRanking';
import { EvaluationForm } from '@/components/EvaluationForm';
import { EvaluationLogList } from '@/components/EvaluationLogList';
import { OccurrenceFilter } from '@/components/OccurrenceFilter';
import { QualityChart } from '@/components/QualityChart';
import { RouteFilter } from '@/components/RouteFilter';
import { RouteScores } from '@/components/RouteScores';
import { StatsCards } from '@/components/StatsCards';
import { TripList } from '@/components/TripList';
import { VinculoFilter } from '@/components/VinculoFilter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';
import type { Driver } from '@/data/mockData';
import { deriveDrivers } from '@/services/dataAdapter';
import { filterTripsBySelections, getDriverVinculoLabel, getRouteKey, getRouteLabel } from '@/lib/tripFilters';

const Index = () => {
  const [evaluatingTrip, setEvaluatingTrip] = useState<string | null>(null);
  const [selectedVinculos, setSelectedVinculos] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const { trips, sheetNoShowTrips, activeDrivers, refreshData, isLoading } = useData();

  const vinculoTypes = useMemo(() => {
    const types = new Set<string>();

    activeDrivers.forEach(driver => {
      types.add(getDriverVinculoLabel(driver.vinculo));
    });

    return Array.from(types).sort();
  }, [activeDrivers]);

  const driverVinculos = useMemo(() => {
    return new Map(
      activeDrivers.map(driver => [driver.id, getDriverVinculoLabel(driver.vinculo)])
    );
  }, [activeDrivers]);

  const filteredTrips = useMemo(() => {
    return filterTripsBySelections(trips, driverVinculos, selectedVinculos, selectedRoutes);
  }, [trips, driverVinculos, selectedVinculos, selectedRoutes]);

  const filteredSheetNoShowTrips = useMemo(() => {
    return filterTripsBySelections(sheetNoShowTrips, driverVinculos, selectedVinculos, selectedRoutes);
  }, [sheetNoShowTrips, driverVinculos, selectedVinculos, selectedRoutes]);

  const filteredDrivers = useMemo(() => {
    const activeDriverMap = new Map(activeDrivers.map(driver => [driver.id, driver]));

    if (selectedVinculos.length === 0 && selectedRoutes.length === 0) {
      return activeDrivers;
    }

    return deriveDrivers(filteredTrips)
      .map((driver): Driver | null => {
        const existingDriver = activeDriverMap.get(driver.id);
        if (!existingDriver) return null;

        return {
          ...driver,
          nome: existingDriver.nome,
          status: existingDriver.status,
          vinculo: existingDriver.vinculo,
        };
      })
      .filter((driver): driver is Driver => driver !== null);
  }, [activeDrivers, filteredTrips, selectedRoutes, selectedVinculos]);

  const routeOptions = useMemo(() => {
    const routes = new Map<string, string>();

    trips.forEach(trip => {
      const key = getRouteKey(trip.origin_code, trip.destination_code);
      if (!routes.has(key)) {
        routes.set(key, getRouteLabel(trip.origin_code, trip.destination_code));
      }
    });

    return Array.from(routes.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [trips]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">RankingMotoristas</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sistema de Avaliacao</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={refreshData} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-slow" />
              Operador
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <StatsCards />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <DateRangeFilter />
          <div className="flex items-center gap-2 flex-wrap">
            <DriverImport />
            <OccurrenceFilter />
            <VinculoFilter
              vinculoTypes={vinculoTypes}
              selectedVinculos={selectedVinculos}
              setSelectedVinculos={setSelectedVinculos}
            />
            <RouteFilter
              routeOptions={routeOptions}
              selectedRoutes={selectedRoutes}
              setSelectedRoutes={setSelectedRoutes}
            />
          </div>
        </div>

        <Tabs defaultValue="ranking" className="space-y-4">
          <TabsList className="bg-card border">
            <TabsTrigger value="ranking" className="gap-1.5 text-xs">
              <Trophy className="h-3.5 w-3.5" /> Ranking
            </TabsTrigger>
            <TabsTrigger value="viagens" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Viagens
            </TabsTrigger>
            <TabsTrigger value="qualidade" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" /> Qualidade
            </TabsTrigger>
            <TabsTrigger value="bloqueios" className="gap-1.5 text-xs">
              <ShieldAlert className="h-3.5 w-3.5" /> Bloqueios
            </TabsTrigger>
            <TabsTrigger value="rotas" className="gap-1.5 text-xs">
              <Route className="h-3.5 w-3.5" /> Rotas
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5 text-xs">
              <ScrollText className="h-3.5 w-3.5" /> Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranking">
            <DriverRanking filteredDrivers={filteredDrivers} filteredTrips={filteredTrips} />
          </TabsContent>

          <TabsContent value="viagens">
            <TripList
              onEvaluate={setEvaluatingTrip}
              selectedVinculos={selectedVinculos}
              selectedRoutes={selectedRoutes}
            />
          </TabsContent>

          <TabsContent value="qualidade">
            <QualityChart
              filteredTrips={filteredTrips}
              filteredDrivers={filteredDrivers}
              filteredNoShowTrips={filteredSheetNoShowTrips}
            />
          </TabsContent>

          <TabsContent value="bloqueios">
            <BlocksList />
          </TabsContent>

          <TabsContent value="rotas">
            <RouteScores />
          </TabsContent>

          <TabsContent value="logs">
            <EvaluationLogList />
          </TabsContent>
        </Tabs>
      </main>

      {evaluatingTrip && (
        <EvaluationForm tripId={evaluatingTrip} onClose={() => setEvaluatingTrip(null)} />
      )}
    </div>
  );
};

export default Index;
