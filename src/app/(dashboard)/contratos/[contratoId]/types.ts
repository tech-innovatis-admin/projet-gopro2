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
  valorTotal: number;
  valorExecutado?: number; // Para cálculo de percentual
  descricao?: string;
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
  valorTotal: 1250000,
  valorExecutado: 812500,
  descricao: "Desenvolvimento de sistema integrado para gestão acadêmica e administrativa.",
};

