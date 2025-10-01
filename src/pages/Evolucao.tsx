import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingDown, Calendar, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Evolucao = () => {
  const navigate = useNavigate();

  // Mock data
  const weightHistory = [
    { week: "Sem 1", weight: 82 },
    { week: "Sem 2", weight: 81.5 },
    { week: "Sem 3", weight: 81 },
    { week: "Sem 4", weight: 80.3 },
  ];

  const adherence = 85;
  const weightLost = 1.7;
  const daysCompleted = 24;

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Evolução</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peso Perdido</p>
                <p className="text-3xl font-bold text-success">{weightLost} kg</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dias Completos</p>
                <p className="text-3xl font-bold">{daysCompleted}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adesão ao Plano</p>
                <p className="text-3xl font-bold">{adherence}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Weight Chart */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Evolução de Peso</h3>
          <div className="space-y-4">
            {weightHistory.map((entry, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-muted-foreground">{entry.week}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 bg-gradient-primary rounded-lg" style={{ width: `${(entry.weight / 85) * 100}%` }} />
                    <span className="font-bold">{entry.weight} kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Feedback */}
        <Card className="p-6 bg-gradient-card">
          <h3 className="text-xl font-bold mb-4">Feedback Semanal</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="font-medium text-success">✓ Ótimo trabalho!</p>
              <p className="text-sm mt-1">Você manteve uma boa adesão ao plano esta semana. Continue assim!</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="font-medium text-primary">💡 Dica da semana</p>
              <p className="text-sm mt-1">Tente aumentar a ingestão de proteínas no café da manhã para melhorar a saciedade.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Evolucao;
