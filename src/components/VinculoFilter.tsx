import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface VinculoFilterProps {
  vinculoTypes: string[];
  selectedVinculos: string[];
  setSelectedVinculos: (v: string[]) => void;
}

export function VinculoFilter({ vinculoTypes, selectedVinculos, setSelectedVinculos }: VinculoFilterProps) {
  if (vinculoTypes.length === 0) return null;

  const toggle = (v: string) => {
    setSelectedVinculos(
      selectedVinculos.includes(v)
        ? selectedVinculos.filter(x => x !== v)
        : [...selectedVinculos, v]
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5" />
          Filtro de Vínculo
          {selectedVinculos.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {selectedVinculos.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <span className="text-sm font-medium">Filtrar por vínculo</span>
          {selectedVinculos.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedVinculos([])}>
              <X className="h-3 w-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
        <div className="p-2 space-y-1">
          {vinculoTypes.map(v => (
            <label key={v} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox
                checked={selectedVinculos.includes(v)}
                onCheckedChange={() => toggle(v)}
              />
              <span className="text-xs">{v}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
