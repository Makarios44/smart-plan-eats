import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Apple, Flame, Droplets, Activity, TrendingUp, Calendar, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  name: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fats: number;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  completed: boolean;
  food_items: Array<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        navigate("/onboarding");
        return;
      }

      setProfile(profileData);

      // Load today's meal plan
      const today = new Date().toISOString().split('T')[0];
      const { data: planData } = await supabase
        .from("meal_plans")
        .select(`
          id,
          meals (
            id,
            name,
            time,
            completed,
            food_items (
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
        setMeals(planData.meals as any);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Calculate consumed totals from meals
  const consumed = meals.reduce(
    (acc, meal) => {
      if (meal.completed && meal.food_items) {
        meal.food_items.forEach((food) => {
          acc.calories += food.calories;
          acc.protein += food.protein;
          acc.carbs += food.carbs;
          acc.fats += food.fats;
        });
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Olá, {profile.name}! 👋</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso hoje</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/plano")}>Ver Plano Completo</Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Calories Card */}
        <Card className="p-6 bg-gradient-card shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Calorias</h3>
                <p className="text-sm text-muted-foreground">Consumo diário</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{Math.round(consumed.calories)}</p>
              <p className="text-sm text-muted-foreground">de {profile.target_calories} kcal</p>
            </div>
          </div>
          <Progress value={(consumed.calories / profile.target_calories) * 100} className="h-3" />
        </Card>

        {/* Macros Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Apple className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proteínas</p>
                <p className="font-bold text-xl">{Math.round(consumed.protein)}g</p>
              </div>
            </div>
            <Progress value={(consumed.protein / profile.target_protein) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: {profile.target_protein}g</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carboidratos</p>
                <p className="font-bold text-xl">{Math.round(consumed.carbs)}g</p>
              </div>
            </div>
            <Progress value={(consumed.carbs / profile.target_carbs) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: {profile.target_carbs}g</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gorduras</p>
                <p className="font-bold text-xl">{Math.round(consumed.fats)}g</p>
              </div>
            </div>
            <Progress value={(consumed.fats / profile.target_fats) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: {profile.target_fats}g</p>
          </Card>
        </div>

        {/* Meals Today */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Refeições de Hoje
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/plano")}>
              Ver Detalhes
            </Button>
          </div>
          
          {meals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Você ainda não tem um plano para hoje
              </p>
              <Button onClick={() => toast.info("Em breve: gerar novo plano")}>
                Gerar Plano de Hoje
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => {
                const mealCalories = meal.food_items?.reduce((sum, food) => sum + food.calories, 0) || 0;
                
                return (
                  <div
                    key={meal.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      meal.completed ? "bg-success/5 border-success/20" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${meal.completed ? "bg-success" : "bg-muted"}`} />
                      <div>
                        <p className="font-medium">{meal.name}</p>
                        <p className="text-sm text-muted-foreground">{meal.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Math.round(mealCalories)} kcal</p>
                      {meal.completed && <p className="text-xs text-success">✓ Concluída</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className="p-6 bg-gradient-primary text-white cursor-pointer hover:scale-105 transition-transform" 
            onClick={() => navigate("/evolucao")}
          >
            <TrendingUp className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Ver Evolução</h3>
            <p className="text-white/80">Acompanhe seu progresso semanal</p>
          </Card>
          
          <Card 
            className="p-6 bg-gradient-secondary text-white cursor-pointer hover:scale-105 transition-transform" 
            onClick={() => navigate("/lista-compras")}
          >
            <Apple className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Lista de Compras</h3>
            <p className="text-white/80">Organize suas compras da semana</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
