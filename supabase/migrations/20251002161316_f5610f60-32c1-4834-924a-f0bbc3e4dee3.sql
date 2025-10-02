-- Fix search_path for set_recommended_exercise function
CREATE OR REPLACE FUNCTION public.set_recommended_exercise()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE NEW.diet_type
    WHEN 'emagrecimento' THEN
      NEW.recommended_exercise := 'Exercícios aeróbicos: corrida, caminhada rápida, ciclismo, natação (30-60 min, 4-5x/semana)';
    WHEN 'hipertrofia' THEN
      NEW.recommended_exercise := 'Musculação e treino de resistência: treino com pesos, 4-6x/semana, foco em grupos musculares';
    WHEN 'manutencao' THEN
      NEW.recommended_exercise := 'Treino leve e manutenção: caminhada, yoga, pilates (20-40 min, 3-4x/semana)';
    ELSE
      NEW.recommended_exercise := NULL;
  END CASE;
  RETURN NEW;
END;
$$;