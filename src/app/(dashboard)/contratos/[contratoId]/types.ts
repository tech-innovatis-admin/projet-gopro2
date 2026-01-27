// Tipo unificado de Contrato - fonte única de verdade
export type Contrato = {
  id: string;
  codigo: string;
  titulo: string; // Unificado: sempre "titulo"
  tipo: "PROJETO" | "PRODUTO";
  status: string;
  coordenador: string; // Unificado: sempre "coordenador"
  parceiro: string;
  cliente?: string; // Cliente/Parceiro (pode ser diferente do parceiro)
  orgaoFinanciador: string;
  segmentos: string[];
  localidade: string;
  unidade?: string; // Unidade / IFES
  dataInicio: string;
  dataFim: string; // Unificado: sempre "dataFim"
  dataRealInicio?: string; // Data que realmente iniciou o projeto
  dataRealTermino?: string; // Data que realmente terminou o projeto
  valorTotal: number;
  valorExecutado?: number; // Para cálculo de percentual
  descricao?: string;
};

// Tipos para dados de resumo do contrato
export type RiscoSeveridade = "ALTA" | "MEDIA" | "BAIXA";
export type CronogramaStatus = "NO_PRAZO" | "ATRASADO" | "ADIANTADO";
export type MovimentacaoTipo = "CONTRATACAO" | "FINANCEIRO" | "STATUS" | "DOCUMENTO";

export type Risco = {
  id: number;
  descricao: string;
  severidade: RiscoSeveridade;
};

export type Movimentacao = {
  id: number;
  data: string;
  tipo: MovimentacaoTipo;
  descricao: string;
  usuario: string;
};

export type ResumoFinanceiro = {
  valorContratado: number;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
};

export type ResumoCronograma = {
  percentualExecucao: number;
  dataAtual: string;
  dataFinal: string;
  diasRestantes: number;
  status: CronogramaStatus;
};

export type ResumoContrato = {
  financeiro: ResumoFinanceiro;
  cronograma: ResumoCronograma;
  riscos: Risco[];
  movimentacoes: Movimentacao[];
};

// Mock de dados do contrato - fonte única de verdade
export const mockContrato: Contrato = {
  id: "1",
  codigo: "PRJ-001",
  titulo: "Sistema de Gestão Integrada",
  tipo: "PROJETO",
  status: "EM_ANDAMENTO",
  coordenador: "João Silva",
  parceiro: "Fundação de Apoio à Pesquisa",
  cliente: "Prefeitura de São Paulo",
  orgaoFinanciador: "Ministério da Educação",
  segmentos: ["Educação", "Tecnologia"],
  localidade: "São Paulo - SP",
  dataInicio: "2025-01-15",
  dataFim: "2025-12-31",
  dataRealInicio: "2025-02-01", // Projeto iniciou efetivamente em 01/02/2025
  dataRealTermino: undefined, // Ainda não terminou
  valorTotal: 1250000,
  valorExecutado: 812500,
  descricao: "Desenvolvimento de sistema integrado para gestão acadêmica e administrativa.",
};

// Mock de dados de resumo do contrato
export const mockResumo: ResumoContrato = {
  financeiro: {
    valorContratado: 1250000,
    valorEmpenhado: 950000,
    valorLiquidado: 812500,
    valorPago: 750000,
  },
  cronograma: {
    percentualExecucao: 65,
    dataAtual: new Date().toISOString(),
    dataFinal: "2025-12-31",
    diasRestantes: 26,
    status: "NO_PRAZO",
  },
  riscos: [
    { id: 1, descricao: "Atraso na entrega de equipamentos pelo fornecedor", severidade: "ALTA" },
    { id: 2, descricao: "Pendência de aprovação do Termo Aditivo nº 02", severidade: "MEDIA" },
    { id: 3, descricao: "Necessidade de remanejamento de rubrica", severidade: "BAIXA" },
  ],
  movimentacoes: [
    {
      id: 1,
      data: "2025-12-03",
      tipo: "CONTRATACAO",
      descricao: "Nova ordem de serviço OS-005 criada",
      usuario: "Maria Santos",
    },
    {
      id: 2,
      data: "2025-12-01",
      tipo: "FINANCEIRO",
      descricao: "Pagamento de R$ 125.000,00 realizado",
      usuario: "Sistema",
    },
    {
      id: 3,
      data: "2025-11-28",
      tipo: "STATUS",
      descricao: "Marco 'Entrega Fase 2' concluído",
      usuario: "João Silva",
    },
    {
      id: 4,
      data: "2025-11-25",
      tipo: "DOCUMENTO",
      descricao: "Relatório de Acompanhamento anexado",
      usuario: "Ana Costa",
    },
  ],
};

