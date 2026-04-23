import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface RouteOption {
  value: string;
  label: string;
}

interface RouteFilterProps {
  routeOptions: RouteOption[];
  selectedRoutes: string[];
  setSelectedRoutes: (v: string[]) => void;
}

export function RouteFilter({ routeOptions, selectedRoutes, setSelectedRoutes }: RouteFilterProps) {
  if (routeOptions.length === 0) return null;

  const toggle = (route: string) => {
    setSelectedRoutes(
      selectedRoutes.includes(route)
        ? selectedRoutes.filter(value => value !== route)
        : [...selectedRoutes, route]
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5" />
          Filtro de Rotas
          {selectedRoutes.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {selectedRoutes.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <span className="text-sm font-medium">Filtrar por rota</span>
          {selectedRoutes.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedRoutes([])}>
              <X className="h-3 w-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {routeOptions.map(route => (
            <label
              key={route.value}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedRoutes.includes(route.value)}
                onCheckedChange={() => toggle(route.value)}
              />
              <span className="text-xs font-mono">{route.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
