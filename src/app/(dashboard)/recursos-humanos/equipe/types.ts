// =============================================================================
// TIPOS PARA PAINEL DA EQUIPE DE EXECUÇÃO
// =============================================================================

export type PermissionLevel = "LEVEL_1" | "LEVEL_2" | "LEVEL_3";

export type UserStatus = "ATIVO" | "INATIVO";

export type Team = "EXECUCAO" | "COMERCIAL" | "ADMINISTRATIVO" | "FINANCEIRO";

export type Role =
  | "COORDENADOR_PROJETOS"
  | "ESPECIALISTA_TECNICO"
  | "ANALISTA_EXECUCAO"
  | "ESTAGIARIO"
  | "GESTOR_FINANCEIRO"
  | "ADMINISTRADOR";

export type ModulePermission = "VER" | "CRIAR" | "EDITAR" | "EXCLUIR" | "CONFIGURAR" | "NENHUM";

export type Module =
  | "CONTRATOS"
  | "FUNIL_CONTRATOS"
  | "INICIACAO_PROJETOS"
  | "EXECUCAO_PROJETOS"
  | "RELATORIOS"
  | "CONFIGURACOES";

// Permissões por módulo
export interface ModulePermissions {
  module: Module;
  access: ModulePermission;
}

// Histórico de mudanças de acesso
export interface PermissionHistoryEntry {
  id: string;
  userId: string;
  fromLevel: PermissionLevel | null;
  toLevel: PermissionLevel;
  changedAt: string; // ISO date
  changedByUserId: string;
  changedByName: string;
  reason?: string;
}

// Usuário da equipe
export interface TeamUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: Role;
  team: Team;
  permissionLevel: PermissionLevel;
  status: UserStatus;
  managerId?: string; // Para organograma
  lastAccessAt?: string; // ISO date
  createdAt: string; // ISO date
  modulePermissions: ModulePermissions[];
}

// Nó do organograma (função + usuários)
export interface OrgNode {
  role: Role;
  roleLabel: string;
  users: TeamUser[];
  level: PermissionLevel;
  managerRole?: Role; // Função do gestor direto
}

// Configuração de nível de permissão
export interface PermissionLevelConfig {
  level: PermissionLevel;
  name: string;
  description: string;
  color: string;
  badgeColor: string;
  textColor: string;
}

// Filtros para a tabela
export interface UserFilters {
  role?: Role;
  permissionLevel?: PermissionLevel;
  status?: UserStatus;
  team?: Team;
  search?: string;
}

