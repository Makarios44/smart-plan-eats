-- ============================================
-- RLS POLICIES FOR MULTI-TIER ACCESS CONTROL
-- ============================================

-- PROFILES TABLE
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies with admin and nutritionist access
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = profiles.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = profiles.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

-- MEAL PLANS TABLE
DROP POLICY IF EXISTS "Users can view their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can insert their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete their own meal plans" ON public.meal_plans;

CREATE POLICY "Users can view their own meal plans"
ON public.meal_plans
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = meal_plans.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

CREATE POLICY "Users can insert their own meal plans"
ON public.meal_plans
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = meal_plans.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

CREATE POLICY "Users can update their own meal plans"
ON public.meal_plans
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = meal_plans.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

-- PROGRESS TRACKING TABLE
DROP POLICY IF EXISTS "Users can view their own progress" ON public.progress_tracking;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.progress_tracking;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.progress_tracking;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.progress_tracking;

CREATE POLICY "Users can view their own progress"
ON public.progress_tracking
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = progress_tracking.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

CREATE POLICY "Users can insert their own progress"
ON public.progress_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.progress_tracking
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete their own progress"
ON public.progress_tracking
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

-- WEEKLY FEEDBACK TABLE
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.weekly_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.weekly_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.weekly_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.weekly_feedback;

CREATE POLICY "Users can view their own feedback"
ON public.weekly_feedback
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = weekly_feedback.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

CREATE POLICY "Users can insert their own feedback"
ON public.weekly_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
ON public.weekly_feedback
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete their own feedback"
ON public.weekly_feedback
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

-- ADJUSTMENT HISTORY TABLE
DROP POLICY IF EXISTS "Users can view their own adjustment history" ON public.adjustment_history;

CREATE POLICY "Users can view their own adjustment history"
ON public.adjustment_history
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = adjustment_history.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);

-- ORGANIZATIONS TABLE
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Users can view their organizations"
ON public.organizations
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR is_org_owner(auth.uid(), id)
  OR is_organization_member(auth.uid(), id)
  OR user_has_role_in_org(auth.uid(), id)
);

-- ADHERENCE METRICS TABLE (already has nutritionist policy, just add admin)
DROP POLICY IF EXISTS "Users can view their own adherence metrics" ON public.adherence_metrics;

CREATE POLICY "Users can view their own adherence metrics"
ON public.adherence_metrics
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = adherence_metrics.user_id
    AND ca.nutritionist_id = auth.uid()
    AND ca.active = true
  )
);