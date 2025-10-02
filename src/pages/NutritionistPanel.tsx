import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, TrendingUp, Calendar, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Client {
  id: string;
  client_id: string;
  assigned_at: string;
  active: boolean;
  notes: string | null;
  client_name: string;
  client_goal: string;
  client_weight: number;
}

const NutritionistPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, organizations, loading: roleLoading } = useUserRole();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!roleLoading && role !== 'nutricionista' && role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
      });
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate, toast]);

  useEffect(() => {
    if (role === 'nutricionista' || role === 'admin') {
      loadClients();
    }
  }, [role]);

  const loadClients = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: assignmentsData, error } = await supabase
        .from('client_assignments')
        .select('*')
        .eq('nutritionist_id', session.user.id)
        .eq('active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Get client profiles
      if (assignmentsData && assignmentsData.length > 0) {
        const clientIds = assignmentsData.map(a => a.client_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, goal, weight')
          .in('user_id', clientIds);

        const clientsWithProfiles = assignmentsData.map(assignment => {
          const profile = profilesData?.find(p => p.user_id === assignment.client_id);
          return {
            ...assignment,
            client_name: profile?.name || 'Nome não disponível',
            client_goal: profile?.goal || 'N/A',
            client_weight: profile?.weight || 0,
          };
        });

        setClients(clientsWithProfiles);
      }
    } catch (error: any) {
      console.error('Error loading clients:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar clientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewClientProgress = (clientId: string) => {
    navigate(`/evolucao?client=${clientId}`);
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Painel do Nutricionista</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie e acompanhe seus clientes
          </p>
        </div>

        {/* Organizations */}
        {organizations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suas Organizações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {organizations.map(org => (
                  <Badge key={org.organization_id} variant="secondary" className="text-sm">
                    {org.organization_name} - {org.user_role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => c.active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => {
                  const assignedDate = new Date(c.assigned_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return assignedDate > weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Clientes</CardTitle>
            <CardDescription>
              Lista de todos os clientes sob sua supervisão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Você ainda não tem clientes atribuídos
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Peso Atual</TableHead>
                    <TableHead>Atribuído em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.client_name}</TableCell>
                      <TableCell>{client.client_goal}</TableCell>
                      <TableCell>{client.client_weight} kg</TableCell>
                      <TableCell>
                        {new Date(client.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.active ? "default" : "secondary"}>
                          {client.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedClient(client)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{selectedClient?.client_name}</DialogTitle>
                                <DialogDescription>
                                  Informações do cliente
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-1">Objetivo</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedClient?.client_goal}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-1">Peso Atual</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedClient?.client_weight} kg
                                  </p>
                                </div>
                                {selectedClient?.notes && (
                                  <div>
                                    <h4 className="font-semibold mb-1">Notas</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedClient.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewClientProgress(client.client_id)}
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Progresso
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NutritionistPanel;
