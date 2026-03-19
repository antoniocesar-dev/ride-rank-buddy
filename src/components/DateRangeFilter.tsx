import { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useData } from '@/contexts/DataContext';

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useData();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const hasFilter = dateRange.from || dateRange.to;

  const clear = () => setDateRange({ from: null, to: null });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2 text-xs", !dateRange.from && "text-muted-foreground")}>
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateRange.from ?? undefined}
            onSelect={(d) => { setDateRange({ ...dateRange, from: d ?? null }); setFromOpen(false); }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-muted-foreground">→</span>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2 text-xs", !dateRange.to && "text-muted-foreground")}>
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateRange.to ?? undefined}
            onSelect={(d) => { setDateRange({ ...dateRange, to: d ?? null }); setToOpen(false); }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clear}>
          <X className="h-3 w-3" /> Limpar
        </Button>
      )}
    </div>
  );
}
