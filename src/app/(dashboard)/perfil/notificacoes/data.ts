/**
 * Dados mock de notificações
 * 
 * Este arquivo contém:
 * - Interface Notification
 * - Dados mock para demonstração
 * 
 * Futura integração: Será substituído por dados da API
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
  actionUrl?: string;
}

// ============================================================================
// MOCK DATA - Para demonstração (futura integração com API)
// ============================================================================

export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Novo contrato aprovado",
    message: "O contrato #2024-001 foi aprovado e está pronto para execução.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min atrás
    read: false,
    type: "success",
    actionUrl: "/contratos/2024-001",
  },
  {
    id: "2",
    title: "Documento pendente",
    message: "Você possui 3 documentos aguardando sua assinatura.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
    read: false,
    type: "warning",
    actionUrl: "/documentos/pendentes",
  },
  {
    id: "3",
    title: "Atualização do sistema",
    message: "Uma nova versão do GoPro2 está disponível com melhorias de performance.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    read: true,
    type: "info",
  },
  {
    id: "4",
    title: "Prazo se aproximando",
    message: "O contrato #2024-015 vence em 7 dias. Verifique a documentação.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    read: true,
    type: "warning",
    actionUrl: "/contratos/2024-015",
  },
  {
    id: "5",
    title: "Novo membro na equipe",
    message: "João Silva foi adicionado ao projeto 'Desenvolvimento App Mobile'.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 dias atrás
    read: true,
    type: "info",
    actionUrl: "/equipe",
  },
];
