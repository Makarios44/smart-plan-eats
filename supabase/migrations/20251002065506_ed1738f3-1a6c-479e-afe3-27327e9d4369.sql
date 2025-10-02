-- Fix infinite recursion in organizations RLS policies
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
USING (
  (auth.uid() = owner_id) 
  OR 
  (EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.organization_id = organizations.id
    AND user_roles.user_id = auth.uid()
  ))
);