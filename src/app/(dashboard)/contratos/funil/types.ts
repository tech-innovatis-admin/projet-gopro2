// =============================================================================
// FUNIL DE CONTRATOS - TIPOS E DADOS MOCK
// =============================================================================

import React from "react";
import { Users, Phone, Mail, FileText, CheckCircle } from "lucide-react";

// Tipos de Status de Execução
export type ContractExecutionStatus = 
  | "NAO_INICIADA" 
  | "EM_EXECUCAO" 
  | "CONCLUIDA" 
  | "SUSPENSA";

// Estágio do Funil de Iniciação
export type InitiationStage = {
  id: string;
  name: string;
  description?: string;
  order: number;
  isFinal: boolean;
  isActive: boolean;
  slaDays?: number;
};

// Contrato no Pipeline (visão simplificada para o Kanban)
export type PipelineContract = {
  id: string;
  title: string;
  code: string;
  type: "PROJETO" | "PRODUTO";
  partnerName: string | null;
  totalValue: number | null;
  coordinatorName: string | null;
  stageId: string;
  stageEnteredAt: string; // ISO date
  daysInStage: number;
  hasScheduledActivities: boolean;
  warnings: string[];
  executionStatus: ContractExecutionStatus;
};

// Coluna do Pipeline (estágio + contratos)
export type PipelineColumn = {
  stage: InitiationStage;
  contracts: PipelineContract[];
  totalValue: number;
};

// Tipos de Atividade de Iniciação
export type InitiationActivityType = 
  | "MEETING" 
  | "CALL" 
  | "EMAIL" 
  | "DOCUMENT" 
  | "INTERNAL_TASK";

// Status de Atividade
export type InitiationActivityStatus = 
  | "PLANNED" 
  | "DONE" 
  | "CANCELED";

// Atividade de Iniciação
export type InitiationActivity = {
  id: string;
  contractId: string;
  stageId: string | null;
  title: string;
  description?: string;
  type: InitiationActivityType;
  status: InitiationActivityStatus;
  dueAt: string | null; // ISO date
  completedAt: string | null; // ISO date
  ownerName: string;
  ownerUserId: string;
  createdByName: string;
  createdByUserId: string;
  createdAt: string; // ISO date
};

// Histórico de Movimentação no Funil (modelo atualizado para suportar origem/destino)
export type StageHistoryEntry = {
  id: string;
  contractId: string;
  fromStageId: string | null; // null para primeira entrada (contrato criado)
  fromStageName: string | null;
  toStageId: string;
  toStageName: string;
  movedAt: string; // ISO date
  movedByUserId: string;
  movedByUserName: string;
  daysInPreviousStage: number | null; // dias que ficou na etapa anterior
};

// Tipo para eventos da Timeline (atividades + histórico unificados)
export type TimelineEventType = "activity" | "stage_change";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  date: string; // ISO date para ordenação
  // Dados de atividade (se type === "activity")
  activity?: InitiationActivity;
  // Dados de mudança de etapa (se type === "stage_change")
  stageChange?: StageHistoryEntry;
};

// =============================================================================
// DADOS MOCK
// =============================================================================

// Estágios do Funil
export const MOCK_STAGES: InitiationStage[] = [
  {
    id: "stage_1",
    name: "Contrato Assinado",
    description: "Contrato recém-assinado aguardando próximos passos",
    order: 1,
    isFinal: false,
    isActive: true,
    slaDays: 5,
  },
  {
    id: "stage_2",
    name: "Documentação Completa",
    description: "Toda documentação necessária foi reunida",
    order: 2,
    isFinal: false,
    isActive: true,
    slaDays: 7,
  },
  {
    id: "stage_3",
    name: "Equipe Alocada",
    description: "Equipe técnica definida e alocada",
    order: 3,
    isFinal: false,
    isActive: true,
    slaDays: 10,
  },
  {
    id: "stage_4",
    name: "Planejamento Aprovado",
    description: "Plano de trabalho aprovado pelo cliente",
    order: 4,
    isFinal: false,
    isActive: true,
    slaDays: 7,
  },
  {
    id: "stage_5",
    name: "Kickoff Realizado",
    description: "Reunião de kickoff realizada com stakeholders",
    order: 5,
    isFinal: false,
    isActive: true,
    slaDays: 3,
  },
  {
    id: "stage_6",
    name: "Pronto para Execução",
    description: "Todas as etapas concluídas, projeto pronto para iniciar",
    order: 6,
    isFinal: true,
    isActive: true,
    slaDays: 2,
  },
];

// Contratos Mock no Pipeline
export const MOCK_PIPELINE_CONTRACTS: PipelineContract[] = [
  // Estágio 1 - Contrato Assinado
  {
    id: "contract_1",
    title: "Sistema de Gestão Acadêmica",
    code: "PRJ-2025-001",
    type: "PROJETO",
    partnerName: "Universidade Federal de Minas Gerais",
    totalValue: 850000,
    coordinatorName: "Dr. Carlos Mendes",
    stageId: "stage_1",
    stageEnteredAt: "2026-01-03T10:00:00Z",
    daysInStage: 3,
    hasScheduledActivities: true,
    warnings: [],
    executionStatus: "NAO_INICIADA",
  },
  {
    id: "contract_2",
    title: "Portal de Transparência Municipal",
    code: "PRJ-2025-002",
    type: "PROJETO",
    partnerName: "Prefeitura de Belo Horizonte",
    totalValue: 420000,
    coordinatorName: "Dra. Ana Paula Silva",
    stageId: "stage_1",
    stageEnteredAt: "2025-12-28T14:00:00Z",
    daysInStage: 9,
    hasScheduledActivities: false,
    warnings: ["Sem atividades agendadas", "SLA próximo de expirar"],
    executionStatus: "NAO_INICIADA",
  },
  // Estágio 2 - Documentação Completa
  {
    id: "contract_3",
    title: "Plataforma de E-learning",
    code: "PRJ-2025-003",
    type: "PROJETO",
    partnerName: "Instituto Federal do Paraná",
    totalValue: 680000,
    coordinatorName: "Prof. Roberto Lima",
    stageId: "stage_2",
    stageEnteredAt: "2026-01-02T09:00:00Z",
    daysInStage: 4,
    hasScheduledActivities: true,
    warnings: [],
    executionStatus: "NAO_INICIADA",
  },
  // Estágio 3 - Equipe Alocada
  {
    id: "contract_4",
    title: "App Mobile de Saúde",
    code: "PRJ-2025-004",
    type: "PROJETO",
    partnerName: "Secretaria Estadual de Saúde - SP",
    totalValue: 1200000,
    coordinatorName: "Dr. Fernando Costa",
    stageId: "stage_3",
    stageEnteredAt: "2025-12-20T11:00:00Z",
    daysInStage: 17,
    hasScheduledActivities: true,
    warnings: ["SLA expirado"],
    executionStatus: "NAO_INICIADA",
  },
  {
    id: "contract_5",
    title: "Licença Enterprise GoPro",
    code: "PRD-2025-001",
    type: "PRODUTO",
    partnerName: "Fundação de Amparo à Pesquisa",
    totalValue: 95000,
    coordinatorName: "Maria Santos",
    stageId: "stage_3",
    stageEnteredAt: "2026-01-01T08:00:00Z",
    daysInStage: 5,
    hasScheduledActivities: true,
    warnings: [],
    executionStatus: "NAO_INICIADA",
  },
  // Estágio 4 - Planejamento Aprovado
  {
    id: "contract_6",
    title: "Sistema de Monitoramento Ambiental",
    code: "PRJ-2025-005",
    type: "PROJETO",
    partnerName: "IBAMA",
    totalValue: 2100000,
    coordinatorName: "Dra. Lucia Ferreira",
    stageId: "stage_4",
    stageEnteredAt: "2026-01-04T15:00:00Z",
    daysInStage: 2,
    hasScheduledActivities: true,
    warnings: [],
    executionStatus: "NAO_INICIADA",
  },
  // Estágio 5 - Kickoff Realizado
  {
    id: "contract_7",
    title: "Digitalização de Processos",
    code: "PRJ-2025-006",
    type: "PROJETO",
    partnerName: "Tribunal de Justiça - RJ",
    totalValue: 560000,
    coordinatorName: "Dr. Paulo Ribeiro",
    stageId: "stage_5",
    stageEnteredAt: "2026-01-05T10:00:00Z",
    daysInStage: 1,
    hasScheduledActivities: true,
    warnings: [],
    executionStatus: "NAO_INICIADA",
  },
  // Estágio 6 - Pronto para Execução
  {
    id: "contract_8",
    title: "Infraestrutura Cloud",
    code: "PRJ-2025-007",
    type: "PROJETO",
    partnerName: "Universidade de São Paulo",
    totalValue: 780000,
    coordinatorName: "Prof. André Souza",
    stageId: "stage_6",
    stageEnteredAt: "2026-01-05T14:00:00Z",
    daysInStage: 1,
    hasScheduledActivities: false,
    warnings: [],
    executionStatus: "NAO_INICIADA",
  },
  {
    id: "contract_9",
    title: "Suporte Premium Anual",
    code: "PRD-2025-002",
    type: "PRODUTO",
    partnerName: "UNICAMP",
    totalValue: 48000,
    coordinatorName: "Carla Oliveira",
    stageId: "stage_6",
    stageEnteredAt: "2026-01-04T09:00:00Z",
    daysInStage: 2,
    hasScheduledActivities: true,
    warnings: [],
    executionStatus: "NAO_INICIADA",
  },
];

// Atividades Mock de Iniciação
export const MOCK_INITIATION_ACTIVITIES: InitiationActivity[] = [
  // Atividades do contract_1
  {
    id: "act_1",
    contractId: "contract_1",
    stageId: "stage_1",
    title: "Reunião de alinhamento inicial",
    description: "Apresentar equipe e alinhar expectativas com o cliente",
    type: "MEETING",
    status: "PLANNED",
    dueAt: "2026-01-08T14:00:00Z",
    completedAt: null,
    ownerName: "Dr. Carlos Mendes",
    ownerUserId: "user_1",
    createdByName: "Sistema",
    createdByUserId: "system",
    createdAt: "2026-01-03T10:00:00Z",
  },
  {
    id: "act_2",
    contractId: "contract_1",
    stageId: "stage_1",
    title: "Coletar documentação pendente",
    description: "Solicitar certidões e documentos complementares",
    type: "DOCUMENT",
    status: "PLANNED",
    dueAt: "2026-01-07T18:00:00Z",
    completedAt: null,
    ownerName: "Maria Silva",
    ownerUserId: "user_2",
    createdByName: "Dr. Carlos Mendes",
    createdByUserId: "user_1",
    createdAt: "2026-01-03T11:00:00Z",
  },
  // Atividades do contract_3 (algumas concluídas)
  {
    id: "act_3",
    contractId: "contract_3",
    stageId: "stage_1",
    title: "Assinatura do contrato",
    description: "Formalização da assinatura digital",
    type: "DOCUMENT",
    status: "DONE",
    dueAt: "2025-12-28T12:00:00Z",
    completedAt: "2025-12-28T11:30:00Z",
    ownerName: "Prof. Roberto Lima",
    ownerUserId: "user_3",
    createdByName: "Sistema",
    createdByUserId: "system",
    createdAt: "2025-12-20T10:00:00Z",
  },
  {
    id: "act_4",
    contractId: "contract_3",
    stageId: "stage_2",
    title: "Revisar plano de trabalho",
    description: "Análise detalhada do cronograma proposto",
    type: "INTERNAL_TASK",
    status: "PLANNED",
    dueAt: "2026-01-10T18:00:00Z",
    completedAt: null,
    ownerName: "Prof. Roberto Lima",
    ownerUserId: "user_3",
    createdByName: "Ana Costa",
    createdByUserId: "user_4",
    createdAt: "2026-01-02T09:00:00Z",
  },
  // Atividades do contract_8 (pronto para execução)
  {
    id: "act_5",
    contractId: "contract_8",
    stageId: "stage_5",
    title: "Reunião de Kickoff",
    description: "Kickoff oficial do projeto com todos stakeholders",
    type: "MEETING",
    status: "DONE",
    dueAt: "2026-01-05T10:00:00Z",
    completedAt: "2026-01-05T12:00:00Z",
    ownerName: "Prof. André Souza",
    ownerUserId: "user_5",
    createdByName: "Sistema",
    createdByUserId: "system",
    createdAt: "2026-01-02T08:00:00Z",
  },
  {
    id: "act_6",
    contractId: "contract_8",
    stageId: "stage_6",
    title: "Validação final de ambiente",
    description: "Confirmar que ambiente de desenvolvimento está pronto",
    type: "INTERNAL_TASK",
    status: "DONE",
    dueAt: "2026-01-06T12:00:00Z",
    completedAt: "2026-01-05T16:00:00Z",
    ownerName: "João Tech",
    ownerUserId: "user_6",
    createdByName: "Prof. André Souza",
    createdByUserId: "user_5",
    createdAt: "2026-01-05T14:00:00Z",
  },
];

// Histórico Mock de Movimentação (formato atualizado com origem/destino)
export const MOCK_STAGE_HISTORY: StageHistoryEntry[] = [
  {
    id: "hist_1",
    contractId: "contract_8",
    fromStageId: null,
    fromStageName: null,
    toStageId: "stage_1",
    toStageName: "Contrato Assinado",
    movedAt: "2025-12-15T10:00:00Z",
    movedByUserId: "system",
    movedByUserName: "Sistema",
    daysInPreviousStage: null,
  },
  {
    id: "hist_2",
    contractId: "contract_8",
    fromStageId: "stage_1",
    fromStageName: "Contrato Assinado",
    toStageId: "stage_2",
    toStageName: "Documentação Completa",
    movedAt: "2025-12-18T14:00:00Z",
    movedByUserId: "user_2",
    movedByUserName: "Maria Santos",
    daysInPreviousStage: 3,
  },
  {
    id: "hist_3",
    contractId: "contract_8",
    fromStageId: "stage_2",
    fromStageName: "Documentação Completa",
    toStageId: "stage_3",
    toStageName: "Equipe Alocada",
    movedAt: "2025-12-23T09:00:00Z",
    movedByUserId: "user_3",
    movedByUserName: "Carlos Mendes",
    daysInPreviousStage: 5,
  },
  {
    id: "hist_4",
    contractId: "contract_8",
    fromStageId: "stage_3",
    fromStageName: "Equipe Alocada",
    toStageId: "stage_4",
    toStageName: "Planejamento Aprovado",
    movedAt: "2025-12-27T11:00:00Z",
    movedByUserId: "user_5",
    movedByUserName: "Prof. André Souza",
    daysInPreviousStage: 4,
  },
  {
    id: "hist_5",
    contractId: "contract_8",
    fromStageId: "stage_4",
    fromStageName: "Planejamento Aprovado",
    toStageId: "stage_5",
    toStageName: "Kickoff Realizado",
    movedAt: "2026-01-02T15:00:00Z",
    movedByUserId: "user_5",
    movedByUserName: "Prof. André Souza",
    daysInPreviousStage: 6,
  },
  {
    id: "hist_6",
    contractId: "contract_8",
    fromStageId: "stage_5",
    fromStageName: "Kickoff Realizado",
    toStageId: "stage_6",
    toStageName: "Pronto para Execução",
    movedAt: "2026-01-05T14:00:00Z",
    movedByUserId: "system",
    movedByUserName: "Sistema",
    daysInPreviousStage: 3,
  },
];

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

export function formatCurrency(value: number | null): string {
  if (value === null) return "R$ -";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getActivityTypeLabel(type: InitiationActivityType): string {
  const labels: Record<InitiationActivityType, string> = {
    MEETING: "Reunião",
    CALL: "Ligação",
    EMAIL: "E-mail",
    DOCUMENT: "Documento",
    INTERNAL_TASK: "Tarefa Interna",
  };
  return labels[type];
}

export function getActivityTypeIcon(type: InitiationActivityType): string {
  const icons: Record<InitiationActivityType, string> = {
    MEETING: "👥",
    CALL: "📞",
    EMAIL: "📧",
    DOCUMENT: "📄",
    INTERNAL_TASK: "✅",
  };
  return icons[type];
}

export function getActivityTypeIconComponent(type: InitiationActivityType): React.ReactElement {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case "MEETING":
      return React.createElement(Users, iconProps);
    case "CALL":
      return React.createElement(Phone, iconProps);
    case "EMAIL":
      return React.createElement(Mail, iconProps);
    case "DOCUMENT":
      return React.createElement(FileText, iconProps);
    case "INTERNAL_TASK":
      return React.createElement(CheckCircle, iconProps);
    default:
      return React.createElement("span", {}, "?");
  }
}

// Agrupa contratos por estágio para formar as colunas do pipeline
export function buildPipelineColumns(customStages?: InitiationStage[]): PipelineColumn[] {
  const stagesToUse = customStages || MOCK_STAGES;
  
  return stagesToUse.filter(stage => stage.isActive)
    .sort((a, b) => a.order - b.order)
    .map(stage => {
      const contracts = MOCK_PIPELINE_CONTRACTS.filter(c => c.stageId === stage.id);
      const totalValue = contracts.reduce((sum, c) => sum + (c.totalValue || 0), 0);
      return {
        stage,
        contracts,
        totalValue,
      };
    });
}

// Obtém atividades de um contrato
export function getContractActivities(contractId: string): InitiationActivity[] {
  return MOCK_INITIATION_ACTIVITIES.filter(a => a.contractId === contractId);
}

// Obtém histórico de movimentação de um contrato
export function getContractStageHistory(contractId: string): StageHistoryEntry[] {
  return MOCK_STAGE_HISTORY.filter(h => h.contractId === contractId);
}

// Obtém um contrato pelo ID
export function getContractById(contractId: string): PipelineContract | undefined {
  return MOCK_PIPELINE_CONTRACTS.find(c => c.id === contractId);
}

// Obtém um estágio pelo ID
export function getStageById(stageId: string): InitiationStage | undefined {
  return MOCK_STAGES.find(s => s.id === stageId);
}
