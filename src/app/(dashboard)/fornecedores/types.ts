// =============================================================================
// TIPOS PARA O MÓDULO DE FORNECEDORES
// =============================================================================

// Status do fornecedor
export type FornecedorStatus = "ATIVO" | "INATIVO";

// Categorias de fornecedores
export type FornecedorCategoria =
  | "CONSULTORIA"
  | "TECNOLOGIA"
  | "SERVICOS_GERAIS"
  | "EQUIPAMENTOS"
  | "LABORATORIO"
  | "CAPACITACAO"
  | "COMUNICACAO"
  | "TRANSPORTE"
  | "ALIMENTACAO"
  | "INFRAESTRUTURA";

// Serviços oferecidos
export type FornecedorServico =
  | "CONSULTORIA_TECNICA"
  | "DESENVOLVIMENTO_SOFTWARE"
  | "MANUTENCAO_EQUIPAMENTOS"
  | "TREINAMENTO"
  | "PESQUISA"
  | "ANALISES_LABORATORIAIS"
  | "ASSESSORIA_JURIDICA"
  | "CONTABILIDADE"
  | "DESIGN_GRAFICO"
  | "MARKETING_DIGITAL"
  | "LOGISTICA"
  | "EVENTOS"
  | "TRADUCAO"
  | "AUDITORIA";

// Labels amigáveis para categorias
export const CATEGORIA_LABELS: Record<FornecedorCategoria, string> = {
  CONSULTORIA: "Consultoria",
  TECNOLOGIA: "Tecnologia",
  SERVICOS_GERAIS: "Serviços Gerais",
  EQUIPAMENTOS: "Equipamentos",
  LABORATORIO: "Laboratório",
  CAPACITACAO: "Capacitação",
  COMUNICACAO: "Comunicação",
  TRANSPORTE: "Transporte",
  ALIMENTACAO: "Alimentação",
  INFRAESTRUTURA: "Infraestrutura",
};

// Labels amigáveis para serviços
export const SERVICO_LABELS: Record<FornecedorServico, string> = {
  CONSULTORIA_TECNICA: "Consultoria Técnica",
  DESENVOLVIMENTO_SOFTWARE: "Desenvolvimento de Software",
  MANUTENCAO_EQUIPAMENTOS: "Manutenção de Equipamentos",
  TREINAMENTO: "Treinamento",
  PESQUISA: "Pesquisa",
  ANALISES_LABORATORIAIS: "Análises Laboratoriais",
  ASSESSORIA_JURIDICA: "Assessoria Jurídica",
  CONTABILIDADE: "Contabilidade",
  DESIGN_GRAFICO: "Design Gráfico",
  MARKETING_DIGITAL: "Marketing Digital",
  LOGISTICA: "Logística",
  EVENTOS: "Eventos",
  TRADUCAO: "Tradução",
  AUDITORIA: "Auditoria",
};

// Cores por categoria (para badges)
export const CATEGORIA_COLORS: Record<FornecedorCategoria, { bg: string; text: string }> = {
  CONSULTORIA: { bg: "bg-blue-100", text: "text-blue-700" },
  TECNOLOGIA: { bg: "bg-purple-100", text: "text-purple-700" },
  SERVICOS_GERAIS: { bg: "bg-gray-100", text: "text-gray-700" },
  EQUIPAMENTOS: { bg: "bg-orange-100", text: "text-orange-700" },
  LABORATORIO: { bg: "bg-teal-100", text: "text-teal-700" },
  CAPACITACAO: { bg: "bg-indigo-100", text: "text-indigo-700" },
  COMUNICACAO: { bg: "bg-pink-100", text: "text-pink-700" },
  TRANSPORTE: { bg: "bg-yellow-100", text: "text-yellow-700" },
  ALIMENTACAO: { bg: "bg-red-100", text: "text-red-700" },
  INFRAESTRUTURA: { bg: "bg-emerald-100", text: "text-emerald-700" },
};

// Interface principal do Fornecedor
export interface Fornecedor {
  id: string;
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  uf: string;
  municipio: string;
  endereco?: string;
  categorias: FornecedorCategoria[];
  servicos: FornecedorServico[];
  status: FornecedorStatus;
  observacoes?: string;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
}

// Avaliação de contrato
export interface ContratoAvaliacao {
  nota: number; // 1-5
  comentario?: string;
  avaliadoPor?: string;
  dataAvaliacao?: string; // ISO date
}

// Contrato vinculado ao fornecedor
export interface FornecedorContratoVinculado {
  id: string;
  codigo: string;
  titulo: string;
  status: "EM_ANDAMENTO" | "CONCLUIDO" | "SUSPENSO" | "CANCELADO";
  valorTotal: number;
  dataInicio: string; // ISO date
  dataFim?: string; // ISO date
  fornecedorId: string;
  avaliacao?: ContratoAvaliacao;
}

// Estado dos filtros da listagem
export interface FornecedoresFiltersState {
  q: string; // busca por nome
  uf: string | null;
  municipio: string | null;
  categorias: FornecedorCategoria[];
  servicos: FornecedorServico[];
  status: FornecedorStatus | null;
  sortBy: "nome" | "uf" | "municipio" | "status";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

// Estado inicial dos filtros
export const INITIAL_FILTERS_STATE: FornecedoresFiltersState = {
  q: "",
  uf: null,
  municipio: null,
  categorias: [],
  servicos: [],
  status: null,
  sortBy: "nome",
  sortDir: "asc",
  page: 1,
  pageSize: 20,
};

// Lista de UFs brasileiros
export const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

// Municípios por UF (amostra para mock)
export const MUNICIPIOS_POR_UF: Record<string, string[]> = {
  PB: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras"],
  PE: ["Recife", "Olinda", "Jaboatão dos Guararapes", "Caruaru", "Petrolina", "Garanhuns"],
  SP: ["São Paulo", "Campinas", "Santos", "Ribeirão Preto", "São José dos Campos", "Sorocaba"],
  RJ: ["Rio de Janeiro", "Niterói", "Nova Iguaçu", "Petrópolis", "Volta Redonda", "Campos"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Montes Claros", "Ouro Preto"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Ilhéus", "Camaçari"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria"],
  PR: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel"],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "Chapecó", "Itajaí"],
};

// Cores para status
export const STATUS_CONFIG: Record<FornecedorStatus, { bg: string; text: string; label: string }> = {
  ATIVO: { bg: "bg-green-100", text: "text-green-700", label: "Ativo" },
  INATIVO: { bg: "bg-red-100", text: "text-red-700", label: "Inativo" },
};

// Cores para status de contrato
export const CONTRATO_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  EM_ANDAMENTO: { bg: "bg-blue-100", text: "text-blue-700", label: "Em Andamento" },
  CONCLUIDO: { bg: "bg-green-100", text: "text-green-700", label: "Concluído" },
  SUSPENSO: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Suspenso" },
  CANCELADO: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" },
};
