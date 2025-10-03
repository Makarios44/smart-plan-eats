import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Sparkles, Loader2, Search } from "lucide-react";
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
  const [manualMode, setManualMode] = useState(true);
  const [searchingNutrition, setSearchingNutrition] = useState(false);
  
  // Manual food entry
  const [foodName, setFoodName] = useState("");
  const [amount, setAmount] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  const searchFoodNutrition = async () => {
    if (!foodName.trim() || !amount.trim()) {
      toast.error("Preencha o nome do alimento e a quantidade");
      return;
    }

    setSearchingNutrition(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-food-nutrition', {
        body: { foodName, amount }
      });

      if (error) throw error;

      if (data.success) {
        setCalories(data.nutrition.calories.toString());
        setProtein(data.nutrition.protein.toString());
        setCarbs(data.nutrition.carbs.toString());
        setFats(data.nutrition.fats.toString());
        toast.success("Informações nutricionais calculadas automaticamente!");
      } else {
        throw new Error(data.error || 'Erro ao buscar informações');
      }
    } catch (error: any) {
      console.error('Error searching nutrition:', error);
      toast.error(error.message || "Erro ao buscar informações. Tente adicionar manualmente os valores");
    } finally {
      setSearchingNutrition(false);
    }
  };

  const getMealSuggestions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('meal_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setSuggestions(data || []);
      
      if (!data || data.length === 0) {
        toast.info("Nenhuma sugestão encontrada. Você pode adicionar manualmente");
      }
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
      toast.error(error.message || "Erro ao carregar sugestões");
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
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Adicionar Alimento</h3>
              {suggestions.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setManualMode(false)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ver Sugestões
                </Button>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Busca Inteligente:</strong> Digite o nome do alimento e a quantidade, depois clique em "Buscar com IA" para calcular automaticamente os valores nutricionais!
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="foodName">Nome do Alimento *</Label>
                <Input
                  id="foodName"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Ex: Arroz integral, Frango grelhado, Banana"
                />
              </div>

              <div>
                <Label htmlFor="amount">Quantidade *</Label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 100g, 1 xícara, 2 unidades, 150ml"
                />
              </div>

              <Button 
                onClick={searchFoodNutrition} 
                disabled={searchingNutrition || !foodName.trim() || !amount.trim()}
                className="w-full"
                variant="secondary"
              >
                {searchingNutrition ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando alimento com IA...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar Informações Nutricionais com IA
                  </>
                )}
              </Button>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {calories ? '✓ Valores calculados automaticamente (você pode ajustar se necessário)' : 'Valores nutricionais:'}
                </p>
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

              <Button 
                onClick={addManualFood} 
                disabled={!foodName || !amount || !calories}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar ao Plano
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Sugestões Anteriores da IA
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setManualMode(true)}>
                Adicionar Novo
              </Button>
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhuma sugestão disponível ainda
                </p>
                <Button onClick={() => setManualMode(true)}>
                  Adicionar Alimento
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
