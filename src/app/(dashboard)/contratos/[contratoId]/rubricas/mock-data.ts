// Arquivo auxiliar para compartilhar mocks entre paginas de contratos.

export const rubricasMock = [
  {
    id: '1',
    codigo: 'MC',
    nome: 'Material de Consumo (33.90.30)',
    expanded: true,
    itens: [
      {
        id: '1-1',
        codigo: '3.1',
        descricao: 'Reagentes químicos para laboratório',
        quantidade: 50,
        meses: 12,
        valorUnitario: 150.00,
        valorTotal: 90000.00,
        meta: '',
        subitens: [],
      },
      {
        id: '1-2',
        codigo: '3.2',
        descricao: 'Material de escritório',
        quantidade: 1,
        meses: 12,
        valorUnitario: 500.00,
        valorTotal: 6000.00,
        meta: '',
        subitens: [],
      },
    ],
  },
  {
    id: '2',
    codigo: 'PP',
    nome: 'Pagamento de Pessoal (33.90.20)',
    expanded: true,
    itens: [
      {
        id: '2-1',
        codigo: '2.1',
        descricao: 'Coordenador',
        quantidade: 1,
        meses: 34,
        valorUnitario: 6000.00,
        valorTotal: 204000.00,
        meta: '',
        subitens: [
          {
            id: 'sub-1',
            empresaRh: 'Stefânia Cabral Pedra',
            lancamentos: {
              'parc-1': { valor: 18000, dataPag: '2025-05-30' },
              'parc-2': { valor: 36000, dataPag: '2025-11-27' },
            },
          },
        ],
      },
      {
        id: '2-2',
        codigo: '2.4',
        descricao: 'Bolsa Ministério',
        quantidade: 1,
        meses: 1,
        valorUnitario: 2499500.00,
        valorTotal: 2499500.00,
        meta: 'Ministério sugestão SV',
        subitens: [
          {
            id: 'sub-2',
            empresaRh: 'ARILSON CÂNDIDO',
            lancamentos: {
              'parc-1': { valor: 1400, dataPag: '2025-06-05' },
              'parc-2': { valor: 21600, dataPag: '2025-12-04' },
            },
          },
          {
            id: 'sub-3',
            empresaRh: 'ELIEZER CECE GREGORIO',
            lancamentos: {
              'parc-1': { valor: 1400, dataPag: '2025-06-05' },
              'parc-2': { valor: 8400, dataPag: '2025-12-04' },
            },
          },
        ],
      },
      {
        id: '2-3',
        codigo: '2.2',
        descricao: 'Bolsa de pesquisador júnior',
        quantidade: 1,
        meses: 12,
        valorUnitario: 3500.00,
        valorTotal: 42000.00,
        meta: '',
        subitens: [],
      },
    ],
  },
  {
    id: '3',
    codigo: 'OST-PJ',
    nome: 'Outros Serviços de Terceiros - Pessoa Jurídica',
    expanded: false,
    itens: [],
  },
  {
    id: '4',
    codigo: 'OST-PF',
    nome: 'Outros Serviços de Terceiros - Pessoa Física',
    expanded: false,
    itens: [],
  },
  {
    id: '5',
    codigo: 'VD',
    nome: 'Viagens e Diárias',
    expanded: false,
    itens: [],
  },
  {
    id: '6',
    codigo: 'EQUIP',
    nome: 'Equipamentos e Material Permanente',
    expanded: false,
    itens: [],
  },
  {
    id: '7',
    codigo: 'OP',
    nome: 'Obras e Instalações',
    expanded: false,
    itens: [],
  },
];

export const parcelasMock = [
  { id: 'parc-1', numero: 1, valorRecebido: 250000, dataRecebimento: '2025-02-10' },
  { id: 'parc-2', numero: 2, valorRecebido: 250000, dataRecebimento: '2025-06-20' },
];

