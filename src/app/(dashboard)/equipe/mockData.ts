// =============================================================================
// MOCK DATA PARA PAINEL DA EQUIPE DE EXECUÇÃO
// =============================================================================

import {
  type TeamUser,
  type PermissionLevelConfig,
  type PermissionHistoryEntry,
  type OrgNode,
} from "./types";

// Configuração dos níveis de permissão
export const PERMISSION_LEVELS: PermissionLevelConfig[] = [
  {
    level: "LEVEL_1",
    name: "Nível 1",
    description: "Operacional",
    color: "bg-green-100",
    badgeColor: "bg-green-500",
    textColor: "text-green-700",
  },
  {
    level: "LEVEL_2",
    name: "Nível 2",
    description: "Coordenador",
    color: "bg-blue-100",
    badgeColor: "bg-blue-500",
    textColor: "text-blue-700",
  },
  {
    level: "LEVEL_3",
    name: "Nível 3",
    description: "Administrador",
    color: "bg-purple-100",
    badgeColor: "bg-purple-500",
    textColor: "text-purple-700",
  },
];

// Mock de usuários
export const MOCK_TEAM_USERS: TeamUser[] = [
  {
    id: "user_1",
    name: "Vitor Silva",
    email: "vitor.silva@gopro.com",
    photo: undefined,
    role: "COORDENADOR_PROJETOS",
    team: "EXECUCAO",
    permissionLevel: "LEVEL_3",
    status: "ATIVO",
    managerId: undefined,
    lastAccessAt: "2026-01-15T10:30:00Z",
    createdAt: "2024-01-10T08:00:00Z",
    modulePermissions: [
      { module: "CONTRATOS", access: "CONFIGURAR" },
      { module: "FUNIL_CONTRATOS", access: "CONFIGURAR" },
      { module: "INICIACAO_PROJETOS", access: "CONFIGURAR" },
      { module: "EXECUCAO_PROJETOS", access: "CONFIGURAR" },
      { module: "RELATORIOS", access: "CONFIGURAR" },
      { module: "CONFIGURACOES", access: "CONFIGURAR" },
    ],
  },
  {
    id: "user_2",
    name: "Maria Santos",
    email: "maria.santos@gopro.com",
    photo: undefined,
    role: "ESPECIALISTA_TECNICO",
    team: "EXECUCAO",
    permissionLevel: "LEVEL_2",
    status: "ATIVO",
    managerId: "user_1",
    lastAccessAt: "2026-01-15T09:15:00Z",
    createdAt: "2024-03-15T08:00:00Z",
    modulePermissions: [
      { module: "CONTRATOS", access: "EDITAR" },
      { module: "FUNIL_CONTRATOS", access: "EDITAR" },
      { module: "INICIACAO_PROJETOS", access: "EDITAR" },
      { module: "EXECUCAO_PROJETOS", access: "EDITAR" },
      { module: "RELATORIOS", access: "VER" },
      { module: "CONFIGURACOES", access: "NENHUM" },
    ],
  },
  {
    id: "user_3",
    name: "João Oliveira",
    email: "joao.oliveira@gopro.com",
    photo: undefined,
    role: "ANALISTA_EXECUCAO",
    team: "EXECUCAO",
    permissionLevel: "LEVEL_1",
    status: "ATIVO",
    managerId: "user_2",
    lastAccessAt: "2026-01-14T16:45:00Z",
    createdAt: "2024-06-01T08:00:00Z",
    modulePermissions: [
      { module: "CONTRATOS", access: "VER" },
      { module: "FUNIL_CONTRATOS", access: "VER" },
      { module: "INICIACAO_PROJETOS", access: "EDITAR" },
      { module: "EXECUCAO_PROJETOS", access: "EDITAR" },
      { module: "RELATORIOS", access: "NENHUM" },
      { module: "CONFIGURACOES", access: "NENHUM" },
    ],
  },
  {
    id: "user_4",
    name: "Ana Costa",
    email: "ana.costa@gopro.com",
    photo: undefined,
    role: "ANALISTA_EXECUCAO",
    team: "EXECUCAO",
    permissionLevel: "LEVEL_1",
    status: "ATIVO",
    managerId: "user_2",
    lastAccessAt: "2026-01-15T11:20:00Z",
    createdAt: "2024-07-10T08:00:00Z",
    modulePermissions: [
      { module: "CONTRATOS", access: "VER" },
      { module: "FUNIL_CONTRATOS", access: "VER" },
      { module: "INICIACAO_PROJETOS", access: "EDITAR" },
      { module: "EXECUCAO_PROJETOS", access: "EDITAR" },
      { module: "RELATORIOS", access: "NENHUM" },
      { module: "CONFIGURACOES", access: "NENHUM" },
    ],
  },
  {
    id: "user_5",
    name: "Carlos Mendes",
    email: "carlos.mendes@gopro.com",
    photo: undefined,
    role: "ESTAGIARIO",
    team: "EXECUCAO",
    permissionLevel: "LEVEL_1",
    status: "ATIVO",
    managerId: "user_3",
    lastAccessAt: "2026-01-15T08:00:00Z",
    createdAt: "2024-09-01T08:00:00Z",
    modulePermissions: [
      { module: "CONTRATOS", access: "VER" },
      { module: "FUNIL_CONTRATOS", access: "NENHUM" },
      { module: "INICIACAO_PROJETOS", access: "VER" },
      { module: "EXECUCAO_PROJETOS", access: "VER" },
      { module: "RELATORIOS", access: "NENHUM" },
      { module: "CONFIGURACOES", access: "NENHUM" },
    ],
  },
  {
    id: "user_6",
    name: "Patricia Lima",
    email: "patricia.lima@gopro.com",
    photo: undefined,
    role: "GESTOR_FINANCEIRO",
    team: "FINANCEIRO",
    permissionLevel: "LEVEL_2",
    status: "ATIVO",
    managerId: "user_1",
    lastAccessAt: "2026-01-15T10:00:00Z",
    createdAt: "2024-02-20T08:00:00Z",
    modulePermissions: [
      { module: "CONTRATOS", access: "VER" },
      { module: "FUNIL_CONTRATOS", access: "VER" },
      { module: "INICIACAO_PROJETOS", access: "VER" },
      { module: "EXECUCAO_PROJETOS", access: "EDITAR" },
      { module: "RELATORIOS", access: "EDITAR" },
      { module: "CONFIGURACOES", access: "NENHUM" },
    ],
  },
  {
    id: "user_7",
    name: "Roberto Alves",
    email: "roberto.alves@gopro.com",
    photo: undefined,
    role: "ANALISTA_EXECUCAO",
    team: "EXECUCAO",
    permissionLevel: "LEVEL_1",
    status: "INATIVO",
    managerId: "user_2",
    lastAccessAt: "2025-12-20T14:30:00Z",
    createdAt: "2024-05-15T08:00:00Z",
    modulePermissions: [
      { module: "CONTRATOS", access: "VER" },
      { module: "FUNIL_CONTRATOS", access: "VER" },
      { module: "INICIACAO_PROJETOS", access: "EDITAR" },
      { module: "EXECUCAO_PROJETOS", access: "EDITAR" },
      { module: "RELATORIOS", access: "NENHUM" },
      { module: "CONFIGURACOES", access: "NENHUM" },
    ],
  },
];

// Mock de histórico de permissões
export const MOCK_PERMISSION_HISTORY: PermissionHistoryEntry[] = [
  {
    id: "hist_1",
    userId: "user_2",
    fromLevel: "LEVEL_1",
    toLevel: "LEVEL_2",
    changedAt: "2024-08-01T10:00:00Z",
    changedByUserId: "user_1",
    changedByName: "Vitor Silva",
    reason: "Promoção para coordenador de projetos",
  },
  {
    id: "hist_2",
    userId: "user_3",
    fromLevel: null,
    toLevel: "LEVEL_1",
    changedAt: "2024-06-01T08:00:00Z",
    changedByUserId: "user_2",
    changedByName: "Maria Santos",
  },
];

// Labels das funções
export const ROLE_LABELS: Record<string, string> = {
  COORDENADOR_PROJETOS: "Coordenador de Projetos",
  ESPECIALISTA_TECNICO: "Especialista Técnico",
  ANALISTA_EXECUCAO: "Analista de Execução",
  ESTAGIARIO: "Estagiário",
  GESTOR_FINANCEIRO: "Gestor Financeiro",
  ADMINISTRADOR: "Administrador",
};

// Labels dos módulos
export const MODULE_LABELS: Record<string, string> = {
  CONTRATOS: "Contratos",
  FUNIL_CONTRATOS: "Funil de Contratos",
  INICIACAO_PROJETOS: "Iniciação de Projetos",
  EXECUCAO_PROJETOS: "Execução de Projetos",
  RELATORIOS: "Relatórios / Dashboards",
  CONFIGURACOES: "Configurações da Plataforma",
};

// Labels das permissões
export const PERMISSION_LABELS: Record<string, string> = {
  VER: "Ver",
  CRIAR: "Criar",
  EDITAR: "Editar",
  EXCLUIR: "Excluir",
  CONFIGURAR: "Configurar",
  NENHUM: "Nenhum",
};

// Função para construir organograma a partir dos usuários
export function buildOrgChart(users: TeamUser[]): OrgNode[] {
  const roleGroups: Record<string, TeamUser[]> = {};
  
  // Agrupa usuários por função
  users.forEach((user) => {
    if (!roleGroups[user.role]) {
      roleGroups[user.role] = [];
    }
    roleGroups[user.role].push(user);
  });

  // Converte para nós do organograma
  const nodes: OrgNode[] = Object.entries(roleGroups).map(([role, roleUsers]) => {
    // Determina o nível de permissão mais comum da função
    const levelCounts: Record<string, number> = {};
    roleUsers.forEach((u) => {
      levelCounts[u.permissionLevel] = (levelCounts[u.permissionLevel] || 0) + 1;
    });
    const mostCommonLevel = Object.entries(levelCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] as any;

    // Determina o gestor direto (função do managerId mais comum)
    const managerRoles = roleUsers
      .map((u) => {
        if (!u.managerId) return null;
        const manager = users.find((m) => m.id === u.managerId);
        return manager?.role;
      })
      .filter((r): r is string => r !== null);
    
    const managerRole = managerRoles.length > 0 
      ? (managerRoles[0] as any)
      : undefined;

    return {
      role: role as any,
      roleLabel: ROLE_LABELS[role] || role,
      users: roleUsers.sort((a, b) => a.name.localeCompare(b.name)),
      level: mostCommonLevel || "LEVEL_1",
      managerRole,
    };
  });

  // Ordena por hierarquia (LEVEL_3 primeiro, depois LEVEL_2, depois LEVEL_1)
  const levelOrder = { LEVEL_3: 0, LEVEL_2: 1, LEVEL_1: 2 };
  return nodes.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
}

