'use client';

import { useMemo, useState, Fragment } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Pencil,
  Save,
} from 'lucide-react';
import { rubricasMock, parcelasMock } from '../rubricas/page';

type ID = string;

type Lancamento = {
  valor: number;    // valor pago daquele subitem na parcela
  dataPag: string;  // data do pagamento (AAAA-MM-DD)
};

type Subitem = {
  id: ID;
  empresaRh: string; // "Empresa/RH" na planilha
  lancamentos: Record<ID, Lancamento | undefined>; // chave = parcelaId
};

type ItemRubrica = {
  id: ID;
  codigo?: string; // ex: "2.4"
  descricao: string; // ex: "Bolsa Ministério"
  quantidade: number;
  meses: number;
  valorUnitario: number;
  meta?: string;
  subitens?: Subitem[];
};

type Rubrica = {
  id: ID;
  codigo: string; // código da rubrica (ex: "MC", "PP")
  nome: string; // ex: "Auxílio financeiro a pesquisadores (33.90.20)"
  expanded: boolean;
  itens: ItemRubrica[];
};

type Parcela = {
  id: ID;
  numero: number; // 1,2,3...
  valorRecebido: number;
  dataRecebimento: string; // AAAA-MM-DD (entrada de recurso)
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function ordinal(n: number) {
  return `${n}º`;
}

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getLancamento(sub: Subitem, parcelaId: ID): Lancamento {
  return sub.lancamentos[parcelaId] ?? { valor: 0, dataPag: '' };
}

export default function PagamentosPlanilhaPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [parcelas, setParcelas] = useState<Parcela[]>(parcelasMock);
  const [rubricas, setRubricas] = useState<Rubrica[]>(rubricasMock);

  // UI: adicionar/editar parcela
  const [isAddingParcela, setIsAddingParcela] = useState(false);
  const [newParcela, setNewParcela] = useState<{ valorRecebido: number; dataRecebimento: string }>({
    valorRecebido: 0,
    dataRecebimento: '',
  });

  const [editingParcelaId, setEditingParcelaId] = useState<ID | null>(null);
  const [editParcelaForm, setEditParcelaForm] = useState<Parcela | null>(null);

  // UI: adicionar subitem por item
  const [addingToItemId, setAddingToItemId] = useState<ID | null>(null);
  const [newSubitemEmpresa, setNewSubitemEmpresa] = useState('');

  // UI: modo de edição global dos subitens
  const [isEditingSubitens, setIsEditingSubitens] = useState(false);

  // Helpers de cálculo
  const calcularTotalOrcadoItem = (item: ItemRubrica) =>
    safeNumber(item.quantidade) * safeNumber(item.meses) * safeNumber(item.valorUnitario);

  const calcularTotalPagoSubitem = (sub: Subitem) =>
    parcelas.reduce((acc, p) => acc + safeNumber(getLancamento(sub, p.id).valor), 0);

  const calcularTotalPagoItem = (item: ItemRubrica) =>
    (item.subitens || []).reduce((acc, s) => acc + calcularTotalPagoSubitem(s), 0);

  const calcularPagoItemPorParcela = (item: ItemRubrica, parcelaId: ID) =>
    (item.subitens || []).reduce((acc, s) => acc + safeNumber(getLancamento(s, parcelaId).valor), 0);

  const calcularTotalOrcadoRubrica = (rub: Rubrica) =>
    rub.itens.reduce((acc, it) => acc + calcularTotalOrcadoItem(it), 0);

  const calcularTotalPagoRubrica = (rub: Rubrica) =>
    rub.itens.reduce((acc, it) => acc + calcularTotalPagoItem(it), 0);

  const totalRecebido = useMemo(
    () => parcelas.reduce((acc, p) => acc + safeNumber(p.valorRecebido), 0),
    [parcelas]
  );

  const totalPago = useMemo(() => {
    let sum = 0;
    for (const r of rubricas) {
      for (const it of r.itens) {
        for (const s of it.subitens || []) {
          for (const p of parcelas) {
            sum += safeNumber(getLancamento(s, p.id).valor);
          }
        }
      }
    }
    return sum;
  }, [rubricas, parcelas]);

  const saldoTotalContrato = totalRecebido - totalPago;

  const totalPagoPorParcela = useMemo(() => {
    const map = new Map<ID, number>();
    for (const p of parcelas) map.set(p.id, 0);

    for (const r of rubricas) {
      for (const it of r.itens) {
        for (const s of it.subitens || []) {
          for (const p of parcelas) {
            map.set(p.id, (map.get(p.id) || 0) + safeNumber(getLancamento(s, p.id).valor));
          }
        }
      }
    }

    return map;
  }, [rubricas, parcelas]);

  const saldoParcela = (p: Parcela) => safeNumber(p.valorRecebido) - (totalPagoPorParcela.get(p.id) || 0);

  // Ações: Rubricas (expand/collapse)
  const toggleRubrica = (rubricaId: ID) => {
    setRubricas(prev => prev.map(r => (r.id === rubricaId ? { ...r, expanded: !r.expanded } : r)));
  };

  // Ações: Parcelas
  const handleAddParcela = () => {
    if (!newParcela.dataRecebimento) return;
    if (!newParcela.valorRecebido || newParcela.valorRecebido <= 0) return;

    const nextNumero = (Math.max(0, ...parcelas.map(p => p.numero)) || 0) + 1;

    const p: Parcela = {
      id: `parc-${Date.now()}`,
      numero: nextNumero,
      valorRecebido: safeNumber(newParcela.valorRecebido),
      dataRecebimento: newParcela.dataRecebimento,
    };

    setParcelas(prev => [...prev, p]);
    setNewParcela({ valorRecebido: 0, dataRecebimento: '' });
    setIsAddingParcela(false);
  };

  const handleStartEditParcela = (p: Parcela) => {
    setEditingParcelaId(p.id);
    setEditParcelaForm({ ...p });
  };

  const handleCancelEditParcela = () => {
    setEditingParcelaId(null);
    setEditParcelaForm(null);
  };

  const handleSaveEditParcela = () => {
    if (!editParcelaForm) return;
    if (!editParcelaForm.dataRecebimento) return;
    if (!editParcelaForm.valorRecebido || editParcelaForm.valorRecebido <= 0) return;

    setParcelas(prev =>
      prev.map(p => (p.id === editingParcelaId ? { ...p, ...editParcelaForm } : p))
    );

    setEditingParcelaId(null);
    setEditParcelaForm(null);
  };

  const handleRemoveParcela = (parcelaId: ID) => {
    const alvo = parcelas.find(p => p.id === parcelaId);
    if (!alvo) return;

    if (!confirm(`Remover a parcela ${ordinal(alvo.numero)}? Isso remove as colunas correspondentes da planilha.`)) {
      return;
    }

    // 1) Remove a parcela
    const novasParcelas = parcelas
      .filter(p => p.id !== parcelaId)
      .sort((a, b) => a.numero - b.numero)
      .map((p, idx) => ({ ...p, numero: idx + 1 })); // reindex para manter 1º,2º...

    setParcelas(novasParcelas);

    // 2) Remove os lançamentos dessa parcela dos subitens
    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it => ({
          ...it,
          subitens: (it.subitens || []).map(s => {
            const { [parcelaId]: _removed, ...rest } = s.lancamentos;
            return { ...s, lancamentos: rest };
          }),
        })),
      }))
    );
  };

  // Ações: Subitens
  const handleAddSubitem = (itemId: ID) => {
    if (!newSubitemEmpresa.trim()) return;

    const sub: Subitem = {
      id: `sub-${Date.now()}`,
      empresaRh: newSubitemEmpresa.trim(),
      lancamentos: {},
    };

    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it => (it.id === itemId ? { ...it, subitens: [...(it.subitens || []), sub] } : it)),
      }))
    );

    setNewSubitemEmpresa('');
    setAddingToItemId(null);
  };

  const handleRemoveSubitem = (itemId: ID, subitemId: ID) => {
    if (!confirm('Remover este subitem?')) return;

    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it =>
          it.id === itemId ? { ...it, subitens: (it.subitens || []).filter(s => s.id !== subitemId) } : it
        ),
      }))
    );
  };

  const updateSubitemEmpresa = (itemId: ID, subitemId: ID, empresaRh: string) => {
    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            subitens: (it.subitens || []).map(s => (s.id === subitemId ? { ...s, empresaRh } : s)),
          };
        }),
      }))
    );
  };

  const updateLancamentoCampo = (
    itemId: ID,
    subitemId: ID,
    parcelaId: ID,
    patch: Partial<Lancamento>
  ) => {
    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it => {
          if (it.id !== itemId) return it;

          return {
            ...it,
            subitens: (it.subitens || []).map(s => {
              if (s.id !== subitemId) return s;

              const atual = getLancamento(s, parcelaId);
              const prox: Lancamento = {
                valor: Math.max(0, safeNumber(patch.valor ?? atual.valor)),
                dataPag: (patch.dataPag ?? atual.dataPag) || '',
              };

              return {
                ...s,
                lancamentos: {
                  ...s.lancamentos,
                  [parcelaId]: prox,
                },
              };
            }),
          };
        }),
      }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumo topo */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Resumo Financeiro</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Total Recebido (parcelas)</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalRecebido)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Total Pago (lançamentos)</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalPago)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Saldo Total do Contrato</p>
            <p className={`text-xl font-semibold ${saldoTotalContrato < 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(saldoTotalContrato)}
            </p>
          </div>
        </div>
      </div>

      {/* Entrada de Recurso (Parcelas) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
          <div>
            <h4 className="font-medium text-gray-900">Entrada de recurso (Parcelas recebidas)</h4>
            <p className="text-xs text-gray-500">Essas parcelas geram as colunas 1º, 2º, 3º… na planilha.</p>
          </div>

          {!isAddingParcela && (
            <div className="flex items-center gap-2">
              {isEditingSubitens && (
                <button
                  onClick={() => setIsEditingSubitens(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              )}
              <button
                onClick={() => setIsEditingSubitens(!isEditingSubitens)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isEditingSubitens
                    ? 'bg-[#003319] text-white'
                    : 'bg-[#004225] text-white hover:bg-[#003319]'}
                  `}
              >
                {isEditingSubitens ? (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    Editar
                  </>
                )}
              </button>
              <button
                onClick={() => setIsAddingParcela(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#004225] text-white text-sm font-medium rounded-lg hover:bg-[#003319] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Parcela
              </button>
            </div>
          )}
        </div>

        {isAddingParcela && (
          <div className="border-t border-gray-200 p-4 bg-emerald-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Valor recebido <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newParcela.valorRecebido}
                  onChange={(e) => setNewParcela(v => ({ ...v, valorRecebido: safeNumber(e.target.value) }))}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(newParcela.valorRecebido)}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data de recebimento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newParcela.dataRecebimento}
                  onChange={(e) => setNewParcela(v => ({ ...v, dataRecebimento: e.target.value }))}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddParcela}
                disabled={!newParcela.dataRecebimento || newParcela.valorRecebido <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Criar
              </button>
              <button
                onClick={() => {
                  setIsAddingParcela(false);
                  setNewParcela({ valorRecebido: 0, dataRecebimento: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-200 bg-white">
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-28">Parcela</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 w-48">Valor Recebido</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 w-44">Data Receb.</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 w-48">Total Pago</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 w-48">Saldo</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Nenhuma parcela cadastrada
                    </div>
                  </td>
                </tr>
              ) : (
                parcelas
                  .slice()
                  .sort((a, b) => a.numero - b.numero)
                  .map((p) => {
                    const pago = totalPagoPorParcela.get(p.id) || 0;
                    const saldo = safeNumber(p.valorRecebido) - pago;

                    return (
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                        {editingParcelaId === p.id && editParcelaForm ? (
                          <>
                            <td className="py-2 px-3 font-medium text-gray-900">{ordinal(p.numero)}</td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={editParcelaForm.valorRecebido}
                                onChange={(e) => setEditParcelaForm(v => (v ? { ...v, valorRecebido: safeNumber(e.target.value) } : v))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                value={editParcelaForm.dataRecebimento}
                                onChange={(e) => setEditParcelaForm(v => (v ? { ...v, dataRecebimento: e.target.value } : v))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-gray-900">{formatCurrency(pago)}</td>
                            <td className={`py-2 px-3 text-right font-semibold ${saldo < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {formatCurrency(saldo)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={handleSaveEditParcela}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Salvar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEditParcela}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 font-medium text-gray-900">{ordinal(p.numero)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-gray-900">{formatCurrency(p.valorRecebido)}</td>
                            <td className="py-2 px-3 text-gray-700">{p.dataRecebimento || '-'}</td>
                            <td className="py-2 px-3 text-right font-medium text-gray-900">{formatCurrency(pago)}</td>
                            <td className={`py-2 px-3 text-right font-semibold ${saldo < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {formatCurrency(saldo)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleStartEditParcela(p)}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveParcela(p.id)}
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
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rubricas / Itens / Subitens (Planilha) */}
      <div className="space-y-4">
        {rubricas.map((rub) => {
          const orcadoRub = calcularTotalOrcadoRubrica(rub);
          const pagoRub = calcularTotalPagoRubrica(rub);
          const saldoRub = orcadoRub - pagoRub;

          return (
            <div key={rub.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header rubrica */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleRubrica(rub.id)}>
                  {rub.expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{rub.nome}</span>
                    <span className="text-xs text-gray-500">
                      Orçado: {formatCurrency(orcadoRub)} • Pago: {formatCurrency(pagoRub)} •{' '}
                      <span className={saldoRub < 0 ? 'text-red-600 font-semibold' : 'text-blue-600 font-semibold'}>
                        Saldo: {formatCurrency(saldoRub)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              {rub.expanded && (
                <div className="px-4 py-3 bg-white">
                  {rub.itens.length === 0 ? (
                    <div className="flex items-center gap-2 text-gray-500 py-6 justify-center">
                      <AlertCircle className="w-5 h-5" />
                      <span>Nenhum item cadastrado nesta rubrica</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          {/* Header agrupado (colSpan) */}
                          <tr className="border-b border-gray-200">
                            <th rowSpan={2} className="text-left py-2 px-2 font-medium text-gray-600 w-20">Código</th>
                            <th rowSpan={2} className="text-left py-2 px-2 font-medium text-gray-600 min-w-[260px]">Item</th>
                            <th rowSpan={2} className="text-right py-2 px-2 font-medium text-gray-600 w-24">Qtd</th>
                            <th rowSpan={2} className="text-right py-2 px-2 font-medium text-gray-600 w-24">Meses</th>
                            <th rowSpan={2} className="text-right py-2 px-2 font-medium text-gray-600 w-32">Valor unit.</th>
                            <th rowSpan={2} className="text-right py-2 px-2 font-medium text-gray-600 w-36">Total</th>
                            <th rowSpan={2} className="text-left py-2 px-2 font-medium text-gray-600 min-w-[200px]">Meta</th>
                            <th rowSpan={2} className="text-left py-2 px-2 font-medium text-gray-600 min-w-[240px]">Subitem</th>

                            {parcelas
                              .slice()
                              .sort((a, b) => a.numero - b.numero)
                              .map((p) => (
                                <th
                                  key={p.id}
                                  colSpan={2}
                                  className="text-center py-2 px-2 font-medium text-gray-600 min-w-[240px]"
                                >
                                  <div className="font-semibold text-gray-800">{ordinal(p.numero)} PAGAMENTO</div>
                                  <div className="text-xs text-gray-500">{formatCurrency(p.valorRecebido)}</div>
                                  <div className="text-xs text-gray-500">{p.dataRecebimento || '-'}</div>
                                </th>
                              ))}

                            <th rowSpan={2} className="text-right py-2 px-2 font-medium text-gray-600 w-36">SALDO</th>
                          </tr>

                          <tr className="border-b border-gray-200">
                            {parcelas
                              .slice()
                              .sort((a, b) => a.numero - b.numero)
                              .flatMap((p) => [
                                <th key={`${p.id}-valor`} className="text-center py-2 px-2 font-medium text-gray-600 w-32">
                                  Valor
                                </th>,
                                <th key={`${p.id}-data`} className="text-center py-2 px-2 font-medium text-gray-600 w-36">
                                  Data de pag.
                                </th>,
                              ])}
                          </tr>
                        </thead>

                        <tbody>
                          {rub.itens.map((it) => {
                            const totalItem = calcularTotalOrcadoItem(it);
                            const pagoItem = calcularTotalPagoItem(it);
                            const saldoItem = totalItem - pagoItem;

                            return (
                              <Fragment key={it.id}>
                                {/* Linha do ITEM (pai) */}
                                <tr className="border-b border-gray-100 bg-gray-50">
                                  <td className="py-2 px-2 font-mono text-gray-700">{it.codigo}</td>
                                  <td className="py-2 px-2 font-medium text-gray-900">{it.descricao}</td>
                                  <td className="py-2 px-2 text-right text-gray-700">{it.quantidade}</td>
                                  <td className="py-2 px-2 text-right text-gray-700">{it.meses}</td>
                                  <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(it.valorUnitario)}</td>
                                  <td className="py-2 px-2 text-right font-semibold text-gray-900">{formatCurrency(totalItem)}</td>
                                  <td className="py-2 px-2 text-gray-700">{it.meta || '-'}</td>

                                  <td className="py-2 px-2">
                                    {addingToItemId !== it.id ? (
                                      <button
                                        onClick={() => setAddingToItemId(it.id)}
                                        disabled={!isEditingSubitens}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
                                          isEditingSubitens
                                            ? 'text-[#004225] hover:bg-emerald-50'
                                            : 'text-gray-400 cursor-not-allowed bg-gray-100'
                                        }`}
                                      >
                                        <Plus className="w-4 h-4" />
                                        Novo subitem
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={newSubitemEmpresa}
                                          onChange={(e) => setNewSubitemEmpresa(e.target.value)}
                                          className="w-full px-2 py-1 border border-emerald-300 rounded text-sm"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleAddSubitem(it.id)}
                                          disabled={!newSubitemEmpresa.trim()}
                                          className="p-1 text-green-700 hover:bg-green-50 rounded disabled:opacity-50"
                                          title="Adicionar"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setAddingToItemId(null);
                                            setNewSubitemEmpresa('');
                                          }}
                                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                          title="Cancelar"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </td>

                                  {/* Totais por parcela (somatório dos subitens) */}
                                  {parcelas
                                    .slice()
                                    .sort((a, b) => a.numero - b.numero)
                                    .flatMap((p) => {
                                      const totalParcelaItem = calcularPagoItemPorParcela(it, p.id);

                                      return [
                                        <td key={`${it.id}-${p.id}-sum`} className="py-2 px-2 text-right font-medium text-gray-900">
                                          {formatCurrency(totalParcelaItem)}
                                        </td>,
                                        <td key={`${it.id}-${p.id}-dash`} className="py-2 px-2 text-gray-400">
                                          
                                        </td>,
                                      ];
                                    })}

                                  <td className={`py-2 px-2 text-right font-semibold ${saldoItem < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {formatCurrency(saldoItem)}
                                  </td>
                                </tr>

                                {/* Linhas de SUBITENS (filhas) */}
                                {(!it.subitens || it.subitens.length === 0) ? (
                                  <tr key={`${it.id}-empty`} className="border-b border-gray-100">
                                    <td colSpan={8 + parcelas.length * 2 + 1} className="py-4 text-center text-gray-500">
                                      Nenhum subitem cadastrado para este item
                                    </td>
                                  </tr>
                                ) : (
                                  it.subitens.map((sub) => {
                                    const totalSub = calcularTotalPagoSubitem(sub);

                                    return (
                                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>

                                        <td className="py-2 px-2">
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="text"
                                              value={sub.empresaRh}
                                              onChange={(e) => updateSubitemEmpresa(it.id, sub.id, e.target.value)}
                                              disabled={!isEditingSubitens}
                                              className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${
                                                isEditingSubitens
                                                  ? 'bg-white'
                                                  : 'bg-gray-50 cursor-not-allowed'
                                              }`}
                                            />
                                            {isEditingSubitens && (
                                              <button
                                                onClick={() => handleRemoveSubitem(it.id, sub.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Remover subitem"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            Total lançado: <span className="font-medium">{formatCurrency(totalSub)}</span>
                                          </p>
                                        </td>

                                        {parcelas
                                          .slice()
                                          .sort((a, b) => a.numero - b.numero)
                                          .flatMap((p) => {
                                            const cell = getLancamento(sub, p.id);

                                            return [
                                              <td key={`${sub.id}-${p.id}-v`} className="py-2 px-2 text-center">
                                                {isEditingSubitens ? (
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={cell.valor}
                                                    onChange={(e) =>
                                                      updateLancamentoCampo(it.id, sub.id, p.id, { valor: safeNumber(e.target.value) })
                                                    }
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right bg-white"
                                                  />
                                                ) : (
                                                  <div className="text-right text-gray-700 py-1 px-2">
                                                    {formatCurrency(cell.valor)}
                                                  </div>
                                                )}
                                              </td>,
                                              <td key={`${sub.id}-${p.id}-d`} className="py-2 px-2 text-center">
                                                {isEditingSubitens ? (
                                                  <input
                                                    type="date"
                                                    value={cell.dataPag || ''}
                                                    onChange={(e) =>
                                                      updateLancamentoCampo(it.id, sub.id, p.id, { dataPag: e.target.value })
                                                    }
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                                                  />
                                                ) : (
                                                  <div className="text-gray-700 py-1 px-2">
                                                    {cell.dataPag || '-'}
                                                  </div>
                                                )}
                                              </td>,
                                            ];
                                          })}

                                        {/* SALDO: não se aplica para subitem (na planilha costuma ficar no item). */}
                                        <td className="py-2 px-2 text-right text-gray-400">—</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo por parcela (saldo de cada pagamento) */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Saldo por Pagamento (Parcela)</h4>

        {parcelas.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-500 py-6 justify-center bg-white rounded-lg border border-gray-200">
            <AlertCircle className="w-5 h-5" />
            <span>Cadastre parcelas para visualizar os saldos</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {parcelas
              .slice()
              .sort((a, b) => a.numero - b.numero)
              .map((p) => {
                const pago = totalPagoPorParcela.get(p.id) || 0;
                const saldo = safeNumber(p.valorRecebido) - pago;

                return (
                  <div key={p.id} className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">{ordinal(p.numero)} PAGAMENTO</p>
                    <p className="text-sm text-gray-700">Recebido: <span className="font-semibold">{formatCurrency(p.valorRecebido)}</span></p>
                    <p className="text-sm text-gray-700">Pago: <span className="font-semibold">{formatCurrency(pago)}</span></p>
                    <p className={`text-lg font-semibold ${saldo < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      Saldo: {formatCurrency(saldo)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Data receb.: {p.dataRecebimento || '-'}</p>
                  </div>
                );
              })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-300 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-600">Saldo Total do Contrato</p>
            <p className={`text-2xl font-bold ${saldoTotalContrato < 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(saldoTotalContrato)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
