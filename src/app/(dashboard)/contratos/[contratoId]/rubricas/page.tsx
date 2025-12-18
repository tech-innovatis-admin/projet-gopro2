'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, ChevronDown, ChevronRight, Edit2, Check, X, AlertCircle, ArrowRight, History } from 'lucide-react';
import { RemanejamentoModal } from './_components/RemanejamentoModal';
import { HistoricoRemanejamentos } from './_components/HistoricoRemanejamentos';
import { MoneyInput } from '../desembolso/_components/MoneyImput';
import { ResizableTable } from '@/components/ui/resizable-table';

// Tipos
type ID = string;

interface Remanejamento {
  id: string;
  contratoId: string;
  itemOrigemId: string;
  itemDestinoId: string;
  valor: number;
  data: string;
  motivo: string;
  createdBy: string;
  createdAt: string;
  status?: 'PENDENTE' | 'APROVADO';
}

type Lancamento = {
  valor: number;    // valor pago daquele subitem na parcela
  dataPag: string;  // data do pagamento (AAAA-MM-DD)
};

type Subitem = {
  id: ID;
  empresaRh: string; // "Empresa/RH" na planilha
  lancamentos: Record<ID, Lancamento | undefined>; // chave = parcelaId
};

interface ItemRubrica {
  id: string;
  codigo?: string; // ex: "2.4", "2.1", "3.1"
  descricao: string;
  quantidade: number;
  meses: number;
  valorUnitario: number;
  valorTotal: number;
  meta?: string; // meta vinculada ao item (texto livre ou ID da meta)
  metaId?: string; // ID da meta selecionada da página de metas
  subitens?: Subitem[]; // subitens com empresa/RH e lançamentos por parcela
  // Campos calculados para remanejamento (não persistidos diretamente no item)
  remanejamentoDebito?: number; // Total de débitos (saídas)
  remanejamentoCredito?: number; // Total de créditos (entradas)
  valorFinal?: number; // Valor Total - Débito + Crédito
}

interface Rubrica {
  id: string;
  codigo: string;
  nome: string;
  itens: ItemRubrica[];
  expanded: boolean;
}

// Dados mockados iniciais (compatível com ambas as páginas: rubricas e pagamentos)
export const rubricasMock: Rubrica[] = [
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

// Mock de parcelas para a página de pagamentos
export const parcelasMock = [
  { id: 'parc-1', numero: 1, valorRecebido: 250000, dataRecebimento: '2025-02-10' },
  { id: 'parc-2', numero: 2, valorRecebido: 250000, dataRecebimento: '2025-06-20' },
];

// Mock de metas para seleção na página de rubricas
export const metasMock = [
  { id: 'meta-1', numero: 1, titulo: ' Meta 1 - Levantamento de Requisitos' },
  { id: 'meta-2', numero: 2, titulo: ' Meta 2 - Desenvolvimento do Sistema' },
  { id: 'meta-3', numero: 3, titulo: ' Meta 3 - Testes e Validação' },
  { id: 'meta-4', numero: 4, titulo: ' Meta 4 - Implementação e Deploy' },
];

export default function RubricasPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const [rubricas, setRubricas] = useState<Rubrica[]>(rubricasMock);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemRubrica | null>(null);
  const [addingToRubrica, setAddingToRubrica] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<ItemRubrica>>({
    descricao: '',
    quantidade: 1,
    meses: 1,
    valorUnitario: 0,
  });
  const [isAddingRubrica, setIsAddingRubrica] = useState(false);
  const [newRubrica, setNewRubrica] = useState({ codigo: '', nome: '' });
  
  // Estado para remanejamentos
  const [remanejamentos, setRemanejamentos] = useState<Remanejamento[]>([]);
  const [remanejamentoModalOpen, setRemanejamentoModalOpen] = useState(false);
  const [itemParaRemanejamento, setItemParaRemanejamento] = useState<ItemRubrica | null>(null);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };


  // Calcular débitos e créditos por item baseado nos remanejamentos
  const calcularRemanejamentosItem = (itemId: string) => {
    const debito = remanejamentos
      .filter(rem => rem.itemOrigemId === itemId)
      .reduce((acc, rem) => acc + rem.valor, 0);
    
    const credito = remanejamentos
      .filter(rem => rem.itemDestinoId === itemId)
      .reduce((acc, rem) => acc + rem.valor, 0);
    
    return { debito, credito };
  };

  // Calcular valor final do item (Valor Total - Débito + Crédito)
  const calcularValorFinalItem = (item: ItemRubrica) => {
    const { debito, credito } = calcularRemanejamentosItem(item.id);
    return item.valorTotal - debito + credito;
  };

  // Calcular total da rubrica (soma dos valores finais dos itens)
  const calcularTotalRubrica = (rubrica: Rubrica) => {
    return rubrica.itens.reduce((acc, item) => {
      return acc + calcularValorFinalItem(item);
    }, 0);
  };

  // Calcular total geral (soma de todas as rubricas)
  const calcularTotalGeral = () => {
    return rubricas.reduce((acc, rubrica) => acc + calcularTotalRubrica(rubrica), 0);
  };

  // Calcular totais de remanejamento por rubrica
  const calcularRemanejamentosRubrica = (rubrica: Rubrica) => {
    const debito = rubrica.itens.reduce((acc, item) => {
      const { debito: itemDebito } = calcularRemanejamentosItem(item.id);
      return acc + itemDebito;
    }, 0);
    
    const credito = rubrica.itens.reduce((acc, item) => {
      const { credito: itemCredito } = calcularRemanejamentosItem(item.id);
      return acc + itemCredito;
    }, 0);
    
    return { debito, credito };
  };

  // Toggle expandir rubrica
  const toggleExpand = (rubricaId: string) => {
    setRubricas(rubricas.map(r =>
      r.id === rubricaId ? { ...r, expanded: !r.expanded } : r
    ));
  };

  // Adicionar item à rubrica
  const handleAddItem = (rubricaId: string) => {
    if (!newItem.descricao?.trim()) return;

    const valorTotal = (newItem.quantidade || 0) * (newItem.meses || 0) * (newItem.valorUnitario || 0);
    const item: ItemRubrica = {
      id: `${rubricaId}-${Date.now()}`,
      descricao: newItem.descricao,
      quantidade: newItem.quantidade || 1,
      meses: newItem.meses || 1,
      valorUnitario: newItem.valorUnitario || 0,
      valorTotal,
      metaId: newItem.metaId,
    };

    setRubricas(rubricas.map(r => {
      if (r.id === rubricaId) {
        return { ...r, itens: [...r.itens, item], expanded: true };
      }
      return r;
    }));

    setNewItem({
      descricao: '',
      quantidade: 1,
      meses: 1,
      valorUnitario: 0,
      metaId: undefined,
    });
    setAddingToRubrica(null);
  };

  // Iniciar edição
  const handleStartEdit = (item: ItemRubrica) => {
    setEditingItem(item.id);
    setEditForm({ ...item });
  };

  // Salvar edição
  const handleSaveEdit = (rubricaId: string) => {
    if (!editForm) return;

    const valorTotal = editForm.quantidade * editForm.meses * editForm.valorUnitario;

    setRubricas(rubricas.map(r => {
      if (r.id === rubricaId) {
        return {
          ...r,
          itens: r.itens.map(item =>
            item.id === editingItem
              ? { ...editForm, valorTotal }
              : item
          ),
        };
      }
      return r;
    }));

    setEditingItem(null);
    setEditForm(null);
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm(null);
  };

  // Remover item
  const handleRemoveItem = (rubricaId: string, itemId: string) => {
    setRubricas(rubricas.map(r => {
      if (r.id === rubricaId) {
        return { ...r, itens: r.itens.filter(item => item.id !== itemId) };
      }
      return r;
    }));
  };

  // Adicionar nova rubrica
  const handleAddRubrica = () => {
    if (!newRubrica.codigo.trim() || !newRubrica.nome.trim()) return;

    const novaRubrica: Rubrica = {
      id: String(Date.now()),
      codigo: newRubrica.codigo.toUpperCase(),
      nome: newRubrica.nome,
      itens: [],
      expanded: true,
    };

    setRubricas([...rubricas, novaRubrica]);
    setNewRubrica({ codigo: '', nome: '' });
    setIsAddingRubrica(false);
  };

  // Cancelar adição de rubrica
  const handleCancelAddRubrica = () => {
    setNewRubrica({ codigo: '', nome: '' });
    setIsAddingRubrica(false);
  };

  // Remover rubrica
  const handleRemoveRubrica = (rubricaId: string) => {
    if (confirm('Tem certeza que deseja remover esta rubrica? Todos os itens serão removidos.')) {
      setRubricas(rubricas.filter(r => r.id !== rubricaId));
    }
  };

  // Abrir modal de remanejamento
  const handleAbrirRemanejamento = (item: ItemRubrica) => {
    setItemParaRemanejamento(item);
    setRemanejamentoModalOpen(true);
  };

  // Confirmar remanejamento
  const handleConfirmarRemanejamento = async (form: {
    itemOrigemId: string;
    itemDestinoId: string;
    valor: number;
    data: string;
    motivo: string;
  }) => {
    // Criar novo remanejamento
    const novoRemanejamento: Remanejamento = {
      id: `rem-${Date.now()}`,
      contratoId,
      itemOrigemId: form.itemOrigemId,
      itemDestinoId: form.itemDestinoId,
      valor: form.valor,
      data: form.data,
      motivo: form.motivo,
      createdBy: 'Usuário Atual', // TODO: pegar do contexto de auth
      createdAt: new Date().toISOString(),
      status: 'APROVADO',
    };

    // Adicionar à lista de remanejamentos
    setRemanejamentos(prev => [...prev, novoRemanejamento]);

    // TODO: Salvar via API
    // await fetch(`/api/contratos/${contratoId}/rubricas/remanejamentos-itens`, {
    //   method: 'POST',
    //   body: JSON.stringify(novoRemanejamento),
    // });

    setRemanejamentoModalOpen(false);
    setItemParaRemanejamento(null);
  };

  // Obter remanejamentos com dados relacionados para exibição
  const remanejamentosComDados = useMemo(() => {
    return remanejamentos.map(rem => {
      const itemOrigem = rubricas
        .flatMap(r => r.itens)
        .find(item => item.id === rem.itemOrigemId);
      
      const itemDestino = rubricas
        .flatMap(r => r.itens)
        .find(item => item.id === rem.itemDestinoId);
      
      const rubricaOrigem = rubricas.find(r => 
        r.itens.some(item => item.id === rem.itemOrigemId)
      );
      
      const rubricaDestino = rubricas.find(r => 
        r.itens.some(item => item.id === rem.itemDestinoId)
      );

      return {
        ...rem,
        itemOrigem: itemOrigem ? {
          descricao: itemOrigem.descricao,
          codigo: itemOrigem.codigo,
          rubricaNome: rubricaOrigem?.nome || '',
          rubricaCodigo: rubricaOrigem?.codigo || '',
        } : undefined,
        itemDestino: itemDestino ? {
          descricao: itemDestino.descricao,
          codigo: itemDestino.codigo,
          rubricaNome: rubricaDestino?.nome || '',
          rubricaCodigo: rubricaDestino?.codigo || '',
        } : undefined,
      };
    });
  }, [remanejamentos, rubricas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rubricas Orçamentárias</h3>
          <p className="text-sm text-gray-500">
            Gerencie os itens de despesa organizados por categoria orçamentária
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isAddingRubrica && (
            <button
              onClick={() => setIsAddingRubrica(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#004225] text-white text-sm font-medium rounded-lg hover:bg-[#003319] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Rubrica
            </button>
          )}
        </div>
      </div>

      {/* Formulário para adicionar nova rubrica */}
      {isAddingRubrica && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-5 h-5 text-emerald-700" />
            <h4 className="font-medium text-emerald-900">Nova Rubrica</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newRubrica.codigo}
                onChange={(e) => setNewRubrica({ ...newRubrica, codigo: e.target.value.toUpperCase() })}
                placeholder="Ex: MC, PP, OST-PJ"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                maxLength={20}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newRubrica.nome}
                onChange={(e) => setNewRubrica({ ...newRubrica, nome: e.target.value })}
                placeholder="Ex: Material de Consumo"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                maxLength={100}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRubrica}
              disabled={!newRubrica.codigo.trim() || !newRubrica.nome.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Criar Rubrica
            </button>
            <button
              onClick={handleCancelAddRubrica}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Rubricas */}
      <div className="space-y-4">
        {rubricas.map((rubrica) => (
          <div
            key={rubrica.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Header da Rubrica */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleExpand(rubrica.id)}
              >
                {rubrica.expanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <span className="font-mono text-sm text-gray-500 mr-2">[{rubrica.codigo}]</span>
                  <span className="font-medium text-gray-900">{rubrica.nome}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({rubrica.itens.length} {rubrica.itens.length === 1 ? 'item' : 'itens'})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700">
                  {formatCurrency(calcularTotalRubrica(rubrica))}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingToRubrica(rubrica.id);
                    setRubricas(rubricas.map(r =>
                      r.id === rubrica.id ? { ...r, expanded: true } : r
                    ));
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-[#004225] text-white text-sm rounded-md hover:bg-[#003319] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Item
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveRubrica(rubrica.id);
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Remover rubrica"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo expandido */}
            {rubrica.expanded && (
              <div className="px-4 py-3 bg-white">
                {rubrica.itens.length === 0 && !addingToRubrica ? (
                  <div className="flex items-center gap-2 text-gray-500 py-4 justify-center">
                    <AlertCircle className="w-5 h-5" />
                    <span>Nenhum item cadastrado nesta rubrica</span>
                  </div>
                ) : (
                  <ResizableTable
                    columnCount={10}
                    defaultWidths={[250, 80, 80, 130, 130, 120, 120, 130, 200, 120]}
                    minColumnWidth={60}
                    className="text-sm"
                  >
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Descrição</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Qtd</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Meses</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Valor Unit.</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Valor Total</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-red-600">Rem. (Deb.)</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-green-600">Rem. (Créd.)</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-blue-600">Valor Final</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Meta</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                      <tbody>
                        {rubrica.itens.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            {editingItem === item.id && editForm ? (
                              // Modo edição
                              <>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={editForm.descricao}
                                    onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={editForm.quantidade}
                                    onChange={(e) => setEditForm({ ...editForm, quantidade: Number(e.target.value) })}
                                    min={1}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={editForm.meses}
                                    onChange={(e) => setEditForm({ ...editForm, meses: Number(e.target.value) })}
                                    min={1}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <MoneyInput
                                    valueCents={Math.round(editForm.valorUnitario * 100)}
                                    onValueChange={(cents) => setEditForm({ ...editForm, valorUnitario: cents / 100 })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right font-medium text-gray-700">
                                  {formatCurrency(editForm.quantidade * editForm.meses * editForm.valorUnitario)}
                                </td>
                                <td className="py-2 px-2 text-right text-gray-400">—</td>
                                <td className="py-2 px-2 text-right text-gray-400">—</td>
                                <td className="py-2 px-2 text-right text-gray-400">—</td>
                                <td className="py-2 px-2">
                                  <select
                                    value={editForm.metaId || ''}
                                    onChange={(e) => setEditForm({ ...editForm, metaId: e.target.value || undefined })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">Selecione uma meta</option>
                                    {metasMock.map((meta) => (
                                      <option key={meta.id} value={meta.id}>
                                        {meta.numero} - {meta.titulo}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleSaveEdit(rubrica.id)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                      title="Salvar"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                      title="Cancelar"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              // Modo visualização
                              <>
                                <td className="py-2 px-2 text-gray-900">{item.descricao}</td>
                                <td className="py-2 px-2 text-right text-gray-700">{item.quantidade}</td>
                                <td className="py-2 px-2 text-right text-gray-700">{item.meses}</td>
                                <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(item.valorUnitario)}</td>
                                <td className="py-2 px-2 text-right font-medium text-gray-900">{formatCurrency(item.valorTotal)}</td>
                                <td className="py-2 px-2 text-right">
                                  {(() => {
                                    const { debito } = calcularRemanejamentosItem(item.id);
                                    return debito > 0 ? (
                                      <span className="text-red-600 font-medium">{formatCurrency(debito)}</span>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    );
                                  })()}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  {(() => {
                                    const { credito } = calcularRemanejamentosItem(item.id);
                                    return credito > 0 ? (
                                      <span className="text-green-600 font-medium">{formatCurrency(credito)}</span>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    );
                                  })()}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <span className="font-semibold text-blue-600">
                                    {formatCurrency(calcularValorFinalItem(item))}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-gray-700">
                                  {item.metaId
                                    ? metasMock.find((m) => m.id === item.metaId)?.titulo || item.meta || '-'
                                    : item.meta || '-'}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleAbrirRemanejamento(item)}
                                      className="p-1 text-[#004225] hover:bg-emerald-50 rounded"
                                      title="Remanejar"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-down-icon lucide-arrow-up-down">
                                        <path d="m21 16-4 4-4-4"/>
                                        <path d="M17 20V4"/>
                                        <path d="m3 8 4-4 4 4"/>
                                        <path d="M7 4v16"/>
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleStartEdit(item)}
                                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveItem(rubrica.id, item.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Remover"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}

                        {/* Form para adicionar novo item */}
                        {addingToRubrica === rubrica.id && (
                          <tr className="bg-blue-50">
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={newItem.descricao || ''}
                                onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })}
                                placeholder="Descrição do item"
                                className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                                autoFocus
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={newItem.quantidade || 1}
                                onChange={(e) => setNewItem({ ...newItem, quantidade: Number(e.target.value) })}
                                min={1}
                                className="w-full px-2 py-1 border border-blue-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={newItem.meses || 1}
                                onChange={(e) => setNewItem({ ...newItem, meses: Number(e.target.value) })}
                                min={1}
                                className="w-full px-2 py-1 border border-blue-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <MoneyInput
                                valueCents={Math.round((newItem.valorUnitario || 0) * 100)}
                                onValueChange={(cents) => setNewItem({ ...newItem, valorUnitario: cents / 100 })}
                                className="w-full px-2 py-1 border border-blue-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-blue-700">
                              {formatCurrency((newItem.quantidade || 0) * (newItem.meses || 0) * (newItem.valorUnitario || 0))}
                            </td>
                            <td className="py-2 px-2 text-right text-gray-400">—</td>
                            <td className="py-2 px-2 text-right text-gray-400">—</td>
                            <td className="py-2 px-2 text-right text-gray-400">—</td>
                            <td className="py-2 px-2">
                              <select
                                value={newItem.metaId || ''}
                                onChange={(e) => setNewItem({ ...newItem, metaId: e.target.value || undefined })}
                                className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                              >
                                <option value="">Selecione uma meta</option>
                                {metasMock.map((meta) => (
                                  <option key={meta.id} value={meta.id}>
                                    {meta.numero} - {meta.titulo}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleAddItem(rubrica.id)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                  title="Adicionar"
                                  disabled={!newItem.descricao?.trim()}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setAddingToRubrica(null);
                                    setNewItem({
                                      descricao: '',
                                      quantidade: 1,
                                      meses: 1,
                                      valorUnitario: 0,
                                      metaId: undefined,
                                    });
                                  }}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </ResizableTable>
                )}

                {/* Botão adicionar quando não há form visível */}
                {rubrica.itens.length === 0 && addingToRubrica !== rubrica.id && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={() => setAddingToRubrica(rubrica.id)}
                      className="flex items-center gap-1 px-4 py-2 text-[#004225] hover:bg-emerald-50 rounded-md text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar primeiro item
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumo por rubrica */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Resultado por Rubrica</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rubricas.filter(r => r.itens.length > 0).map((rubrica) => (
            <div key={rubrica.id} className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 font-mono">[{rubrica.codigo}]</p>
              <p className="text-sm font-medium text-gray-700 truncate">{rubrica.nome}</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(calcularTotalRubrica(rubrica))}
              </p>
              <p className="text-xs text-gray-500">{rubrica.itens.length} itens</p>
            </div>
          ))}
        </div>

        {/* Total Geral no rodapé */}
        <div className="mt-4 pt-4 border-t border-gray-300 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Geral de Rubricas</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(calcularTotalGeral())}
            </p>
          </div>

        </div>
      </div>

      {/* Modais */}
      {itemParaRemanejamento && (
        <RemanejamentoModal
          isOpen={remanejamentoModalOpen}
          onClose={() => {
            setRemanejamentoModalOpen(false);
            setItemParaRemanejamento(null);
          }}
          onConfirm={handleConfirmarRemanejamento}
          itemOrigem={itemParaRemanejamento}
          rubricas={rubricas}
          contratoId={contratoId}
        />
      )}

      <HistoricoRemanejamentos
        isOpen={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        remanejamentos={remanejamentosComDados}
        contratoId={contratoId}
      />
    </div>
  );
}

