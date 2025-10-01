import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Apple, Flame, Droplets, Activity, TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface UserProfile {
  name: string;
  tdee: number;
  goal: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (!storedProfile) {
      navigate("/onboarding");
      return;
    }
    setProfile(JSON.parse(storedProfile));
  }, [navigate]);

  if (!profile) return null;

  // Mock data for demo
  const caloriesConsumed = 1450;
  const caloriesGoal = profile.tdee;
  const proteinConsumed = 85;
  const proteinGoal = Math.round(profile.tdee * 0.3 / 4);
  const carbsConsumed = 120;
  const carbsGoal = Math.round(profile.tdee * 0.4 / 4);
  const fatsConsumed = 45;
  const fatsGoal = Math.round(profile.tdee * 0.3 / 9);

  const meals = [
    { name: "Café da Manhã", calories: 450, time: "07:30", completed: true },
    { name: "Lanche da Manhã", calories: 200, time: "10:00", completed: true },
    { name: "Almoço", calories: 800, time: "12:30", completed: false },
    { name: "Lanche da Tarde", calories: 250, time: "16:00", completed: false },
    { name: "Jantar", calories: 600, time: "19:30", completed: false },
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Olá, {profile.name}! 👋</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso hoje</p>
          </div>
          <Button onClick={() => navigate("/plano")}>Ver Plano Completo</Button>
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
              <p className="text-3xl font-bold">{caloriesConsumed}</p>
              <p className="text-sm text-muted-foreground">de {caloriesGoal} kcal</p>
            </div>
          </div>
          <Progress value={(caloriesConsumed / caloriesGoal) * 100} className="h-3" />
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
                <p className="font-bold text-xl">{proteinConsumed}g</p>
              </div>
            </div>
            <Progress value={(proteinConsumed / proteinGoal) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: {proteinGoal}g</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carboidratos</p>
                <p className="font-bold text-xl">{carbsConsumed}g</p>
              </div>
            </div>
            <Progress value={(carbsConsumed / carbsGoal) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: {carbsGoal}g</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gorduras</p>
                <p className="font-bold text-xl">{fatsConsumed}g</p>
              </div>
            </div>
            <Progress value={(fatsConsumed / fatsGoal) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: {fatsGoal}g</p>
          </Card>
        </div>

        {/* Meals Today */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Refeições de Hoje
            </h3>
            <Button variant="outline" size="sm">Ver Histórico</Button>
          </div>
          <div className="space-y-3">
            {meals.map((meal, index) => (
              <div
                key={index}
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
                  <p className="font-semibold">{meal.calories} kcal</p>
                  {meal.completed && <p className="text-xs text-success">✓ Concluída</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-gradient-primary text-white cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/evolucao")}>
            <TrendingUp className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Ver Evolução</h3>
            <p className="text-white/80">Acompanhe seu progresso semanal</p>
          </Card>
          
          <Card className="p-6 bg-gradient-secondary text-white cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/lista-compras")}>
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
