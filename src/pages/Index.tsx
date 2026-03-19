import { useState } from 'react';
import { BarChart3, Trophy, FileText, ShieldAlert, Activity, ScrollText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatsCards } from '@/components/StatsCards';
import { DriverRanking } from '@/components/DriverRanking';
import { TripList } from '@/components/TripList';
import { BlocksList } from '@/components/BlocksList';
import { QualityChart } from '@/components/QualityChart';
import { EvaluationForm } from '@/components/EvaluationForm';
import { EvaluationLogList } from '@/components/EvaluationLogList';
import { OccurrenceFilter } from '@/components/OccurrenceFilter';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { DriverImport } from '@/components/DriverImport';

const Index = () => {
  const [evaluatingTrip, setEvaluatingTrip] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">DriverScore</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sistema de Avaliação</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-slow" />
            Operador
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
            <TabsTrigger value="logs" className="gap-1.5 text-xs">
              <ScrollText className="h-3.5 w-3.5" /> Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranking">
            <DriverRanking />
          </TabsContent>

          <TabsContent value="viagens">
            <TripList onEvaluate={setEvaluatingTrip} />
          </TabsContent>

          <TabsContent value="qualidade">
            <QualityChart />
          </TabsContent>

          <TabsContent value="bloqueios">
            <BlocksList />
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
