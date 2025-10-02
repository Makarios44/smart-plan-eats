import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GeneratePlanDialog } from "@/components/GeneratePlanDialog";

interface MealPlan {
  id: string;
  plan_name: string;
  plan_description: string | null;
  diet_type: string;
  recommended_exercise: string | null;
  plan_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  created_at: string;
}

const MeusPlanos = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("plan_date", { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error("Error loading plans:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
      
      toast.success("Plano excluído com sucesso");
      loadPlans();
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      toast.error("Erro ao excluir plano");
    }
  };

  const getDietTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      emagrecimento: "Emagrecimento",
      hipertrofia: "Hipertrofia",
      manutencao: "Manutenção"
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Meus Planos</h1>
              <p className="text-muted-foreground">Gerencie seus planos alimentares</p>
            </div>
          </div>
          <GeneratePlanDialog onPlanCreated={loadPlans} />
        </div>

        {plans.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum plano criado ainda</h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro plano alimentar personalizado
            </p>
            <GeneratePlanDialog 
              onPlanCreated={loadPlans}
              trigger={<Button size="lg">Criar Primeiro Plano</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{plan.plan_name}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {getDietTypeLabel(plan.diet_type)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Tipo:</strong> {getDietTypeLabel(plan.diet_type)}
                    </p>
                    
                    {plan.plan_description && (
                      <p className="text-muted-foreground mb-3">{plan.plan_description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(plan.plan_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div>
                        {Math.round(plan.total_calories)} kcal
                      </div>
                      <div>
                        P: {Math.round(plan.total_protein)}g
                      </div>
                      <div>
                        C: {Math.round(plan.total_carbs)}g
                      </div>
                      <div>
                        G: {Math.round(plan.total_fats)}g
                      </div>
                    </div>

                    {plan.recommended_exercise && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Exercício Recomendado:</p>
                        <p className="text-sm text-muted-foreground">{plan.recommended_exercise}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/plano/${plan.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusPlanos;
