-- Add DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Add new columns to meal_plans for enhanced diet plan functionality
ALTER TABLE public.meal_plans
ADD COLUMN IF NOT EXISTS plan_name text,
ADD COLUMN IF NOT EXISTS plan_description text,
ADD COLUMN IF NOT EXISTS diet_type text CHECK (diet_type IN ('emagrecimento', 'hipertrofia', 'manutencao')),
ADD COLUMN IF NOT EXISTS recommended_exercise text;

-- Create function to automatically set recommended exercise based on diet type
CREATE OR REPLACE FUNCTION public.set_recommended_exercise()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set recommended exercise
DROP TRIGGER IF EXISTS set_exercise_recommendation ON public.meal_plans;
CREATE TRIGGER set_exercise_recommendation
BEFORE INSERT OR UPDATE OF diet_type ON public.meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_recommended_exercise();