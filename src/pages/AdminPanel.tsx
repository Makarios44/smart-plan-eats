import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, Building2, UserPlus, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  email: string;
  role: string;
  organization_id: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newOrgName, setNewOrgName] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<string>("usuario");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roleLoading && role !== 'admin') {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
      });
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate, toast]);

  useEffect(() => {
    if (role === 'admin') {
      loadOrganizations();
    }
  }, [role]);

  useEffect(() => {
    if (selectedOrg) {
      loadMembers();
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar organizações.",
      });
    }
  };

  const loadMembers = async () => {
    try {
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role, organization_id')
        .eq('organization_id', selectedOrg);

      if (error) throw error;

      // Get user emails (this is simplified - in production you'd need a proper way to get user info)
      const membersWithEmails = rolesData || [];
      setMembers(membersWithEmails as any);
    } catch (error: any) {
      console.error('Error loading members:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar membros.",
      });
    }
  };

  const createOrganization = async () => {
    if (!newOrgName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome da organização é obrigatório.",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('organizations')
        .insert({
          name: newOrgName,
          owner_id: session.user.id,
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Organização criada com sucesso.",
      });

      setNewOrgName("");
      loadOrganizations();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar organização.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!selectedOrg || !newMemberEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma organização e informe o email do membro.",
      });
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd need to look up the user by email first
      // This is simplified for demonstration
      toast({
        title: "Info",
        description: "Funcionalidade de adicionar membro requer implementação de lookup de usuário por email.",
      });
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar membro.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Painel do Administrador</h1>
          </div>
          <p className="text-muted-foreground">
            Gerenciamento de organizações, membros e permissões
          </p>
        </div>

        {/* Create Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Criar Nova Organização
            </CardTitle>
            <CardDescription>
              Crie uma nova organização para gerenciar clientes e nutricionistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="orgName">Nome da Organização</Label>
                <Input
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Ex: Clínica de Nutrição XYZ"
                />
              </div>
              <Button onClick={createOrganization} disabled={loading} className="mt-auto">
                Criar Organização
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Organizations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizações ({organizations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organizations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma organização criada ainda
              </p>
            ) : (
              <div className="space-y-2">
                {organizations.map((org) => (
                  <Card
                    key={org.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedOrg === org.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedOrg(org.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{org.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Criada em {new Date(org.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedOrg === org.id && <Badge>Selecionada</Badge>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manage Members */}
        {selectedOrg && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Membros
              </CardTitle>
              <CardDescription>
                Adicione e gerencie membros da organização selecionada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="memberEmail">Email do Membro</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div className="w-48">
                  <Label htmlFor="memberRole">Role</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger id="memberRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="nutricionista">Nutricionista</SelectItem>
                      <SelectItem value="usuario">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addMember} disabled={loading} className="mt-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {members.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-xs">{member.user_id}</TableCell>
                        <TableCell>
                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Remover</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
