import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FoodItem {
  id: string;
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  meal_order: number;
  completed: boolean;
  food_items: FoodItem[];
}

interface MealPlan {
  id: string;
  plan_name: string;
  plan_description: string | null;
  diet_type: string;
  plan_date: string;
  recommended_exercise: string | null;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
}

const PlanoDetalhes = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFoodDialog, setShowAddFoodDialog] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: "",
    amount: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  useEffect(() => {
    loadPlanDetails();
  }, [planId]);

  const loadPlanDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load plan
      const { data: planData, error: planError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError) throw planError;
      setPlan(planData);

      // Load meals with food items
      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select(`
          *,
          food_items (*)
        `)
        .eq("meal_plan_id", planId)
        .order("meal_order");

      if (mealsError) throw mealsError;
      setMeals(mealsData as any);
    } catch (error: any) {
      console.error("Error loading plan:", error);
      toast.error("Erro ao carregar plano");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async () => {
    if (!selectedMealId || !foodForm.name.trim()) {
      toast.error("Preencha o nome do alimento");
      return;
    }

    try {
      const { error } = await supabase
        .from("food_items")
        .insert({
          meal_id: selectedMealId,
          name: foodForm.name.trim(),
          amount: foodForm.amount.trim() || "1 porção",
          calories: foodForm.calories,
          protein: foodForm.protein,
          carbs: foodForm.carbs,
          fats: foodForm.fats,
        });

      if (error) throw error;

      toast.success("Alimento adicionado!");
      setShowAddFoodDialog(false);
      setFoodForm({
        name: "",
        amount: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      });
      loadPlanDetails();
    } catch (error: any) {
      console.error("Error adding food:", error);
      toast.error("Erro ao adicionar alimento");
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!confirm("Tem certeza que deseja excluir este alimento?")) return;

    try {
      const { error } = await supabase
        .from("food_items")
        .delete()
        .eq("id", foodId);

      if (error) throw error;

      toast.success("Alimento excluído");
      loadPlanDetails();
    } catch (error: any) {
      console.error("Error deleting food:", error);
      toast.error("Erro ao excluir alimento");
    }
  };

  const toggleMealComplete = async (mealId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("meals")
        .update({ completed: !completed })
        .eq("id", mealId);

      if (error) throw error;

      toast.success(completed ? "Refeição desmarcada" : "Refeição concluída!");
      loadPlanDetails();
    } catch (error: any) {
      console.error("Error toggling meal:", error);
      toast.error("Erro ao atualizar refeição");
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

  if (!plan) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Plano não encontrado</p>
          <Button onClick={() => navigate("/meus-planos")}>
            Voltar para Meus Planos
          </Button>
        </div>
      </div>
    );
  }

  const totalConsumed = meals.reduce((acc, meal) => {
    if (meal.food_items) {
      meal.food_items.forEach((food) => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fats += food.fats;
      });
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/meus-planos")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{plan.plan_name}</h1>
            <p className="text-muted-foreground">
              {new Date(plan.plan_date).toLocaleDateString('pt-BR')} • {getDietTypeLabel(plan.diet_type)}
            </p>
          </div>
        </div>

        {/* Plan Description */}
        {plan.plan_description && (
          <Card className="p-4">
            <p className="text-muted-foreground">{plan.plan_description}</p>
          </Card>
        )}

        {/* Exercise Recommendation */}
        {plan.recommended_exercise && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2">💪 Exercício Recomendado</h3>
            <p className="text-sm text-muted-foreground">{plan.recommended_exercise}</p>
          </Card>
        )}

        {/* Macros Summary */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Resumo Nutricional</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Calorias</p>
              <p className="text-2xl font-bold">{Math.round(totalConsumed.calories)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proteínas</p>
              <p className="text-2xl font-bold">{Math.round(totalConsumed.protein)}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carboidratos</p>
              <p className="text-2xl font-bold">{Math.round(totalConsumed.carbs)}g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gorduras</p>
              <p className="text-2xl font-bold">{Math.round(totalConsumed.fats)}g</p>
            </div>
          </div>
        </Card>

        {/* Meals */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Refeições</h3>
          
          {meals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma refeição cadastrada ainda</p>
            </Card>
          ) : (
            meals.map((meal) => {
              const mealTotals = meal.food_items?.reduce((acc, food) => ({
                calories: acc.calories + food.calories,
                protein: acc.protein + food.protein,
                carbs: acc.carbs + food.carbs,
                fats: acc.fats + food.fats,
              }), { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

              return (
                <Card key={meal.id} className={meal.completed ? "bg-success/5 border-success/20" : ""}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={meal.completed}
                          onChange={() => toggleMealComplete(meal.id, meal.completed)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                        <div>
                          <h4 className="text-lg font-semibold">{meal.name}</h4>
                          <p className="text-sm text-muted-foreground">{meal.time}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedMealId(meal.id);
                          setShowAddFoodDialog(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Alimento
                      </Button>
                    </div>

                    {/* Food Items */}
                    {meal.food_items && meal.food_items.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {meal.food_items.map((food) => (
                          <div key={food.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{food.name}</p>
                              <p className="text-sm text-muted-foreground">{food.amount}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{food.calories} kcal</span>
                              <span>P: {food.protein}g</span>
                              <span>C: {food.carbs}g</span>
                              <span>G: {food.fats}g</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFood(food.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">Nenhum alimento adicionado</p>
                    )}

                    {/* Meal Totals */}
                    <div className="flex gap-6 text-sm text-muted-foreground pt-4 border-t">
                      <span>Total: {Math.round(mealTotals.calories)} kcal</span>
                      <span>P: {Math.round(mealTotals.protein)}g</span>
                      <span>C: {Math.round(mealTotals.carbs)}g</span>
                      <span>G: {Math.round(mealTotals.fats)}g</span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Add Food Dialog */}
      <Dialog open={showAddFoodDialog} onOpenChange={setShowAddFoodDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Alimento</DialogTitle>
            <DialogDescription>
              Adicione um alimento à refeição
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="food_name">Nome do Alimento *</Label>
              <Input
                id="food_name"
                placeholder="Ex: Arroz integral"
                value={foodForm.name}
                onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Quantidade</Label>
              <Input
                id="amount"
                placeholder="Ex: 100g, 1 xícara"
                value={foodForm.amount}
                onChange={(e) => setFoodForm({ ...foodForm, amount: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="calories">Calorias (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  value={foodForm.calories}
                  onChange={(e) => setFoodForm({ ...foodForm, calories: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="protein">Proteínas (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={foodForm.protein}
                  onChange={(e) => setFoodForm({ ...foodForm, protein: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="carbs">Carboidratos (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={foodForm.carbs}
                  onChange={(e) => setFoodForm({ ...foodForm, carbs: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fats">Gorduras (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  value={foodForm.fats}
                  onChange={(e) => setFoodForm({ ...foodForm, fats: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFoodDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddFood}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanoDetalhes;
