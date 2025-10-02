-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Nutritionists can view their client assignments" ON public.client_assignments;

-- Create security definer function to check organization membership
CREATE OR REPLACE FUNCTION public.is_organization_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id
    AND user_id = _user_id
  )
$$;

-- Create security definer function to check if user has role in organization
CREATE OR REPLACE FUNCTION public.user_has_role_in_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND organization_id = _org_id
  )
$$;

-- Create security definer function to check if user owns organization
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id
    AND owner_id = _user_id
  )
$$;

-- Recreate organizations policy using security definer functions
CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
USING (
  public.is_org_owner(auth.uid(), id)
  OR public.is_organization_member(auth.uid(), id)
  OR public.user_has_role_in_org(auth.uid(), id)
);

-- Fix client_assignments policy
CREATE POLICY "Nutritionists can view their client assignments"
ON public.client_assignments FOR SELECT
USING (
  (auth.uid() = nutritionist_id) 
  OR (auth.uid() = client_id) 
  OR public.has_role_in_org(auth.uid(), 'admin'::app_role, organization_id)
);