import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, Download, BarChart3, RefreshCw, ChevronRight, Target, TrendingUp } from "lucide-react";

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
    target_protein: number;
    target_carbs: number;
    target_fats: number;
  };
}

const NutritionistPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupAnalysis, setGroupAnalysis] = useState<any>(null);
  const [analyzingGroups, setAnalyzingGroups] = useState(false);

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
          profiles!client_assignments_client_id_fkey(
            name, 
            goal, 
            target_calories, 
            target_protein, 
            target_carbs, 
            target_fats
          )
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

  const analyzeClientGroups = async () => {
    setAnalyzingGroups(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-client-groups');
      
      if (error) throw error;
      
      setGroupAnalysis(data);
      toast({
        title: "Análise concluída!",
        description: "Insights inteligentes foram gerados para seus clientes.",
      });
    } catch (error: any) {
      console.error('Error analyzing groups:', error);
      toast({
        variant: "destructive",
        title: "Erro ao analisar grupos",
        description: error.message,
      });
    } finally {
      setAnalyzingGroups(false);
    }
  };

  const downloadClientReport = async (clientId: string, format: 'json' | 'csv') => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('generate-client-report', {
        body: { clientId, format, startDate, endDate }
      });

      if (error) throw error;

      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_cliente_${clientId}.csv`;
        a.click();
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_cliente_${clientId}.json`;
        a.click();
      }

      toast({
        title: "Relatório gerado!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: error.message,
      });
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <Button onClick={analyzeClientGroups} disabled={analyzingGroups}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {analyzingGroups ? "Analisando..." : "Analisar Grupos com IA"}
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Painel Profissional B2B</h1>
          </div>
          <p className="text-muted-foreground">Gerencie múltiplos clientes com inteligência artificial</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Clientes ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Novos este mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {clients.filter(c => {
                  const assignedDate = new Date(c.assigned_at);
                  const thisMonth = new Date();
                  return assignedDate.getMonth() === thisMonth.getMonth() &&
                         assignedDate.getFullYear() === thisMonth.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Meta Calórica Média</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {clients.length > 0
                  ? Math.round(
                      clients.reduce((acc, c) => acc + (c.profiles?.target_calories || 0), 0) / clients.length
                    )
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Calorias/dia</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients">Meus Clientes</TabsTrigger>
            <TabsTrigger value="groups">Análise de Grupos IA</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Atribuídos</CardTitle>
                <CardDescription>
                  Gerencie seus clientes com ferramentas avançadas de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum cliente atribuído no momento</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clients.map((client) => (
                      <Card key={client.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">{client.profiles?.name || "Sem nome"}</h3>
                              <Badge variant="secondary">{client.profiles?.goal || "Não definido"}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Calorias:</span> {client.profiles?.target_calories || 0} kcal
                              </div>
                              <div>
                                <span className="font-medium">Proteína:</span> {client.profiles?.target_protein || 0}g
                              </div>
                              <div>
                                <span className="font-medium">Carbos:</span> {client.profiles?.target_carbs || 0}g
                              </div>
                              <div>
                                <span className="font-medium">Gorduras:</span> {client.profiles?.target_fats || 0}g
                              </div>
                            </div>
                            {client.notes && (
                              <p className="text-sm bg-muted p-2 rounded">
                                <span className="font-medium">Notas:</span> {client.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Atribuído em: {new Date(client.assigned_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadClientReport(client.client_id, 'csv')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadClientReport(client.client_id, 'json')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              JSON
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise Inteligente de Grupos</CardTitle>
                <CardDescription>
                  IA analisa padrões e sugere ajustes para grupos de clientes similares
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!groupAnalysis ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Clique em "Analisar Grupos com IA" para obter insights automáticos
                    </p>
                    <Button onClick={analyzeClientGroups} disabled={analyzingGroups}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${analyzingGroups ? 'animate-spin' : ''}`} />
                      {analyzingGroups ? "Analisando..." : "Iniciar Análise"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupAnalysis.overall_insights && groupAnalysis.overall_insights.length > 0 && (
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Insights Gerais
                        </h3>
                        <ul className="space-y-2 text-sm">
                          {groupAnalysis.overall_insights.map((insight: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {groupAnalysis.groups && groupAnalysis.groups.length > 0 ? (
                      <div className="grid gap-4">
                        {groupAnalysis.groups.map((group: any, idx: number) => (
                          <Card key={idx} className="border-2">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{group.name}</CardTitle>
                                <Badge>{group.client_count} cliente{group.client_count !== 1 ? 's' : ''}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Calorias Médias</p>
                                  <p className="text-xl font-semibold">{Math.round(group.avg_calories)}</p>
                                  <p className="text-xs text-muted-foreground">kcal/dia</p>
                                </div>
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Proteína Média</p>
                                  <p className="text-xl font-semibold">{Math.round(group.avg_protein)}</p>
                                  <p className="text-xs text-muted-foreground">gramas</p>
                                </div>
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Carboidratos Médios</p>
                                  <p className="text-xl font-semibold">{Math.round(group.avg_carbs)}</p>
                                  <p className="text-xs text-muted-foreground">gramas</p>
                                </div>
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Gorduras Médias</p>
                                  <p className="text-xl font-semibold">{Math.round(group.avg_fats)}</p>
                                  <p className="text-xs text-muted-foreground">gramas</p>
                                </div>
                              </div>

                              {group.recommendations && group.recommendations.length > 0 && (
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                  <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Recomendações da IA:
                                  </h4>
                                  <ul className="space-y-2 text-sm">
                                    {group.recommendations.map((rec: string, recIdx: number) => (
                                      <li key={recIdx} className="flex items-start gap-2 text-muted-foreground">
                                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum grupo identificado. Atribua mais clientes para obter análises.
                      </p>
                    )}
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

export default NutritionistPanel;