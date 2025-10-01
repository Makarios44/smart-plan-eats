import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const ListaCompras = () => {
  const navigate = useNavigate();

  const categories = [
    {
      name: "Proteínas",
      items: [
        { name: "Peito de frango", quantity: "1kg" },
        { name: "Salmão", quantity: "500g" },
        { name: "Ovos", quantity: "1 dúzia" },
        { name: "Queijo cottage", quantity: "200g" },
        { name: "Iogurte grego", quantity: "1kg" },
      ],
    },
    {
      name: "Carboidratos",
      items: [
        { name: "Arroz integral", quantity: "1kg" },
        { name: "Batata doce", quantity: "1kg" },
        { name: "Aveia", quantity: "500g" },
        { name: "Pão integral", quantity: "1 pacote" },
        { name: "Feijão preto", quantity: "500g" },
      ],
    },
    {
      name: "Gorduras Saudáveis",
      items: [
        { name: "Azeite extra virgem", quantity: "500ml" },
        { name: "Pasta de amendoim", quantity: "300g" },
        { name: "Castanhas", quantity: "200g" },
        { name: "Abacate", quantity: "3 unidades" },
      ],
    },
    {
      name: "Frutas e Vegetais",
      items: [
        { name: "Banana", quantity: "1 cacho" },
        { name: "Maçã", quantity: "6 unidades" },
        { name: "Brócolis", quantity: "500g" },
        { name: "Alface", quantity: "1 unidade" },
        { name: "Tomate", quantity: "500g" },
        { name: "Cenoura", quantity: "500g" },
      ],
    },
    {
      name: "Outros",
      items: [
        { name: "Leite desnatado", quantity: "2L" },
        { name: "Café", quantity: "250g" },
        { name: "Temperos naturais", quantity: "à gosto" },
      ],
    },
  ];

  const handleShare = () => {
    toast.success("Lista compartilhada com sucesso!");
  };

  const handleExport = () => {
    toast.success("Lista exportada para PDF!");
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Lista de Compras</h1>
            <p className="text-muted-foreground">Itens para a semana</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <Card className="p-6 bg-gradient-primary text-white">
          <h3 className="text-xl font-bold mb-2">Lista Gerada Automaticamente</h3>
          <p className="text-white/80">
            Baseada no seu plano alimentar da semana. Marque os itens conforme for comprando.
          </p>
        </Card>

        {categories.map((category, index) => (
          <Card key={index} className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              {category.name}
            </h3>
            <div className="space-y-3">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox id={`${category.name}-${itemIndex}`} />
                  <label
                    htmlFor={`${category.name}-${itemIndex}`}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity}</p>
                  </label>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ListaCompras;
