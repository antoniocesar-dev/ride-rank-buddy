
-- Evaluations table: stores operator evaluations per trip
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  comunicacao TEXT NOT NULL DEFAULT 'BOA',
  atendeu BOOLEAN NOT NULL DEFAULT true,
  desvio_rota TEXT NOT NULL DEFAULT 'NENHUM',
  postura TEXT NOT NULL DEFAULT 'OK',
  ajuste_manual INTEGER NOT NULL DEFAULT 0,
  observacao TEXT DEFAULT '',
  operador TEXT NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Driver blocks table: manages block/unblock status
CREATE TABLE public.driver_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'MANUAL',
  motivo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ,
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluation logs table: full audit trail
CREATE TABLE public.evaluation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id TEXT,
  driver_id TEXT,
  driver_name TEXT,
  operador TEXT NOT NULL,
  acao TEXT NOT NULL,
  dados_antes JSONB,
  dados_depois JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_logs ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this operational tool)
CREATE POLICY "Allow all access to evaluations" ON public.evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to driver_blocks" ON public.driver_blocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to evaluation_logs" ON public.evaluation_logs FOR ALL USING (true) WITH CHECK (true);
