import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coffee, Sun, Sunset, Moon, Check, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddFoodDialog } from "@/components/AddFoodDialog";

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
  completed: boolean;
  food_items: FoodItem[];
}

const PlanoAlimentar = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: planData } = await supabase
        .from("meal_plans")
        .select(`
          id,
          meals (
            id,
            name,
            time,
            meal_order,
            completed,
            food_items (
              id,
              name,
              amount,
              calories,
              protein,
              carbs,
              fats
            )
          )
        `)
        .eq("user_id", session.user.id)
        .eq("plan_date", today)
        .maybeSingle();

      if (planData && planData.meals) {
        // Sort meals by order
        const sortedMeals = (planData.meals as any[]).sort((a, b) => a.meal_order - b.meal_order);
        setMeals(sortedMeals);
      }
    } catch (error: any) {
      console.error("Error loading meals:", error);
      toast.error("Erro ao carregar refeições");
    } finally {
      setLoading(false);
    }
  };

  const toggleMealComplete = async (mealId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("meals")
        .update({ completed: !completed })
        .eq("id", mealId);

      if (error) throw error;

      setMeals(meals.map(meal => 
        meal.id === mealId ? { ...meal, completed: !completed } : meal
      ));

      toast.success(completed ? "Refeição desmarcada" : "Refeição marcada como concluída!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao atualizar refeição");
    }
  };

  const deleteFoodItem = async (foodId: string) => {
    try {
      const { error } = await supabase
        .from("food_items")
        .delete()
        .eq("id", foodId);

      if (error) throw error;

      toast.success("Alimento removido");
      loadMeals();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao remover alimento");
    }
  };

  const getMealIcon = (index: number) => {
    const icons = [Coffee, Sun, Sunset, Sun, Moon];
    return icons[index] || Sun;
  };

  const calculateMealTotals = (foods: FoodItem[]) => {
    return foods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fats: acc.fats + food.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando plano...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Plano Alimentar</h1>
            <p className="text-muted-foreground">Seu cardápio personalizado para hoje</p>
          </div>
        </div>

          {meals.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Você ainda não tem um plano alimentar para hoje
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </Card>
        ) : (
          meals.map((meal, index) => {
            const totals = calculateMealTotals(meal.food_items);
            const Icon = getMealIcon(index);

            return (
              <Card key={meal.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground">{meal.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{Math.round(totals.calories)} kcal</p>
                    <p className="text-sm text-muted-foreground">
                      P: {Math.round(totals.protein)}g · C: {Math.round(totals.carbs)}g · G: {Math.round(totals.fats)}g
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {meal.food_items.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="mb-4">Nenhum alimento adicionado ainda</p>
                      <AddFoodDialog 
                        mealId={meal.id}
                        mealName={meal.name}
                        onFoodAdded={loadMeals}
                      />
                    </div>
                  ) : (
                    <>
                      {meal.food_items.map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{food.name}</p>
                            <p className="text-sm text-muted-foreground">{food.amount}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right text-sm">
                              <p className="font-semibold">{Math.round(food.calories)} kcal</p>
                              <p className="text-muted-foreground">
                                P: {Math.round(food.protein)}g · C: {Math.round(food.carbs)}g · G: {Math.round(food.fats)}g
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteFoodItem(food.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2">
                        <AddFoodDialog 
                          mealId={meal.id}
                          mealName={meal.name}
                          onFoodAdded={loadMeals}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <Button 
                    onClick={() => toggleMealComplete(meal.id, meal.completed)}
                    variant={meal.completed ? "outline" : "default"}
                    className="w-full"
                  >
                    {meal.completed ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Refeição Concluída
                      </>
                    ) : (
                      "Marcar como Concluída"
                    )}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlanoAlimentar;
