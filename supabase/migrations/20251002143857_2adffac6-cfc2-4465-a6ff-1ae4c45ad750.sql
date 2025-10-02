-- Fix organization_members RLS policies to allow owners and proper role setup

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Admins can add members to their org" ON public.organization_members;

-- Create new INSERT policy that allows:
-- 1. Organization owners to add members
-- 2. Users with admin role in that organization to add members
CREATE POLICY "Owners and admins can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  is_org_owner(auth.uid(), organization_id) OR
  has_role_in_org(auth.uid(), 'admin'::app_role, organization_id)
);

-- Update DELETE policy to also allow owners
DROP POLICY IF EXISTS "Admins can remove members from their org" ON public.organization_members;

CREATE POLICY "Owners and admins can remove members"
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  is_org_owner(auth.uid(), organization_id) OR
  has_role_in_org(auth.uid(), 'admin'::app_role, organization_id)
);