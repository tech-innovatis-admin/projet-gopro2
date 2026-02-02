// =============================================================================
// MOCK DATA PARA O MÓDULO DE PARCEIROS
// =============================================================================

import { type Parceiro, type ParceiroContratoVinculado } from "./types";

// =============================================================================
// DADOS MOCK DE PARCEIROS (IFES e Fundações)
// =============================================================================

export const MOCK_PARCEIROS: Parceiro[] = [
  // ===== IFES (Institutos Federais) =====
  {
    id: "parc_001",
    nome: "Instituto Federal do Maranhão",
    sigla: "IFMA",
    tipo: "IFES",
    cnpj: "10.735.145/0001-28",
    email: "reitoria@ifma.edu.br",
    telefone: "(98) 3411-5100",
    site: "https://portal.ifma.edu.br",
    uf: "MA",
    municipio: "São Luís",
    endereco: "Av. Getúlio Vargas, 04 - Monte Castelo",
    status: "ATIVO",
    contratosAtivos: 8,
    valorTotalContratos: 4500000,
    createdAt: "2023-01-15T10:00:00Z",
  },
  {
    id: "parc_002",
    nome: "Instituto Federal de Minas Gerais",
    sigla: "IFMG",
    tipo: "IFES",
    cnpj: "10.626.896/0001-72",
    email: "gabinete@ifmg.edu.br",
    telefone: "(31) 2513-5100",
    site: "https://www.ifmg.edu.br",
    uf: "MG",
    municipio: "Belo Horizonte",
    endereco: "Av. Mário Werneck, 2590 - Buritis",
    status: "ATIVO",
    contratosAtivos: 5,
    valorTotalContratos: 2800000,
    createdAt: "2023-02-20T14:30:00Z",
  },
  {
    id: "parc_003",
    nome: "Instituto Federal de São Paulo",
    sigla: "IFSP",
    tipo: "IFES",
    cnpj: "10.882.594/0001-65",
    email: "gab@ifsp.edu.br",
    telefone: "(11) 3775-4500",
    site: "https://www.ifsp.edu.br",
    uf: "SP",
    municipio: "São Paulo",
    endereco: "Rua Pedro Vicente, 625 - Canindé",
    status: "ATIVO",
    contratosAtivos: 12,
    valorTotalContratos: 7200000,
    createdAt: "2022-11-10T09:15:00Z",
  },
  {
    id: "parc_004",
    nome: "Instituto Federal do Rio Grande do Sul",
    sigla: "IFRS",
    tipo: "IFES",
    cnpj: "10.637.926/0001-46",
    email: "gabinete@ifrs.edu.br",
    telefone: "(51) 3930-6000",
    site: "https://ifrs.edu.br",
    uf: "RS",
    municipio: "Bento Gonçalves",
    endereco: "Rua General Osório, 348 - Centro",
    status: "ATIVO",
    contratosAtivos: 6,
    valorTotalContratos: 3100000,
    createdAt: "2023-03-05T11:00:00Z",
  },
  {
    id: "parc_005",
    nome: "Instituto Federal de Pernambuco",
    sigla: "IFPE",
    tipo: "IFES",
    cnpj: "10.767.239/0001-45",
    email: "reitoria@ifpe.edu.br",
    telefone: "(81) 2125-1600",
    site: "https://portal.ifpe.edu.br",
    uf: "PE",
    municipio: "Recife",
    endereco: "Av. Prof. Luiz Freire, 500 - Curado",
    status: "ATIVO",
    contratosAtivos: 4,
    valorTotalContratos: 1950000,
    createdAt: "2023-04-12T08:45:00Z",
  },
  {
    id: "parc_006",
    nome: "Instituto Federal da Paraíba",
    sigla: "IFPB",
    tipo: "IFES",
    cnpj: "10.783.898/0001-75",
    email: "reitoria@ifpb.edu.br",
    telefone: "(83) 3612-9700",
    site: "https://www.ifpb.edu.br",
    uf: "PB",
    municipio: "João Pessoa",
    endereco: "Av. 1º de Maio, 720 - Jaguaribe",
    status: "ATIVO",
    contratosAtivos: 7,
    valorTotalContratos: 3800000,
    createdAt: "2022-08-20T16:00:00Z",
  },
  {
    id: "parc_007",
    nome: "Instituto Federal do Ceará",
    sigla: "IFCE",
    tipo: "IFES",
    cnpj: "10.744.098/0001-45",
    email: "gabinete@ifce.edu.br",
    telefone: "(85) 3401-2400",
    site: "https://ifce.edu.br",
    uf: "CE",
    municipio: "Fortaleza",
    endereco: "Av. 13 de Maio, 2081 - Benfica",
    status: "ATIVO",
    contratosAtivos: 9,
    valorTotalContratos: 5100000,
    createdAt: "2022-06-15T10:30:00Z",
  },
  {
    id: "parc_008",
    nome: "Instituto Federal de Santa Catarina",
    sigla: "IFSC",
    tipo: "IFES",
    cnpj: "11.402.887/0001-60",
    email: "gabinete.reitoria@ifsc.edu.br",
    telefone: "(48) 3877-9000",
    site: "https://www.ifsc.edu.br",
    uf: "SC",
    municipio: "Florianópolis",
    endereco: "Rua 14 de Julho, 150 - Coqueiros",
    status: "ATIVO",
    contratosAtivos: 3,
    valorTotalContratos: 1600000,
    createdAt: "2023-05-22T13:20:00Z",
  },
  {
    id: "parc_009",
    nome: "Instituto Federal do Rio de Janeiro",
    sigla: "IFRJ",
    tipo: "IFES",
    cnpj: "10.952.616/0001-50",
    email: "reitoria@ifrj.edu.br",
    telefone: "(21) 3293-6000",
    site: "https://portal.ifrj.edu.br",
    uf: "RJ",
    municipio: "Rio de Janeiro",
    endereco: "Rua Senador Furtado, 121 - Maracanã",
    status: "INATIVO",
    contratosAtivos: 0,
    valorTotalContratos: 800000,
    createdAt: "2022-10-08T14:00:00Z",
  },
  {
    id: "parc_010",
    nome: "Instituto Federal do Tocantins",
    sigla: "IFTO",
    tipo: "IFES",
    cnpj: "10.742.006/0001-98",
    email: "gabinete@ifto.edu.br",
    telefone: "(63) 3229-2200",
    site: "https://www.ifto.edu.br",
    uf: "TO",
    municipio: "Palmas",
    endereco: "Quadra 310 Sul, Lo 5 - Plano Diretor Sul",
    status: "ATIVO",
    contratosAtivos: 5,
    valorTotalContratos: 2400000,
    createdAt: "2023-07-10T09:00:00Z",
  },

  // ===== FUNDAÇÕES =====
  {
    id: "parc_011",
    nome: "Fundação de Apoio à Pesquisa do Tocantins",
    sigla: "FAPTO",
    tipo: "FUNDACAO",
    cnpj: "07.570.820/0001-13",
    email: "fapto@fapto.org.br",
    telefone: "(63) 3232-8400",
    site: "https://www.fapto.org.br",
    uf: "TO",
    municipio: "Palmas",
    endereco: "Quadra 108 Sul, Alameda 11",
    status: "ATIVO",
    contratosAtivos: 15,
    valorTotalContratos: 12000000,
    createdAt: "2021-03-15T10:00:00Z",
  },
  {
    id: "parc_012",
    nome: "Fundação de Apoio ao Desenvolvimento do Ensino, Ciência e Tecnologia",
    sigla: "FADECT",
    tipo: "FUNDACAO",
    cnpj: "07.902.442/0001-31",
    email: "contato@fadect.org.br",
    telefone: "(67) 3345-2600",
    site: "https://www.fadect.org.br",
    uf: "MS",
    municipio: "Campo Grande",
    endereco: "Rua 14 de Julho, 3169 - Centro",
    status: "ATIVO",
    contratosAtivos: 8,
    valorTotalContratos: 5600000,
    createdAt: "2022-01-20T14:30:00Z",
  },
  {
    id: "parc_013",
    nome: "Fundação Araucária de Apoio ao Desenvolvimento Científico e Tecnológico",
    sigla: "ARAUCÁRIA",
    tipo: "FUNDACAO",
    cnpj: "03.579.958/0001-07",
    email: "contato@fappr.pr.gov.br",
    telefone: "(41) 3219-0700",
    site: "https://www.fappr.pr.gov.br",
    uf: "PR",
    municipio: "Curitiba",
    endereco: "Rua Desembargador Westphalen, 3070",
    status: "ATIVO",
    contratosAtivos: 20,
    valorTotalContratos: 18500000,
    createdAt: "2020-06-10T09:00:00Z",
  },
  {
    id: "parc_014",
    nome: "Fundação de Apoio à Universidade Federal do Rio Grande do Sul",
    sigla: "FAURGS",
    tipo: "FUNDACAO",
    cnpj: "74.704.008/0001-75",
    email: "faurgs@faurgs.ufrgs.br",
    telefone: "(51) 3308-3990",
    site: "https://www.faurgs.ufrgs.br",
    uf: "RS",
    municipio: "Porto Alegre",
    endereco: "Rua Ramiro Barcelos, 2500 - Campus Central",
    status: "ATIVO",
    contratosAtivos: 12,
    valorTotalContratos: 9200000,
    createdAt: "2021-09-05T11:30:00Z",
  },
  {
    id: "parc_015",
    nome: "Fundação de Apoio ao Desenvolvimento da UFPE",
    sigla: "FADE",
    tipo: "FUNDACAO",
    cnpj: "11.735.586/0001-59",
    email: "fade@fade.org.br",
    telefone: "(81) 2126-8000",
    site: "https://www.fade.org.br",
    uf: "PE",
    municipio: "Recife",
    endereco: "Av. Prof. Moraes Rego, 1235 - Cidade Universitária",
    status: "ATIVO",
    contratosAtivos: 6,
    valorTotalContratos: 4100000,
    createdAt: "2022-04-18T08:00:00Z",
  },
  {
    id: "parc_016",
    nome: "Fundação de Apoio Institucional Rio Solimões",
    sigla: "UNISOL",
    tipo: "FUNDACAO",
    cnpj: "04.130.924/0001-37",
    email: "unisol@unisol.org.br",
    telefone: "(92) 3621-2300",
    site: "https://www.unisol.org.br",
    uf: "AM",
    municipio: "Manaus",
    endereco: "Av. General Rodrigo Octávio, 6200 - Coroado",
    status: "ATIVO",
    contratosAtivos: 4,
    valorTotalContratos: 2300000,
    createdAt: "2023-02-28T15:45:00Z",
  },
  {
    id: "parc_017",
    nome: "Fundação de Apoio à Pesquisa do Estado de São Paulo",
    sigla: "FAPESP",
    tipo: "FUNDACAO",
    cnpj: "43.828.151/0001-45",
    email: "fapesp@fapesp.br",
    telefone: "(11) 3838-4000",
    site: "https://fapesp.br",
    uf: "SP",
    municipio: "São Paulo",
    endereco: "Rua Pio XI, 1500 - Alto da Lapa",
    status: "ATIVO",
    contratosAtivos: 25,
    valorTotalContratos: 35000000,
    createdAt: "2019-01-10T10:00:00Z",
  },
  {
    id: "parc_018",
    nome: "Fundação de Amparo à Pesquisa do Estado de Minas Gerais",
    sigla: "FAPEMIG",
    tipo: "FUNDACAO",
    cnpj: "18.313.471/0001-07",
    email: "comunicacao@fapemig.br",
    telefone: "(31) 3280-2100",
    site: "https://fapemig.br",
    uf: "MG",
    municipio: "Belo Horizonte",
    endereco: "Av. José Cândido da Silveira, 1500 - Horto",
    status: "ATIVO",
    contratosAtivos: 18,
    valorTotalContratos: 22000000,
    createdAt: "2020-03-22T13:00:00Z",
  },
  {
    id: "parc_019",
    nome: "Fundação Carlos Chagas Filho de Amparo à Pesquisa",
    sigla: "FAPERJ",
    tipo: "FUNDACAO",
    cnpj: "34.029.977/0001-05",
    email: "faperj@faperj.br",
    telefone: "(21) 2334-0050",
    site: "https://www.faperj.br",
    uf: "RJ",
    municipio: "Rio de Janeiro",
    endereco: "Av. Erasmo Braga, 118 - Centro",
    status: "INATIVO",
    contratosAtivos: 0,
    valorTotalContratos: 15000000,
    createdAt: "2021-07-14T09:30:00Z",
  },
  {
    id: "parc_020",
    nome: "Fundação de Amparo à Pesquisa da Bahia",
    sigla: "FAPESB",
    tipo: "FUNDACAO",
    cnpj: "07.058.123/0001-00",
    email: "fapesb@fapesb.ba.gov.br",
    telefone: "(71) 3103-2700",
    site: "https://www.fapesb.ba.gov.br",
    uf: "BA",
    municipio: "Salvador",
    endereco: "Av. Luís Viana Filho, 3ª Av., 430 - CAB",
    status: "ATIVO",
    contratosAtivos: 10,
    valorTotalContratos: 8500000,
    createdAt: "2022-08-30T16:15:00Z",
  },
];

// =============================================================================
// DADOS MOCK DE CONTRATOS VINCULADOS (para detalhes do parceiro)
// =============================================================================

export const MOCK_CONTRATOS_PARCEIROS: Record<string, ParceiroContratoVinculado[]> = {
  parc_001: [
    { id: "cont_001", titulo: "Projeto de Extensão Tecnológica", status: "EM_ANDAMENTO", valor: 850000, dataInicio: "2024-01-15", dataFim: "2025-12-31" },
    { id: "cont_002", titulo: "Capacitação em TI para Docentes", status: "EM_ANDAMENTO", valor: 320000, dataInicio: "2024-03-01", dataFim: "2024-12-31" },
    { id: "cont_003", titulo: "Laboratório de Inovação", status: "CONCLUIDO", valor: 1200000, dataInicio: "2023-01-10", dataFim: "2024-06-30" },
  ],
  parc_011: [
    { id: "cont_010", titulo: "Gestão de Projetos de P&D", status: "EM_ANDAMENTO", valor: 2500000, dataInicio: "2023-06-01", dataFim: "2026-05-31" },
    { id: "cont_011", titulo: "Incubadora de Startups", status: "EM_ANDAMENTO", valor: 1800000, dataInicio: "2024-02-15", dataFim: "2027-02-14" },
  ],
  parc_017: [
    { id: "cont_020", titulo: "Programa PIPE - Fase 3", status: "EM_ANDAMENTO", valor: 5000000, dataInicio: "2023-01-01", dataFim: "2025-12-31" },
    { id: "cont_021", titulo: "Bolsas de Pesquisa FAPESP", status: "EM_ANDAMENTO", valor: 3500000, dataInicio: "2024-03-01", dataFim: "2026-02-28" },
  ],
};

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Retorna a quantidade de contratos de um parceiro
 */
export function getContratosCountByParceiro(parceiroId: string): number {
  return MOCK_CONTRATOS_PARCEIROS[parceiroId]?.length ?? 0;
}

/**
 * Retorna os contratos de um parceiro
 */
export function getContratosByParceiro(parceiroId: string): ParceiroContratoVinculado[] {
  return MOCK_CONTRATOS_PARCEIROS[parceiroId] ?? [];
}

/**
 * Retorna um parceiro pelo ID
 */
export function getParceiroById(parceiroId: string): Parceiro | undefined {
  return MOCK_PARCEIROS.find((p) => p.id === parceiroId);
}

/**
 * Retorna parceiros por tipo
 */
export function getParceirosByTipo(tipo: "IFES" | "FUNDACAO"): Parceiro[] {
  return MOCK_PARCEIROS.filter((p) => p.tipo === tipo);
}

/**
 * Formata valor em moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
