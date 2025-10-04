-- Corrigir search_path das funções removendo trigger primeiro
DROP TRIGGER IF EXISTS set_food_name_normalized ON public.food_database;
DROP FUNCTION IF EXISTS public.set_normalized_food_name();
DROP FUNCTION IF EXISTS public.normalize_food_name(TEXT);

-- Recriar funções com search_path correto
CREATE OR REPLACE FUNCTION public.normalize_food_name(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN lower(
    unaccent(
      regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g')
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_normalized_food_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.food_name_normalized := public.normalize_food_name(NEW.food_name);
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER set_food_name_normalized
  BEFORE INSERT OR UPDATE ON public.food_database
  FOR EACH ROW
  EXECUTE FUNCTION public.set_normalized_food_name();