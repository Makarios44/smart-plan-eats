import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X } from "lucide-react";

const commonRestrictions = [
  "Lactose",
  "Glúten",
  "Amendoim",
  "Nozes",
  "Frutos do mar",
  "Ovo",
  "Soja",
  "Peixe",
];

export default function RestricoesDietarias() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [customRestriction, setCustomRestriction] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('restrictions')
        .eq('user_id', user.id)
        .single();

      if (profile?.restrictions) {
        setSelectedRestrictions(profile.restrictions as string[]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleToggleRestriction = (restriction: string) => {
    setSelectedRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleAddCustom = () => {
    if (customRestriction.trim() && !selectedRestrictions.includes(customRestriction.trim())) {
      setSelectedRestrictions(prev => [...prev, customRestriction.trim()]);
      setCustomRestriction("");
    }
  };

  const handleRemoveCustom = (restriction: string) => {
    setSelectedRestrictions(prev => prev.filter(r => r !== restriction));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('profiles')
        .update({ 
          restrictions: selectedRestrictions,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Restrições Atualizadas ✅",
        description: "Seus planos alimentares respeitarão essas restrições",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving restrictions:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const customRestrictions = selectedRestrictions.filter(r => !commonRestrictions.includes(r));

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
            <CardTitle className="text-2xl">Restrições Dietárias</CardTitle>
            <CardDescription>
              Informe alergias e alimentos que você não consome
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Restrições Comuns</Label>
              <div className="grid grid-cols-2 gap-4">
                {commonRestrictions.map((restriction) => (
                  <div key={restriction} className="flex items-center space-x-2">
                    <Checkbox
                      id={restriction}
                      checked={selectedRestrictions.includes(restriction)}
                      onCheckedChange={() => handleToggleRestriction(restriction)}
                    />
                    <Label
                      htmlFor={restriction}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {restriction}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Outras Restrições</Label>
              <div className="flex gap-2">
                <Input
                  value={customRestriction}
                  onChange={(e) => setCustomRestriction(e.target.value)}
                  placeholder="Ex: Camarão, Leite de vaca..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
                />
                <Button type="button" onClick={handleAddCustom} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {customRestrictions.length > 0 && (
                <div className="space-y-2">
                  {customRestrictions.map((restriction) => (
                    <div
                      key={restriction}
                      className="flex items-center justify-between p-2 bg-secondary rounded-md"
                    >
                      <span className="text-sm">{restriction}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCustom(restriction)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSave} className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Restrições"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como isso ajuda?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• A IA evitará sugerir alimentos que você não pode consumir</p>
            <p>• Seus planos alimentares serão sempre seguros e adequados</p>
            <p>• Você pode atualizar essas restrições a qualquer momento</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}