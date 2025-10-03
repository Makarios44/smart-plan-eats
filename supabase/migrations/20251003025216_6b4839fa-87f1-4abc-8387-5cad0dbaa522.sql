-- Add new fields to profiles table for enhanced user data collection
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS lifestyle_routine text,
ADD COLUMN IF NOT EXISTS meals_per_day text,
ADD COLUMN IF NOT EXISTS dietary_restrictions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS food_allergies jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS disliked_foods text,
ADD COLUMN IF NOT EXISTS preferred_cuisines jsonb DEFAULT '[]'::jsonb;