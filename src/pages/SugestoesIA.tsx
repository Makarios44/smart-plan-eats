import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, RefreshCw, Check } from "lucide-react";

export default function SugestoesIA() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [foodToReplace, setFoodToReplace] = useState("");
  const [substitutions, setSubstitutions] = useState<any>(null);
  const [creativeMeal, setCreativeMeal] = useState<any>(null);
  const [remainingMacros, setRemainingMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  });

  useEffect(() => {
    loadRemainingMacros();
  }, []);

  const loadRemainingMacros = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with targets
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get today's consumed macros
      const today = new Date().toISOString().split('T')[0];
      const { data: planData } = await supabase
        .from('meal_plans')
        .select(`
          meals (
            completed,
            food_items (
              calories,
              protein,
              carbs,
              fats
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .maybeSingle();

      let consumed = { calories: 0, protein: 0, carbs: 0, fats: 0 };
      
      if (planData && planData.meals) {
        (planData.meals as any[]).forEach((meal: any) => {
          if (meal.completed && meal.food_items) {
            meal.food_items.forEach((food: any) => {
              consumed.calories += food.calories;
              consumed.protein += food.protein;
              consumed.carbs += food.carbs;
              consumed.fats += food.fats;
            });
          }
        });
      }

      setRemainingMacros({
        calories: Math.max(0, profile.target_calories - consumed.calories),
        protein: Math.max(0, profile.target_protein - consumed.protein),
        carbs: Math.max(0, profile.target_carbs - consumed.carbs),
        fats: Math.max(0, profile.target_fats - consumed.fats)
      });
    } catch (error) {
      console.error('Error loading remaining macros:', error);
    }
  };

  const handleSubstitution = async () => {
    if (!foodToReplace.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o alimento que deseja substituir",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-meal-alternatives', {
        body: {
          type: 'substitution',
          foodToReplace: foodToReplace
        }
      });

      if (error) throw error;

      setSubstitutions(data.suggestion.substitutions);
      toast({
        title: "Sugestões Geradas! ✨",
        description: "Confira as opções de substituição abaixo"
      });
    } catch (error) {
      console.error('Error getting substitutions:', error);
      toast({
        title: "Erro ao gerar sugestões",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreativeMeal = async () => {
    if (remainingMacros.calories === 0) {
      toast({
        title: "Sem macros restantes",
        description: "Você já atingiu suas metas do dia!",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-meal-alternatives', {
        body: {
          type: 'creative_meal',
          targetMacros: remainingMacros
        }
      });

      if (error) throw error;

      setCreativeMeal(data.suggestion.meal);
      toast({
        title: "Refeição Criada! 🍽️",
        description: "Confira sua refeição personalizada"
      });
    } catch (error) {
      console.error('Error generating meal:', error);
      toast({
        title: "Erro ao gerar refeição",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Sugestões Inteligentes de IA
            </CardTitle>
            <CardDescription>
              Receba substituições e refeições criativas personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="substitution" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="substitution">Substituir Alimento</TabsTrigger>
                <TabsTrigger value="creative">Refeição Criativa</TabsTrigger>
              </TabsList>

              <TabsContent value="substitution" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Substituição de Alimento</CardTitle>
                    <CardDescription>
                      A IA sugerirá alternativas nutricionalmente equivalentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="food">Alimento que deseja substituir</Label>
                      <Input
                        id="food"
                        value={foodToReplace}
                        onChange={(e) => setFoodToReplace(e.target.value)}
                        placeholder="Ex: Frango grelhado 150g"
                      />
                    </div>
                    <Button 
                      onClick={handleSubstitution} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Gerando sugestões...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Gerar Substituições
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {substitutions && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sugestões de Substituição:</h3>
                    {substitutions.map((sub: any, index: number) => (
                      <Card key={index} className={sub.available_in_pantry ? "border-primary" : ""}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>{sub.food_name}</span>
                            {sub.available_in_pantry && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Na sua despensa
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription>{sub.amount}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Calorias</p>
                              <p className="font-semibold">{sub.calories} kcal</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Proteínas</p>
                              <p className="font-semibold">{sub.protein}g</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Carbs</p>
                              <p className="font-semibold">{sub.carbs}g</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Gorduras</p>
                              <p className="font-semibold">{sub.fats}g</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{sub.reason}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="creative" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Refeição Criativa</CardTitle>
                    <CardDescription>
                      A IA criará uma refeição completa com seus macros restantes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Calorias</p>
                        <p className="text-xl font-bold">{Math.round(remainingMacros.calories)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Proteínas</p>
                        <p className="text-xl font-bold">{Math.round(remainingMacros.protein)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Carbs</p>
                        <p className="text-xl font-bold">{Math.round(remainingMacros.carbs)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Gorduras</p>
                        <p className="text-xl font-bold">{Math.round(remainingMacros.fats)}g</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleCreativeMeal} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Criando refeição...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Criar Refeição Personalizada
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {creativeMeal && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-xl">{creativeMeal.name}</CardTitle>
                      <CardDescription>{creativeMeal.description}</CardDescription>
                      <p className="text-sm text-muted-foreground mt-2">
                        ⏱️ Tempo de preparo: {creativeMeal.prep_time}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Ingredientes:</h4>
                        <div className="space-y-2">
                          {creativeMeal.ingredients.map((ing: any, index: number) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-2 bg-secondary/30 rounded"
                            >
                              <div className="flex items-center gap-2">
                                {ing.available_in_pantry && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                                <span>{ing.food_name} - {ing.amount}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {ing.calories} kcal
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Modo de Preparo:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {creativeMeal.instructions}
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Cal</p>
                          <p className="text-lg font-bold">{creativeMeal.totals.calories}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Proteínas</p>
                          <p className="text-lg font-bold">{creativeMeal.totals.protein}g</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Carbs</p>
                          <p className="text-lg font-bold">{creativeMeal.totals.carbs}g</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Gorduras</p>
                          <p className="text-lg font-bold">{creativeMeal.totals.fats}g</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}