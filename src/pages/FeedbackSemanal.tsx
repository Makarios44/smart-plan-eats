import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, Battery, Heart, Target } from "lucide-react";

export default function FeedbackSemanal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentWeight, setCurrentWeight] = useState("");
  const [energyLevel, setEnergyLevel] = useState([3]);
  const [hungerSatisfaction, setHungerSatisfaction] = useState([3]);
  const [adherenceLevel, setAdherenceLevel] = useState([3]);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.functions.invoke('process-weekly-feedback', {
        body: {
          feedbackData: {
            week_date: today,
            current_weight: parseFloat(currentWeight),
            energy_level: energyLevel[0],
            hunger_satisfaction: hungerSatisfaction[0],
            adherence_level: adherenceLevel[0],
            notes: notes || null
          }
        }
      });

      if (error) throw error;

      if (data.adjusted) {
        toast({
          title: "Plano Ajustado! 🎯",
          description: `Suas metas foram recalculadas: ${data.adjustments.calories.new} kcal/dia. ${data.reasons.join('. ')}`,
        });
      } else {
        toast({
          title: "Feedback Registrado ✅",
          description: data.message,
        });
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro ao processar feedback",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelLabel = (value: number, type: 'energy' | 'hunger' | 'adherence') => {
    const labels = {
      energy: ['Muito Baixa', 'Baixa', 'Média', 'Boa', 'Excelente'],
      hunger: ['Muito Insatisfeito', 'Insatisfeito', 'Neutro', 'Satisfeito', 'Muito Satisfeito'],
      adherence: ['Muito Baixa', 'Baixa', 'Média', 'Boa', 'Excelente']
    };
    return labels[type][value - 1];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
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
            <CardTitle className="text-2xl">Feedback Semanal</CardTitle>
            <CardDescription>
              Compartilhe como foi sua semana para ajustarmos seu plano automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso Atual (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  required
                  placeholder="Ex: 75.5"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Battery className="h-5 w-5 text-primary" />
                    <Label>Nível de Energia nos Treinos</Label>
                  </div>
                  <Slider
                    value={energyLevel}
                    onValueChange={setEnergyLevel}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {getLevelLabel(energyLevel[0], 'energy')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <Label>Satisfação com Fome/Saciedade</Label>
                  </div>
                  <Slider
                    value={hungerSatisfaction}
                    onValueChange={setHungerSatisfaction}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {getLevelLabel(hungerSatisfaction[0], 'hunger')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <Label>Adesão ao Plano Alimentar</Label>
                  </div>
                  <Slider
                    value={adherenceLevel}
                    onValueChange={setAdherenceLevel}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {getLevelLabel(adherenceLevel[0], 'adherence')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Como você se sentiu esta semana? Teve alguma dificuldade?"
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : "Enviar Feedback e Ajustar Plano"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Analisamos sua evolução de peso</p>
            <p>• Consideramos seus níveis de energia e saciedade</p>
            <p>• Avaliamos sua adesão ao plano</p>
            <p>• Ajustamos automaticamente calorias e macros se necessário</p>
            <p>• Mantemos mudanças graduais e seguras</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}