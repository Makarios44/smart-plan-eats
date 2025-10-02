import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, ShoppingBasket } from "lucide-react";

interface PantryItem {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
}

const foodCategories = [
  "Proteínas",
  "Carboidratos",
  "Vegetais",
  "Frutas",
  "Laticínios",
  "Grãos e Cereais",
  "Temperos",
  "Outros"
];

const units = ["g", "kg", "ml", "L", "unidade", "xícara", "colher"];

export default function MinhaDespensa() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [newItem, setNewItem] = useState({
    food_name: "",
    category: "",
    quantity: "",
    unit: "g"
  });

  useEffect(() => {
    loadPantry();
  }, []);

  const loadPantry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_pantry')
        .select('*')
        .eq('user_id', user.id)
        .order('food_name');

      if (error) throw error;
      setPantryItems(data || []);
    } catch (error) {
      console.error('Error loading pantry:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.food_name || !newItem.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e categoria do alimento",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('user_pantry')
        .insert({
          user_id: user.id,
          food_name: newItem.food_name,
          category: newItem.category,
          quantity: newItem.quantity ? parseFloat(newItem.quantity) : null,
          unit: newItem.unit
        });

      if (error) throw error;

      toast({
        title: "Item adicionado! ✅",
        description: `${newItem.food_name} foi adicionado à sua despensa`
      });

      setNewItem({ food_name: "", category: "", quantity: "", unit: "g" });
      loadPantry();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Erro ao adicionar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_pantry')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Item removido",
        description: "Alimento removido da despensa"
      });

      loadPantry();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erro ao remover",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const groupedItems = pantryItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

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
              <ShoppingBasket className="h-6 w-6" />
              Minha Despensa
            </CardTitle>
            <CardDescription>
              Registre os alimentos que você tem em casa para receber sugestões personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Item Form */}
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Alimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="food_name">Nome do Alimento *</Label>
                    <Input
                      id="food_name"
                      value={newItem.food_name}
                      onChange={(e) => setNewItem({ ...newItem, food_name: e.target.value })}
                      placeholder="Ex: Frango, Arroz integral..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {foodCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade (opcional)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      placeholder="Ex: 500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Select
                      value={newItem.unit}
                      onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleAddItem} disabled={loading} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? "Adicionando..." : "Adicionar à Despensa"}
                </Button>
              </CardContent>
            </Card>

            {/* Pantry Items List */}
            {Object.keys(groupedItems).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBasket className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Sua despensa está vazia</p>
                <p className="text-sm mt-2">Adicione alimentos para receber sugestões personalizadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{item.food_name}</p>
                              {item.quantity && (
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} {item.unit}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como isso ajuda?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• A IA priorizará alimentos que você já tem em casa</p>
            <p>• Sugestões de substituições usarão sua despensa</p>
            <p>• Refeições criativas serão geradas com seus ingredientes</p>
            <p>• Reduza desperdício e otimize suas compras</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}