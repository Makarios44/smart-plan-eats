-- Create user_pantry table for available foods
CREATE TABLE public.user_pantry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  category text,
  quantity numeric,
  unit text,
  added_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create meal_suggestions table to store AI suggestions
CREATE TABLE public.meal_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('substitution', 'creative_meal')),
  original_food text,
  suggested_meal jsonb NOT NULL,
  macros jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_pantry
CREATE POLICY "Users can view their own pantry"
  ON public.user_pantry FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pantry items"
  ON public.user_pantry FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pantry items"
  ON public.user_pantry FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pantry items"
  ON public.user_pantry FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_suggestions
CREATE POLICY "Users can view their own suggestions"
  ON public.meal_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suggestions"
  ON public.meal_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_pantry_user ON public.user_pantry(user_id);
CREATE INDEX idx_meal_suggestions_user_date ON public.meal_suggestions(user_id, created_at DESC);

-- Trigger for updating updated_at
CREATE TRIGGER update_user_pantry_updated_at
  BEFORE UPDATE ON public.user_pantry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();