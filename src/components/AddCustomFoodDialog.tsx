import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddCustomFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoodAdded?: () => void;
}

export function AddCustomFoodDialog({ open, onOpenChange, onFoodAdded }: AddCustomFoodDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    food_name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    fiber: "",
    category: "",
    brand: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.food_name || !formData.calories || !formData.protein || !formData.carbs || !formData.fats) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para adicionar alimentos");
        return;
      }

      const { error } = await supabase.from('food_database').insert({
        food_name: formData.food_name.trim(),
        food_name_normalized: formData.food_name.trim().toLowerCase(),
        source: 'user_custom',
        calories: parseFloat(formData.calories),
        protein: parseFloat(formData.protein),
        carbs: parseFloat(formData.carbs),
        fats: parseFloat(formData.fats),
        fiber: formData.fiber ? parseFloat(formData.fiber) : null,
        category: formData.category || null,
        brand: formData.brand || null,
        created_by_user_id: user.id,
        is_verified: false
      });

      if (error) throw error;

      toast.success("Alimento cadastrado com sucesso!");
      setFormData({
        food_name: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        fiber: "",
        category: "",
        brand: ""
      });
      onOpenChange(false);
      onFoodAdded?.();
    } catch (error) {
      console.error('Error adding custom food:', error);
      toast.error("Erro ao cadastrar alimento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Alimento Personalizado</DialogTitle>
          <DialogDescription>
            Adicione um alimento que não foi encontrado nas bases de dados.
            <br />
            <span className="text-xs text-muted-foreground">
              Valores devem ser informados para 100g do alimento.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="food_name">Nome do Alimento *</Label>
            <Input
              id="food_name"
              value={formData.food_name}
              onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
              placeholder="Ex: Arroz integral cozido"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calorias (kcal) *</Label>
              <Input
                id="calories"
                type="number"
                step="0.1"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein">Proteínas (g) *</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">Carboidratos (g) *</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fats">Gorduras (g) *</Label>
              <Input
                id="fats"
                type="number"
                step="0.1"
                value={formData.fats}
                onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiber">Fibras (g)</Label>
              <Input
                id="fiber"
                type="number"
                step="0.1"
                value={formData.fiber}
                onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Grãos"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ex: Camil"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
