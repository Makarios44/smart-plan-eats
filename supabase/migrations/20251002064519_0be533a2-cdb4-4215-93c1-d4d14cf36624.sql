-- Add body measurements fields to progress_tracking table
ALTER TABLE public.progress_tracking 
ADD COLUMN IF NOT EXISTS chest numeric,
ADD COLUMN IF NOT EXISTS waist numeric,
ADD COLUMN IF NOT EXISTS hip numeric,
ADD COLUMN IF NOT EXISTS arm_left numeric,
ADD COLUMN IF NOT EXISTS arm_right numeric,
ADD COLUMN IF NOT EXISTS thigh_left numeric,
ADD COLUMN IF NOT EXISTS thigh_right numeric,
ADD COLUMN IF NOT EXISTS body_fat_percentage numeric;

-- Create adherence_metrics table for tracking client adherence
CREATE TABLE IF NOT EXISTS public.adherence_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  meals_completed integer NOT NULL DEFAULT 0,
  meals_planned integer NOT NULL DEFAULT 0,
  adherence_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.adherence_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for adherence_metrics
CREATE POLICY "Users can view their own adherence metrics"
ON public.adherence_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adherence metrics"
ON public.adherence_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adherence metrics"
ON public.adherence_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Nutritionists can view their clients adherence"
ON public.adherence_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = adherence_metrics.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

-- Create notifications table for B2B communications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Nutritionists can create notifications for their clients"
ON public.notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = notifications.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);