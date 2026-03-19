import { TrendingUp, TrendingDown, AlertTriangle, Users, Route, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/contexts/DataContext';

export function StatsCards() {
  const { activeDrivers, drivers, trips, blocks, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) =>
        <Card key={i} className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        )}
      </div>);

  }

  const stats = [
  {
    label: 'Motoristas Ativos',
    value: activeDrivers.length,
    total: drivers.length,
    icon: Users,
    trend: 'up' as const
  },
  {
    label: 'Pontuação Total',
    value: activeDrivers.reduce((a, d) => a + d.pontuacao, 0),
    suffix: ' pts',
    icon: BarChart3,
    trend: 'up' as const
  },
  {
    label: 'Total Viagens',
    value: trips.length,
    icon: Route,
    trend: 'neutral' as const
  },
  {
    label: 'Bloqueios Ativos',
    value: blocks.filter((b) => b.ativo).length,
    icon: AlertTriangle,
    trend: 'down' as const
  }];


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) =>
      <Card key={stat.label} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
              {stat.total &&
            <span className="text-sm text-muted-foreground mb-1">/ {stat.total}</span>
            }
              {stat.suffix &&
            <span className="text-sm text-muted-foreground mb-1">{stat.suffix}</span>
            }
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
              {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
              <span className="text-muted-foreground">​</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>);

}