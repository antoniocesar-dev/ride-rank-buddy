
CREATE TABLE public.route_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_code TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  pontuacao NUMERIC NOT NULL DEFAULT 1,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_route_scores_codes ON public.route_scores (origin_code, destination_code);
CREATE INDEX idx_route_scores_dates ON public.route_scores (data_inicio, data_fim);

ALTER TABLE public.route_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to route_scores"
ON public.route_scores
FOR ALL
TO public
USING (true)
WITH CHECK (true);
