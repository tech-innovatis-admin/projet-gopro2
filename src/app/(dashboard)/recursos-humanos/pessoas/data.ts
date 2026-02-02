// =============================================================================
// MOCK DATA PARA PESSOAS EM PROJETOS
// =============================================================================

import {
  type Person,
  type ProjectPerson,
  type PersonWithProjects,
} from "./types";

// Mock de Pessoas (tabela people)
export const MOCK_PEOPLE: Person[] = [
  {
    id: "person_001",
    fullName: "João Silva Santos",
    cpf: "123.456.789-00",
    email: "joao.santos@email.com",
    phone: "(83) 99999-1234",
    avatarUrl: undefined,
    birthDate: "1985-03-15",
    address: "Rua das Flores, 123",
    zipCode: "58000-000",
    city: "João Pessoa",
    state: "PB",
    notes: "Professor doutor em Engenharia",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-06-15T14:30:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_002",
    fullName: "Maria Oliveira Costa",
    cpf: "987.654.321-00",
    email: "maria.costa@email.com",
    phone: "(83) 98888-5678",
    avatarUrl: undefined,
    birthDate: "1990-07-22",
    address: "Av. Epitácio Pessoa, 456",
    zipCode: "58030-000",
    city: "João Pessoa",
    state: "PB",
    notes: "Especialista em Gestão de Projetos",
    createdAt: "2024-02-05T09:00:00Z",
    updatedAt: "2024-08-20T10:15:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_003",
    fullName: "Pedro Henrique Almeida",
    cpf: "456.789.123-00",
    email: "pedro.almeida@email.com",
    phone: "(83) 97777-9012",
    avatarUrl: undefined,
    birthDate: "1995-11-08",
    address: "Rua Conselheiro Henriques, 789",
    zipCode: "58011-000",
    city: "João Pessoa",
    state: "PB",
    notes: "Mestrando em Ciência da Computação",
    createdAt: "2024-03-12T10:30:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_004",
    fullName: "Ana Beatriz Ferreira",
    cpf: "321.654.987-00",
    email: "ana.ferreira@email.com",
    phone: "(81) 96666-3456",
    avatarUrl: undefined,
    birthDate: "1988-05-30",
    address: "Rua do Sol, 100",
    zipCode: "50000-000",
    city: "Recife",
    state: "PE",
    createdAt: "2024-04-01T08:00:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_005",
    fullName: "Carlos Eduardo Lima",
    cpf: "654.321.987-00",
    email: "carlos.lima@email.com",
    phone: "(84) 95555-7890",
    avatarUrl: undefined,
    birthDate: "1992-09-18",
    address: "Av. Prudente de Morais, 200",
    zipCode: "59000-000",
    city: "Natal",
    state: "RN",
    notes: "Técnico em Laboratório",
    createdAt: "2024-05-15T11:00:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_006",
    fullName: "Fernanda Souza Ribeiro",
    cpf: "789.123.456-00",
    email: "fernanda.ribeiro@email.com",
    phone: "(83) 94444-1111",
    avatarUrl: undefined,
    birthDate: "1993-12-05",
    address: "Rua José Américo, 50",
    zipCode: "58040-000",
    city: "João Pessoa",
    state: "PB",
    createdAt: "2024-06-20T09:30:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_007",
    fullName: "Lucas Pereira Gomes",
    cpf: "147.258.369-00",
    email: "lucas.gomes@email.com",
    phone: "(83) 93333-2222",
    avatarUrl: undefined,
    birthDate: "1998-02-14",
    address: "Rua Duque de Caxias, 300",
    zipCode: "58013-000",
    city: "João Pessoa",
    state: "PB",
    notes: "Bolsista de Iniciação Científica",
    createdAt: "2024-07-01T08:00:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_008",
    fullName: "Juliana Martins Vasconcelos",
    cpf: "258.369.147-00",
    email: "juliana.martins@email.com",
    phone: "(81) 92222-4444",
    avatarUrl: undefined,
    birthDate: "1987-08-25",
    address: "Av. Boa Viagem, 1500",
    zipCode: "51020-000",
    city: "Recife",
    state: "PE",
    notes: "Consultora Externa",
    createdAt: "2024-08-10T10:00:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_009",
    fullName: "Rafael Nascimento Silva",
    cpf: "369.147.258-00",
    email: "rafael.nascimento@email.com",
    phone: "(84) 91111-5555",
    avatarUrl: undefined,
    birthDate: "1991-04-10",
    address: "Rua Potengi, 80",
    zipCode: "59020-000",
    city: "Natal",
    state: "RN",
    createdAt: "2024-09-05T14:00:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_010",
    fullName: "Camila Rodrigues Barbosa",
    cpf: "741.852.963-00",
    email: "camila.rodrigues@email.com",
    phone: "(83) 90000-6666",
    avatarUrl: undefined,
    birthDate: "1994-06-20",
    address: "Rua Barão do Triunfo, 45",
    zipCode: "58020-000",
    city: "João Pessoa",
    state: "PB",
    notes: "Doutoranda em Biotecnologia",
    createdAt: "2024-10-01T08:30:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_011",
    fullName: "Thiago Andrade Moreira",
    cpf: "852.963.741-00",
    email: "thiago.andrade@email.com",
    phone: "(87) 98765-4321",
    avatarUrl: undefined,
    birthDate: "1989-01-28",
    address: "Av. Agamenon Magalhães, 900",
    zipCode: "55000-000",
    city: "Caruaru",
    state: "PE",
    createdAt: "2024-11-15T09:00:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_012",
    fullName: "Isabela Castro Mendes",
    cpf: "963.741.852-00",
    email: "isabela.castro@email.com",
    phone: "(83) 99876-5432",
    avatarUrl: undefined,
    birthDate: "1996-10-12",
    address: "Rua Padre Azevedo, 200",
    zipCode: "58100-000",
    city: "Campina Grande",
    state: "PB",
    notes: "Estudante de graduação em Engenharia Elétrica",
    createdAt: "2024-12-01T11:30:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_013",
    fullName: "Roberto Carvalho Santos",
    cpf: "159.753.486-00",
    email: "roberto.carvalho@email.com",
    phone: "(84) 98765-1111",
    avatarUrl: undefined,
    birthDate: "1982-03-08",
    address: "Av. Senador Salgado Filho, 1200",
    zipCode: "59075-000",
    city: "Natal",
    state: "RN",
    notes: "Professor titular em Física",
    createdAt: "2024-12-15T08:00:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_014",
    fullName: "Patrícia Lima Fernandes",
    cpf: "357.951.246-00",
    email: "patricia.lima@email.com",
    phone: "(81) 97654-2222",
    avatarUrl: undefined,
    birthDate: "1990-07-15",
    address: "Rua do Bom Jesus, 80",
    zipCode: "50030-000",
    city: "Recife",
    state: "PE",
    notes: "Especialista em Gestão Ambiental",
    createdAt: "2025-01-05T09:00:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_015",
    fullName: "Gustavo Henrique Pereira",
    cpf: "468.135.792-00",
    email: "gustavo.pereira@email.com",
    phone: "(83) 96543-3333",
    avatarUrl: undefined,
    birthDate: "1997-12-03",
    address: "Rua Maria Diva, 150",
    zipCode: "58051-000",
    city: "João Pessoa",
    state: "PB",
    notes: "Desenvolvedor Full Stack",
    createdAt: "2025-01-10T10:30:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_016",
    fullName: "Amanda Silva Oliveira",
    cpf: "579.246.813-00",
    email: "amanda.oliveira@email.com",
    phone: "(87) 95432-4444",
    avatarUrl: undefined,
    birthDate: "1994-09-22",
    address: "Rua Coronel Antônio, 250",
    zipCode: "55002-000",
    city: "Caruaru",
    state: "PE",
    notes: "Analista de Qualidade de Software",
    createdAt: "2025-01-12T14:00:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_017",
    fullName: "Felipe Augusto Rodrigues",
    cpf: "680.357.924-00",
    email: "felipe.rodrigues@email.com",
    phone: "(84) 94321-5555",
    avatarUrl: undefined,
    birthDate: "1993-04-18",
    address: "Rua João Pessoa, 75",
    zipCode: "59012-000",
    city: "Natal",
    state: "RN",
    notes: "Pesquisador em Inteligência Artificial",
    createdAt: "2025-01-15T08:45:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_018",
    fullName: "Carolina Nunes Santos",
    cpf: "791.468.035-00",
    email: "carolina.nunes@email.com",
    phone: "(83) 93210-6666",
    avatarUrl: undefined,
    birthDate: "1988-11-30",
    address: "Rua João XXIII, 90",
    zipCode: "58080-000",
    city: "João Pessoa",
    state: "PB",
    notes: "Coordenadora de Projetos Educacionais",
    createdAt: "2025-01-18T11:15:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_019",
    fullName: "Diego Martins Costa",
    cpf: "802.579.146-00",
    email: "diego.martins@email.com",
    phone: "(81) 92109-7777",
    avatarUrl: undefined,
    birthDate: "1995-06-14",
    address: "Av. Conde da Boa Vista, 500",
    zipCode: "50060-000",
    city: "Recife",
    state: "PE",
    notes: "Designer UX/UI",
    createdAt: "2025-01-20T13:30:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_020",
    fullName: "Mariana Fonseca Almeida",
    cpf: "913.680.257-00",
    email: "mariana.fonseca@email.com",
    phone: "(88) 91098-8888",
    avatarUrl: undefined,
    birthDate: "1992-01-25",
    address: "Rua Dom Expedito, 180",
    zipCode: "62000-000",
    city: "Sobral",
    state: "CE",
    notes: "Engenheira Civil",
    createdAt: "2025-01-22T09:45:00Z",
    createdBy: "user_1",
  },
  {
    id: "person_021",
    fullName: "Vinícius Barbosa Lima",
    cpf: "024.791.368-00",
    email: "vinicius.barbosa@email.com",
    phone: "(82) 90987-9999",
    avatarUrl: undefined,
    birthDate: "1998-08-07",
    address: "Av. Durval de Goes Monteiro, 300",
    zipCode: "57000-000",
    city: "Maceió",
    state: "AL",
    notes: "Estudante de Ciência da Computação",
    createdAt: "2025-01-25T15:00:00Z",
    createdBy: "user_2",
  },
  {
    id: "person_022",
    fullName: "Larissa Teixeira Gomes",
    cpf: "135.802.479-00",
    email: "larissa.teixeira@email.com",
    phone: "(85) 89876-0000",
    avatarUrl: undefined,
    birthDate: "1991-05-19",
    address: "Av. Washington Soares, 800",
    zipCode: "60800-000",
    city: "Fortaleza",
    state: "CE",
    notes: "Advogada especializada em contratos",
    createdAt: "2025-01-28T10:20:00Z",
    createdBy: "user_1",
  },
];

// Mock de vínculos pessoa-projeto (tabela project_people)
export const MOCK_PROJECT_PEOPLE: ProjectPerson[] = [
  // João Silva Santos - 3 projetos (2 ativos, 1 encerrado)
  {
    id: "pp_001",
    projectId: "proj_001",
    projectName: "Sistema de Gestão Ambiental",
    projectCode: "CONT-2024-001",
    personId: "person_001",
    role: "Coordenador",
    workloadHours: 20,
    institutionalLink: "UFPB",
    contractType: "BOLSA",
    startDate: "2024-01-15",
    endDate: "2025-12-31",
    status: 1,
    baseAmount: 8000,
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "pp_002",
    projectId: "proj_002",
    projectName: "Monitoramento de Recursos Hídricos",
    projectCode: "CONT-2024-002",
    personId: "person_001",
    role: "Pesquisador",
    workloadHours: 10,
    institutionalLink: "UFPB",
    contractType: "RPA",
    startDate: "2024-03-01",
    endDate: "2025-06-30",
    status: 1,
    baseAmount: 4000,
    createdAt: "2024-02-25T10:00:00Z",
  },
  {
    id: "pp_003",
    projectId: "proj_005",
    projectName: "Capacitação em Sustentabilidade",
    projectCode: "CONT-2023-005",
    personId: "person_001",
    role: "Consultor",
    workloadHours: 8,
    institutionalLink: "UFPB",
    contractType: "RPA",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    status: 2,
    baseAmount: 3500,
    createdAt: "2023-05-20T09:00:00Z",
  },

  // Maria Oliveira Costa - 2 projetos ativos
  {
    id: "pp_004",
    projectId: "proj_001",
    projectName: "Sistema de Gestão Ambiental",
    projectCode: "CONT-2024-001",
    personId: "person_002",
    role: "Vice-Coordenadora",
    workloadHours: 15,
    institutionalLink: "IFPB",
    contractType: "BOLSA",
    startDate: "2024-01-15",
    endDate: "2025-12-31",
    status: 1,
    baseAmount: 6000,
    createdAt: "2024-01-10T08:30:00Z",
  },
  {
    id: "pp_005",
    projectId: "proj_003",
    projectName: "Desenvolvimento de Software Educacional",
    projectCode: "CONT-2024-003",
    personId: "person_002",
    role: "Gestora de Projetos",
    workloadHours: 20,
    institutionalLink: "IFPB",
    contractType: "CLT",
    startDate: "2024-04-01",
    status: 1,
    baseAmount: 7500,
    createdAt: "2024-03-20T14:00:00Z",
  },

  // Pedro Henrique Almeida - 1 projeto ativo, 1 pendente
  {
    id: "pp_006",
    projectId: "proj_002",
    projectName: "Monitoramento de Recursos Hídricos",
    projectCode: "CONT-2024-002",
    personId: "person_003",
    role: "Desenvolvedor",
    workloadHours: 30,
    institutionalLink: "UFPB",
    contractType: "BOLSA",
    startDate: "2024-03-15",
    endDate: "2025-06-30",
    status: 1,
    baseAmount: 2500,
    createdAt: "2024-03-10T09:00:00Z",
  },
  {
    id: "pp_007",
    projectId: "proj_004",
    projectName: "Plataforma de Inovação Tecnológica",
    projectCode: "CONT-2024-004",
    personId: "person_003",
    role: "Analista de Sistemas",
    workloadHours: 20,
    institutionalLink: "UFPB",
    contractType: "BOLSA",
    startDate: "2025-02-01",
    status: 0,
    baseAmount: 3000,
    notes: "Aguardando aprovação do termo aditivo",
    createdAt: "2025-01-15T10:00:00Z",
  },

  // Ana Beatriz Ferreira - 1 projeto ativo
  {
    id: "pp_008",
    projectId: "proj_003",
    projectName: "Desenvolvimento de Software Educacional",
    projectCode: "CONT-2024-003",
    personId: "person_004",
    role: "Especialista UX",
    workloadHours: 25,
    institutionalLink: "UFPE",
    contractType: "RPA",
    startDate: "2024-05-01",
    status: 1,
    baseAmount: 5000,
    createdAt: "2024-04-25T11:00:00Z",
  },

  // Carlos Eduardo Lima - 2 projetos (1 ativo, 1 encerrado)
  {
    id: "pp_009",
    projectId: "proj_001",
    projectName: "Sistema de Gestão Ambiental",
    projectCode: "CONT-2024-001",
    personId: "person_005",
    role: "Técnico de Laboratório",
    workloadHours: 40,
    institutionalLink: "UFRN",
    contractType: "CLT",
    startDate: "2024-02-01",
    status: 1,
    baseAmount: 3500,
    createdAt: "2024-01-28T08:00:00Z",
  },
  {
    id: "pp_010",
    projectId: "proj_006",
    projectName: "Análise de Qualidade da Água",
    projectCode: "CONT-2023-006",
    personId: "person_005",
    role: "Analista de Laboratório",
    workloadHours: 20,
    institutionalLink: "UFRN",
    contractType: "BOLSA",
    startDate: "2023-03-01",
    endDate: "2024-02-28",
    status: 2,
    baseAmount: 2000,
    createdAt: "2023-02-20T09:30:00Z",
  },

  // Fernanda Souza Ribeiro - 1 projeto ativo
  {
    id: "pp_011",
    projectId: "proj_002",
    projectName: "Monitoramento de Recursos Hídricos",
    projectCode: "CONT-2024-002",
    personId: "person_006",
    role: "Pesquisadora Júnior",
    workloadHours: 20,
    institutionalLink: "UFPB",
    contractType: "BOLSA",
    startDate: "2024-07-01",
    status: 1,
    baseAmount: 2200,
    createdAt: "2024-06-25T14:00:00Z",
  },

  // Lucas Pereira Gomes - 1 projeto ativo (bolsista IC)
  {
    id: "pp_012",
    projectId: "proj_004",
    projectName: "Plataforma de Inovação Tecnológica",
    projectCode: "CONT-2024-004",
    personId: "person_007",
    role: "Bolsista IC",
    workloadHours: 20,
    institutionalLink: "UFPB",
    contractType: "BOLSA",
    startDate: "2024-08-01",
    status: 1,
    baseAmount: 800,
    createdAt: "2024-07-25T10:00:00Z",
  },

  // Juliana Martins Vasconcelos - 1 projeto ativo (consultora)
  {
    id: "pp_013",
    projectId: "proj_003",
    projectName: "Desenvolvimento de Software Educacional",
    projectCode: "CONT-2024-003",
    personId: "person_008",
    role: "Consultora de Negócios",
    workloadHours: 10,
    institutionalLink: "Externa",
    contractType: "RPA",
    startDate: "2024-09-01",
    status: 1,
    baseAmount: 6000,
    createdAt: "2024-08-28T15:00:00Z",
  },

  // Rafael Nascimento Silva - 1 projeto pendente
  {
    id: "pp_014",
    projectId: "proj_004",
    projectName: "Plataforma de Inovação Tecnológica",
    projectCode: "CONT-2024-004",
    personId: "person_009",
    role: "Desenvolvedor Backend",
    workloadHours: 30,
    institutionalLink: "UFRN",
    contractType: "BOLSA",
    startDate: "2025-03-01",
    status: 0,
    baseAmount: 3200,
    notes: "Contratação prevista para março/2025",
    createdAt: "2025-01-20T09:00:00Z",
  },

  // Camila Rodrigues Barbosa - 2 projetos ativos
  {
    id: "pp_015",
    projectId: "proj_001",
    projectName: "Sistema de Gestão Ambiental",
    projectCode: "CONT-2024-001",
    personId: "person_010",
    role: "Pesquisadora",
    workloadHours: 15,
    institutionalLink: "UFPB",
    contractType: "BOLSA",
    startDate: "2024-10-15",
    status: 1,
    baseAmount: 4500,
    createdAt: "2024-10-10T08:00:00Z",
  },
  {
    id: "pp_016",
    projectId: "proj_002",
    projectName: "Monitoramento de Recursos Hídricos",
    projectCode: "CONT-2024-002",
    personId: "person_010",
    role: "Especialista em Biotecnologia",
    workloadHours: 10,
    institutionalLink: "UFPB",
    contractType: "RPA",
    startDate: "2024-11-01",
    status: 1,
    baseAmount: 3000,
    createdAt: "2024-10-28T11:00:00Z",
  },

  // Thiago Andrade Moreira - sem projetos ativos (apenas encerrado)
  {
    id: "pp_017",
    projectId: "proj_005",
    projectName: "Capacitação em Sustentabilidade",
    projectCode: "CONT-2023-005",
    personId: "person_011",
    role: "Instrutor",
    workloadHours: 12,
    institutionalLink: "UFPE",
    contractType: "RPA",
    startDate: "2023-08-01",
    endDate: "2024-01-31",
    status: 2,
    baseAmount: 2800,
    createdAt: "2023-07-25T10:00:00Z",
  },

  // Isabela Castro Mendes - 1 projeto ativo (voluntária)
  {
    id: "pp_018",
    projectId: "proj_004",
    projectName: "Plataforma de Inovação Tecnológica",
    projectCode: "CONT-2024-004",
    personId: "person_012",
    role: "Estagiária",
    workloadHours: 20,
    institutionalLink: "UFCG",
    contractType: "VOLUNTARIO",
    startDate: "2025-01-15",
    status: 1,
    baseAmount: 0,
    notes: "Participação voluntária para TCC",
    createdAt: "2025-01-10T14:00:00Z",
  },

  // Roberto Carvalho Santos - 2 projetos (1 ativo, 1 encerrado)
  {
    id: "pp_019",
    projectId: "proj_001",
    projectName: "Sistema de Gestão Ambiental",
    projectCode: "CONT-2024-001",
    personId: "person_013",
    role: "Orientador",
    workloadHours: 8,
    institutionalLink: "UFRN",
    contractType: "RPA",
    startDate: "2024-01-20",
    endDate: "2025-12-31",
    status: 1,
    baseAmount: 12000,
    createdAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "pp_020",
    projectId: "proj_007",
    projectName: "Pesquisa em Física de Partículas",
    projectCode: "CONT-2022-007",
    personId: "person_013",
    role: "Coordenador Principal",
    workloadHours: 15,
    institutionalLink: "UFRN",
    contractType: "RPA",
    startDate: "2022-03-01",
    endDate: "2024-12-31",
    status: 2,
    baseAmount: 15000,
    createdAt: "2022-02-20T10:00:00Z",
  },

  // Patrícia Lima Fernandes - 1 projeto ativo
  {
    id: "pp_021",
    projectId: "proj_001",
    projectName: "Sistema de Gestão Ambiental",
    projectCode: "CONT-2024-001",
    personId: "person_014",
    role: "Especialista Ambiental",
    workloadHours: 25,
    institutionalLink: "UFPE",
    contractType: "RPA",
    startDate: "2024-11-01",
    status: 1,
    baseAmount: 8500,
    createdAt: "2024-10-25T11:00:00Z",
  },

  // Gustavo Henrique Pereira - 2 projetos ativos
  {
    id: "pp_022",
    projectId: "proj_004",
    projectName: "Plataforma de Inovação Tecnológica",
    projectCode: "CONT-2024-004",
    personId: "person_015",
    role: "Desenvolvedor Frontend",
    workloadHours: 40,
    institutionalLink: "UFPB",
    contractType: "CLT",
    startDate: "2025-01-01",
    status: 1,
    baseAmount: 6500,
    createdAt: "2024-12-20T14:00:00Z",
  },
  {
    id: "pp_023",
    projectId: "proj_003",
    projectName: "Desenvolvimento de Software Educacional",
    projectCode: "CONT-2024-003",
    personId: "person_015",
    role: "Tech Lead",
    workloadHours: 20,
    institutionalLink: "UFPB",
    contractType: "RPA",
    startDate: "2025-02-01",
    status: 1,
    baseAmount: 9000,
    createdAt: "2025-01-25T09:00:00Z",
  },

  // Amanda Silva Oliveira - 1 projeto ativo
  {
    id: "pp_024",
    projectId: "proj_003",
    projectName: "Desenvolvimento de Software Educacional",
    projectCode: "CONT-2024-003",
    personId: "person_016",
    role: "QA Analyst",
    workloadHours: 30,
    institutionalLink: "UFPE",
    contractType: "CLT",
    startDate: "2025-01-15",
    status: 1,
    baseAmount: 4500,
    createdAt: "2025-01-10T13:00:00Z",
  },

  // Felipe Augusto Rodrigues - 1 projeto pendente
  {
    id: "pp_025",
    projectId: "proj_008",
    projectName: "Sistema de IA para Diagnóstico Médico",
    projectCode: "CONT-2025-008",
    personId: "person_017",
    role: "Pesquisador em IA",
    workloadHours: 35,
    institutionalLink: "UFRN",
    contractType: "BOLSA",
    startDate: "2025-04-01",
    status: 0,
    baseAmount: 5500,
    notes: "Aguardando liberação de recursos",
    createdAt: "2025-01-20T10:00:00Z",
  },

  // Carolina Nunes Santos - 1 projeto ativo
  {
    id: "pp_026",
    projectId: "proj_002",
    projectName: "Monitoramento de Recursos Hídricos",
    projectCode: "CONT-2024-002",
    personId: "person_018",
    role: "Coordenadora Pedagógica",
    workloadHours: 15,
    institutionalLink: "UFPB",
    contractType: "RPA",
    startDate: "2024-09-01",
    status: 1,
    baseAmount: 7200,
    createdAt: "2024-08-25T11:30:00Z",
  },

  // Diego Martins Costa - 1 projeto ativo
  {
    id: "pp_027",
    projectId: "proj_004",
    projectName: "Plataforma de Inovação Tecnológica",
    projectCode: "CONT-2024-004",
    personId: "person_019",
    role: "UX Designer",
    workloadHours: 25,
    institutionalLink: "UFPE",
    contractType: "RPA",
    startDate: "2025-01-10",
    status: 1,
    baseAmount: 5800,
    createdAt: "2025-01-05T14:30:00Z",
  },

  // Mariana Fonseca Almeida - 1 projeto ativo
  {
    id: "pp_028",
    projectId: "proj_001",
    projectName: "Sistema de Gestão Ambiental",
    projectCode: "CONT-2024-001",
    personId: "person_020",
    role: "Engenheira de Projetos",
    workloadHours: 20,
    institutionalLink: "UFC",
    contractType: "RPA",
    startDate: "2024-12-01",
    status: 1,
    baseAmount: 6800,
    createdAt: "2024-11-25T09:45:00Z",
  },

  // Vinícius Barbosa Lima - 1 projeto ativo (bolsista)
  {
    id: "pp_029",
    projectId: "proj_004",
    projectName: "Plataforma de Inovação Tecnológica",
    projectCode: "CONT-2024-004",
    personId: "person_021",
    role: "Bolsista Desenvolvimento",
    workloadHours: 30,
    institutionalLink: "UFAL",
    contractType: "BOLSA",
    startDate: "2025-02-01",
    status: 1,
    baseAmount: 1200,
    createdAt: "2025-01-28T16:00:00Z",
  },

  // Larissa Teixeira Gomes - 1 projeto ativo
  {
    id: "pp_030",
    projectId: "proj_003",
    projectName: "Desenvolvimento de Software Educacional",
    projectCode: "CONT-2024-003",
    personId: "person_022",
    role: "Assessora Jurídica",
    workloadHours: 10,
    institutionalLink: "UFC",
    contractType: "RPA",
    startDate: "2025-01-20",
    status: 1,
    baseAmount: 7500,
    createdAt: "2025-01-15T12:00:00Z",
  },
];

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Retorna todas as pessoas com seus vínculos de projetos
 */
export function getPeopleWithProjects(): PersonWithProjects[] {
  return MOCK_PEOPLE.map((person) => {
    const projects = MOCK_PROJECT_PEOPLE.filter((pp) => pp.personId === person.id);
    const activeProjectsCount = projects.filter((pp) => pp.status === 1).length;

    return {
      ...person,
      projects,
      activeProjectsCount,
      totalProjectsCount: projects.length,
    };
  });
}

/**
 * Retorna uma pessoa pelo ID com seus vínculos
 */
export function getPersonById(personId: string): PersonWithProjects | undefined {
  const person = MOCK_PEOPLE.find((p) => p.id === personId);
  if (!person) return undefined;

  const projects = MOCK_PROJECT_PEOPLE.filter((pp) => pp.personId === personId);
  const activeProjectsCount = projects.filter((pp) => pp.status === 1).length;

  return {
    ...person,
    projects,
    activeProjectsCount,
    totalProjectsCount: projects.length,
  };
}

/**
 * Retorna os vínculos de projeto de uma pessoa
 */
export function getProjectsByPersonId(personId: string): ProjectPerson[] {
  return MOCK_PROJECT_PEOPLE.filter((pp) => pp.personId === personId);
}

/**
 * Retorna os vínculos de um projeto específico
 */
export function getPeopleByProjectId(projectId: string): ProjectPerson[] {
  return MOCK_PROJECT_PEOPLE.filter((pp) => pp.projectId === projectId);
}

/**
 * Retorna lista única de estados
 */
export function getUniqueStates(): string[] {
  const states = MOCK_PEOPLE.map((p) => p.state).filter(Boolean) as string[];
  return Array.from(new Set(states)).sort();
}

/**
 * Retorna lista única de cidades por estado
 */
export function getCitiesByState(state: string): string[] {
  const cities = MOCK_PEOPLE
    .filter((p) => p.state === state)
    .map((p) => p.city)
    .filter(Boolean) as string[];
  return Array.from(new Set(cities)).sort();
}

/**
 * Retorna lista única de todas as cidades
 */
export function getAllCities(): string[] {
  const cities = MOCK_PEOPLE.map((p) => p.city).filter(Boolean) as string[];
  return Array.from(new Set(cities)).sort();
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR");
}