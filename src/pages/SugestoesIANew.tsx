import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2, RefreshCw, Plus, ChefHat } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";

interface MealSuggestion {
  id: string;
  suggestion_type: string;
  suggested_meal: {
    name: string;
    ingredients: string[];
    instructions: string[];
    meal_type: string;
    uses_pantry_items: boolean;
  };
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  created_at: string;
}

const SugestoesIANew = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MealSuggestion | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("meal_suggestions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setSuggestions((data || []) as any);
    } catch (error: any) {
      console.error("Error loading suggestions:", error);
      toast.error("Erro ao carregar sugestões");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar autenticado");
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-meal-suggestions');

      if (error) {
        console.error("Error:", error);
        toast.error(error.message || "Erro ao gerar sugestões");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success) {
        toast.success(
          data.used_pantry 
            ? "Sugestões geradas com base na sua despensa!"
            : "Sugestões geradas com sucesso!"
        );
        loadSuggestions();
      }
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      toast.error("Erro ao gerar sugestões");
    } finally {
      setGenerating(false);
    }
  };

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cafe_da_manha: "Café da Manhã",
      almoco: "Almoço",
      jantar: "Jantar",
      lanche: "Lanche",
      geral: "Geral"
    };
    return labels[type] || type;
  };

  const viewDetails = (suggestion: MealSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowDetailDialog(true);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                Sugestões de IA
              </h1>
              <p className="text-muted-foreground">
                Refeições personalizadas baseadas no seu perfil e despensa
              </p>
            </div>
          </div>
          <Button onClick={handleGenerateSuggestions} disabled={generating} size="lg">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Novas Sugestões
              </>
            )}
          </Button>
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <ChefHat className="w-12 h-12 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Como funciona?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• A IA analisa seu perfil nutricional e objetivos</li>
                <li>• Se você tiver itens na despensa, priorizamos usá-los</li>
                <li>• Cada sugestão inclui ingredientes, modo de preparo e valores nutricionais</li>
                <li>• Gere novas sugestões sempre que quiser!</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/despensa")}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Gerenciar Despensa
          </Button>
        </div>

        {/* Suggestions Grid */}
        {suggestions.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma sugestão ainda</h3>
            <p className="text-muted-foreground mb-6">
              Clique em "Gerar Novas Sugestões" para receber recomendações personalizadas
            </p>
            <Button onClick={handleGenerateSuggestions} disabled={generating} size="lg">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Primeira Sugestão
                </>
              )}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => viewDetails(suggestion)}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{suggestion.suggested_meal.name}</h3>
                  {suggestion.suggested_meal.uses_pantry_items && (
                    <Badge variant="secondary" className="ml-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Usa Despensa
                    </Badge>
                  )}
                </div>

                <Badge variant="outline" className="mb-3">
                  {getMealTypeLabel(suggestion.suggested_meal.meal_type)}
                </Badge>

                {/* Nutrition Summary */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Calorias</p>
                    <p className="font-semibold">{suggestion.macros.calories}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Proteína</p>
                    <p className="font-semibold">{suggestion.macros.protein}g</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="font-semibold">{suggestion.macros.carbs}g</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Gordura</p>
                    <p className="font-semibold">{suggestion.macros.fats}g</p>
                  </div>
                </div>

                {/* Ingredients Preview */}
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Ingredientes principais:</p>
                  <p className="line-clamp-2">
                    {suggestion.suggested_meal.ingredients.slice(0, 3).join(', ')}
                    {suggestion.suggested_meal.ingredients.length > 3 && '...'}
                  </p>
                </div>

                <Button 
                  className="w-full mt-4"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    viewDetails(suggestion);
                  }}
                >
                  Ver Receita Completa
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          {selectedSuggestion && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedSuggestion.suggested_meal.name}</DialogTitle>
                <DialogDescription>
                  <Badge variant="outline" className="mr-2">
                    {getMealTypeLabel(selectedSuggestion.suggested_meal.meal_type)}
                  </Badge>
                  {selectedSuggestion.suggested_meal.uses_pantry_items && (
                    <Badge variant="secondary">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Usa Despensa
                    </Badge>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Nutrition */}
                <div>
                  <h4 className="font-semibold mb-3">Valores Nutricionais</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Calorias</p>
                      <p className="text-lg font-bold">{selectedSuggestion.macros.calories}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Proteína</p>
                      <p className="text-lg font-bold">{selectedSuggestion.macros.protein}g</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                      <p className="text-lg font-bold">{selectedSuggestion.macros.carbs}g</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground mb-1">Gordura</p>
                      <p className="text-lg font-bold">{selectedSuggestion.macros.fats}g</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="font-semibold mb-3">Ingredientes</h4>
                  <ul className="space-y-2">
                    {selectedSuggestion.suggested_meal.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="font-semibold mb-3">Modo de Preparo</h4>
                  <ol className="space-y-3">
                    {selectedSuggestion.suggested_meal.instructions.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </span>
                        <span className="text-sm pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SugestoesIANew;
