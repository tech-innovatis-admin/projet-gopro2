// Tipos
export type Papel =
  | "COORDENADOR"
  | "VICE_COORDENADOR"
  | "SECRETARIO"
  | "PESQUISADOR"
  | "BOLSISTA"
  | "TECNICO"
  | "OUTRO";

export type Membro = {
  id: string;
  nome: string;
  papel: Papel;
  papelCustom?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  avatarUrl?: string;
  endereco?: string;
  vinculo?: string;
  cargaHoraria?: number;
};

export const papelLabels: Record<Papel, string> = {
  COORDENADOR: "Coordenador",
  VICE_COORDENADOR: "Vice-Coordenador",
  SECRETARIO: "Secretário",
  PESQUISADOR: "Pesquisador",
  BOLSISTA: "Bolsista",
  TECNICO: "Técnico",
  OUTRO: "Outro",
};

// Mock de dados
// Baseado nas tabelas: people e project_people
// Total de 15 membros com dados realistas
export const mockMembros: Membro[] = [
  {
    id: "1",
    nome: "João Silva Santos",
    papel: "COORDENADOR",
    email: "joao.silva@universidade.edu.br",
    telefone: "11999991234",
    cpf: "12345678901",
    vinculo: "Professor Associado",
    cargaHoraria: 20,
    endereco: "Rua das Flores, 123, Vila Maria, São Paulo - SP",
  },
  {
    id: "2",
    nome: "Maria Santos Oliveira",
    papel: "VICE_COORDENADOR",
    email: "maria.santos@universidade.edu.br",
    telefone: "11999995678",
    cpf: "98765432101",
    vinculo: "Professora Adjunta",
    cargaHoraria: 15,
    endereco: "Avenida Principal, 456, Centro, São Paulo - SP",
  },
  {
    id: "3",
    nome: "Pedro Costa Ferreira",
    papel: "PESQUISADOR",
    email: "pedro.costa@universidade.edu.br",
    cpf: "11122233344",
    vinculo: "Doutorando",
    cargaHoraria: 40,
    endereco: "Rua Secundária, 789, Vila Nova, São Paulo - SP",
  },
  {
    id: "4",
    nome: "Ana Paula Silva",
    papel: "PESQUISADOR",
    email: "ana.paula@universidade.edu.br",
    telefone: "11988884321",
    cpf: "55566677788",
    vinculo: "Mestranda",
    cargaHoraria: 30,
    endereco: "Travessa das Acácias, 234, Bela Vista, São Paulo - SP",
  },
  {
    id: "5",
    nome: "Carlos Eduardo Mendes",
    papel: "BOLSISTA",
    email: "carlos.mendes@universidade.edu.br",
    telefone: "11987653210",
    cpf: "33344455566",
    vinculo: "Bolsista de IC",
    cargaHoraria: 20,
    endereco: "Rua das Magnólias, 567, Vila Madalena, São Paulo - SP",
  },
  {
    id: "6",
    nome: "Lucia Mariana Gonçalves",
    papel: "TECNICO",
    email: "lucia.goncalves@universidade.edu.br",
    telefone: "11986543210",
    cpf: "77788899900",
    vinculo: "Técnica de Laboratório",
    cargaHoraria: 40,
    endereco: "Avenida Brasil, 890, Pinheiros, São Paulo - SP",
  },
  {
    id: "7",
    nome: "Roberto Alves Martins",
    papel: "PESQUISADOR",
    email: "roberto.alves@universidade.edu.br",
    telefone: "11985552233",
    cpf: "44455566677",
    vinculo: "Pós-doutorando",
    cargaHoraria: 35,
    endereco: "Rua do Carmo, 321, Vila Olímpia, São Paulo - SP",
  },
  {
    id: "8",
    nome: "Fernanda Rosa Pereira",
    papel: "SECRETARIO",
    email: "fernanda.pereira@universidade.edu.br",
    telefone: "11984441111",
    cpf: "22233344455",
    vinculo: "Secretária Executiva",
    cargaHoraria: 40,
    endereco: "Avenida Paulista, 1578, Bela Vista, São Paulo - SP",
  },
  {
    id: "9",
    nome: "Thiago Oliveira Santos",
    papel: "BOLSISTA",
    email: "thiago.santos@universidade.edu.br",
    telefone: "11983335555",
    cpf: "66677788899",
    vinculo: "Bolsista de Iniciação Científica",
    cargaHoraria: 20,
    endereco: "Rua Augusta, 2234, Centro, São Paulo - SP",
  },
  {
    id: "10",
    nome: "Patricia Helena Costa",
    papel: "PESQUISADOR",
    email: "patricia.costa@universidade.edu.br",
    telefone: "11982221111",
    cpf: "99900011122",
    vinculo: "Pesquisadora Colaboradora",
    cargaHoraria: 25,
    endereco: "Rua Groenlândia, 456, Vila Mariana, São Paulo - SP",
  },
  {
    id: "11",
    nome: "Daniel Felipe Ribeiro",
    papel: "TECNICO",
    email: "daniel.ribeiro@universidade.edu.br",
    telefone: "11981112222",
    cpf: "11122233344",
    vinculo: "Técnico de Informática",
    cargaHoraria: 40,
    endereco: "Rua Bandeira, 789, Tatuapé, São Paulo - SP",
  },
  {
    id: "12",
    nome: "Samantha Campos Almeida",
    papel: "PESQUISADOR",
    email: "samantha.campos@universidade.edu.br",
    telefone: "11979994444",
    cpf: "55566677788",
    vinculo: "Doutoranda",
    cargaHoraria: 40,
    endereco: "Avenida Morumbi, 3000, Brooklin, São Paulo - SP",
  },
  {
    id: "13",
    nome: "Lucas Antonio Barbosa",
    papel: "BOLSISTA",
    email: "lucas.barbosa@universidade.edu.br",
    telefone: "11978886666",
    cpf: "33344455566",
    vinculo: "Bolsista PIBIC",
    cargaHoraria: 20,
    endereco: "Rua Oscar Freire, 112, Cerqueira César, São Paulo - SP",
  },
  {
    id: "14",
    nome: "Beatriz Monteiro Silva",
    papel: "PESQUISADOR",
    email: "beatriz.silva@universidade.edu.br",
    telefone: "11977775555",
    cpf: "77788899900",
    vinculo: "Pesquisadora Sênior",
    cargaHoraria: 30,
    endereco: "Rua Haddock Lobo, 234, Vila Mariana, São Paulo - SP",
  },
  {
    id: "15",
    nome: "Marcelo Gomes da Silva",
    papel: "OUTRO",
    papelCustom: "Consultor Externo",
    email: "marcelo.gomes@consultoria.com.br",
    telefone: "11976663333",
    cpf: "44455566677",
    vinculo: "Consultor - Parceria Externa",
    cargaHoraria: 15,
    endereco: "Rua Teodoro Sampaio, 567, Sumaré, São Paulo - SP",
  },
];
