-- Criar tabela de banco de dados de alimentos
CREATE TABLE IF NOT EXISTS public.food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name TEXT NOT NULL,
  food_name_normalized TEXT NOT NULL,
  source TEXT NOT NULL, -- 'open_food_facts', 'taco', 'nutrisurvey', 'user_custom'
  source_id TEXT,
  
  -- Informações nutricionais por 100g
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fats NUMERIC NOT NULL,
  fiber NUMERIC,
  sodium NUMERIC,
  
  -- Metadados
  category TEXT,
  brand TEXT,
  image_url TEXT,
  barcode TEXT,
  
  -- Controle de usuário (para alimentos customizados)
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para busca
  UNIQUE(source, source_id)
);

-- Índices para performance
CREATE INDEX idx_food_database_name ON public.food_database USING gin(to_tsvector('portuguese', food_name));
CREATE INDEX idx_food_database_normalized ON public.food_database(food_name_normalized);
CREATE INDEX idx_food_database_source ON public.food_database(source);
CREATE INDEX idx_food_database_category ON public.food_database(category);

-- Enable RLS
ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: todos podem ler, usuários autenticados podem criar
CREATE POLICY "Anyone can view food database"
  ON public.food_database
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert custom foods"
  ON public.food_database
  FOR INSERT
  TO authenticated
  WITH CHECK (
    source = 'user_custom' AND 
    created_by_user_id = auth.uid()
  );

CREATE POLICY "Users can update their own custom foods"
  ON public.food_database
  FOR UPDATE
  TO authenticated
  USING (
    source = 'user_custom' AND 
    created_by_user_id = auth.uid()
  )
  WITH CHECK (
    source = 'user_custom' AND 
    created_by_user_id = auth.uid()
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_food_database_updated_at
  BEFORE UPDATE ON public.food_database
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para normalizar nomes de alimentos (remover acentos, lowercase)
CREATE OR REPLACE FUNCTION public.normalize_food_name(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(
    unaccent(
      regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g')
    )
  );
END;
$$;

-- Trigger para auto-preencher food_name_normalized
CREATE OR REPLACE FUNCTION public.set_normalized_food_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.food_name_normalized := public.normalize_food_name(NEW.food_name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_food_name_normalized
  BEFORE INSERT OR UPDATE ON public.food_database
  FOR EACH ROW
  EXECUTE FUNCTION public.set_normalized_food_name();