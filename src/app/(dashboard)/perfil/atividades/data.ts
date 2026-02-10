import type { ContractInitiationActivity } from "../../../../types/api_gopro_java/contracts";
import type { Project } from "../../../../types/api_gopro_java/projects";
import type { Organization } from "../../../../types/api_gopro_java/organizations";

// Tipo para atividade centralizada (combinando ContractInitiationActivity + Project + Organization)
export interface AtividadeCentralizada {
  id: number;
  activity: ContractInitiationActivity;
  projeto: {
    id: number;
    nome: string;
    codigo?: string;
  };
  organizacao?: {
    id: number;
    nome: string;
    tipo?: string;
  };
  pessoaContato?: {
    nome: string;
    email?: string;
    telefone?: string;
  };
  prioridade?: "alta" | "media" | "baixa";
  atribuidoA?: string;
}

// Mock de projetos
export const mockProjetos: Project[] = [
  {
    id: 101,
    name: "Plataforma Digital Corporativa",
    code: "PRJ-001",
    status: "EXECUCAO",
    createdAt: "2025-12-10T08:00:00",
    updatedAt: "2026-01-20T14:30:00",
    totalReceived: 0,
    totalExpenses: 0,
    saldo: 0,
  },
  {
    id: 102,
    name: "Sistema de Gestão de Processos",
    code: "PRJ-002",
    status: "EXECUCAO",
    createdAt: "2025-11-15T09:00:00",
    updatedAt: "2026-01-18T17:00:00",
    totalReceived: 0,
    totalExpenses: 0,
    saldo: 0,
  },
  {
    id: 103,
    name: "Modernização de Serviços Digitais",
    code: "PRJ-003",
    status: "EXECUCAO",
    createdAt: "2025-12-20T10:00:00",
    updatedAt: "2026-01-22T10:00:00",
    totalReceived: 0,
    totalExpenses: 0,
    saldo: 0,
  },
];

// Mock de organizações
export const mockOrganizacoes: Organization[] = [
  {
    id: 1,
    name: "Empresa Alpha Ltda",
    contactPerson: "Carlos Mendes",
    email: "contato@empresaalpha.com.br",
    phone: "(11) 3456-7890",
    isActive: 1,
    createdAt: "2025-10-01T00:00:00",
    updatedAt: "2025-10-01T00:00:00",
  },
  {
    id: 2,
    name: "Beta Solutions S.A.",
    contactPerson: "Patricia Alves",
    email: "contato@betasolutions.com.br",
    phone: "(21) 2345-6789",
    isActive: 1,
    createdAt: "2025-10-01T00:00:00",
    updatedAt: "2025-10-01T00:00:00",
  },
  {
    id: 3,
    name: "Gamma Tecnologia",
    contactPerson: "Roberto Silva",
    email: "contato@gammatec.com.br",
    phone: "(31) 3234-5678",
    isActive: 1,
    createdAt: "2025-10-01T00:00:00",
    updatedAt: "2025-10-01T00:00:00",
  },
  {
    id: 4,
    name: "Delta Inovação",
    contactPerson: "Fernanda Costa",
    email: "contato@deltainovacao.com.br",
    phone: "(41) 3123-4567",
    isActive: 1,
    createdAt: "2025-10-01T00:00:00",
    updatedAt: "2025-10-01T00:00:00",
  },
  {
    id: 5,
    name: "Epsilon Consultoria",
    contactPerson: "Marcos Pereira",
    email: "contato@epsilonconsult.com.br",
    phone: "(51) 3456-7890",
    isActive: 1,
    createdAt: "2025-10-01T00:00:00",
    updatedAt: "2025-10-01T00:00:00",
  },
  {
    id: 6,
    name: "Zeta Serviços",
    contactPerson: "Juliana Santos",
    email: "contato@zetaservicos.com.br",
    phone: "(61) 3234-5678",
    isActive: 1,
    createdAt: "2025-10-01T00:00:00",
    updatedAt: "2025-10-01T00:00:00",
  },
];

// Mock de atividades centralizadas
// Data de referência: 23/01/2026
// Algumas atividades vencidas (antes de 23/01/2026) e outras futuras (depois de 23/01/2026)
export const mockAtividades: AtividadeCentralizada[] = [
  {
    id: 1,
    activity: {
      id: 1,
      projectId: 101,
      title: "Enviar relatório de progresso",
      description: "Enviar relatório mensal de progresso do projeto",
      activityType: "DOCUMENTO",
      status: "PENDING",
      dueAt: "2026-01-15T14:00:00", // Vencida (8 dias atrás)
      ownerUserId: 1,
      createdAt: "2026-01-10T10:30:00",
      updatedAt: "2026-01-15T10:30:00",
    },
    projeto: {
      id: 101,
      nome: "Plataforma Digital Corporativa",
      codigo: "PRJ-001",
    },
    organizacao: {
      id: 1,
      nome: "Empresa Alpha Ltda",
    },
    pessoaContato: {
      nome: "Carlos Mendes",
      email: "contato@empresaalpha.com.br",
      telefone: "(11) 3456-7890",
    },
    prioridade: "alta",
    atribuidoA: "Maria Silva",
  },
  {
    id: 2,
    activity: {
      id: 2,
      projectId: 102,
      title: "Reunião de alinhamento",
      description: "Reunião para alinhar próximos passos do projeto",
      activityType: "REUNIAO",
      status: "PENDING",
      dueAt: "2026-01-20T10:30:00", // Vencida (3 dias atrás)
      ownerUserId: 1,
      createdAt: "2026-01-18T14:20:00",
      updatedAt: "2026-01-20T14:20:00",
    },
    projeto: {
      id: 102,
      nome: "Sistema de Gestão de Processos",
      codigo: "PRJ-002",
    },
    organizacao: {
      id: 2,
      nome: "Beta Solutions S.A.",
    },
    pessoaContato: {
      nome: "Patricia Alves",
      email: "contato@betasolutions.com.br",
      telefone: "(21) 2345-6789",
    },
    prioridade: "media",
    atribuidoA: "João Santos",
  },
  {
    id: 3,
    activity: {
      id: 3,
      projectId: 102,
      title: "Ligar para cliente",
      description: "Entrar em contato para esclarecer dúvidas técnicas",
      activityType: "CHAMADA",
      status: "IN_PROGRESS",
      dueAt: "2026-01-25T15:00:00", // Futura (2 dias)
      ownerUserId: 2,
      createdAt: "2026-01-20T09:15:00",
      updatedAt: "2026-01-22T16:45:00",
    },
    projeto: {
      id: 102,
      nome: "Sistema de Gestão de Processos",
      codigo: "PRJ-002",
    },
    organizacao: {
      id: 3,
      nome: "Gamma Tecnologia",
    },
    pessoaContato: {
      nome: "Roberto Silva",
      email: "contato@gammatec.com.br",
      telefone: "(31) 3234-5678",
    },
    prioridade: "alta",
    atribuidoA: "Pedro Oliveira",
  },
  {
    id: 4,
    activity: {
      id: 4,
      projectId: 101,
      title: "Revisar documentação técnica",
      description: "Revisar e validar documentação técnica do projeto",
      activityType: "DOCUMENTO",
      status: "PENDING",
      dueAt: "2026-01-23T09:00:00", // Hoje
      ownerUserId: 1,
      createdAt: "2026-01-19T11:00:00",
      updatedAt: "2026-01-19T11:00:00",
    },
    projeto: {
      id: 101,
      nome: "Plataforma Digital Corporativa",
      codigo: "PRJ-001",
    },
    organizacao: {
      id: 4,
      nome: "Delta Inovação",
    },
    pessoaContato: {
      nome: "Fernanda Costa",
      email: "contato@deltainovacao.com.br",
      telefone: "(41) 3123-4567",
    },
    prioridade: "media",
    atribuidoA: "Ana Costa",
  },
  {
    id: 5,
    activity: {
      id: 5,
      projectId: 103,
      title: "Enviar proposta comercial",
      description: "Enviar proposta comercial atualizada",
      activityType: "DOCUMENTO",
      status: "PENDING",
      dueAt: "2026-01-30T11:00:00", // Futura (7 dias)
      ownerUserId: 3,
      createdAt: "2026-01-18T08:30:00",
      updatedAt: "2026-01-18T08:30:00",
    },
    projeto: {
      id: 103,
      nome: "Modernização de Serviços Digitais",
      codigo: "PRJ-003",
    },
    organizacao: {
      id: 5,
      nome: "Epsilon Consultoria",
    },
    pessoaContato: {
      nome: "Marcos Pereira",
      email: "contato@epsilonconsult.com.br",
      telefone: "(51) 3456-7890",
    },
    prioridade: "baixa",
    atribuidoA: "Lucas Ferreira",
  },
  {
    id: 6,
    activity: {
      id: 6,
      projectId: 102,
      title: "Reunião de apresentação",
      description: "Apresentar resultados do projeto para o cliente",
      activityType: "REUNIAO",
      status: "IN_PROGRESS",
      dueAt: "2026-02-05T16:30:00", // Futura (13 dias)
      ownerUserId: 4,
      createdAt: "2026-01-15T15:00:00",
      updatedAt: "2026-01-22T10:00:00",
    },
    projeto: {
      id: 102,
      nome: "Sistema de Gestão de Processos",
      codigo: "PRJ-002",
    },
    organizacao: {
      id: 6,
      nome: "Zeta Serviços",
    },
    pessoaContato: {
      nome: "Juliana Santos",
      email: "contato@zetaservicos.com.br",
      telefone: "(61) 3234-5678",
    },
    prioridade: "alta",
    atribuidoA: "Roberto Lima",
  },
  {
    id: 7,
    activity: {
      id: 7,
      projectId: 101,
      title: "Validar especificações",
      description: "Validar especificações técnicas com a equipe",
      activityType: "REUNIAO",
      status: "PENDING",
      dueAt: "2026-01-18T14:00:00", // Vencida (5 dias atrás)
      ownerUserId: 1,
      createdAt: "2026-01-15T10:00:00",
      updatedAt: "2026-01-18T10:00:00",
    },
    projeto: {
      id: 101,
      nome: "Plataforma Digital Corporativa",
      codigo: "PRJ-001",
    },
    organizacao: {
      id: 2,
      nome: "Beta Solutions S.A.",
    },
    pessoaContato: {
      nome: "Patricia Alves",
      email: "contato@betasolutions.com.br",
      telefone: "(21) 2345-6789",
    },
    prioridade: "alta",
    atribuidoA: "Fernanda Souza",
  },
  {
    id: 8,
    activity: {
      id: 8,
      projectId: 103,
      title: "Atualizar cronograma",
      description: "Atualizar cronograma do projeto com novas datas",
      activityType: "DOCUMENTO",
      status: "PENDING",
      dueAt: "2026-01-27T10:00:00", // Futura (4 dias)
      ownerUserId: 3,
      createdAt: "2026-01-20T09:00:00",
      updatedAt: "2026-01-20T09:00:00",
    },
    projeto: {
      id: 103,
      nome: "Modernização de Serviços Digitais",
      codigo: "PRJ-003",
    },
    organizacao: {
      id: 1,
      nome: "Empresa Alpha Ltda",
    },
    pessoaContato: {
      nome: "Carlos Mendes",
      email: "contato@empresaalpha.com.br",
      telefone: "(11) 3456-7890",
    },
    prioridade: "media",
    atribuidoA: "Gabriel Martins",
  },
];
