import { Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useData, DEFAULT_IGNORED_OCCURRENCES } from '@/contexts/DataContext';

export function OccurrenceFilter() {
  const { uniqueOccurrences, ignoredOccurrences, setIgnoredOccurrences } = useData();

  if (uniqueOccurrences.length === 0) return null;

  const toggle = (occ: string) => {
    setIgnoredOccurrences(
      ignoredOccurrences.includes(occ)
        ? ignoredOccurrences.filter(o => o !== occ)
        : [...ignoredOccurrences, occ]
    );
  };

  const reset = () => setIgnoredOccurrences([...DEFAULT_IGNORED_OCCURRENCES]);
  const clear = () => setIgnoredOccurrences([]);
  const count = ignoredOccurrences.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <Filter className="h-3.5 w-3.5" />
          Filtro de Ocorrências
          {count > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {count} ignorada{count > 1 ? 's' : ''}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-medium">Ignorar ocorrências</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={reset}>
              <RotateCcw className="h-3 w-3" /> Resetar
            </Button>
            {count > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clear}>
                <X className="h-3 w-3" /> Limpar
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <div className="p-2 space-y-1">
            {uniqueOccurrences.map(occ => (
              <label
                key={occ}
                className="flex items-start gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={ignoredOccurrences.includes(occ)}
                  onCheckedChange={() => toggle(occ)}
                  className="mt-0.5"
                />
                <span className="text-xs leading-relaxed break-words">{occ}</span>
              </label>
            ))}
          </div>
        </div>
        {count > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30 text-[11px] text-muted-foreground">
            Score e ranking recalculados sem as ocorrências selecionadas
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
