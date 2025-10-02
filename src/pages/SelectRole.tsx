import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, User, Building2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const roles = [
  {
    id: "usuario",
    title: "Usuário",
    description: "Acompanhe sua nutrição pessoal",
    icon: User,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Plano alimentar personalizado",
      "Acompanhamento de evolução",
      "Sugestões com IA",
      "Lista de compras automática",
    ],
  },
  {
    id: "nutricionista",
    title: "Nutricionista",
    description: "Gerencie múltiplos clientes",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    features: [
      "Painel de gestão de clientes",
      "Acompanhamento em tempo real",
      "Ajustes automáticos de planos",
      "Relatórios e insights com IA",
    ],
    badge: "Profissional",
  },
  {
    id: "admin",
    title: "Administrador",
    description: "Gerencie organizações e equipes",
    icon: Shield,
    color: "from-purple-500 to-pink-500",
    features: [
      "Gestão de organizações",
      "Controle de membros e permissões",
      "Dashboard administrativo",
      "Análises consolidadas",
    ],
    badge: "Enterprise",
  },
];

const SelectRole = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione um tipo de conta",
      });
      return;
    }

    if ((selectedRole === "admin" || selectedRole === "nutricionista") && !organizationName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe o nome da organização",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Create organization for admin/nutritionist
      if (selectedRole === "admin" || selectedRole === "nutricionista") {
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({ name: organizationName, owner_id: user.id })
          .select()
          .single();

        if (orgError) throw orgError;

        // Add user as member
        const { error: memberError } = await supabase
          .from("organization_members")
          .insert({
            user_id: user.id,
            organization_id: org.id,
          });

        if (memberError) throw memberError;

        // Assign role in organization
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: selectedRole as "admin" | "nutricionista" | "usuario",
            organization_id: org.id,
          });

        if (roleError) throw roleError;
      } else {
        // For regular users, just assign the role without organization
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: selectedRole as "admin" | "nutricionista" | "usuario",
          });

        if (roleError) throw roleError;
      }

      toast({
        title: "Sucesso!",
        description: "Conta configurada com sucesso",
      });

      navigate("/onboarding");
    } catch (error: any) {
      console.error("Error setting up role:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao configurar conta. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-6xl mx-auto space-y-8 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Bem-vindo ao NutriFácil! 🎉</h1>
          <p className="text-xl text-muted-foreground">
            Escolha o tipo de conta que melhor se adequa às suas necessidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {role.badge && (
                      <Badge variant="secondary">{role.badge}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isSelected && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Check className="h-5 w-5" />
                        Selecionado
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(selectedRole === "admin" || selectedRole === "nutricionista") && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Organização
              </CardTitle>
              <CardDescription>
                {selectedRole === "admin"
                  ? "Configure sua organização para começar a gerenciar equipes"
                  : "Configure sua clínica ou consultório"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="org-name">Nome da Organização *</Label>
                <Input
                  id="org-name"
                  placeholder="Ex: Clínica Saúde Total"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/auth")}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            onClick={handleContinue}
            disabled={loading || !selectedRole}
            size="lg"
            className="min-w-[200px]"
          >
            {loading ? "Configurando..." : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
