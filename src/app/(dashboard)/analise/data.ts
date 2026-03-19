// =============================================================================
// DADOS MOCKADOS PARA O DASHBOARD DE ANÁLISE EXECUTIVO
// =============================================================================

// -----------------------------------------------------------------------------
// TIPOS E INTERFACES
// -----------------------------------------------------------------------------

export interface ProjectStatus {
  code: 0 | 1 | 2 | 3 | 4;
  label: string;
}

export const PROJECT_STATUS: Record<number, ProjectStatus> = {
  0: { code: 0, label: "Pré-projeto" },
  1: { code: 1, label: "Execução" },
  2: { code: 2, label: "Finalizado" },
  3: { code: 3, label: "Suspenso" },
  4: { code: 4, label: "Planejamento" },
};

export interface Project {
  id: string;
  name: string;
  code: string;
  status: number;
  areaSegmento: string;
  tipo: "projeto" | "produto";
  contractValue: number;
  totalReceived: number;
  totalExpenses: number;
  saldo: number;
  plannedBudget: number;
  executedBudget: number;
  coordinatorName: string;
  partnerPrimaryName: string;
  clientPrimaryName: string;
  daysOverdue: number;
  isOverdue: boolean;
  isBudgetOverrun: boolean;
  riskScore: number;
  team: number;
  state: string;
  city: string;
}

export interface Partner {
  id: string;
  name: string;
  tradeName: string;
  projectCount: number;
  totalValue: number;
  avgCycleDays: number;
}

export interface Client {
  id: string;
  name: string;
  sigla: string;
  projectCount: number;
  totalValue: number;
}

export interface BudgetCategory {
  id: string;
  code: string;
  name: string;
  plannedAmount: number;
  executedAmount: number;
}

export interface BudgetTransfer {
  id: string;
  projectName: string;
  fromItemName: string;
  toItemName: string;
  amount: number;
  transferDate: string;
  status: 0 | 1 | 2;
  reason: string;
}

export interface SupplierEvaluation {
  id: string;
  supplierName: string;
  projectName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  evaluatedAt: string;
  evaluatorName: string;
}

// -----------------------------------------------------------------------------
// MÉTRICAS AGREGADAS
// -----------------------------------------------------------------------------

export const mockMetrics = {
  // Página 1 - Resumo Executivo
  totalProjects: 47,
  activeProjects: 32,
  completedProjects: 12,
  suspendedProjects: 3,
  
  percentAtrasados: 18.7,
  percentEstouro: 9.4,
  
  caixaAtual: 4850000,
  
  contratosVencer90Dias: {
    quantidade: 5,
    valor: 8200000,
  },
  
  iee: 76.8,
  
  // Página 2 - Portfólio
  valorExecutado: 28500000,
  valorAtivos: 42000000,
  valorConcluidos: 15800000,
  
  taxaSaidaMensal: 2.3,
  valorMedioProduto: 1250000,
  valorMedioProjeto: 3800000,
  
  wip: 32,
  tempoMedioExecucao: 14.5,
  
  // Página 3 - Financeiro
  valorTotalContratos: 58300000,
  totalReceived: 38500000,
  totalExpenses: 33650000,
  saldoTotal: 4850000,
  
  execucaoOrcamentaria: 72.4,
  desvioMedioOrcamento: 8.2,
  percentEstouroOrcamento: 9.4,
  
  burnRateMensal: 2800000,
  runwayMeses: 1.7,
  acuraciaRecebimento: 89.5,
  
  // Página 4 - Orçamento
  percentRubricasAcima100: 12.5,
  valorRemanejado: 2450000,
  taxaRemanejamento: 4.2,
  remanejamentosPendentes: {
    quantidade: 8,
    valor: 890000,
  },
  
  // Página 5 - Trilha/SLA
  leadTimeMedio: 45,
  cumprimentoSLA: 78.5,
  tempoMedioPorEtapa: 8.2,
  tempoEsperaEntreEtapas: 2.1,
  etapaGargalo: "Análise Jurídica",
  
  backlogAtividades: 23,
  atividadesVencidas: 7,
  
  // Página 6 - Parceiros/Clientes
  hhiRegional: 0.35,
  hhiCliente: 0.28,
  notaMediaFornecedores: 4.2,
  
  monthlyGrowth: 12.5,
  avgProjectDuration: 18,
  totalPeople: 156,
  activePeople: 89,
};

// -----------------------------------------------------------------------------
// DADOS FINANCEIROS MENSAIS
// -----------------------------------------------------------------------------

export const mockMonthlyFinancials = [
  { month: "Jan/24", label: "Jan", received: 2800000, spent: 2400000 },
  { month: "Fev/24", label: "Fev", received: 3200000, spent: 2650000 },
  { month: "Mar/24", label: "Mar", received: 2100000, spent: 2900000 },
  { month: "Abr/24", label: "Abr", received: 3800000, spent: 2750000 },
  { month: "Mai/24", label: "Mai", received: 2500000, spent: 2850000 },
  { month: "Jun/24", label: "Jun", received: 4100000, spent: 3100000 },
  { month: "Jul/24", label: "Jul", received: 2900000, spent: 2950000 },
  { month: "Ago/24", label: "Ago", received: 3400000, spent: 3200000 },
  { month: "Set/24", label: "Set", received: 3100000, spent: 2800000 },
  { month: "Out/24", label: "Out", received: 3600000, spent: 3050000 },
  { month: "Nov/24", label: "Nov", received: 2800000, spent: 2700000 },
  { month: "Dez/24", label: "Dez", received: 4200000, spent: 3300000 },
];

// -----------------------------------------------------------------------------
// TABELA "ATENÇÃO AGORA" - TOP 10 PROJETOS CRÍTICOS
// -----------------------------------------------------------------------------

export const mockAttentionProjects = [
  { id: "4", projeto: "Modernização da Rede de Ensino", code: "MRE-2023", status: "Atrasado", diasAtraso: 45, execucaoFinanceira: 82.2, saldo: 20000, diasVencimento: -45, riskScore: 78 },
  { id: "2", projeto: "Plataforma de Inovação Tecnológica", code: "PIT-2024", status: "Estouro", diasAtraso: 0, execucaoFinanceira: 109.7, saldo: -300000, diasVencimento: 365, riskScore: 65 },
  { id: "8", projeto: "Sistema de Monitoramento Ambiental", code: "SMA-2023", status: "Estouro", diasAtraso: 0, execucaoFinanceira: 108.3, saldo: -200000, diasVencimento: 210, riskScore: 55 },
  { id: "15", projeto: "Modernização Portuária", code: "MPO-2023", status: "Atenção", diasAtraso: 0, execucaoFinanceira: 45.2, saldo: 3200000, diasVencimento: 85, riskScore: 42 },
  { id: "7", projeto: "Infraestrutura de Data Center", code: "IDC-2024", status: "No prazo", diasAtraso: 0, execucaoFinanceira: 31.7, saldo: 700000, diasVencimento: 720, riskScore: 30 },
  { id: "1", projeto: "Sistema de Gestão Educacional", code: "SGE-2024", status: "No prazo", diasAtraso: 0, execucaoFinanceira: 66.0, saldo: 150000, diasVencimento: 180, riskScore: 25 },
  { id: "5", projeto: "Programa de Capacitação Docente", code: "PCD-2024", status: "No prazo", diasAtraso: 0, execucaoFinanceira: 61.0, saldo: 70000, diasVencimento: 30, riskScore: 20 },
  { id: "3", projeto: "Centro de Pesquisa em Biotecnologia", code: "CPB-2024", status: "Planejamento", diasAtraso: 0, execucaoFinanceira: 5.3, saldo: 1550000, diasVencimento: 800, riskScore: 15 },
  { id: "9", projeto: "Plataforma de Telemedicina", code: "PTM-2024", status: "Pré-projeto", diasAtraso: 0, execucaoFinanceira: 4.3, saldo: 380000, diasVencimento: 520, riskScore: 10 },
  { id: "14", projeto: "Capacitação em IA", code: "CIA-2024", status: "Planejamento", diasAtraso: 0, execucaoFinanceira: 2.0, saldo: 820000, diasVencimento: 450, riskScore: 8 },
];

// -----------------------------------------------------------------------------
// DADOS POR ÁREA/SEGMENTO
// -----------------------------------------------------------------------------

export const mockByArea = [
  { area: "Tecnologia", quantidade: 12, valor: 22800000, percentual: 39.1 },
  { area: "Educação", quantidade: 15, valor: 18500000, percentual: 31.7 },
  { area: "Infraestrutura", quantidade: 5, valor: 18000000, percentual: 30.9 },
  { area: "Saúde", quantidade: 8, valor: 14500000, percentual: 24.9 },
  { area: "Meio Ambiente", quantidade: 3, valor: 4200000, percentual: 7.2 },
  { area: "Agricultura", quantidade: 4, valor: 2800000, percentual: 4.8 },
];

// -----------------------------------------------------------------------------
// RUBRICAS ORÇAMENTÁRIAS
// -----------------------------------------------------------------------------

export const mockBudgetCategories: BudgetCategory[] = [
  { id: "1", code: "PESSOAL", name: "Pessoal e Bolsas", plannedAmount: 18500000, executedAmount: 14200000 },
  { id: "2", code: "EQUIPAMENTOS", name: "Equipamentos", plannedAmount: 12000000, executedAmount: 10800000 },
  { id: "3", code: "SERVICOS", name: "Serviços de Terceiros", plannedAmount: 8500000, executedAmount: 9200000 },
  { id: "4", code: "MATERIAL", name: "Material de Consumo", plannedAmount: 4200000, executedAmount: 3850000 },
  { id: "5", code: "VIAGENS", name: "Diárias e Passagens", plannedAmount: 2800000, executedAmount: 2100000 },
  { id: "6", code: "OBRAS", name: "Obras e Instalações", plannedAmount: 6500000, executedAmount: 4500000 },
  { id: "7", code: "OUTROS", name: "Outros Custos", plannedAmount: 1500000, executedAmount: 1400000 },
];

// -----------------------------------------------------------------------------
// REMANEJAMENTOS
// -----------------------------------------------------------------------------

export const mockBudgetTransfers: BudgetTransfer[] = [
  { id: "1", projectName: "SGE-2024", fromItemName: "Viagens", toItemName: "Equipamentos", amount: 150000, transferDate: "2024-03-15", status: 1, reason: "Redução de viagens por uso de videoconferência" },
  { id: "2", projectName: "PIT-2024", fromItemName: "Material", toItemName: "Serviços", amount: 280000, transferDate: "2024-04-20", status: 1, reason: "Terceirização de atividades" },
  { id: "3", projectName: "IDC-2024", fromItemName: "Pessoal", toItemName: "Obras", amount: 450000, transferDate: "2024-05-10", status: 0, reason: "Adequação de infraestrutura" },
  { id: "4", projectName: "SMA-2023", fromItemName: "Outros", toItemName: "Equipamentos", amount: 120000, transferDate: "2024-06-05", status: 1, reason: "Aquisição de sensores adicionais" },
  { id: "5", projectName: "PCD-2024", fromItemName: "Equipamentos", toItemName: "Pessoal", amount: 85000, transferDate: "2024-07-12", status: 0, reason: "Contratação de formadores" },
  { id: "6", projectName: "MRE-2023", fromItemName: "Viagens", toItemName: "Serviços", amount: 95000, transferDate: "2024-08-01", status: 2, reason: "Rejeitado - fora do escopo" },
  { id: "7", projectName: "MPO-2023", fromItemName: "Material", toItemName: "Obras", amount: 320000, transferDate: "2024-08-15", status: 0, reason: "Ampliação de escopo" },
  { id: "8", projectName: "IDC-2024", fromItemName: "Serviços", toItemName: "Equipamentos", amount: 180000, transferDate: "2024-09-01", status: 0, reason: "Upgrade de servidores" },
];

// -----------------------------------------------------------------------------
// SLA POR ETAPA
// -----------------------------------------------------------------------------

export const mockSLAComparison = [
  { label: "Análise Jurídica", sla: 15, actual: 22, isViolated: true },
  { label: "Análise Técnica", sla: 10, actual: 12, isViolated: true },
  { label: "Parecer Financeiro", sla: 7, actual: 6, isViolated: false },
  { label: "Aprovação Diretoria", sla: 5, actual: 4, isViolated: false },
  { label: "Recebimento", sla: 3, actual: 2, isViolated: false },
  { label: "Assinatura", sla: 3, actual: 3, isViolated: false },
  { label: "Públicação", sla: 2, actual: 1, isViolated: false },
];

// -----------------------------------------------------------------------------
// ATIVIDADES ABERTAS (BACKLOG)
// -----------------------------------------------------------------------------

export const mockOpenActivities = [
  { id: "1", projectName: "CPB-2024", stage: "Análise Jurídica", title: "Parecer jurídico pendente", status: "overdue", daysOpen: 20 },
  { id: "2", projectName: "PTM-2024", stage: "Análise Técnica", title: "Análise de escopo técnico", status: "in_progress", daysOpen: 12 },
  { id: "3", projectName: "CIA-2024", stage: "Análise Técnica", title: "Validação de requisitos", status: "pending", daysOpen: 8 },
  { id: "4", projectName: "IDC-2024", stage: "Parecer Financeiro", title: "Conferência orçamentária", status: "in_progress", daysOpen: 5 },
  { id: "5", projectName: "MPO-2023", stage: "Análise Jurídica", title: "Revisão contratual", status: "overdue", daysOpen: 15 },
];

// -----------------------------------------------------------------------------
// PARCEIROS
// -----------------------------------------------------------------------------

export const mockPartners: Partner[] = [
  { id: "p1", name: "Instituto Federal do Maranhão", tradeName: "IFMA", projectCount: 28, totalValue: 35200000, avgCycleDays: 42 },
  { id: "p2", name: "Fundação de Amparo à Pesquisa do MA", tradeName: "FAPEMA", projectCount: 12, totalValue: 14800000, avgCycleDays: 38 },
  { id: "p3", name: "Universidade Federal do Maranhão", tradeName: "UFMA", projectCount: 5, totalValue: 6500000, avgCycleDays: 55 },
  { id: "p4", name: "Instituto Estadual de Educação", tradeName: "IEMA", projectCount: 2, totalValue: 1800000, avgCycleDays: 35 },
];

// -----------------------------------------------------------------------------
// CLIENTES
// -----------------------------------------------------------------------------

export const mockClients: Client[] = [
  { id: "cl1", name: "Ministério da Educação", sigla: "MEC", projectCount: 12, totalValue: 18500000 },
  { id: "cl2", name: "Ministério da Ciência e Tecnologia", sigla: "MCTI", projectCount: 8, totalValue: 16200000 },
  { id: "cl3", name: "Ministério da Saúde", sigla: "MS", projectCount: 6, totalValue: 11300000 },
  { id: "cl4", name: "Governo do Estado do MA", sigla: "GOV-MA", projectCount: 6, totalValue: 8500000 },
  { id: "cl5", name: "Secretaria de Educação do MA", sigla: "SEDUC-MA", projectCount: 8, totalValue: 5800000 },
  { id: "cl6", name: "IBAMA", sigla: "IBAMA", projectCount: 3, totalValue: 3200000 },
  { id: "cl7", name: "Ministério da Agricultura", sigla: "MAPA", projectCount: 4, totalValue: 2800000 },
];

// -----------------------------------------------------------------------------
// DISTRIBUIÇÃO REGIONAL
// -----------------------------------------------------------------------------

export const mockByRegion = [
  { uf: "MA", cidade: "São Luís", quantidade: 22, valor: 32500000, percentual: 55.7 },
  { uf: "MA", cidade: "Imperatriz", quantidade: 6, valor: 8200000, percentual: 14.1 },
  { uf: "MA", cidade: "Caxias", quantidade: 4, valor: 9500000, percentual: 16.3 },
  { uf: "MA", cidade: "Açailândia", quantidade: 2, valor: 3400000, percentual: 5.8 },
  { uf: "MA", cidade: "Bacabal", quantidade: 3, valor: 3200000, percentual: 5.5 },
  { uf: "MA", cidade: "Timon", quantidade: 3, valor: 2800000, percentual: 4.8 },
  { uf: "MA", cidade: "Balsas", quantidade: 2, valor: 1200000, percentual: 2.1 },
  { uf: "MA", cidade: "Outros", quantidade: 5, valor: 2500000, percentual: 4.3 },
];

// -----------------------------------------------------------------------------
// AVALIAÇÕES DE FORNECEDORES
// -----------------------------------------------------------------------------

export const mockSupplierEvaluations: SupplierEvaluation[] = [
  { id: "1", supplierName: "TechSolutions LTDA", projectName: "SGE-2024", rating: 5, comment: "Excelente qualidade de entrega e pontualidade", evaluatedAt: "2024-01-20", evaluatorName: "Dr. Carlos Silva" },
  { id: "2", supplierName: "Construtora ABC", projectName: "IDC-2024", rating: 4, comment: "Bom trabalho, pequenos atrasos na documentação", evaluatedAt: "2024-01-18", evaluatorName: "Dra. Ana Martins" },
  { id: "3", supplierName: "DataServ Informática", projectName: "PIT-2024", rating: 3, comment: "Atendeu requisitos mínimos", evaluatedAt: "2024-01-15", evaluatorName: "Dra. Ana Martins" },
  { id: "4", supplierName: "LabEquip Científico", projectName: "CPB-2024", rating: 5, comment: "Equipamentos de alta qualidade, suporte excelente", evaluatedAt: "2024-01-12", evaluatorName: "Dr. Roberto Lima" },
  { id: "5", supplierName: "FormaTech Educação", projectName: "PCD-2024", rating: 4, comment: "Boa metodologia de ensino", evaluatedAt: "2024-01-10", evaluatorName: "Profa. Maria Santos" },
  { id: "6", supplierName: "AgroSoft Sistemas", projectName: "DSA-2023", rating: 5, comment: "Entrega antecipada e com qualidade", evaluatedAt: "2024-01-08", evaluatorName: "Dr. José Oliveira" },
  { id: "7", supplierName: "EnviroTech Sensores", projectName: "SMA-2023", rating: 2, comment: "Problemas de calibração e suporte lento", evaluatedAt: "2024-01-05", evaluatorName: "Dr. Paulo Mendes" },
  { id: "8", supplierName: "NetServices TI", projectName: "MRE-2023", rating: 4, comment: "Boa infraestrutura de rede instalada", evaluatedAt: "2024-01-02", evaluatorName: "Dr. Carlos Silva" },
];

export const mockSupplierRatings = [
  { supplier: "TechSolutions LTDA", avgRating: 5.0, count: 3 },
  { supplier: "LabEquip Científico", avgRating: 4.8, count: 2 },
  { supplier: "AgroSoft Sistemas", avgRating: 4.5, count: 2 },
  { supplier: "Construtora ABC", avgRating: 4.2, count: 4 },
  { supplier: "FormaTech Educação", avgRating: 4.0, count: 3 },
  { supplier: "NetServices TI", avgRating: 3.8, count: 3 },
  { supplier: "DataServ Informática", avgRating: 3.2, count: 2 },
  { supplier: "EnviroTech Sensores", avgRating: 2.5, count: 2 },
];

// -----------------------------------------------------------------------------
// CRONOGRAMA DE DESEMBOLSO
// -----------------------------------------------------------------------------

export const mockDisbursementSchedule = [
  { month: "Jan", expected: 3200000, received: 2800000 },
  { month: "Fev", expected: 2800000, received: 3200000 },
  { month: "Mar", expected: 3500000, received: 2100000 },
  { month: "Abr", expected: 2900000, received: 3800000 },
  { month: "Mai", expected: 3100000, received: 2500000 },
  { month: "Jun", expected: 4200000, received: 4100000 },
  { month: "Jul", expected: 3000000, received: 2900000 },
  { month: "Ago", expected: 3300000, received: 3400000 },
  { month: "Set", expected: 2800000, received: 3100000 },
  { month: "Out", expected: 3500000, received: 3600000 },
  { month: "Nov", expected: 2700000, received: 2800000 },
  { month: "Dez", expected: 4000000, received: 4200000 },
];

// -----------------------------------------------------------------------------
// STATUS DO PORTFÓLIO
// -----------------------------------------------------------------------------

export const mockStatusDistribution = [
  { label: "Execução", value: 32, color: "#22C55E" },
  { label: "Finalizado", value: 12, color: "#10B981" },
  { label: "Planejamento", value: 5, color: "#3B82F6" },
  { label: "Pré-projeto", value: 3, color: "#9CA3AF" },
  { label: "Suspenso", value: 3, color: "#EF4444" },
];

// -----------------------------------------------------------------------------
// THROUGHPUT
// -----------------------------------------------------------------------------

export const mockThroughput = [
  { month: "Jul", concluidos: 1 },
  { month: "Ago", concluidos: 0 },
  { month: "Set", concluidos: 2 },
  { month: "Out", concluidos: 1 },
  { month: "Nov", concluidos: 1 },
  { month: "Dez", concluidos: 0 },
  { month: "Jan", concluidos: 2 },
  { month: "Fev", concluidos: 1 },
  { month: "Mar", concluidos: 0 },
  { month: "Abr", concluidos: 1 },
  { month: "Mai", concluidos: 2 },
  { month: "Jun", concluidos: 1 },
];

// -----------------------------------------------------------------------------
// PROJETOS POR SALDO (TOP 10)
// -----------------------------------------------------------------------------

export const mockProjectsBySaldo = [
  { projeto: "Modernização Portuária", code: "MPO-2023", saldo: 3200000, burnRate: 450000 },
  { projeto: "Centro de Pesquisa em Biotecnologia", code: "CPB-2024", saldo: 1550000, burnRate: 75000 },
  { projeto: "Capacitação em IA", code: "CIA-2024", saldo: 820000, burnRate: 25000 },
  { projeto: "Infraestrutura de Data Center", code: "IDC-2024", saldo: 700000, burnRate: 320000 },
  { projeto: "Plataforma de Telemedicina", code: "PTM-2024", saldo: 380000, burnRate: 40000 },
  { projeto: "Sistema de Gestão Educacional", code: "SGE-2024", saldo: 150000, burnRate: 138000 },
  { projeto: "Programa de Capacitação Docente", code: "PCD-2024", saldo: 70000, burnRate: 65000 },
  { projeto: "Modernização da Rede de Ensino", code: "MRE-2023", saldo: 20000, burnRate: 62000 },
  { projeto: "Sistema de Monitoramento Ambiental", code: "SMA-2023", saldo: -200000, burnRate: 163000 },
  { projeto: "Plataforma de Inovação Tecnológica", code: "PIT-2024", saldo: -300000, burnRate: 189000 },
];

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCurrencyCompact = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Labels das páginas
export const PAGE_LABELS = [
  "Resumo Executivo",
  "Portfólio",
  "Financeiro",
  "Orçamento",
  "Trilha/SLA",
  "Parceiros/Clientes",
];
