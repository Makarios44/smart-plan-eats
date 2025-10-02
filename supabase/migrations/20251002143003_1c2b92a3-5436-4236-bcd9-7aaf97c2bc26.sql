-- Fix organizations RLS policies to prevent violations
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their org" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete their org" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

-- Create new policies
-- Allow authenticated users to create organizations where they are the owner
CREATE POLICY "Users can create organizations as owner"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Organization owners can update their organization
CREATE POLICY "Owners can update their organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Organization owners can delete their organization
CREATE POLICY "Owners can delete their organizations"
ON public.organizations
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Users can view organizations they own, are members of, or have roles in
-- Admins can view all organizations
CREATE POLICY "Users can view accessible organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  auth.uid() = owner_id OR
  is_organization_member(auth.uid(), id) OR
  user_has_role_in_org(auth.uid(), id)
);

-- Update user_roles policies to ensure proper role assignment
DROP POLICY IF EXISTS "Admins can assign roles in their org" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles in their org" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles in their org" ON public.user_roles;

-- Allow users to create their own usuario role without org
CREATE POLICY "Users can create their own usuario role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  (
    (role = 'usuario'::app_role AND organization_id IS NULL) OR
    (role IN ('admin'::app_role, 'nutricionista'::app_role) AND organization_id IS NOT NULL AND is_org_owner(auth.uid(), organization_id))
  )
);

-- Admins can assign roles in their organization
CREATE POLICY "Org admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role_in_org(auth.uid(), 'admin'::app_role, organization_id)
);

-- Admins can update roles in their organization
CREATE POLICY "Org admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role_in_org(auth.uid(), 'admin'::app_role, organization_id))
WITH CHECK (has_role_in_org(auth.uid(), 'admin'::app_role, organization_id));

-- Admins can delete roles in their organization
CREATE POLICY "Org admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role_in_org(auth.uid(), 'admin'::app_role, organization_id));