-- Simplificar NutriFácil: Remover camada B2B
-- Remover tables de organizações e roles complexos

-- 1. Remover client_assignments (relação nutricionista-cliente)
DROP TABLE IF EXISTS public.client_assignments CASCADE;

-- 2. Remover organization_members
DROP TABLE IF EXISTS public.organization_members CASCADE;

-- 3. Remover organizations
DROP TABLE IF EXISTS public.organizations CASCADE;

-- 4. Remover user_roles (vamos simplificar para apenas usuários finais)
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 5. Remover notifications (era usado para nutricionistas)
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 6. Remover funções relacionadas a roles e organizações
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role_in_org(_user_id uuid, _role app_role, _org_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_organizations(_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_organization_member(_user_id uuid, _org_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_role_in_org(_user_id uuid, _org_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_owner(_user_id uuid, _org_id uuid) CASCADE;

-- 7. Remover enum app_role
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 8. Atualizar RLS policies das tabelas restantes para usuários finais apenas

-- Profiles: apenas o próprio usuário pode ver/editar
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Meal Plans: apenas o próprio usuário
DROP POLICY IF EXISTS "Users can view their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can insert their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete their own meal plans" ON public.meal_plans;

CREATE POLICY "Users can view their own meal plans"
ON public.meal_plans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
ON public.meal_plans FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
ON public.meal_plans FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Progress Tracking: apenas o próprio usuário
DROP POLICY IF EXISTS "Users can view their own progress" ON public.progress_tracking;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.progress_tracking;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.progress_tracking;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.progress_tracking;

CREATE POLICY "Users can view their own progress"
ON public.progress_tracking FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.progress_tracking FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.progress_tracking FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
ON public.progress_tracking FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Weekly Feedback: apenas o próprio usuário
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.weekly_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.weekly_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.weekly_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.weekly_feedback;

CREATE POLICY "Users can view their own feedback"
ON public.weekly_feedback FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
ON public.weekly_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
ON public.weekly_feedback FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
ON public.weekly_feedback FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Adherence Metrics: apenas o próprio usuário
DROP POLICY IF EXISTS "Users can view their own adherence metrics" ON public.adherence_metrics;
DROP POLICY IF EXISTS "Nutritionists can view their clients adherence" ON public.adherence_metrics;
DROP POLICY IF EXISTS "Users can insert their own adherence metrics" ON public.adherence_metrics;
DROP POLICY IF EXISTS "Users can update their own adherence metrics" ON public.adherence_metrics;

CREATE POLICY "Users can view their own adherence metrics"
ON public.adherence_metrics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adherence metrics"
ON public.adherence_metrics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adherence metrics"
ON public.adherence_metrics FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Adjustment History: apenas o próprio usuário
DROP POLICY IF EXISTS "Users can view their own adjustment history" ON public.adjustment_history;
DROP POLICY IF EXISTS "Users can insert their own adjustment history" ON public.adjustment_history;

CREATE POLICY "Users can view their own adjustment history"
ON public.adjustment_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adjustment history"
ON public.adjustment_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);