import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'nutricionista' | 'usuario' | null;

interface Organization {
  organization_id: string;
  organization_name: string;
  user_role: UserRole;
}

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Get user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role, organization_id')
        .eq('user_id', session.user.id);

      if (rolesData && rolesData.length > 0) {
        // Get highest priority role
        const roles = rolesData.map(r => r.role);
        if (roles.includes('admin')) {
          setRole('admin');
        } else if (roles.includes('nutricionista')) {
          setRole('nutricionista');
        } else {
          setRole('usuario');
        }
      } else {
        setRole('usuario'); // Default role
      }

      // Get user's organizations
      const { data: orgsData } = await supabase
        .rpc('get_user_organizations', { _user_id: session.user.id });

      if (orgsData) {
        setOrganizations(orgsData);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    } finally {
      setLoading(false);
    }
  };

  return { role, organizations, loading, refresh: loadUserRole };
};
