-- Create enum for user roles (only if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'nutricionista', 'usuario');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create organizations table for multi-tenancy
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role, organization_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create client_assignments table (nutricionistas managing clients)
CREATE TABLE IF NOT EXISTS public.client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL,
  client_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  UNIQUE(nutritionist_id, client_id, organization_id)
);

ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user has role in organization
CREATE OR REPLACE FUNCTION public.has_role_in_org(_user_id UUID, _role app_role, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND organization_id = _org_id
  ) OR EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.user_roles ur ON ur.organization_id = om.organization_id AND ur.user_id = _user_id
    WHERE om.organization_id = _org_id AND ur.role = _role
  )
$$;

-- Security definer function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id UUID)
RETURNS TABLE(organization_id UUID, organization_name TEXT, user_role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT 
    o.id AS organization_id,
    o.name AS organization_name,
    ur.role AS user_role
  FROM public.organizations o
  LEFT JOIN public.user_roles ur ON ur.organization_id = o.id AND ur.user_id = _user_id
  LEFT JOIN public.organization_members om ON om.organization_id = o.id AND om.user_id = _user_id
  WHERE ur.user_id = _user_id OR om.user_id = _user_id OR o.owner_id = _user_id
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their org" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete their org" ON public.organizations;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE organization_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can update their org"
ON public.organizations FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can delete their org"
ON public.organizations FOR DELETE
USING (auth.uid() = owner_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles in their org" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can assign roles in their org" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles in their org" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles in their org" ON public.user_roles;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles in their org"
ON public.user_roles FOR SELECT
USING (
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Admins can assign roles in their org"
ON public.user_roles FOR INSERT
WITH CHECK (
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Admins can update roles in their org"
ON public.user_roles FOR UPDATE
USING (
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Admins can delete roles in their org"
ON public.user_roles FOR DELETE
USING (
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can add members to their org" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can remove members from their org" ON public.organization_members;

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations"
ON public.organization_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_id AND (
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE organization_id = organizations.id AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Admins can add members to their org"
ON public.organization_members FOR INSERT
WITH CHECK (
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Admins can remove members from their org"
ON public.organization_members FOR DELETE
USING (
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Nutritionists can view their client assignments" ON public.client_assignments;
DROP POLICY IF EXISTS "Nutritionists can create client assignments" ON public.client_assignments;
DROP POLICY IF EXISTS "Nutritionists can update their client assignments" ON public.client_assignments;
DROP POLICY IF EXISTS "Nutritionists can delete their client assignments" ON public.client_assignments;

-- RLS Policies for client_assignments
CREATE POLICY "Nutritionists can view their client assignments"
ON public.client_assignments FOR SELECT
USING (
  auth.uid() = nutritionist_id OR
  auth.uid() = client_id OR
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Nutritionists can create client assignments"
ON public.client_assignments FOR INSERT
WITH CHECK (
  auth.uid() = nutritionist_id AND
  public.has_role_in_org(auth.uid(), 'nutricionista', organization_id)
);

CREATE POLICY "Nutritionists can update their client assignments"
ON public.client_assignments FOR UPDATE
USING (
  auth.uid() = nutritionist_id OR
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

CREATE POLICY "Nutritionists can delete their client assignments"
ON public.client_assignments FOR DELETE
USING (
  auth.uid() = nutritionist_id OR
  public.has_role_in_org(auth.uid(), 'admin', organization_id)
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON public.user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_nutritionist ON public.client_assignments(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_client ON public.client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_org ON public.client_assignments(organization_id);

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;

-- Trigger for updating organizations updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
