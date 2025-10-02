import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, Users, UserPlus, Shield, BarChart3, Activity, TrendingUp } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface Member {
  user_id: string;
  profiles: {
    name: string;
  };
  user_roles: Array<{
    role: string;
  }>;
}

interface SystemStats {
  totalUsers: number;
  totalOrganizations: number;
  totalNutritionists: number;
  totalClients: number;
  activeClients: number;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState("");
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalOrganizations: 0,
    totalNutritionists: 0,
    totalClients: 0,
    activeClients: 0
  });

  useEffect(() => {
    loadOrganizations();
    loadSystemStats();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadMembers();
    }
  }, [selectedOrg]);

  const loadSystemStats = async () => {
    try {
      // Count all profiles
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true });

      // Count organizations
      const { count: orgsCount } = await supabase
        .from("organizations")
        .select("*", { count: 'exact', head: true });

      // Count nutritionists
      const { data: nutritionistRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "nutricionista");

      // Count active client assignments
      const { count: activeClientsCount } = await supabase
        .from("client_assignments")
        .select("*", { count: 'exact', head: true })
        .eq("active", true);

      // Count total clients (users with role 'usuario')
      const { data: clientRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "usuario");

      setStats({
        totalUsers: usersCount || 0,
        totalOrganizations: orgsCount || 0,
        totalNutritionists: nutritionistRoles?.length || 0,
        totalClients: clientRoles?.length || 0,
        activeClients: activeClientsCount || 0
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("name");

      if (error) throw error;
      setOrganizations(data || []);
      if (data && data.length > 0 && !selectedOrg) {
        setSelectedOrg(data[0].id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!selectedOrg) return;

    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          user_id,
          profiles!inner(name),
          user_roles!inner(role)
        `)
        .eq("organization_id", selectedOrg);

      if (error) throw error;
      setMembers(data as any || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar membros",
        description: error.message,
      });
    }
  };

  const createOrganization = async () => {
    if (!newOrgName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome da organização é obrigatório",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: newOrgName, owner_id: user.id })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "admin",
          organization_id: org.id,
        });

      if (roleError) throw roleError;

      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          user_id: user.id,
          organization_id: org.id,
        });

      if (memberError) throw memberError;

      toast({
        title: "Sucesso!",
        description: "Organização criada com sucesso.",
      });

      setNewOrgName("");
      loadOrganizations();
      loadSystemStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "nutricionista":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Painel de Administração B2B</h1>
          </div>
          <p className="text-muted-foreground">Gerencie organizações, usuários, permissões e métricas do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Todos os perfis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Organizações</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground mt-1">Empresas cadastradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Nutricionistas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalNutritionists}</div>
              <p className="text-xs text-muted-foreground mt-1">Profissionais ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeClients}</div>
              <p className="text-xs text-muted-foreground mt-1">De {stats.totalClients} totais</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organizations">Organizações</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Gerenciar Organizações
                </CardTitle>
                <CardDescription>Crie e gerencie organizações B2B</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    placeholder="Nome da nova organização"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createOrganization()}
                  />
                  <Button onClick={createOrganization} className="md:w-auto">
                    <Building2 className="h-4 w-4 mr-2" />
                    Criar Organização
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Organização Selecionada</Label>
                  <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 mt-6">
                  <h3 className="text-sm font-semibold">Organizações Cadastradas</h3>
                  {organizations.map((org) => (
                    <Card key={org.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{org.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Criada em: {new Date(org.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrg(org.id)}
                        >
                          Ver Membros
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membros da Organização
                </CardTitle>
                <CardDescription>
                  {selectedOrg 
                    ? `Gerencie membros e suas permissões da organização selecionada`
                    : "Selecione uma organização para ver os membros"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedOrg ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Selecione uma organização na aba "Organizações"
                    </p>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum membro nesta organização
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <Card key={member.user_id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h4 className="font-semibold">{member.profiles.name}</h4>
                            <div className="flex gap-2 flex-wrap">
                              {member.user_roles.map((ur, idx) => (
                                <Badge key={idx} variant={getRoleBadgeVariant(ur.role)}>
                                  {ur.role === 'admin' ? 'Administrador' : 
                                   ur.role === 'nutricionista' ? 'Nutricionista' : 
                                   'Usuário'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;