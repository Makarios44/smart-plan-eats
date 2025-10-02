import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Brain, TrendingUp, AlertTriangle, Target, Sparkles, Activity, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Predictions {
  individual_patterns: {
    weight_trend: string;
    energy_pattern: string;
    hunger_pattern: string;
    adherence_pattern: string;
    weekly_consistency: string;
  };
  predictions: {
    next_week_weight: number;
    weight_confidence: string;
    recommended_adjustment: {
      should_adjust: boolean;
      adjustment_type: string;
      estimated_calories: number;
      estimated_protein: number;
      estimated_carbs: number;
      estimated_fats: number;
      reasoning: string;
    };
    goal_timeline: string;
  };
  adherence_risk: {
    risk_level: string;
    risk_factors: string[];
    warning_signs: string[];
    recommendations: string[];
  };
  actionable_insights: string[];
  success_indicators: string[];
}

const Insights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Predictions | null>(null);

  const analyzePredictions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-patterns');

      if (error) throw error;

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.error,
        });
        return;
      }

      setPredictions(data.predictions);
      toast({
        title: "Análise concluída!",
        description: "Insights preditivos gerados com sucesso.",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar análise preditiva. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'baixo': return 'bg-green-500';
      case 'médio': return 'bg-yellow-500';
      case 'alto': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceValue = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'alta': return 90;
      case 'média': return 60;
      case 'baixa': return 30;
      default: return 50;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Insights Preditivos</h1>
          </div>
          <p className="text-muted-foreground">
            Análise de Machine Learning dos seus padrões e predições personalizadas
          </p>
        </div>

        {!predictions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Gerar Análise Preditiva
              </CardTitle>
              <CardDescription>
                Analise seus dados históricos e receba predições personalizadas sobre seu progresso,
                ajustes recomendados e alertas de adesão.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={analyzePredictions} disabled={loading} className="w-full">
                {loading ? 'Analisando seus dados...' : 'Gerar Insights com IA'}
              </Button>
            </CardContent>
          </Card>
        )}

        {predictions && (
          <>
            {/* Padrões Individuais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Padrões Individuais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Tendência de Peso</h4>
                    <p className="text-sm text-muted-foreground">{predictions.individual_patterns.weight_trend}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Padrão de Energia</h4>
                    <p className="text-sm text-muted-foreground">{predictions.individual_patterns.energy_pattern}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Padrão de Fome</h4>
                    <p className="text-sm text-muted-foreground">{predictions.individual_patterns.hunger_pattern}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Padrão de Adesão</h4>
                    <p className="text-sm text-muted-foreground">{predictions.individual_patterns.adherence_pattern}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Consistência Semanal</h4>
                  <p className="text-sm text-muted-foreground">{predictions.individual_patterns.weekly_consistency}</p>
                </div>
              </CardContent>
            </Card>

            {/* Predições */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predições
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Peso Previsto (Próxima Semana)</h4>
                    <p className="text-2xl font-bold">{predictions.predictions.next_week_weight.toFixed(1)} kg</p>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Confiança da Predição</p>
                      <Progress value={getConfidenceValue(predictions.predictions.weight_confidence)} />
                      <p className="text-xs text-muted-foreground mt-1">{predictions.predictions.weight_confidence}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Timeline do Objetivo
                    </h4>
                    <p className="text-sm text-muted-foreground">{predictions.predictions.goal_timeline}</p>
                  </div>
                </div>

                {predictions.predictions.recommended_adjustment.should_adjust && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Ajuste Recomendado
                    </h4>
                    <Badge className="mb-3">
                      {predictions.predictions.recommended_adjustment.adjustment_type === 'increase' ? 'Aumentar' : 
                       predictions.predictions.recommended_adjustment.adjustment_type === 'decrease' ? 'Diminuir' : 'Manter'}
                    </Badge>
                    <div className="grid gap-2 text-sm">
                      <p><strong>Calorias:</strong> {predictions.predictions.recommended_adjustment.estimated_calories} kcal</p>
                      <p><strong>Proteína:</strong> {predictions.predictions.recommended_adjustment.estimated_protein}g</p>
                      <p><strong>Carboidratos:</strong> {predictions.predictions.recommended_adjustment.estimated_carbs}g</p>
                      <p><strong>Gorduras:</strong> {predictions.predictions.recommended_adjustment.estimated_fats}g</p>
                      <p className="text-muted-foreground mt-2">{predictions.predictions.recommended_adjustment.reasoning}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risco de Adesão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Análise de Risco de Adesão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Nível de Risco</h4>
                  <Badge className={getRiskColor(predictions.adherence_risk.risk_level)}>
                    {predictions.adherence_risk.risk_level}
                  </Badge>
                </div>

                {predictions.adherence_risk.risk_factors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Fatores de Risco</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {predictions.adherence_risk.risk_factors.map((factor, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {predictions.adherence_risk.warning_signs.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Sinais de Alerta</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {predictions.adherence_risk.warning_signs.map((sign, idx) => (
                        <li key={idx} className="text-sm text-amber-600">{sign}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {predictions.adherence_risk.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Recomendações</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {predictions.adherence_risk.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-green-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights Acionáveis */}
            {predictions.actionable_insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Insights Acionáveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {predictions.actionable_insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Indicadores de Sucesso */}
            {predictions.success_indicators.length > 0 && (
              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Target className="h-5 w-5" />
                    Indicadores de Sucesso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {predictions.success_indicators.map((indicator, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm">{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Button onClick={analyzePredictions} disabled={loading} className="w-full">
              {loading ? 'Atualizando análise...' : 'Atualizar Análise'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Insights;
