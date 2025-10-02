-- Change nutrition-related columns from integer to numeric for decimal precision
ALTER TABLE profiles 
  ALTER COLUMN target_calories TYPE numeric,
  ALTER COLUMN target_protein TYPE numeric,
  ALTER COLUMN target_carbs TYPE numeric,
  ALTER COLUMN target_fats TYPE numeric,
  ALTER COLUMN tdee TYPE numeric;

ALTER TABLE meal_plans
  ALTER COLUMN total_calories TYPE numeric,
  ALTER COLUMN total_protein TYPE numeric,
  ALTER COLUMN total_carbs TYPE numeric,
  ALTER COLUMN total_fats TYPE numeric;