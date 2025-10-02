# Segurança e Controle de Acesso

## Sistema de Roles e Permissões

Este projeto implementa um sistema robusto de controle de acesso baseado em roles (papéis) com três níveis:

### 1. **Usuário Comum** (`usuario`)
- Acesso apenas aos próprios dados e planos alimentares
- Não pode visualizar informações de outros usuários
- Sem acesso a painéis administrativos ou de nutricionista

### 2. **Nutricionista** (`nutricionista`)
- Acesso aos dados dos clientes atribuídos
- Pode gerenciar planos alimentares dos clientes
- Acesso ao painel de nutricionista em `/nutricionista`
- Vinculado a uma organização

### 3. **Administrador** (`admin`)
- Acesso completo ao sistema
- Gerenciamento de organizações e membros
- Acesso ao painel administrativo via URL secreta: `/x7k2p9m4n8q1`
- **IMPORTANTE**: A rota administrativa NÃO está exposta publicamente

## Proteção de Rotas

### Componente ProtectedRoute
Todas as rotas sensíveis são protegidas usando o componente `ProtectedRoute`:

```tsx
<Route 
  path="/x7k2p9m4n8q1" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

### Hook useAuth
O hook `useAuth` centraliza toda lógica de autenticação e autorização:
- Verifica se o usuário está autenticado
- Valida o role do usuário
- Redireciona automaticamente para área apropriada
- Exibe mensagens de erro amigáveis

## Row Level Security (RLS)

### Políticas Implementadas

#### Organizations
- ✅ Usuários só podem criar organizações onde são proprietários
- ✅ Apenas proprietários podem modificar/deletar suas organizações
- ✅ Admins veem todas organizações
- ✅ Usuários veem apenas organizações das quais fazem parte

#### User Roles
- ✅ Usuários podem criar seu próprio role `usuario` sem organização
- ✅ Apenas proprietários podem criar roles `admin`/`nutricionista` em suas organizações
- ✅ Admins de organização podem gerenciar roles dentro de sua org

#### Meal Plans e Dados do Usuário
- ✅ Usuários veem apenas seus próprios planos
- ✅ Nutricionistas veem planos dos clientes atribuídos
- ✅ Admins têm acesso completo

#### Client Assignments
- ✅ Nutricionistas podem criar atribuições de clientes
- ✅ Nutricionistas veem apenas seus próprios clientes
- ✅ Admins de organização podem gerenciar todas atribuições

## Boas Práticas de Segurança

### ✅ Implementado
1. **Verificação Server-Side**: Todas verificações de role são feitas no backend via funções `SECURITY DEFINER`
2. **RLS Habilitado**: Todas tabelas têm Row Level Security ativado
3. **URL Secreta**: Painel admin não está em rota pública (`/x7k2p9m4n8q1`)
4. **Proteção de Rotas**: Middleware de autenticação em todas rotas sensíveis
5. **Mensagens Amigáveis**: Usuários recebem feedback claro sobre permissões negadas
6. **Centralização**: Lógica de roles centralizada em hooks e componentes reutilizáveis

### ⚠️ Recomendações Adicionais
1. Ativar proteção contra senhas vazadas nas configurações de autenticação
2. Implementar rate limiting para proteção contra ataques de força bruta
3. Adicionar auditoria de ações administrativas
4. Considerar autenticação multifator (MFA) para admins

## Funções de Segurança

O projeto utiliza funções `SECURITY DEFINER` para evitar recursão em políticas RLS:

```sql
-- Verifica se usuário tem role específico
has_role(_user_id uuid, _role app_role)

-- Verifica role em organização específica
has_role_in_org(_user_id uuid, _role app_role, _org_id uuid)

-- Verifica se é proprietário da organização
is_org_owner(_user_id uuid, _org_id uuid)

-- Verifica se é membro da organização
is_organization_member(_user_id uuid, _org_id uuid)

-- Verifica se tem algum role na organização
user_has_role_in_org(_user_id uuid, _org_id uuid)
```

## Fluxo de Autenticação

1. Usuário faz login → `/auth`
2. Sistema verifica roles no banco de dados
3. Redirecionamento automático baseado no role:
   - Admin → `/x7k2p9m4n8q1`
   - Nutricionista → `/nutricionista`
   - Usuário → `/dashboard`
4. Tentativas de acesso não autorizado resultam em:
   - Mensagem de erro amigável
   - Redirecionamento para área apropriada do usuário
   - Log do erro no console (apenas desenvolvimento)

## Estrutura de Dados

```
auth.users (Supabase Auth)
    ↓
user_roles (Roles por organização)
    ↓
organizations (Entidades/Clínicas)
    ↓
client_assignments (Nutricionista → Clientes)
    ↓
profiles, meal_plans, etc. (Dados protegidos por RLS)
```

## Como Testar Permissões

1. **Criar usuário comum**:
   - Registrar → Selecionar "Usuário" → Verificar acesso apenas ao dashboard pessoal

2. **Criar nutricionista**:
   - Registrar → Selecionar "Nutricionista" → Criar organização → Verificar painel `/nutricionista`

3. **Criar admin**:
   - Registrar → Selecionar "Administrador" → Criar organização → Acessar `/x7k2p9m4n8q1`

4. **Testar violação de acesso**:
   - Como usuário comum, tentar acessar `/x7k2p9m4n8q1` → Deve ser bloqueado
   - Como nutricionista, tentar acessar dados de cliente não atribuído → Deve ser bloqueado
