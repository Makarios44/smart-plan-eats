-- Create weekly_feedback table
CREATE TABLE public.weekly_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_date date NOT NULL,
  current_weight numeric NOT NULL,
  energy_level integer NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
  hunger_satisfaction integer NOT NULL CHECK (hunger_satisfaction >= 1 AND hunger_satisfaction <= 5),
  adherence_level integer NOT NULL CHECK (adherence_level >= 1 AND adherence_level <= 5),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, week_date)
);

-- Create adjustment_history table
CREATE TABLE public.adjustment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_id uuid REFERENCES public.weekly_feedback(id) ON DELETE CASCADE,
  adjustment_date timestamp with time zone DEFAULT now(),
  previous_calories integer NOT NULL,
  new_calories integer NOT NULL,
  previous_protein integer NOT NULL,
  new_protein integer NOT NULL,
  previous_carbs integer NOT NULL,
  new_carbs integer NOT NULL,
  previous_fats integer NOT NULL,
  new_fats integer NOT NULL,
  adjustment_reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_feedback
CREATE POLICY "Users can view their own feedback"
  ON public.weekly_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.weekly_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.weekly_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.weekly_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for adjustment_history
CREATE POLICY "Users can view their own adjustment history"
  ON public.adjustment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adjustment history"
  ON public.adjustment_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_weekly_feedback_user_date ON public.weekly_feedback(user_id, week_date DESC);
CREATE INDEX idx_adjustment_history_user_date ON public.adjustment_history(user_id, adjustment_date DESC);