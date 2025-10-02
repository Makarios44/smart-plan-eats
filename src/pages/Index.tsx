import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Apple, Target, TrendingUp, Sparkles, Zap, Heart, Calendar, Brain, ShoppingBasket } from "lucide-react";

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
            <span className="text-sm font-medium">Seu nutricionista digital inteligente</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            NutriFácil
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Planos alimentares personalizados com inteligência artificial para alcançar seus objetivos de saúde
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              Começar Grátis <Zap className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher o NutriFácil?</h2>
            <p className="text-lg md:text-xl text-muted-foreground">Tudo que você precisa para sua jornada fitness</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Planos Personalizados</h3>
              <p className="text-muted-foreground">
                Cardápios adaptados ao seu objetivo, preferências e restrições alimentares
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Controle de Macros</h3>
              <p className="text-muted-foreground">
                Acompanhe proteínas, carboidratos e gorduras de forma simples e intuitiva
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Evolução em Tempo Real</h3>
              <p className="text-muted-foreground">
                Acompanhe seu progresso com gráficos e métricas detalhadas
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">IA Adaptativa</h3>
              <p className="text-muted-foreground">
                Ajustes automáticos baseados no seu progresso e feedback semanal
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <ShoppingBasket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lista de Compras</h3>
              <p className="text-muted-foreground">
                Gere automaticamente sua lista de compras baseada no seu plano
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Planejamento Semanal</h3>
              <p className="text-muted-foreground">
                Organize suas refeições e alcance suas metas com facilidade
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona?</h2>
            <p className="text-lg md:text-xl text-muted-foreground">Simples, rápido e eficiente</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Cadastre-se</h3>
              <p className="text-muted-foreground">
                Crie sua conta gratuita e informe seus dados básicos
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-secondary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Configure seu Perfil</h3>
              <p className="text-muted-foreground">
                Defina seus objetivos, restrições e preferências alimentares
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Receba seu Plano</h3>
              <p className="text-muted-foreground">
                A IA gera automaticamente seu plano alimentar personalizado
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Card Section */}
      <section className="py-20 px-4 md:px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comece sua transformação hoje</h2>
            <p className="text-lg md:text-xl text-muted-foreground">Grátis para sempre</p>
          </div>

          <Card className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl">
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">Plano Gratuito</h3>
                  <p className="text-muted-foreground mb-6">
                    Acesso completo a todos os recursos para alcançar seus objetivos de saúde
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-500">✓</span>
                      <span>Plano alimentar personalizado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-500">✓</span>
                      <span>Ajustes automáticos com IA</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-500">✓</span>
                      <span>Acompanhamento de progresso</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-500">✓</span>
                      <span>Lista de compras inteligente</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-500">✓</span>
                      <span>Sugestões de refeições com IA</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-500">✓</span>
                      <span>Feedback semanal adaptativo</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  >
                    Começar Agora <Zap className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar sua transformação?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Junte-se a milhares de pessoas que já alcançaram seus objetivos
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-lg"
          >
            Criar Meu Plano Gratuito <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 bg-background border-t">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 NutriFácil. Todos os direitos reservados.</p>
          <p className="text-sm mt-2">
            Planos alimentares personalizados com inteligência artificial
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
