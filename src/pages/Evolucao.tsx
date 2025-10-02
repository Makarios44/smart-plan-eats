import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingDown, Calendar, Award, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProgressEntry {
  date: string;
  weight: number;
}

const Evolucao = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      setProfile(profileData);

      // Load progress
      const { data: progressData } = await supabase
        .from("progress_tracking")
        .select("*")
        .eq("user_id", session.user.id)
        .order("date", { ascending: false })
        .limit(10);

      if (progressData) {
        setProgress(progressData);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao carregar evolução");
    } finally {
      setLoading(false);
    }
  };

  const addProgress = async () => {
    if (!newWeight || !profile) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.from("progress_tracking").upsert({
        user_id: session.user.id,
        date: today,
        weight: parseFloat(newWeight),
      });

      if (error) throw error;

      toast.success("Peso registrado!");
      setDialogOpen(false);
      setNewWeight("");
      loadData();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao salvar peso");
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const initialWeight = profile.weight;
  const currentWeight = progress.length > 0 ? progress[0].weight : initialWeight;
  const weightChange = initialWeight - currentWeight;

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Evolução</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Peso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Peso de Hoje</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder={currentWeight.toString()}
                  />
                </div>
                <Button onClick={addProgress} className="w-full">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Variação de Peso</p>
                <p className="text-3xl font-bold text-success">
                  {weightChange > 0 ? "-" : weightChange < 0 ? "+" : ""}{Math.abs(weightChange).toFixed(1)} kg
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peso Atual</p>
                <p className="text-3xl font-bold">{currentWeight.toFixed(1)} kg</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registros</p>
                <p className="text-3xl font-bold">{progress.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Weight History */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Histórico de Peso</h3>
          {progress.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum registro ainda
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                Registrar Primeiro Peso
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {progress.map((entry, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 bg-gradient-primary rounded-lg transition-all" 
                        style={{ width: `${(entry.weight / initialWeight) * 100}%` }} 
                      />
                      <span className="font-bold">{entry.weight.toFixed(1)} kg</span>
                      {index > 0 && (
                        <span className={`text-sm ${
                          entry.weight < progress[index - 1].weight ? "text-success" : "text-destructive"
                        }`}>
                          {entry.weight < progress[index - 1].weight ? "▼" : "▲"}
                          {Math.abs(entry.weight - progress[index - 1].weight).toFixed(1)} kg
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Goal Card */}
        <Card className="p-6 bg-gradient-card">
          <h3 className="text-xl font-bold mb-4">Seu Objetivo</h3>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              <span className="font-medium">Objetivo: </span>
              {profile.goal === "lose" ? "Perder peso" : profile.goal === "gain" ? "Ganhar massa" : "Manter peso"}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">Peso inicial: </span>
              {initialWeight} kg
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">Peso atual: </span>
              {currentWeight.toFixed(1)} kg
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Evolucao;
