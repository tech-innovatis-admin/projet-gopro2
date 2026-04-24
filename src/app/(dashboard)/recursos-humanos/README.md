# Recursos Humanos - Arquitetura e Funcionalidades

## Visão Geral

O módulo de **Recursos Humanos** é responsável por gerenciar dois tipos distintos de recursos humanos na plataforma GoPro:

1. **Equipe Interna** - Membros da equipe de execução da organização
2. **Pessoas em Projetos** - Profissionais contratados especificamente para projetos

> Nota: a gestão de usuários/equipe foi centralizada em `/admin/usuarios`.
> A rota legada `/recursos-humanos/equipe` agora redireciona para o admin, e o fluxo ativo deste módulo fica em `Pessoas em Projetos`.

## Estrutura de Arquivos

```
src/app/(dashboard)/recursos-humanos/
├── equipe/                          # Equipe interna de execução
│   ├── mockData.ts                  # Dados mock da equipe
│   ├── page.tsx                     # Página principal da equipe
│   ├── types.ts                     # Tipos TypeScript da equipe
│   └── _components/                 # Componentes da equipe
│       ├── index.ts
│       ├── UserDetails.tsx
│       └── UsersTable.tsx
├── pessoas/                         # Pessoas contratadas para projetos
│   ├── data.ts                      # Dados mock e funções utilitárias
│   ├── layout.tsx                   # Layout da seção pessoas
│   ├── page.tsx                     # Página principal de pessoas
│   ├── types.ts                     # Tipos TypeScript das pessoas
│   ├── _components/                 # Componentes das pessoas
│   │   ├── index.ts
│   │   ├── PeopleTable.tsx
│   │   └── PersonDetails.tsx
│   └── [pessoasId]/                 # Página de detalhe individual
│       └── page.tsx
└── README.md                        # Este arquivo
```

## Arquitetura por Módulo

### 1. Equipe Interna (`/equipe`)

**Propósito**: Gerenciar os membros da equipe de execução interna da organização.

**Funcionalidades**:
- Visualização de usuários da equipe
- Controle de permissões por módulo
- Gestão de níveis de acesso (LEVEL_1, LEVEL_2, LEVEL_3)
- Histórico de mudanças de permissões

**Estrutura de Dados**:
```typescript
interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: Role; // COORDENADOR_PROJETOS, ESPECIALISTA_TECNICO, etc.
  team: Team; // EXECUCAO, COMERCIAL, ADMINISTRATIVO, FINANCEIRO
  status: UserStatus; // ATIVO, INATIVO
  permissionLevel: PermissionLevel;
  modulePermissions: ModulePermissions[];
  // ... outros campos
}
```

**Componentes**:
- `UsersTable`: Tabela com lista de usuários e filtros
- `UserDetails`: Painel lateral com detalhes do usuário selecionado

### 2. Pessoas em Projetos (`/pessoas`)

**Propósito**: Gerenciar profissionais contratados especificamente para projetos, com seus vínculos e contratos.

**Funcionalidades**:
- Listagem de pessoas com filtros avançados
- Visualização de vínculos com projetos
- Header informativo quando pessoa selecionada (similar ao layout de contratos)
- Página de detalhe individual por pessoa
- Métricas de projetos ativos e carga horária

**Estrutura de Dados**:

**Pessoa (tabela `people`)**:
```typescript
interface Person {
  id: string;
  fullName: string;
  cpf?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  city?: string;
  state?: string;
  // ... outros campos de contato
}
```

**Vínculo Pessoa-Projeto (tabela `project_people`)**:
```typescript
interface ProjectPerson {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  personId: string;
  role?: string;
  workloadHours?: number;
  contractType?: ContractType; // BOLSA, RPA, CLT, VOLUNTARIO, OUTRO
  status: ProjectPersonStatus; // 0=Pendente, 1=Ativo, 2=Encerrado
  baseAmount?: number;
  startDate?: string;
  endDate?: string;
  // ... outros campos
}
```

**Pessoa com Projetos Agregados**:
```typescript
interface PersonWithProjects extends Person {
  projects: ProjectPerson[];
  activeProjectsCount: number;
  totalProjectsCount: number;
}
```

**Componentes**:
- `PeopleTable`: Tabela com filtros por estado, cidade, projetos ativos, busca por nome/email/CPF
- `PersonDetails`: Componente não utilizado na versão atual (substituído pelo header)

## Padrões de Design

### Layout Similar ao de Contratos

A página de pessoas segue o mesmo padrão de layout dos contratos:
- **Header Informativo**: Quando uma pessoa é selecionada, aparece um header acima da tabela com:
  - Avatar com iniciais do nome
  - Informações de contato (email, telefone, localização)
  - Cards de resumo (projetos ativos, total, carga horária, valor total)
  - Seção expansível de projetos com cards detalhados
- **Breadcrumb Navigation**: Home > Recursos Humanos > Pessoas em Projetos
- **Estado de Seleção**: Gerenciado no nível da página principal

### Sistema de Filtros

**Filtros Disponíveis**:
- **Busca**: Nome, email ou CPF
- **Estado**: Lista de estados únicos das pessoas cadastradas
- **Cidade**: Dependente do estado selecionado
- **Projetos Ativos**: Com/sem projetos ativos

### Status e Configurações

**Status de Vínculos**:
- 🔄 **Pendente** (0): Vínculo aguardando início
- ✅ **Ativo** (1): Vínculo em andamento
- ⏹️ **Encerrado** (2): Vínculo finalizado

**Tipos de Contrato**:
- BOLSA: Bolsa de estudo/pesquisa
- RPA: Regime Próprio de Trabalho
- CLT: Consolidação das Leis do Trabalho
- VOLUNTARIO: Trabalho voluntário
- OUTRO: Outros tipos

## Navegação e URLs

- `/recursos-humanos/equipe` - Redireciona para `/admin/usuarios`
- `/recursos-humanos/pessoas` - Lista de pessoas em projetos
- `/recursos-humanos/pessoas/[id]` - Detalhes de uma pessoa específica

## Integração com Navbar

O acesso ativo no navbar principal fica na seção "Gestão", apontando para a tela de pessoas em projetos:

```typescript
{
  label: "Gestão",
  href: "/gestão",
  icon: Users,
  children: [
    { label: "Pessoas em Projetos", href: "/recursos-humanos/pessoas", icon: Users },
  ],
}
```

## Tecnologias Utilizadas

- **Next.js 13+** com App Router
- **TypeScript** para tipagem forte
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **React Hooks** para gerenciamento de estado
- **Mock Data** para desenvolvimento (substituir por API real)

## Próximos Passos

1. **Integração com API**: Substituir mock data por chamadas reais da API
2. **Funcionalidades CRUD**: Adicionar criação, edição e exclusão de pessoas/vínculos
3. **Validações**: Implementar validações de formulários
4. **Paginação**: Para listas grandes de pessoas
5. **Export/Import**: Funcionalidades de exportação de dados
6. **Notificações**: Sistema de notificações para mudanças de status

## Convenções de Código

- **Nomenclatura**: PascalCase para componentes, camelCase para variáveis/funções
- **Estrutura**: `_components/` para componentes locais, `types.ts` para tipos
- **Estilização**: Tailwind CSS com cores da marca (#004225 para pessoas)
- **Estado**: React hooks (useState, useMemo, useCallback) para gerenciamento
- **Tipagem**: TypeScript obrigatório em todos os arquivos</content>
<parameter name="filePath">c:\Users\victo\OneDrive\Desktop\Arquivos Victor\GoPro 2.0\gopro-2\src\app\(dashboard)\recursos-humanos\README.md
