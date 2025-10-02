-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

-- Create a more robust INSERT policy that allows any authenticated user to create an organization
-- as long as they set themselves as the owner
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);