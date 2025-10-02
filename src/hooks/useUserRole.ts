import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  organization_id: string;
  organization_name: string;
  user_role: string;
}

export const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role, organization_id")
        .eq("user_id", user.id);

      // Get primary role (highest permission)
      if (roles && roles.length > 0) {
        const roleHierarchy = ["admin", "nutricionista", "usuario"];
        const highestRole = roles
          .map(r => r.role)
          .sort((a, b) => roleHierarchy.indexOf(a) - roleHierarchy.indexOf(b))[0];
        
        setRole(highestRole);
      }

      // Get user organizations
      const { data: orgs } = await supabase.rpc("get_user_organizations", {
        _user_id: user.id,
      });

      if (orgs) {
        setOrganizations(orgs as Organization[]);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    } finally {
      setLoading(false);
    }
  };

  return { role, organizations, loading, refresh: loadUserRole };
};
