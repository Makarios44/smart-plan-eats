import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Apple, Target, TrendingUp, Sparkles, Zap, Heart, Users, Shield } from "lucide-react";

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
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Escolha seu Perfil</h2>
            <p className="text-xl text-muted-foreground">Selecione o tipo de conta ideal para você</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Regular User Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl">
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Usuário</h3>
                <p className="text-muted-foreground mb-6">
                  Planos personalizados e acompanhamento inteligente para seus objetivos de saúde
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Plano alimentar personalizado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Ajustes automáticos com IA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Acompanhamento de progresso</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Lista de compras inteligente</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  Começar Agora
                </Button>
              </div>
            </div>

            {/* Nutritionist Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                PROFISSIONAL
              </div>
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Nutricionista</h3>
                <p className="text-muted-foreground mb-6">
                  Gerencie múltiplos clientes com ferramentas avançadas e análises com IA
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Dashboard profissional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Gestão de múltiplos clientes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Análise de grupos com IA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Relatórios exportáveis</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  Acessar Painel Profissional
                </Button>
              </div>
            </div>

            {/* Admin Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                EMPRESARIAL
              </div>
              <div className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Administrador</h3>
                <p className="text-muted-foreground mb-6">
                  Controle total para clínicas, academias e empresas de nutrição
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span>
                    <span>Dashboard administrativo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span>
                    <span>Gestão de organizações</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span>
                    <span>Controle de permissões</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">✓</span>
                    <span>Métricas do sistema</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Acessar Painel Admin
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center mt-12 p-6 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-muted-foreground">
              💡 <strong>Dica:</strong> Após o cadastro, você poderá escolher seu tipo de perfil e começar a usar imediatamente!
            </p>
          </div>
        </div>
      </section>

      {/* B2B Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Para Profissionais</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Soluções B2B para Nutricionistas</h2>
            <p className="text-xl text-muted-foreground">Gerencie múltiplos clientes com eficiência</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Painel do Nutricionista</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Gestão centralizada de todos os clientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Acompanhamento em tempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Insights e relatórios automatizados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Ajustes inteligentes com IA</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Gestão Empresarial</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span>Multi-tenant para clínicas e consultórios</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span>Controle de permissões e roles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span>Dashboard administrativo completo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span>Análises consolidadas da equipe</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Começar Teste Gratuito Para Profissionais
            </Button>
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
