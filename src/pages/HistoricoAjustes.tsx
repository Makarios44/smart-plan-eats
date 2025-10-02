import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Adjustment {
  id: string;
  adjustment_date: string;
  previous_calories: number;
  new_calories: number;
  previous_protein: number;
  new_protein: number;
  previous_carbs: number;
  new_carbs: number;
  previous_fats: number;
  new_fats: number;
  adjustment_reason: string;
}

export default function HistoricoAjustes() {
  const navigate = useNavigate();
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdjustments();
  }, []);

  const loadAdjustments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('adjustment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('adjustment_date', { ascending: false });

      if (error) throw error;
      setAdjustments(data || []);
    } catch (error) {
      console.error('Error loading adjustments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (oldValue: number, newValue: number) => {
    if (newValue > oldValue) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (newValue < oldValue) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getDiff = (oldValue: number, newValue: number) => {
    const diff = newValue - oldValue;
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 flex items-center justify-center">
        <p>Carregando histórico...</p>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">Histórico de Ajustes</CardTitle>
            <CardDescription>
              Acompanhe todas as mudanças feitas no seu plano alimentar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adjustments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum ajuste realizado ainda.</p>
                <p className="mt-2 text-sm">Complete seu primeiro feedback semanal para ver ajustes aqui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adjustments.map((adjustment) => (
                  <Card key={adjustment.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {format(new Date(adjustment.adjustment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(adjustment.adjustment_date), "HH:mm")}
                        </span>
                      </div>
                      {adjustment.adjustment_reason && (
                        <CardDescription className="mt-2">
                          {adjustment.adjustment_reason}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Calorias</p>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(adjustment.previous_calories, adjustment.new_calories)}
                            <span className="text-sm">
                              {adjustment.new_calories} kcal
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getDiff(adjustment.previous_calories, adjustment.new_calories)} kcal
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium">Proteínas</p>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(adjustment.previous_protein, adjustment.new_protein)}
                            <span className="text-sm">
                              {adjustment.new_protein}g
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getDiff(adjustment.previous_protein, adjustment.new_protein)}g
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium">Carboidratos</p>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(adjustment.previous_carbs, adjustment.new_carbs)}
                            <span className="text-sm">
                              {adjustment.new_carbs}g
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getDiff(adjustment.previous_carbs, adjustment.new_carbs)}g
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium">Gorduras</p>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(adjustment.previous_fats, adjustment.new_fats)}
                            <span className="text-sm">
                              {adjustment.new_fats}g
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getDiff(adjustment.previous_fats, adjustment.new_fats)}g
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}