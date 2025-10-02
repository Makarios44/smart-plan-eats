import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserRole } from "./useUserRole";

interface UseAuthOptions {
  requiredRole?: UserRole;
  redirectTo?: string;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        if (options.redirectTo) {
          navigate(options.redirectTo);
        }
      } else {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        if (options.redirectTo) {
          navigate(options.redirectTo);
        }
        return;
      }

      setIsAuthenticated(true);

      // Check role if required
      if (options.requiredRole) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (roles && roles.length > 0) {
          const roleHierarchy = ["admin", "nutricionista", "usuario"];
          const highestRole = roles
            .map(r => r.role)
            .sort((a, b) => roleHierarchy.indexOf(a) - roleHierarchy.indexOf(b))[0];
          
          setUserRole(highestRole as UserRole);

          // Check if user has required role
          const hasRequiredRole = roles.some(r => r.role === options.requiredRole);
          
          if (!hasRequiredRole) {
            setIsAuthorized(false);
            toast.error("Acesso negado", {
              description: "Você não tem permissão para acessar esta página.",
            });
            
            // Redirect based on user's actual role
            if (highestRole === "admin") {
              navigate("/x7k2p9m4n8q1");
            } else if (highestRole === "nutricionista") {
              navigate("/nutricionista");
            } else {
              navigate("/dashboard");
            }
            return;
          }
        } else {
          setIsAuthorized(false);
          navigate("/select-role");
          return;
        }
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAuthenticated, isAuthorized, userRole, loading };
};
