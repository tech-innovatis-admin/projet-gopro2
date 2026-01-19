// Mock data para organizações (parceiros e órgãos financiadores)
// Baseado na tabela organizations do banco de dados

export interface Organization {
  id: string;
  name: string;
  cnpj?: string;
  type: number; // 0=fundacao, 1=orgao_publico, 2=empresa, 3=parceira, 4=cliente
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export const MOCK_ORGANIZATIONS: Organization[] = [
  // Órgãos Financiadores (type: 1 = ORGAO_PUBLICO)
  {
    id: "org_001",
    name: "CNPq - Conselho Nacional de Desenvolvimento Científico e Tecnológico",
    cnpj: "00.000.000/0001-91",
    type: 1, // ORGAO_PUBLICO
    city: "Brasília",
    state: "DF",
  },
  {
    id: "org_002",
    name: "CAPES - Coordenação de Aperfeiçoamento de Pessoal de Nível Superior",
    cnpj: "00.000.000/0001-92",
    type: 1, // ORGAO_PUBLICO
    city: "Brasília",
    state: "DF",
  },
  {
    id: "org_003",
    name: "FINEP - Financiadora de Estudos e Projetos",
    cnpj: "00.000.000/0001-93",
    type: 1, // ORGAO_PUBLICO
    city: "Rio de Janeiro",
    state: "RJ",
  },
  {
    id: "org_004",
    name: "MEC - Ministério da Educação",
    cnpj: "00.000.000/0001-94",
    type: 1, // ORGAO_PUBLICO
    city: "Brasília",
    state: "DF",
  },
  {
    id: "org_005",
    name: "MCTI - Ministério da Ciência, Tecnologia e Inovações",
    cnpj: "00.000.000/0001-95",
    type: 1, // ORGAO_PUBLICO
    city: "Brasília",
    state: "DF",
  },
  {
    id: "org_006",
    name: "Prefeitura de São Paulo",
    cnpj: "00.000.000/0001-96",
    type: 1, // ORGAO_PUBLICO
    city: "São Paulo",
    state: "SP",
  },
  {
    id: "org_007",
    name: "Governo do Estado de São Paulo",
    cnpj: "00.000.000/0001-97",
    type: 1, // ORGAO_PUBLICO
    city: "São Paulo",
    state: "SP",
  },
  // Fundações (type: 0 = FUNDACAO) - podem ser parceiros ou financiadores
  {
    id: "org_008",
    name: "FAPTO - Fundação de Apoio à Pesquisa do Tocantins",
    cnpj: "00.000.000/0001-01",
    type: 0, // FUNDACAO
    city: "Palmas",
    state: "TO",
  },
  {
    id: "org_009",
    name: "FADEX - Fundação de Apoio ao Desenvolvimento",
    cnpj: "00.000.000/0001-02",
    type: 0, // FUNDACAO
    city: "Recife",
    state: "PE",
  },
  {
    id: "org_010",
    name: "Fundação de Apoio à Pesquisa",
    cnpj: "00.000.000/0001-03",
    type: 0, // FUNDACAO
    city: "São Paulo",
    state: "SP",
  },
  {
    id: "org_011",
    name: "Fundação Araucária",
    cnpj: "00.000.000/0001-04",
    type: 0, // FUNDACAO
    city: "Curitiba",
    state: "PR",
  },
  {
    id: "org_012",
    name: "Fundação UFRGS",
    cnpj: "00.000.000/0001-05",
    type: 0, // FUNDACAO
    city: "Porto Alegre",
    state: "RS",
  },
  {
    id: "org_013",
    name: "Fundação XYZ",
    cnpj: "00.000.000/0001-06",
    type: 0, // FUNDACAO
    city: "Belo Horizonte",
    state: "MG",
  },
  // IFES e Parceiros (type: 1 = ORGAO_PUBLICO para IFES, type: 3 = PARCEIRA)
  {
    id: "org_014",
    name: "IFMA - Instituto Federal do Maranhão",
    cnpj: "00.000.000/0001-07",
    type: 1, // ORGAO_PUBLICO (IFES)
    city: "São Luís",
    state: "MA",
  },
  {
    id: "org_015",
    name: "IFES-MG - Instituto Federal de Educação, Ciência e Tecnologia de Minas Gerais",
    cnpj: "00.000.000/0001-08",
    type: 1, // ORGAO_PUBLICO (IFES)
    city: "Belo Horizonte",
    state: "MG",
  },
  {
    id: "org_016",
    name: "Universidade Federal de São Paulo",
    cnpj: "00.000.000/0001-09",
    type: 1, // ORGAO_PUBLICO
    city: "São Paulo",
    state: "SP",
  },
  {
    id: "org_017",
    name: "Universidade Federal do Rio Grande do Sul",
    cnpj: "00.000.000/0001-10",
    type: 1, // ORGAO_PUBLICO
    city: "Porto Alegre",
    state: "RS",
  },
];

// Função helper para buscar organizações por tipo
export function getOrganizationsByType(type?: number): Organization[] {
  if (type === undefined) return MOCK_ORGANIZATIONS;
  return MOCK_ORGANIZATIONS.filter((org) => org.type === type);
}

// Função helper para buscar organização por ID
export function getOrganizationById(id: string): Organization | undefined {
  return MOCK_ORGANIZATIONS.find((org) => org.id === id);
}

// Função helper para obter organizações que podem ser financiadores
// (Órgãos Públicos e Fundações)
export function getOrganizationsFinanciadoras(): Organization[] {
  return MOCK_ORGANIZATIONS.filter((org) => org.type === 1 || org.type === 0);
}

// Função helper para obter organizações que podem ser parceiros
// (Fundações e Parceiras)
export function getOrganizationsParceiras(): Organization[] {
  return MOCK_ORGANIZATIONS.filter((org) => org.type === 0 || org.type === 3 || org.type === 1);
}
