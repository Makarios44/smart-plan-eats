import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface AddFoodDialogProps {
  mealId: string;
  mealName: string;
  onFoodAdded: () => void;
}

export const AddFoodDialog = ({ mealId, mealName, onFoodAdded }: AddFoodDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [manualMode, setManualMode] = useState(false);
  
  // Manual food entry
  const [foodName, setFoodName] = useState("");
  const [amount, setAmount] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  const getMealSuggestions = async () => {
    setLoading(true);
    try {
      // Get user's meal suggestions from the AI
      const { data, error } = await supabase
        .from('meal_suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        setSuggestions(data);
      } else {
        toast.info("Nenhuma sugestão disponível. Adicione alimentos manualmente.");
        setManualMode(true);
      }
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  const addFoodFromSuggestion = async (suggestion: any) => {
    try {
      const meal = suggestion.suggested_meal;
      const macros = suggestion.macros;

      const { error } = await supabase
        .from('food_items')
        .insert({
          meal_id: mealId,
          name: meal.name,
          amount: meal.ingredients?.slice(0, 3).join(', ') || 'Porção sugerida',
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fats: macros.fats
        });

      if (error) throw error;

      toast.success("Alimento adicionado com sucesso!");
      setOpen(false);
      onFoodAdded();
    } catch (error: any) {
      console.error('Error adding food:', error);
      toast.error("Erro ao adicionar alimento");
    }
  };

  const addManualFood = async () => {
    if (!foodName || !amount || !calories || !protein || !carbs || !fats) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const { error } = await supabase
        .from('food_items')
        .insert({
          meal_id: mealId,
          name: foodName,
          amount: amount,
          calories: parseFloat(calories),
          protein: parseFloat(protein),
          carbs: parseFloat(carbs),
          fats: parseFloat(fats)
        });

      if (error) throw error;

      toast.success("Alimento adicionado com sucesso!");
      
      // Reset form
      setFoodName("");
      setAmount("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      
      setOpen(false);
      onFoodAdded();
    } catch (error: any) {
      console.error('Error adding food:', error);
      toast.error("Erro ao adicionar alimento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={getMealSuggestions}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Alimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar alimento - {mealName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : manualMode ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Adicionar Manualmente</h3>
              {suggestions.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setManualMode(false)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ver Sugestões
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="foodName">Nome do Alimento</Label>
                <Input
                  id="foodName"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Ex: Peito de frango grelhado"
                />
              </div>

              <div>
                <Label htmlFor="amount">Quantidade/Porção</Label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 150g, 1 unidade, 1 xícara"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Calorias (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Proteínas (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carbs">Carboidratos (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="fats">Gorduras (g)</Label>
                  <Input
                    id="fats"
                    type="number"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <Button onClick={addManualFood} className="w-full">
                Adicionar Alimento
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Sugestões da IA
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setManualMode(true)}>
                Adicionar Manualmente
              </Button>
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhuma sugestão disponível ainda
                </p>
                <Button onClick={() => setManualMode(true)}>
                  Adicionar Manualmente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => {
                  const meal = suggestion.suggested_meal;
                  const macros = suggestion.macros;
                  
                  return (
                    <Card key={suggestion.id} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{meal.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {meal.ingredients?.slice(0, 3).join(', ')}
                            {meal.ingredients?.length > 3 && '...'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addFoodFromSuggestion(suggestion)}
                        >
                          Adicionar
                        </Button>
                      </div>
                      <div className="flex gap-4 text-sm mt-3">
                        <span className="text-muted-foreground">
                          {macros.calories} kcal
                        </span>
                        <span className="text-muted-foreground">
                          P: {macros.protein}g
                        </span>
                        <span className="text-muted-foreground">
                          C: {macros.carbs}g
                        </span>
                        <span className="text-muted-foreground">
                          G: {macros.fats}g
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
