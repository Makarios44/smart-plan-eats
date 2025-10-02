import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Apple, Target, TrendingUp, Sparkles, Zap, Heart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Seu nutricionista digital</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            NutriFácil
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Planos alimentares inteligentes e personalizados para alcançar seus objetivos de saúde
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              Começar Agora <Zap className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Por que escolher o NutriFácil?</h2>
            <p className="text-xl text-muted-foreground">Tudo que você precisa em um só lugar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Planos Personalizados</h3>
              <p className="text-muted-foreground">
                Cardápios adaptados ao seu objetivo, preferências e restrições alimentares
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Controle de Macros</h3>
              <p className="text-muted-foreground">
                Acompanhe proteínas, carboidratos e gorduras de forma simples e intuitiva
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">IA Adaptativa</h3>
              <p className="text-muted-foreground">
                Ajustes automáticos baseados no seu progresso e feedback semanal
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lista de Compras</h3>
              <p className="text-muted-foreground">
                Geração automática da lista de compras baseada no seu plano semanal
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Integrações</h3>
              <p className="text-muted-foreground">
                Conecte com Google Fit e Apple Health para dados mais precisos
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-card shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Resultados Reais</h3>
              <p className="text-muted-foreground">
                Acompanhe sua evolução com gráficos e relatórios detalhados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Pronto para começar sua transformação?</h2>
          <p className="text-xl mb-8 text-white/90">
            Junte-se a milhares de pessoas que já alcançaram seus objetivos
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-lg"
          >
            Criar Meu Plano Gratuito
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-background border-t">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 NutriFácil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
