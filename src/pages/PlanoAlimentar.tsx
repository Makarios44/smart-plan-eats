import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coffee, Sun, Sunset, Moon, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PlanoAlimentar = () => {
  const navigate = useNavigate();

  const meals = [
    {
      icon: Coffee,
      name: "Café da Manhã",
      time: "07:30",
      foods: [
        { name: "Aveia integral", amount: "50g", calories: 180, protein: 7, carbs: 30, fats: 3 },
        { name: "Banana", amount: "1 unidade", calories: 105, protein: 1, carbs: 27, fats: 0 },
        { name: "Pasta de amendoim", amount: "20g", calories: 120, protein: 5, carbs: 4, fats: 10 },
        { name: "Leite desnatado", amount: "200ml", calories: 70, protein: 7, carbs: 10, fats: 0 },
      ],
    },
    {
      icon: Sun,
      name: "Lanche da Manhã",
      time: "10:00",
      foods: [
        { name: "Iogurte grego natural", amount: "150g", calories: 130, protein: 17, carbs: 7, fats: 4 },
        { name: "Castanhas", amount: "10 unidades", calories: 70, protein: 2, carbs: 2, fats: 6 },
      ],
    },
    {
      icon: Sunset,
      name: "Almoço",
      time: "12:30",
      foods: [
        { name: "Arroz integral", amount: "150g", calories: 165, protein: 3, carbs: 35, fats: 1 },
        { name: "Feijão preto", amount: "100g", calories: 77, protein: 5, carbs: 14, fats: 0 },
        { name: "Peito de frango grelhado", amount: "150g", calories: 247, protein: 47, carbs: 0, fats: 5 },
        { name: "Salada verde", amount: "1 tigela", calories: 30, protein: 2, carbs: 6, fats: 0 },
        { name: "Azeite", amount: "1 colher", calories: 90, protein: 0, carbs: 0, fats: 10 },
      ],
    },
    {
      icon: Sun,
      name: "Lanche da Tarde",
      time: "16:00",
      foods: [
        { name: "Pão integral", amount: "2 fatias", calories: 140, protein: 6, carbs: 26, fats: 2 },
        { name: "Queijo cottage", amount: "50g", calories: 50, protein: 6, carbs: 2, fats: 2 },
        { name: "Tomate", amount: "½ unidade", calories: 15, protein: 1, carbs: 3, fats: 0 },
      ],
    },
    {
      icon: Moon,
      name: "Jantar",
      time: "19:30",
      foods: [
        { name: "Batata doce", amount: "200g", calories: 180, protein: 4, carbs: 41, fats: 0 },
        { name: "Salmão grelhado", amount: "150g", calories: 275, protein: 34, carbs: 0, fats: 14 },
        { name: "Brócolis no vapor", amount: "150g", calories: 50, protein: 4, carbs: 10, fats: 0 },
        { name: "Azeite", amount: "1 colher", calories: 90, protein: 0, carbs: 0, fats: 10 },
      ],
    },
  ];

  const calculateMealTotals = (foods: any[]) => {
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

        {meals.map((meal, index) => {
          const totals = calculateMealTotals(meal.foods);
          const Icon = meal.icon;

          return (
            <Card key={index} className="p-6">
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
                  <p className="text-2xl font-bold">{totals.calories} kcal</p>
                  <p className="text-sm text-muted-foreground">
                    P: {totals.protein}g · C: {totals.carbs}g · G: {totals.fats}g
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {meal.foods.map((food, foodIndex) => (
                  <div
                    key={foodIndex}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{food.name}</p>
                      <p className="text-sm text-muted-foreground">{food.amount}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{food.calories} kcal</p>
                      <p className="text-muted-foreground">
                        P: {food.protein}g · C: {food.carbs}g · G: {food.fats}g
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Substituir Alimento
                </Button>
                <Button size="sm" className="flex-1">
                  Marcar como Concluída
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PlanoAlimentar;
