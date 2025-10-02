import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, Eye, TrendingUp } from "lucide-react";

interface ClientAssignment {
  id: string;
  client_id: string;
  notes: string;
  active: boolean;
  assigned_at: string;
  profiles: {
    name: string;
    goal: string;
    target_calories: number;
  };
}

const NutritionistPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkNutritionistAccess();
    loadClients();
  }, []);

  const checkNutritionistAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isNutritionist = roles?.some(r => r.role === "nutricionista" || r.role === "admin");
    if (!isNutritionist) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
      });
      navigate("/dashboard");
    }
  };

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("client_assignments")
        .select(`
          *,
          profiles!client_assignments_client_id_fkey(name, goal, target_calories)
        `)
        .eq("nutritionist_id", user.id)
        .eq("active", true)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      setClients(data as any || []);
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

  const viewClientDetails = (clientId: string) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Visualização detalhada do cliente será implementada em breve.",
    });
  };

  const viewClientProgress = (clientId: string) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Acompanhamento de progresso será implementado em breve.",
    });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Painel do Nutricionista</h1>
          </div>
          <p className="text-muted-foreground">Gerencie seus clientes e acompanhe o progresso</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Clientes ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Novos Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {clients.filter(c => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(c.assigned_at) > weekAgo;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Meta Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {clients.length > 0
                  ? Math.round(clients.reduce((sum, c) => sum + c.profiles.target_calories, 0) / clients.length)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Calorias/dia</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meus Clientes
            </CardTitle>
            <CardDescription>Gerencie e acompanhe seus clientes</CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Você ainda não tem clientes atribuídos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <Card key={client.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{client.profiles.name}</h3>
                            <Badge>{client.profiles.goal}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Meta: {client.profiles.target_calories} kcal/dia</p>
                            <p>Atribuído em: {new Date(client.assigned_at).toLocaleDateString()}</p>
                            {client.notes && (
                              <p className="mt-2 text-xs bg-muted p-2 rounded">
                                Notas: {client.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewClientDetails(client.client_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewClientProgress(client.client_id)}
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Progresso
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NutritionistPanel;
