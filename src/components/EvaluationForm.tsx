import { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { blockDriver as blockDriverApi, createEvaluationLog } from '@/services/supabaseService';

interface EvaluationFormProps {
  tripId: string;
  onClose: () => void;
}

export function EvaluationForm({ tripId, onClose }: EvaluationFormProps) {
  const { trips, evaluateTrip, evaluations, refreshData } = useData();
  const trip = trips.find(t => t.id === tripId);
  const existing = evaluations.find(e => e.trip_id === tripId);
  const { toast } = useToast();

  const [comunicacao, setComunicacao] = useState(existing?.comunicacao || 'BOA');
  const [noShow, setNoShow] = useState(existing ? !existing.atendeu : false);
  
  const [desvio, setDesvio] = useState(existing?.desvio_rota || 'NENHUM');
  const [postura, setPostura] = useState(existing?.postura || 'OK');
  const [ajuste, setAjuste] = useState([existing?.ajuste_manual || 0]);
  const [observacao, setObservacao] = useState(existing?.observacao || '');
  const [operador, setOperador] = useState(existing?.operador || 'Ana Costa');
  const [saving, setSaving] = useState(false);
  const [blocking, setBlocking] = useState(false);

  if (!trip) return null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await evaluateTrip(tripId, trip.driver_id, trip.driverName, {
        comunicacao,
        atendeu: !noShow,
        desvio_rota: desvio,
        postura,
        ajuste_manual: ajuste[0],
        observacao,
        operador,
      });
      toast({
        title: existing ? 'Avaliação atualizada' : 'Avaliação salva',
        description: `Viagem ${tripId} avaliada com sucesso.`,
      });
      onClose();
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async () => {
    setBlocking(true);
    try {
      await blockDriverApi({
        driver_id: trip.driver_id,
        driver_name: trip.driverName,
        tipo: 'MANUAL',
        motivo: `Bloqueio manual na avaliação da viagem ${tripId}`,
        ativo: true,
        manual_override: false,
        data_inicio: new Date().toISOString(),
        data_fim: null,
        created_by: operador,
      });

      await createEvaluationLog({
        driver_id: trip.driver_id,
        driver_name: trip.driverName,
        operador,
        acao: 'BLOQUEIO_MANUAL',
        dados_antes: null,
        dados_depois: { status: 'BLOQUEADO', motivo: 'MANUAL', trip_id: tripId },
      });

      toast({
        title: 'Motorista bloqueado',
        description: `${trip.driverName} foi bloqueado manualmente.`,
        variant: 'destructive',
      });

      refreshData();
      onClose();
    } catch (err) {
      toast({ title: 'Erro ao bloquear', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{existing ? 'Editar Avaliação' : 'Avaliar Viagem'}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {trip.driverName} — {trip.data}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Comunicação</Label>
              <Select value={comunicacao} onValueChange={setComunicacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOA">Boa (+5)</SelectItem>
                  <SelectItem value="REGULAR">Regular (0)</SelectItem>
                  <SelectItem value="RUIM">Ruim (-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Desvio de Rota</Label>
              <Select value={desvio} onValueChange={setDesvio}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NENHUM">Nenhum (0)</SelectItem>
                  <SelectItem value="LEVE">Leve (-10)</SelectItem>
                  <SelectItem value="GRAVE">Grave (-20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Postura</Label>
              <Select value={postura} onValueChange={setPostura}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OK">OK (0)</SelectItem>
                  <SelectItem value="RUIM">Ruim (-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={noShow} onCheckedChange={setNoShow} />
              <Label className="text-xs">
                NO-SHOW {noShow && <span className="text-destructive font-semibold">— Irá BLOQUEAR o motorista</span>}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">
              Ajuste Manual: <span className="font-mono font-bold">{ajuste[0] >= 0 ? '+' : ''}{ajuste[0]}</span>
            </Label>
            <Slider value={ajuste} onValueChange={setAjuste} min={-20} max={20} step={1} />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-20</span><span>0</span><span>+20</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Operador</Label>
            <Input value={operador} onChange={(e) => setOperador(e.target.value)} placeholder="Nome do operador" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Observação</Label>
            <Textarea
              placeholder="Detalhes adicionais sobre a viagem..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleBlock}
              className="gap-1"
              disabled={saving || blocking}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {blocking ? 'Bloqueando...' : 'Bloquear'}
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={onClose} disabled={saving || blocking}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || blocking}>
              {saving ? 'Salvando...' : existing ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
