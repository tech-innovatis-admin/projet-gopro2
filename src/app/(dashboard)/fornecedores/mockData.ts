// =============================================================================
// MOCK DATA PARA O MÓDULO DE FORNECEDORES
// =============================================================================

import {
  type Fornecedor,
  type FornecedorContratoVinculado,
  type FornecedorCategoria,
  type FornecedorServico,
} from "./types";

// =============================================================================
// DADOS MOCK DE FORNECEDORES (50+ registros para validar filtros)
// =============================================================================

export const MOCK_FORNECEDORES: Fornecedor[] = [
  // ===== PARAÍBA =====
  {
    id: "forn_001",
    nome: "TechSolutions PB",
    razaoSocial: "TechSolutions Tecnologia LTDA",
    cnpj: "12.345.678/0001-01",
    email: "contato@techsolutions.com.br",
    telefone: "(83) 3333-1111",
    uf: "PB",
    municipio: "João Pessoa",
    endereco: "Av. Epitácio Pessoa, 1500",
    categorias: ["TECNOLOGIA", "CONSULTORIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "CONSULTORIA_TECNICA"],
    status: "ATIVO",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "forn_002",
    nome: "LabAnalise Nordeste",
    razaoSocial: "Laboratório de Análises Nordeste LTDA",
    cnpj: "23.456.789/0001-02",
    email: "contato@labanalise.com.br",
    telefone: "(83) 3333-2222",
    uf: "PB",
    municipio: "Campina Grande",
    endereco: "Rua Floriano Peixoto, 200",
    categorias: ["LABORATORIO"],
    servicos: ["ANALISES_LABORATORIAIS", "PESQUISA"],
    status: "ATIVO",
    createdAt: "2024-02-10T14:30:00Z",
  },
  {
    id: "forn_003",
    nome: "Consultoria Borborema",
    razaoSocial: "Borborema Consultoria e Assessoria EIRELI",
    cnpj: "34.567.890/0001-03",
    email: "atendimento@borborema.com",
    telefone: "(83) 3333-3333",
    uf: "PB",
    municipio: "Campina Grande",
    endereco: "Av. Almirante Barroso, 800",
    categorias: ["CONSULTORIA"],
    servicos: ["CONSULTORIA_TECNICA", "ASSESSORIA_JURIDICA", "AUDITORIA"],
    status: "ATIVO",
    createdAt: "2024-03-05T09:15:00Z",
  },
  {
    id: "forn_004",
    nome: "Capacita PB",
    razaoSocial: "Instituto Capacita Paraíba ME",
    cnpj: "45.678.901/0001-04",
    email: "cursos@capacitapb.com.br",
    telefone: "(83) 3333-4444",
    uf: "PB",
    municipio: "João Pessoa",
    endereco: "Rua das Trincheiras, 300",
    categorias: ["CAPACITACAO"],
    servicos: ["TREINAMENTO"],
    status: "ATIVO",
    createdAt: "2024-04-20T11:45:00Z",
  },
  {
    id: "forn_005",
    nome: "Equipar Nordeste",
    razaoSocial: "Equipar Comércio de Equipamentos LTDA",
    cnpj: "56.789.012/0001-05",
    email: "vendas@equiparnordeste.com",
    telefone: "(83) 3333-5555",
    uf: "PB",
    municipio: "Santa Rita",
    endereco: "Rodovia BR-230, km 15",
    categorias: ["EQUIPAMENTOS"],
    servicos: ["MANUTENCAO_EQUIPAMENTOS"],
    status: "INATIVO",
    createdAt: "2023-08-10T16:00:00Z",
  },
  {
    id: "forn_006",
    nome: "LogiExpress Cariri",
    razaoSocial: "LogiExpress Transportes LTDA",
    cnpj: "67.890.123/0001-06",
    email: "contato@logiexpress.com.br",
    telefone: "(83) 3333-6666",
    uf: "PB",
    municipio: "Patos",
    endereco: "Av. Getúlio Vargas, 1000",
    categorias: ["TRANSPORTE"],
    servicos: ["LOGISTICA"],
    status: "ATIVO",
    createdAt: "2024-05-01T08:30:00Z",
  },

  // ===== PERNAMBUCO =====
  {
    id: "forn_007",
    nome: "Porto Digital Tech",
    razaoSocial: "Porto Digital Soluções Tecnológicas S.A.",
    cnpj: "78.901.234/0001-07",
    email: "comercial@portodigital.tech",
    telefone: "(81) 4444-1111",
    uf: "PE",
    municipio: "Recife",
    endereco: "Cais do Apolo, 222",
    categorias: ["TECNOLOGIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "MARKETING_DIGITAL"],
    status: "ATIVO",
    createdAt: "2024-01-20T09:00:00Z",
  },
  {
    id: "forn_008",
    nome: "Agreste Consultoria",
    razaoSocial: "Agreste Consultoria Empresarial LTDA",
    cnpj: "89.012.345/0001-08",
    email: "contato@agresteconsultoria.com.br",
    telefone: "(81) 4444-2222",
    uf: "PE",
    municipio: "Caruaru",
    endereco: "Rua Leão Dourado, 150",
    categorias: ["CONSULTORIA", "CAPACITACAO"],
    servicos: ["CONSULTORIA_TECNICA", "TREINAMENTO", "AUDITORIA"],
    status: "ATIVO",
    createdAt: "2024-02-15T10:30:00Z",
  },
  {
    id: "forn_009",
    nome: "Olinda Comunicação",
    razaoSocial: "Olinda Comunicação Visual EIRELI",
    cnpj: "90.123.456/0001-09",
    email: "design@olindacom.com.br",
    telefone: "(81) 4444-3333",
    uf: "PE",
    municipio: "Olinda",
    endereco: "Alto da Sé, 45",
    categorias: ["COMUNICACAO"],
    servicos: ["DESIGN_GRAFICO", "MARKETING_DIGITAL"],
    status: "ATIVO",
    createdAt: "2024-03-10T14:00:00Z",
  },
  {
    id: "forn_010",
    nome: "São Francisco Labs",
    razaoSocial: "Laboratório São Francisco LTDA",
    cnpj: "01.234.567/0001-10",
    email: "lab@sfranciscolabs.com.br",
    telefone: "(87) 4444-4444",
    uf: "PE",
    municipio: "Petrolina",
    endereco: "Av. das Nações, 800",
    categorias: ["LABORATORIO"],
    servicos: ["ANALISES_LABORATORIAIS", "PESQUISA"],
    status: "ATIVO",
    createdAt: "2024-04-05T11:15:00Z",
  },
  {
    id: "forn_011",
    nome: "Infra PE Construções",
    razaoSocial: "Infra PE Engenharia e Construções LTDA",
    cnpj: "12.345.678/0001-11",
    email: "obras@infrape.com.br",
    telefone: "(81) 4444-5555",
    uf: "PE",
    municipio: "Jaboatão dos Guararapes",
    endereco: "Av. Barreto de Menezes, 500",
    categorias: ["INFRAESTRUTURA"],
    servicos: ["MANUTENCAO_EQUIPAMENTOS"],
    status: "INATIVO",
    createdAt: "2023-06-20T15:45:00Z",
  },

  // ===== SÃO PAULO =====
  {
    id: "forn_012",
    nome: "SP Tech Solutions",
    razaoSocial: "São Paulo Tech Solutions S.A.",
    cnpj: "23.456.789/0001-12",
    email: "contato@sptechsolutions.com.br",
    telefone: "(11) 5555-1111",
    uf: "SP",
    municipio: "São Paulo",
    endereco: "Av. Paulista, 1500",
    categorias: ["TECNOLOGIA", "CONSULTORIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "CONSULTORIA_TECNICA", "AUDITORIA"],
    status: "ATIVO",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "forn_013",
    nome: "Campinas Eventos",
    razaoSocial: "Campinas Eventos e Produções LTDA",
    cnpj: "34.567.890/0001-13",
    email: "eventos@campinaseventos.com.br",
    telefone: "(19) 5555-2222",
    uf: "SP",
    municipio: "Campinas",
    endereco: "Rua José Paulino, 300",
    categorias: ["COMUNICACAO", "SERVICOS_GERAIS"],
    servicos: ["EVENTOS", "MARKETING_DIGITAL"],
    status: "ATIVO",
    createdAt: "2024-02-25T13:30:00Z",
  },
  {
    id: "forn_014",
    nome: "Santos Logística",
    razaoSocial: "Santos Logística e Transporte LTDA",
    cnpj: "45.678.901/0001-14",
    email: "operações@santoslog.com.br",
    telefone: "(13) 5555-3333",
    uf: "SP",
    municipio: "Santos",
    endereco: "Porto de Santos, Armazém 12",
    categorias: ["TRANSPORTE"],
    servicos: ["LOGISTICA"],
    status: "ATIVO",
    createdAt: "2024-03-15T09:45:00Z",
  },
  {
    id: "forn_015",
    nome: "Vale do Paraíba Labs",
    razaoSocial: "Laboratórios Vale do Paraíba S.A.",
    cnpj: "56.789.012/0001-15",
    email: "contato@vpblabs.com.br",
    telefone: "(12) 5555-4444",
    uf: "SP",
    municipio: "São José dos Campos",
    endereco: "Av. Dr. João Batista, 1200",
    categorias: ["LABORATORIO", "TECNOLOGIA"],
    servicos: ["ANALISES_LABORATORIAIS", "PESQUISA", "DESENVOLVIMENTO_SOFTWARE"],
    status: "ATIVO",
    createdAt: "2024-04-10T16:20:00Z",
  },
  {
    id: "forn_016",
    nome: "Ribeirão Contábil",
    razaoSocial: "Ribeirão Preto Contabilidade LTDA",
    cnpj: "67.890.123/0001-16",
    email: "contabil@ribeiraocontabil.com.br",
    telefone: "(16) 5555-5555",
    uf: "SP",
    municipio: "Ribeirão Preto",
    endereco: "Rua Lafaiete, 450",
    categorias: ["SERVICOS_GERAIS"],
    servicos: ["CONTABILIDADE", "ASSESSORIA_JURIDICA"],
    status: "ATIVO",
    createdAt: "2024-05-05T10:00:00Z",
  },
  {
    id: "forn_017",
    nome: "Sorocaba Equipamentos",
    razaoSocial: "Sorocaba Equipamentos Industriais LTDA",
    cnpj: "78.901.234/0001-17",
    email: "vendas@sorocabaequip.com.br",
    telefone: "(15) 5555-6666",
    uf: "SP",
    municipio: "Sorocaba",
    endereco: "Rod. Raposo Tavares, km 100",
    categorias: ["EQUIPAMENTOS"],
    servicos: ["MANUTENCAO_EQUIPAMENTOS"],
    status: "INATIVO",
    createdAt: "2023-09-15T14:30:00Z",
  },

  // ===== RIO DE JANEIRO =====
  {
    id: "forn_018",
    nome: "RJ Tech Hub",
    razaoSocial: "RJ Tech Hub Inovação S.A.",
    cnpj: "89.012.345/0001-18",
    email: "contato@rjtechhub.com.br",
    telefone: "(21) 6666-1111",
    uf: "RJ",
    municipio: "Rio de Janeiro",
    endereco: "Av. Rio Branco, 100",
    categorias: ["TECNOLOGIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "CONSULTORIA_TECNICA"],
    status: "ATIVO",
    createdAt: "2024-01-25T09:30:00Z",
  },
  {
    id: "forn_019",
    nome: "Niterói Traduções",
    razaoSocial: "Niterói Traduções e Interpretações LTDA",
    cnpj: "90.123.456/0001-19",
    email: "traducoes@niteroitrad.com.br",
    telefone: "(21) 6666-2222",
    uf: "RJ",
    municipio: "Niterói",
    endereco: "Rua da Conceição, 80",
    categorias: ["SERVICOS_GERAIS"],
    servicos: ["TRADUCAO"],
    status: "ATIVO",
    createdAt: "2024-02-20T11:00:00Z",
  },
  {
    id: "forn_020",
    nome: "Petrópolis Capacitação",
    razaoSocial: "Instituto de Capacitação Petrópolis ME",
    cnpj: "01.234.567/0001-20",
    email: "cursos@petrocap.com.br",
    telefone: "(24) 6666-3333",
    uf: "RJ",
    municipio: "Petrópolis",
    endereco: "Av. Koeller, 300",
    categorias: ["CAPACITACAO"],
    servicos: ["TREINAMENTO"],
    status: "ATIVO",
    createdAt: "2024-03-25T14:45:00Z",
  },
  {
    id: "forn_021",
    nome: "Volta Redonda Industrial",
    razaoSocial: "Volta Redonda Serviços Industriais LTDA",
    cnpj: "12.345.678/0001-21",
    email: "industrial@vrservicos.com.br",
    telefone: "(24) 6666-4444",
    uf: "RJ",
    municipio: "Volta Redonda",
    endereco: "Av. dos Trabalhadores, 1500",
    categorias: ["INFRAESTRUTURA", "EQUIPAMENTOS"],
    servicos: ["MANUTENCAO_EQUIPAMENTOS"],
    status: "ATIVO",
    createdAt: "2024-04-15T08:15:00Z",
  },

  // ===== MINAS GERAIS =====
  {
    id: "forn_022",
    nome: "BH Consultoria",
    razaoSocial: "Belo Horizonte Consultoria Empresarial LTDA",
    cnpj: "23.456.789/0001-22",
    email: "contato@bhconsultoria.com.br",
    telefone: "(31) 7777-1111",
    uf: "MG",
    municipio: "Belo Horizonte",
    endereco: "Av. Afonso Pena, 2500",
    categorias: ["CONSULTORIA"],
    servicos: ["CONSULTORIA_TECNICA", "AUDITORIA"],
    status: "ATIVO",
    createdAt: "2024-01-30T10:15:00Z",
  },
  {
    id: "forn_023",
    nome: "Uberlândia Tech",
    razaoSocial: "Uberlândia Tecnologia e Inovação S.A.",
    cnpj: "34.567.890/0001-23",
    email: "tech@uberlandiatech.com.br",
    telefone: "(34) 7777-2222",
    uf: "MG",
    municipio: "Uberlândia",
    endereco: "Av. João Naves de Ávila, 1000",
    categorias: ["TECNOLOGIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "MARKETING_DIGITAL"],
    status: "ATIVO",
    createdAt: "2024-02-28T13:45:00Z",
  },
  {
    id: "forn_024",
    nome: "Triângulo Labs",
    razaoSocial: "Laboratório Triângulo Mineiro LTDA",
    cnpj: "45.678.901/0001-24",
    email: "lab@triangulolabs.com.br",
    telefone: "(34) 7777-3333",
    uf: "MG",
    municipio: "Uberlândia",
    endereco: "Rua Olegário Maciel, 800",
    categorias: ["LABORATORIO"],
    servicos: ["ANALISES_LABORATORIAIS", "PESQUISA"],
    status: "ATIVO",
    createdAt: "2024-03-30T09:30:00Z",
  },
  {
    id: "forn_025",
    nome: "Juiz de Fora Eventos",
    razaoSocial: "JF Eventos e Produções EIRELI",
    cnpj: "56.789.012/0001-25",
    email: "eventos@jfeventos.com.br",
    telefone: "(32) 7777-4444",
    uf: "MG",
    municipio: "Juiz de Fora",
    endereco: "Av. Rio Branco, 1200",
    categorias: ["COMUNICACAO"],
    servicos: ["EVENTOS", "DESIGN_GRAFICO"],
    status: "INATIVO",
    createdAt: "2023-07-10T11:20:00Z",
  },
  {
    id: "forn_026",
    nome: "Ouro Preto Patrimônio",
    razaoSocial: "Ouro Preto Restauração e Patrimônio LTDA",
    cnpj: "67.890.123/0001-26",
    email: "restauro@oppatrimonio.com.br",
    telefone: "(31) 7777-5555",
    uf: "MG",
    municipio: "Ouro Preto",
    endereco: "Praça Tiradentes, 20",
    categorias: ["INFRAESTRUTURA", "CONSULTORIA"],
    servicos: ["CONSULTORIA_TECNICA"],
    status: "ATIVO",
    createdAt: "2024-05-10T15:00:00Z",
  },

  // ===== BAHIA =====
  {
    id: "forn_027",
    nome: "Salvador Digital",
    razaoSocial: "Salvador Digital Soluções em TI LTDA",
    cnpj: "78.901.234/0001-27",
    email: "contato@salvadordigital.com.br",
    telefone: "(71) 8888-1111",
    uf: "BA",
    municipio: "Salvador",
    endereco: "Av. Tancredo Neves, 1500",
    categorias: ["TECNOLOGIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "CONSULTORIA_TECNICA"],
    status: "ATIVO",
    createdAt: "2024-02-05T08:45:00Z",
  },
  {
    id: "forn_028",
    nome: "Feira Capacita",
    razaoSocial: "Feira de Santana Capacitação LTDA",
    cnpj: "89.012.345/0001-28",
    email: "cursos@feiracapacita.com.br",
    telefone: "(75) 8888-2222",
    uf: "BA",
    municipio: "Feira de Santana",
    endereco: "Av. Getúlio Vargas, 2000",
    categorias: ["CAPACITACAO"],
    servicos: ["TREINAMENTO"],
    status: "ATIVO",
    createdAt: "2024-03-10T10:30:00Z",
  },
  {
    id: "forn_029",
    nome: "Conquista Jurídico",
    razaoSocial: "Vitória da Conquista Assessoria Jurídica LTDA",
    cnpj: "90.123.456/0001-29",
    email: "juridico@conquistajur.com.br",
    telefone: "(77) 8888-3333",
    uf: "BA",
    municipio: "Vitória da Conquista",
    endereco: "Praça Tancredo Neves, 100",
    categorias: ["SERVICOS_GERAIS"],
    servicos: ["ASSESSORIA_JURIDICA"],
    status: "ATIVO",
    createdAt: "2024-04-20T14:15:00Z",
  },
  {
    id: "forn_030",
    nome: "Ilhéus Labs",
    razaoSocial: "Laboratório Ilhéus LTDA",
    cnpj: "01.234.567/0001-30",
    email: "contato@ilheuslabs.com.br",
    telefone: "(73) 8888-4444",
    uf: "BA",
    municipio: "Ilhéus",
    endereco: "Av. Soares Lopes, 500",
    categorias: ["LABORATORIO"],
    servicos: ["ANALISES_LABORATORIAIS"],
    status: "INATIVO",
    createdAt: "2023-05-15T16:45:00Z",
  },

  // ===== RIO GRANDE DO SUL =====
  {
    id: "forn_031",
    nome: "POA Tech",
    razaoSocial: "Porto Alegre Tech Solutions LTDA",
    cnpj: "12.345.678/0001-31",
    email: "contato@poatech.com.br",
    telefone: "(51) 9999-1111",
    uf: "RS",
    municipio: "Porto Alegre",
    endereco: "Av. Borges de Medeiros, 800",
    categorias: ["TECNOLOGIA", "CONSULTORIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "CONSULTORIA_TECNICA"],
    status: "ATIVO",
    createdAt: "2024-01-18T09:00:00Z",
  },
  {
    id: "forn_032",
    nome: "Serra Gaúcha Vinhos",
    razaoSocial: "Serra Gaúcha Alimentação e Bebidas LTDA",
    cnpj: "23.456.789/0001-32",
    email: "contato@serragaucha.com.br",
    telefone: "(54) 9999-2222",
    uf: "RS",
    municipio: "Caxias do Sul",
    endereco: "Rua Sinimbu, 1500",
    categorias: ["ALIMENTACAO"],
    servicos: ["EVENTOS"],
    status: "ATIVO",
    createdAt: "2024-02-22T11:30:00Z",
  },
  {
    id: "forn_033",
    nome: "Pelotas Equipamentos",
    razaoSocial: "Pelotas Equipamentos Científicos LTDA",
    cnpj: "34.567.890/0001-33",
    email: "vendas@pelotasequip.com.br",
    telefone: "(53) 9999-3333",
    uf: "RS",
    municipio: "Pelotas",
    endereco: "Av. Bento Gonçalves, 600",
    categorias: ["EQUIPAMENTOS", "LABORATORIO"],
    servicos: ["MANUTENCAO_EQUIPAMENTOS", "ANALISES_LABORATORIAIS"],
    status: "ATIVO",
    createdAt: "2024-03-28T14:00:00Z",
  },

  // ===== PARANÁ =====
  {
    id: "forn_034",
    nome: "Curitiba Software",
    razaoSocial: "Curitiba Software House S.A.",
    cnpj: "45.678.901/0001-34",
    email: "dev@curitibasoftware.com.br",
    telefone: "(41) 1010-1111",
    uf: "PR",
    municipio: "Curitiba",
    endereco: "Rua XV de Novembro, 1000",
    categorias: ["TECNOLOGIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE"],
    status: "ATIVO",
    createdAt: "2024-01-22T08:30:00Z",
  },
  {
    id: "forn_035",
    nome: "Londrina Consultoria",
    razaoSocial: "Londrina Consultoria Empresarial LTDA",
    cnpj: "56.789.012/0001-35",
    email: "contato@londrinaconsult.com.br",
    telefone: "(43) 1010-2222",
    uf: "PR",
    municipio: "Londrina",
    endereco: "Av. Higienópolis, 500",
    categorias: ["CONSULTORIA"],
    servicos: ["CONSULTORIA_TECNICA", "CONTABILIDADE"],
    status: "ATIVO",
    createdAt: "2024-02-26T10:15:00Z",
  },
  {
    id: "forn_036",
    nome: "Maringá Labs",
    razaoSocial: "Laboratório Maringá LTDA",
    cnpj: "67.890.123/0001-36",
    email: "lab@maringalabs.com.br",
    telefone: "(44) 1010-3333",
    uf: "PR",
    municipio: "Maringá",
    endereco: "Av. Brasil, 3000",
    categorias: ["LABORATORIO"],
    servicos: ["ANALISES_LABORATORIAIS", "PESQUISA"],
    status: "ATIVO",
    createdAt: "2024-04-02T13:45:00Z",
  },

  // ===== CEARÁ =====
  {
    id: "forn_037",
    nome: "Fortaleza Tech",
    razaoSocial: "Fortaleza Tecnologia e Inovação S.A.",
    cnpj: "78.901.234/0001-37",
    email: "contato@fortalezatech.com.br",
    telefone: "(85) 1111-1111",
    uf: "CE",
    municipio: "Fortaleza",
    endereco: "Av. Beira Mar, 2500",
    categorias: ["TECNOLOGIA", "CONSULTORIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "CONSULTORIA_TECNICA"],
    status: "ATIVO",
    createdAt: "2024-02-08T09:30:00Z",
  },
  {
    id: "forn_038",
    nome: "Cariri Capacitação",
    razaoSocial: "Instituto Cariri de Capacitação ME",
    cnpj: "89.012.345/0001-38",
    email: "cursos@cariricapacita.com.br",
    telefone: "(88) 1111-2222",
    uf: "CE",
    municipio: "Juazeiro do Norte",
    endereco: "Rua São Pedro, 150",
    categorias: ["CAPACITACAO"],
    servicos: ["TREINAMENTO"],
    status: "ATIVO",
    createdAt: "2024-03-12T11:00:00Z",
  },
  {
    id: "forn_039",
    nome: "Sobral Comunicação",
    razaoSocial: "Sobral Comunicação Visual EIRELI",
    cnpj: "90.123.456/0001-39",
    email: "design@sobralcom.com.br",
    telefone: "(88) 1111-3333",
    uf: "CE",
    municipio: "Sobral",
    endereco: "Av. Dom José, 800",
    categorias: ["COMUNICACAO"],
    servicos: ["DESIGN_GRAFICO", "MARKETING_DIGITAL"],
    status: "INATIVO",
    createdAt: "2023-10-20T15:30:00Z",
  },

  // ===== SANTA CATARINA =====
  {
    id: "forn_040",
    nome: "Floripa Tech",
    razaoSocial: "Florianópolis Tech Hub S.A.",
    cnpj: "01.234.567/0001-40",
    email: "contato@floripatech.com.br",
    telefone: "(48) 1212-1111",
    uf: "SC",
    municipio: "Florianópolis",
    endereco: "Rod. SC-401, km 5",
    categorias: ["TECNOLOGIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "CONSULTORIA_TECNICA"],
    status: "ATIVO",
    createdAt: "2024-01-28T08:00:00Z",
  },
  {
    id: "forn_041",
    nome: "Joinville Industrial",
    razaoSocial: "Joinville Equipamentos Industriais LTDA",
    cnpj: "12.345.678/0001-41",
    email: "vendas@joinvilleind.com.br",
    telefone: "(47) 1212-2222",
    uf: "SC",
    municipio: "Joinville",
    endereco: "Rua Blumenau, 1200",
    categorias: ["EQUIPAMENTOS", "INFRAESTRUTURA"],
    servicos: ["MANUTENCAO_EQUIPAMENTOS"],
    status: "ATIVO",
    createdAt: "2024-02-18T10:45:00Z",
  },
  {
    id: "forn_042",
    nome: "Blumenau Têxtil",
    razaoSocial: "Blumenau Serviços Têxteis LTDA",
    cnpj: "23.456.789/0001-42",
    email: "contato@blumenautextil.com.br",
    telefone: "(47) 1212-3333",
    uf: "SC",
    municipio: "Blumenau",
    endereco: "Rua XV de Novembro, 500",
    categorias: ["SERVICOS_GERAIS"],
    servicos: ["LOGISTICA"],
    status: "ATIVO",
    createdAt: "2024-03-22T13:15:00Z",
  },

  // ===== MAIS FORNECEDORES PARA DIVERSIDADE =====
  {
    id: "forn_043",
    nome: "Natal Digital",
    razaoSocial: "Natal Digital Soluções LTDA",
    cnpj: "34.567.890/0001-43",
    email: "contato@nataldigital.com.br",
    telefone: "(84) 1313-1111",
    uf: "RN",
    municipio: "Natal",
    categorias: ["TECNOLOGIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE", "MARKETING_DIGITAL"],
    status: "ATIVO",
    createdAt: "2024-04-08T09:00:00Z",
  },
  {
    id: "forn_044",
    nome: "Aracaju Labs",
    razaoSocial: "Laboratório Aracaju LTDA",
    cnpj: "45.678.901/0001-44",
    email: "lab@aracajulabs.com.br",
    telefone: "(79) 1414-1111",
    uf: "SE",
    municipio: "Aracaju",
    categorias: ["LABORATORIO"],
    servicos: ["ANALISES_LABORATORIAIS", "PESQUISA"],
    status: "ATIVO",
    createdAt: "2024-04-12T11:30:00Z",
  },
  {
    id: "forn_045",
    nome: "Maceió Eventos",
    razaoSocial: "Maceió Eventos e Produções EIRELI",
    cnpj: "56.789.012/0001-45",
    email: "eventos@maceioev.com.br",
    telefone: "(82) 1515-1111",
    uf: "AL",
    municipio: "Maceió",
    categorias: ["COMUNICACAO"],
    servicos: ["EVENTOS", "DESIGN_GRAFICO"],
    status: "ATIVO",
    createdAt: "2024-04-18T14:00:00Z",
  },
  {
    id: "forn_046",
    nome: "Teresina Consultoria",
    razaoSocial: "Teresina Consultoria Empresarial LTDA",
    cnpj: "67.890.123/0001-46",
    email: "contato@teresinaconsult.com.br",
    telefone: "(86) 1616-1111",
    uf: "PI",
    municipio: "Teresina",
    categorias: ["CONSULTORIA"],
    servicos: ["CONSULTORIA_TECNICA", "AUDITORIA"],
    status: "ATIVO",
    createdAt: "2024-04-25T10:15:00Z",
  },
  {
    id: "forn_047",
    nome: "São Luís Tech",
    razaoSocial: "São Luís Tecnologia LTDA",
    cnpj: "78.901.234/0001-47",
    email: "tech@sltech.com.br",
    telefone: "(98) 1717-1111",
    uf: "MA",
    municipio: "São Luís",
    categorias: ["TECNOLOGIA"],
    servicos: ["DESENVOLVIMENTO_SOFTWARE"],
    status: "INATIVO",
    createdAt: "2023-11-10T15:45:00Z",
  },
  {
    id: "forn_048",
    nome: "Belém Labs",
    razaoSocial: "Laboratório Belém LTDA",
    cnpj: "89.012.345/0001-48",
    email: "lab@belemlabs.com.br",
    telefone: "(91) 1818-1111",
    uf: "PA",
    municipio: "Belém",
    categorias: ["LABORATORIO"],
    servicos: ["ANALISES_LABORATORIAIS", "PESQUISA"],
    status: "ATIVO",
    createdAt: "2024-05-02T08:30:00Z",
  },
  {
    id: "forn_049",
    nome: "Manaus Industrial",
    razaoSocial: "Manaus Equipamentos Industriais LTDA",
    cnpj: "90.123.456/0001-49",
    email: "vendas@manausind.com.br",
    telefone: "(92) 1919-1111",
    uf: "AM",
    municipio: "Manaus",
    categorias: ["EQUIPAMENTOS"],
    servicos: ["MANUTENCAO_EQUIPAMENTOS"],
    status: "ATIVO",
    createdAt: "2024-05-08T11:00:00Z",
  },
  {
    id: "forn_050",
    nome: "Goiânia Capacita",
    razaoSocial: "Instituto Goiânia Capacitação ME",
    cnpj: "01.234.567/0001-50",
    email: "cursos@goianiacapacita.com.br",
    telefone: "(62) 2020-1111",
    uf: "GO",
    municipio: "Goiânia",
    categorias: ["CAPACITACAO"],
    servicos: ["TREINAMENTO"],
    status: "ATIVO",
    createdAt: "2024-05-15T13:30:00Z",
  },
];

// =============================================================================
// DADOS MOCK DE CONTRATOS VINCULADOS POR FORNECEDOR
// =============================================================================

export const MOCK_CONTRATOS_POR_FORNECEDOR: Record<string, FornecedorContratoVinculado[]> = {
  forn_001: [
    {
      id: "cont_001",
      codigo: "CT-2024-001",
      titulo: "Desenvolvimento do Sistema de Gestão Acadêmica",
      status: "EM_ANDAMENTO",
      valorTotal: 450000,
      dataInicio: "2024-03-01",
      fornecedorId: "forn_001",
    },
    {
      id: "cont_002",
      codigo: "CT-2024-015",
      titulo: "Consultoria em Arquitetura de Software",
      status: "CONCLUIDO",
      valorTotal: 85000,
      dataInicio: "2024-01-15",
      dataFim: "2024-04-30",
      fornecedorId: "forn_001",
    },
  ],
  forn_002: [
    {
      id: "cont_003",
      codigo: "CT-2024-008",
      titulo: "Análises Laboratoriais para Projeto de Pesquisa",
      status: "EM_ANDAMENTO",
      valorTotal: 120000,
      dataInicio: "2024-04-01",
      fornecedorId: "forn_002",
    },
  ],
  forn_003: [
    {
      id: "cont_004",
      codigo: "CT-2023-042",
      titulo: "Auditoria de Processos Internos",
      status: "CONCLUIDO",
      valorTotal: 65000,
      dataInicio: "2023-10-01",
      dataFim: "2023-12-20",
      fornecedorId: "forn_003",
    },
    {
      id: "cont_005",
      codigo: "CT-2024-022",
      titulo: "Assessoria Jurídica Contínua",
      status: "EM_ANDAMENTO",
      valorTotal: 180000,
      dataInicio: "2024-02-01",
      fornecedorId: "forn_003",
    },
    {
      id: "cont_006",
      codigo: "CT-2024-035",
      titulo: "Consultoria em Governança Corporativa",
      status: "EM_ANDAMENTO",
      valorTotal: 95000,
      dataInicio: "2024-05-01",
      fornecedorId: "forn_003",
    },
  ],
  forn_007: [
    {
      id: "cont_007",
      codigo: "CT-2024-003",
      titulo: "Plataforma de E-commerce Institucional",
      status: "EM_ANDAMENTO",
      valorTotal: 320000,
      dataInicio: "2024-02-15",
      fornecedorId: "forn_007",
    },
  ],
  forn_012: [
    {
      id: "cont_008",
      codigo: "CT-2024-005",
      titulo: "Sistema de Business Intelligence",
      status: "EM_ANDAMENTO",
      valorTotal: 580000,
      dataInicio: "2024-03-10",
      fornecedorId: "forn_012",
    },
    {
      id: "cont_009",
      codigo: "CT-2023-055",
      titulo: "Migração de Infraestrutura para Cloud",
      status: "CONCLUIDO",
      valorTotal: 250000,
      dataInicio: "2023-08-01",
      dataFim: "2024-01-31",
      fornecedorId: "forn_012",
    },
  ],
  forn_018: [
    {
      id: "cont_010",
      codigo: "CT-2024-012",
      titulo: "App Mobile para Gestão de Projetos",
      status: "EM_ANDAMENTO",
      valorTotal: 280000,
      dataInicio: "2024-04-01",
      fornecedorId: "forn_018",
    },
  ],
  forn_022: [
    {
      id: "cont_011",
      codigo: "CT-2024-018",
      titulo: "Consultoria em Planejamento Estratégico",
      status: "EM_ANDAMENTO",
      valorTotal: 150000,
      dataInicio: "2024-03-15",
      fornecedorId: "forn_022",
    },
  ],
  forn_027: [
    {
      id: "cont_012",
      codigo: "CT-2024-025",
      titulo: "Portal de Transparência",
      status: "SUSPENSO",
      valorTotal: 180000,
      dataInicio: "2024-04-20",
      fornecedorId: "forn_027",
    },
  ],
  forn_031: [
    {
      id: "cont_013",
      codigo: "CT-2024-030",
      titulo: "Sistema de Gestão de Contratos",
      status: "EM_ANDAMENTO",
      valorTotal: 420000,
      dataInicio: "2024-05-01",
      fornecedorId: "forn_031",
    },
  ],
  forn_034: [
    {
      id: "cont_014",
      codigo: "CT-2024-028",
      titulo: "Automação de Processos RH",
      status: "EM_ANDAMENTO",
      valorTotal: 190000,
      dataInicio: "2024-04-15",
      fornecedorId: "forn_034",
      avaliacao: {
        nota: 4,
        comentario: "Bom desempenho até o momento, entregas no prazo",
        avaliadoPor: "Admin",
        dataAvaliacao: "2024-05-10",
      },
    },
    {
      id: "cont_015",
      codigo: "CT-2023-048",
      titulo: "Sistema de Ponto Eletrônico",
      status: "CONCLUIDO",
      valorTotal: 75000,
      dataInicio: "2023-09-01",
      dataFim: "2023-11-30",
      fornecedorId: "forn_034",
      avaliacao: {
        nota: 5,
        comentario: "Excelente trabalho, sistema entregue com qualidade superior",
        avaliadoPor: "Admin",
        dataAvaliacao: "2023-12-05",
      },
    },
  ],
  forn_037: [
    {
      id: "cont_016",
      codigo: "CT-2024-032",
      titulo: "Plataforma de Ensino à Distância",
      status: "EM_ANDAMENTO",
      valorTotal: 350000,
      dataInicio: "2024-05-10",
      fornecedorId: "forn_037",
    },
  ],
  forn_040: [
    {
      id: "cont_017",
      codigo: "CT-2024-020",
      titulo: "Sistema de Gestão Financeira",
      status: "EM_ANDAMENTO",
      valorTotal: 480000,
      dataInicio: "2024-03-20",
      fornecedorId: "forn_040",
    },
    {
      id: "cont_018",
      codigo: "CT-2024-038",
      titulo: "Integração de APIs Bancárias",
      status: "EM_ANDAMENTO",
      valorTotal: 120000,
      dataInicio: "2024-05-15",
      fornecedorId: "forn_040",
    },
  ],
};

// =============================================================================
// FUNÇÕES UTILITÁRIAS PARA MOCK
// =============================================================================

/**
 * Retorna contratos vinculados a um fornecedor
 */
export function getContratosByFornecedor(fornecedorId: string): FornecedorContratoVinculado[] {
  return MOCK_CONTRATOS_POR_FORNECEDOR[fornecedorId] || [];
}

/**
 * Retorna um fornecedor pelo ID
 */
export function getFornecedorById(id: string): Fornecedor | undefined {
  return MOCK_FORNECEDORES.find((f) => f.id === id);
}

/**
 * Retorna contagem de contratos por fornecedor
 */
export function getContratosCountByFornecedor(fornecedorId: string): number {
  return (MOCK_CONTRATOS_POR_FORNECEDOR[fornecedorId] || []).length;
}

/**
 * Retorna lista de municípios disponíveis para uma UF
 */
export function getMunicipiosByUF(uf: string): string[] {
  // Primeiro tenta pegar da lista pré-definida
  const predefinidos = MUNICIPIOS_POR_UF[uf] || [];
  
  // Depois adiciona municípios únicos dos fornecedores dessa UF
  const dosFornecedores = MOCK_FORNECEDORES
    .filter((f) => f.uf === uf)
    .map((f) => f.municipio);
  
  // Combina e remove duplicatas
  return [...new Set([...predefinidos, ...dosFornecedores])].sort();
}

/**
 * Retorna lista de todos os municípios únicos de todos os fornecedores
 */
export function getAllMunicipios(): string[] {
  const municipios = MOCK_FORNECEDORES.map((f) => f.municipio);
  return [...new Set(municipios)].sort();
}

// Importando constantes de tipos para uso no mock
import { MUNICIPIOS_POR_UF } from "./types";

// =============================================================================
// TIPOS PARA RUBRICAS E ITENS VINCULADOS A FORNECEDORES
// =============================================================================

export type SubitemRubrica = {
  id: string;
  empresaRh: string; // Pode conter CNPJ ou nome do fornecedor
  lancamentos: Record<string, { valor: number; dataPag: string } | undefined>;
};

export type ItemRubricaVinculado = {
  id: string;
  rubricaId: string;
  rubricaCodigo: string;
  rubricaNome: string;
  codigo?: string;
  descricao: string;
  quantidade: number;
  meses: number;
  valorUnitario: number;
  valorTotal: number;
  meta?: string;
  subitens?: SubitemRubrica[];
};

// =============================================================================
// DADOS MOCK DE RUBRICAS VINCULADAS AOS CONTRATOS/FORNECEDORES
// =============================================================================

/**
 * Mapeia contratoId -> lista de itens de rubricas vinculados a fornecedores
 * Os fornecedores são identificados pelo CNPJ ou nome no campo empresaRh dos subitens
 */
export const MOCK_RUBRICAS_POR_CONTRATO: Record<string, ItemRubricaVinculado[]> = {
  // Contrato CT-2024-001 (TechSolutions PB - forn_001)
  cont_001: [
    {
      id: 'rub-item-001',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.1',
      descricao: 'Desenvolvimento de Software',
      quantidade: 1,
      meses: 12,
      valorUnitario: 50000.00,
      valorTotal: 600000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-001',
          empresaRh: 'TechSolutions PB - 12.345.678/0001-01',
          lancamentos: {
            'parc-1': { valor: 100000, dataPag: '2025-03-15' },
            'parc-2': { valor: 150000, dataPag: '2025-06-15' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2024-003 (LabAnalise Nordeste - forn_002)
  cont_003: [
    {
      id: 'rub-item-002',
      rubricaId: '1',
      rubricaCodigo: 'MC',
      rubricaNome: 'Material de Consumo (33.90.30)',
      codigo: '3.1',
      descricao: 'Reagentes químicos para laboratório',
      quantidade: 50,
      meses: 12,
      valorUnitario: 150.00,
      valorTotal: 90000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-002',
          empresaRh: 'LabAnalise Nordeste - 23.456.789/0001-02',
          lancamentos: {
            'parc-1': { valor: 30000, dataPag: '2025-04-10' },
            'parc-2': { valor: 30000, dataPag: '2025-07-10' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2024-022 (Consultoria Borborema - forn_003)
  cont_005: [
    {
      id: 'rub-item-003',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.2',
      descricao: 'Consultoria Técnica',
      quantidade: 1,
      meses: 6,
      valorUnitario: 15000.00,
      valorTotal: 90000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-003',
          empresaRh: 'Consultoria Borborema - 34.567.890/0001-03',
          lancamentos: {
            'parc-1': { valor: 45000, dataPag: '2025-04-01' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2024-005 (SP Tech Solutions - forn_012)
  cont_008: [
    {
      id: 'rub-item-004',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.1',
      descricao: 'Desenvolvimento de Software',
      quantidade: 1,
      meses: 12,
      valorUnitario: 48000.00,
      valorTotal: 576000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-004',
          empresaRh: 'SP Tech Solutions - 23.456.789/0001-12',
          lancamentos: {
            'parc-1': { valor: 200000, dataPag: '2025-03-20' },
            'parc-2': { valor: 200000, dataPag: '2025-06-20' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2024-012 (RJ Tech Hub - forn_018)
  cont_010: [
    {
      id: 'rub-item-005',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.1',
      descricao: 'Desenvolvimento de Software',
      quantidade: 1,
      meses: 8,
      valorUnitario: 35000.00,
      valorTotal: 280000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-005',
          empresaRh: 'RJ Tech Hub - 89.012.345/0001-18',
          lancamentos: {
            'parc-1': { valor: 140000, dataPag: '2025-04-15' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2024-030 (POA Tech - forn_031)
  cont_013: [
    {
      id: 'rub-item-006',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.1',
      descricao: 'Desenvolvimento de Software',
      quantidade: 1,
      meses: 10,
      valorUnitario: 42000.00,
      valorTotal: 420000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-006',
          empresaRh: 'POA Tech - 12.345.678/0001-31',
          lancamentos: {
            'parc-1': { valor: 210000, dataPag: '2025-05-05' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2024-020 (Floripa Tech - forn_040)
  cont_017: [
    {
      id: 'rub-item-007',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.1',
      descricao: 'Desenvolvimento de Software',
      quantidade: 1,
      meses: 12,
      valorUnitario: 40000.00,
      valorTotal: 480000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-007',
          empresaRh: 'Floripa Tech - 01.234.567/0001-40',
          lancamentos: {
            'parc-1': { valor: 160000, dataPag: '2025-03-25' },
            'parc-2': { valor: 160000, dataPag: '2025-06-25' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2024-032 (Fortaleza Tech - forn_037)
  cont_016: [
    {
      id: 'rub-item-008',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.1',
      descricao: 'Desenvolvimento de Software',
      quantidade: 1,
      meses: 10,
      valorUnitario: 35000.00,
      valorTotal: 350000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-008',
          empresaRh: 'Fortaleza Tech - 78.901.234/0001-37',
          lancamentos: {
            'parc-1': { valor: 175000, dataPag: '2025-05-15' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2024-028 (Curitiba Software - forn_034)
  cont_014: [
    {
      id: 'rub-item-009',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.1',
      descricao: 'Desenvolvimento de Software',
      quantidade: 1,
      meses: 8,
      valorUnitario: 23750.00,
      valorTotal: 190000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-009',
          empresaRh: 'Curitiba Software - 45.678.901/0001-34',
          lancamentos: {
            'parc-1': { valor: 95000, dataPag: '2025-04-20' },
            'parc-2': { valor: 95000, dataPag: '2025-07-20' },
          },
        },
      ],
    },
  ],
  
  // Contrato CT-2023-048 (Curitiba Software - forn_034)
  cont_015: [
    {
      id: 'rub-item-010',
      rubricaId: '3',
      rubricaCodigo: 'OST-PJ',
      rubricaNome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
      codigo: '4.1',
      descricao: 'Desenvolvimento de Software',
      quantidade: 1,
      meses: 3,
      valorUnitario: 25000.00,
      valorTotal: 75000.00,
      meta: '',
      subitens: [
        {
          id: 'sub-010',
          empresaRh: 'Curitiba Software House S.A. - 45.678.901/0001-34',
          lancamentos: {
            'parc-1': { valor: 25000, dataPag: '2023-09-15' },
            'parc-2': { valor: 25000, dataPag: '2023-10-15' },
            'parc-3': { valor: 25000, dataPag: '2023-11-15' },
          },
        },
      ],
    },
  ],
};

// =============================================================================
// FUNÇÕES UTILITÁRIAS PARA BUSCAR RUBRICAS VINCULADAS A FORNECEDORES
// =============================================================================

/**
 * Normaliza CNPJ removendo formatação para comparação
 */
function normalizeCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, '');
}

/**
 * Verifica se um fornecedor está vinculado a um item de rubrica
 * Compara pelo CNPJ normalizado ou pelo nome do fornecedor
 */
function isFornecedorVinculado(
  fornecedor: { cnpj?: string; nome: string; razaoSocial?: string },
  empresaRh: string
): boolean {
  // Se o fornecedor tem CNPJ, compara pelo CNPJ normalizado
  if (fornecedor.cnpj) {
    const cnpjNormalizado = normalizeCNPJ(fornecedor.cnpj);
    const empresaRhNormalizado = normalizeCNPJ(empresaRh);
    
    // Verifica se o CNPJ está contido na string empresaRh (pode estar em qualquer posição)
    if (empresaRhNormalizado && empresaRhNormalizado.includes(cnpjNormalizado)) {
      return true;
    }
  }
  
  // Verifica se o nome ou razão social está presente no campo empresaRh
  const nomeUpper = fornecedor.nome.toUpperCase();
  const empresaRhUpper = empresaRh.toUpperCase();
  
  if (empresaRhUpper.includes(nomeUpper)) {
    return true;
  }
  
  if (fornecedor.razaoSocial) {
    const razaoUpper = fornecedor.razaoSocial.toUpperCase();
    if (empresaRhUpper.includes(razaoUpper)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Retorna itens de rubricas vinculados a um fornecedor dentro de um contrato específico
 */
export function getRubricasByFornecedor(
  contratoId: string,
  fornecedor: { cnpj?: string; nome: string; razaoSocial?: string }
): ItemRubricaVinculado[] {
  const rubricasDoContrato = MOCK_RUBRICAS_POR_CONTRATO[contratoId] || [];
  
  return rubricasDoContrato.filter((item) => {
    // Se o item tem subitens, verifica se algum subitem está vinculado ao fornecedor
    if (item.subitens && item.subitens.length > 0) {
      return item.subitens.some((subitem) =>
        isFornecedorVinculado(fornecedor, subitem.empresaRh)
      );
    }
    
    // Se não tem subitens, retorna false (não está vinculado)
    return false;
  }).map((item) => {
    // Filtra apenas os subitens vinculados ao fornecedor
    if (item.subitens) {
      return {
        ...item,
        subitens: item.subitens.filter((subitem) =>
          isFornecedorVinculado(fornecedor, subitem.empresaRh)
        ),
      };
    }
    return item;
  });
}