import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface GeneratePlanDialogProps {
  onPlanCreated?: () => void;
  trigger?: React.ReactNode;
}

export function GeneratePlanDialog({ onPlanCreated, trigger }: GeneratePlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: "",
    plan_description: "",
    diet_type: "manutencao" as "emagrecimento" | "hipertrofia" | "manutencao",
    plan_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plan_name) {
      toast.error("Por favor, dê um nome ao plano");
      return;
    }

    setLoading(true);

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error("Você precisa estar autenticado para criar um plano");
        console.error("Session error:", sessionError);
        return;
      }

      console.log("Criando plano com dados:", formData);
      console.log("Token de autenticação presente:", !!session.access_token);
      
      const { data, error } = await supabase.functions.invoke('create-diet-plan', {
        body: formData
      });

      console.log("Resposta do edge function:", { data, error });

      if (error) {
        console.error("Erro do edge function:", error);
        throw new Error(`Erro na chamada: ${error.message}`);
      }

      if (data?.error) {
        console.error("Erro retornado pelo edge function:", data.error);
        throw new Error(data.error);
      }

      if (data?.success) {
        console.log("Plano criado com sucesso:", data.plan);
        toast.success("Plano criado com sucesso!");
        setOpen(false);
        setFormData({
          plan_name: "",
          plan_description: "",
          diet_type: "manutencao",
          plan_date: new Date().toISOString().split('T')[0]
        });
        onPlanCreated?.();
      } else {
        throw new Error("Resposta inesperada do servidor");
      }
    } catch (error: any) {
      console.error("Erro completo ao criar plano:", error);
      const errorMsg = error.message || "Erro ao criar plano. Tente novamente.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Criar Novo Plano</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Novo Plano Alimentar</DialogTitle>
            <DialogDescription>
              Crie um plano personalizado de acordo com seus objetivos
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plan_name">Nome do Plano *</Label>
              <Input
                id="plan_name"
                placeholder="Ex: Plano de Segunda-feira"
                value={formData.plan_name}
                onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="diet_type">Tipo de Dieta *</Label>
              <Select
                value={formData.diet_type}
                onValueChange={(value: any) => setFormData({ ...formData, diet_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan_date">Data do Plano *</Label>
              <Input
                id="plan_date"
                type="date"
                value={formData.plan_date}
                onChange={(e) => setFormData({ ...formData, plan_date: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan_description">Descrição (opcional)</Label>
              <Textarea
                id="plan_description"
                placeholder="Observações sobre este plano..."
                value={formData.plan_description}
                onChange={(e) => setFormData({ ...formData, plan_description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Plano"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
