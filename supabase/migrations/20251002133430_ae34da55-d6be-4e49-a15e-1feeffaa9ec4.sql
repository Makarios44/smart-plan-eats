-- ============================================
-- FUNÇÕES DE SUPORTE A RLS (Row-Level Security)
-- ============================================

-- Função para checar se o usuário tem um papel global (ex: admin)
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = uid AND ur.role = role_name
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para checar se usuário é dono da organização
CREATE OR REPLACE FUNCTION public.is_org_owner(uid uuid, org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = org_id
      AND om.user_id = uid
      AND om.role = 'owner'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para checar se usuário é membro da organização
CREATE OR REPLACE FUNCTION public.is_organization_member(uid uuid, org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = org_id
      AND om.user_id = uid
      AND om.active = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para checar se usuário tem algum papel específico na organização
CREATE OR REPLACE FUNCTION public.user_has_role_in_org(uid uuid, org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = org_id
      AND om.user_id = uid
      AND om.role IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- POLÍTICAS DE ACESSO (RLS)
-- ============================================

-- ORGANIZATIONS TABLE
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Users can view their organizations"
ON public.organizations
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_org_owner(auth.uid(), id)
  OR public.is_organization_member(auth.uid(), id)
  OR public.user_has_role_in_org(auth.uid(), id)
);

-- Exemplo de política de INSERT (apenas admin cria org)
DROP POLICY IF EXISTS "Admins can insert organizations" ON public.organizations;
CREATE POLICY "Admins can insert organizations"
ON public.organizations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Exemplo de política de UPDATE (owner ou admin)
DROP POLICY IF EXISTS "Owners or admins can update organizations" ON public.organizations;
CREATE POLICY "Owners or admins can update organizations"
ON public.organizations
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_org_owner(auth.uid(), id)
);

-- Exemplo de política de DELETE (apenas admin)
DROP POLICY IF EXISTS "Admins can delete organizations" ON public.organizations;
CREATE POLICY "Admins can delete organizations"
ON public.organizations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
