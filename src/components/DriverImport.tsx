import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { upsertDrivers } from '@/services/supabaseService';
import * as XLSX from 'xlsx';

interface ParsedDriver {
  driver_id: string;
  driver_name: string;
}

function parseFile(file: File): Promise<ParsedDriver[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (rows.length === 0) {
          reject(new Error('Planilha vazia'));
          return;
        }

        // Find columns (case-insensitive, flexible matching)
        const firstRow = rows[0];
        const keys = Object.keys(firstRow);
        const driverIdCol = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '').includes('driverid'));
        const driverNameCol = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '').includes('drivername'));

        if (!driverIdCol || !driverNameCol) {
          reject(new Error('Colunas obrigatórias não encontradas: "Driver ID" e "Driver Name"'));
          return;
        }

        const drivers: ParsedDriver[] = [];
        for (const row of rows) {
          const id = String(row[driverIdCol] || '').trim();
          const name = String(row[driverNameCol] || '').trim();
          if (id && name) {
            drivers.push({ driver_id: id, driver_name: name });
          }
        }

        resolve(drivers);
      } catch {
        reject(new Error('Erro ao processar arquivo'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function DriverImport() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { refreshData } = useData();

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      toast({ title: 'Formato inválido', description: 'Aceita apenas .xlsx ou .csv', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const drivers = await parseFile(file);
      if (drivers.length === 0) {
        toast({ title: 'Nenhum motorista encontrado', description: 'Verifique o conteúdo da planilha.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      await upsertDrivers(drivers);
      setResult({ count: drivers.length });
      toast({ title: 'Planilha importada com sucesso', description: `${drivers.length} motoristas atualizados.` });
      refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro na importação', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setOpen(true)}>
        <Upload className="h-3.5 w-3.5" /> Importar Motoristas
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Planilha de Motoristas</DialogTitle>
            <DialogDescription>
              Envie um arquivo .xlsx ou .csv com as colunas <strong>Driver ID</strong> e <strong>Driver Name</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Processando...</p>
                </div>
              ) : result ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <p className="text-sm font-medium">{result.count} motoristas importados</p>
                  <Button variant="outline" size="sm" onClick={() => { setResult(null); }}>
                    Importar outra
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-xs text-muted-foreground">.xlsx ou .csv</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Os nomes importados substituem completamente os nomes originais da planilha de viagens para os Driver IDs correspondentes.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
