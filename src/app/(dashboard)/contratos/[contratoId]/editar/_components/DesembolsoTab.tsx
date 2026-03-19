'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';

// Props
interface DesembolsoTabProps {
  contratoId?: string;
}

// Tipos
interface Parcela {
  id: string;
  numero: number;
  descricao: string;
  rubricaVinculada: string;
  metaVinculada: string;
  dataPrevista: string;
  dataEfetiva: string | null;
  valorPrevisto: number;
  valorLiberado: number | null;
  status: 'PENDENTE' | 'LIBERADO' | 'ATRASADO' | 'CANCELADO';
  observacao: string;
}

// Dados mockados
const parcelasMock: Parcela[] = [
  {
    id: '1',
    numero: 1,
    descricao: 'Primeira parcela - Início do projeto',
    rubricaVinculada: 'Material de Consumo',
    metaVinculada: 'Meta 1 - Planejamento',
    dataPrevista: '2024-02-15',
    dataEfetiva: '2024-02-18',
    valorPrevisto: 50000.00,
    valorLiberado: 50000.00,
    status: 'LIBERADO',
    observacao: 'Liberado com 3 dias de atraso',
  },
  {
    id: '2',
    numero: 2,
    descricao: 'Segunda parcela - Execução fase 1',
    rubricaVinculada: 'Pagamento de Pessoal',
    metaVinculada: 'Meta 2 - Execução',
    dataPrevista: '2024-05-15',
    dataEfetiva: null,
    valorPrevisto: 75000.00,
    valorLiberado: null,
    status: 'PENDENTE',
    observacao: '',
  },
  {
    id: '3',
    numero: 3,
    descricao: 'Terceira parcela - Execução fase 2',
    rubricaVinculada: 'Outros Serviços de Terceiros',
    metaVinculada: 'Meta 2 - Execução',
    dataPrevista: '2024-08-15',
    dataEfetiva: null,
    valorPrevisto: 60000.00,
    valorLiberado: null,
    status: 'PENDENTE',
    observacao: '',
  },
  {
    id: '4',
    numero: 4,
    descricao: 'Quarta parcela - Finalização',
    rubricaVinculada: 'Equipamentos',
    metaVinculada: 'Meta 3 - Encerramento',
    dataPrevista: '2024-11-15',
    dataEfetiva: null,
    valorPrevisto: 45000.00,
    valorLiberado: null,
    status: 'PENDENTE',
    observacao: '',
  },
];

// Opções de rubricas e metas (simplificado)
const rubricasOptions = [
  'Material de Consumo',
  'Pagamento de Pessoal',
  'Outros Serviços de Terceiros',
  'Viagens e Diárias',
  'Equipamentos',
];

const metasOptions = [
  'Meta 1 - Planejamento',
  'Meta 2 - Execução',
  'Meta 3 - Encerramento',
];

export default function DesembolsoTab({ contratoId }: DesembolsoTabProps) {
  const [parcelas, setParcelas] = useState<Parcela[]>(parcelasMock);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Parcela | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newParcela, setNewParcela] = useState<Partial<Parcela>>({
    descricao: '',
    rubricaVinculada: '',
    metaVinculada: '',
    dataPrevista: '',
    valorPrevisto: 0,
    observacao: '',
  });

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // Calcular totais
  const totalPrevisto = parcelas.reduce((acc, p) => acc + p.valorPrevisto, 0);
  const totalLiberado = parcelas.reduce((acc, p) => acc + (p.valorLiberado || 0), 0);
  const percentualLiberado = totalPrevisto > 0 ? (totalLiberado / totalPrevisto) * 100 : 0;

  // Status badge
  const getStatusBadge = (status: Parcela['status']) => {
    const styles = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      LIBERADO: 'bg-green-100 text-green-800',
      ATRASADO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      PENDENTE: 'Pendente',
      LIBERADO: 'Liberado',
      ATRASADO: 'Atrasado',
      CANCELADO: 'Cancelado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Adicionar parcela
  const handleAdd = () => {
    if (!newParcela.descricao?.trim() || !newParcela.dataPrevista || !newParcela.valorPrevisto) return;

    const novaParcela: Parcela = {
      id: Date.now().toString(),
      numero: parcelas.length + 1,
      descricao: newParcela.descricao,
      rubricaVinculada: newParcela.rubricaVinculada || '',
      metaVinculada: newParcela.metaVinculada || '',
      dataPrevista: newParcela.dataPrevista,
      dataEfetiva: null,
      valorPrevisto: newParcela.valorPrevisto,
      valorLiberado: null,
      status: 'PENDENTE',
      observacao: newParcela.observacao || '',
    };

    setParcelas([...parcelas, novaParcela]);
    setNewParcela({
      descricao: '',
      rubricaVinculada: '',
      metaVinculada: '',
      dataPrevista: '',
      valorPrevisto: 0,
      observacao: '',
    });
    setIsAdding(false);
  };

  // Iniciar edição
  const handleStartEdit = (parcela: Parcela) => {
    setEditingId(parcela.id);
    setEditForm({ ...parcela });
  };

  // Salvar edição
  const handleSaveEdit = () => {
    if (!editForm) return;

    setParcelas(parcelas.map(p =>
      p.id === editingId ? editForm : p
    ));
    setEditingId(null);
    setEditForm(null);
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  // Remover parcela
  const handleRemove = (id: string) => {
    setParcelas(parcelas.filter(p => p.id !== id).map((p, idx) => ({ ...p, numero: idx + 1 })));
  };

  // Marcar como liberado
  const handleMarkAsReleased = (id: string) => {
    setParcelas(parcelas.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'LIBERADO' as const,
          dataEfetiva: new Date().toISOString().split('T')[0],
          valorLiberado: p.valorPrevisto,
        };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cronograma de Desembolso</h3>
          <p className="text-sm text-gray-500">
            Gerencie as parcelas de liberação de recursos do contrato
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nova Parcela
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total de Parcelas</p>
          <p className="text-2xl font-bold text-gray-900">{parcelas.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Valor Previsto Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrevisto)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Valor Liberado</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalLiberado)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">% Liberado</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-blue-600">{percentualLiberado.toFixed(1)}%</p>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(percentualLiberado, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form para nova parcela */}
      {isAdding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-4">Nova Parcela</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
              <input
                type="text"
                value={newParcela.descricao || ''}
                onChange={(e) => setNewParcela({ ...newParcela, descricao: e.target.value })}
                placeholder="Ex: Primeira parcela - Início do projeto"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista *</label>
              <DatePicker
                value={newParcela.dataPrevista || ''}
                onChange={(value) => setNewParcela({ ...newParcela, dataPrevista: value })}
                placeholder="Selecione a data"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rubrica Vinculada</label>
              <select
                value={newParcela.rubricaVinculada || ''}
                onChange={(e) => setNewParcela({ ...newParcela, rubricaVinculada: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Selecione...</option>
                {rubricasOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Vinculada</label>
              <select
                value={newParcela.metaVinculada || ''}
                onChange={(e) => setNewParcela({ ...newParcela, metaVinculada: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Selecione...</option>
                {metasOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Previsto *</label>
              <input
                type="number"
                value={newParcela.valorPrevisto || ''}
                onChange={(e) => setNewParcela({ ...newParcela, valorPrevisto: Number(e.target.value) })}
                placeholder="0,00"
                min={0}
                step={0.01}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <input
                type="text"
                value={newParcela.observacao || ''}
                onChange={(e) => setNewParcela({ ...newParcela, observacao: e.target.value })}
                placeholder="Observações adicionais (opcional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewParcela({
                  descricao: '',
                  rubricaVinculada: '',
                  metaVinculada: '',
                  dataPrevista: '',
                  valorPrevisto: 0,
                  observacao: '',
                });
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!newParcela.descricao?.trim() || !newParcela.dataPrevista || !newParcela.valorPrevisto}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar Parcela
            </button>
          </div>
        </div>
      )}

      {/* Lista de parcelas */}
      {parcelas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma parcela cadastrada</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            + Adicionar primeira parcela
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">#</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rubrica</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Meta</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Data Prevista</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Data Efetiva</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Valor Previsto</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Valor Liberado</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((parcela) => (
                <tr key={parcela.id} className="border-b border-gray-100 hover:bg-gray-50">
                  {editingId === parcela.id && editForm ? (
                    // Modo edição
                    <>
                      <td className="py-3 px-4 font-medium text-gray-500">{parcela.numero}</td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.descricao}
                          onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.rubricaVinculada}
                          onChange={(e) => setEditForm({ ...editForm, rubricaVinculada: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Selecione...</option>
                          {rubricasOptions.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.metaVinculada}
                          onChange={(e) => setEditForm({ ...editForm, metaVinculada: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Selecione...</option>
                          {metasOptions.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <DatePicker
                          value={editForm.dataPrevista}
                          onChange={(value) => setEditForm({ ...editForm, dataPrevista: value })}
                          placeholder="Selecione a data"
                          className="w-full min-w-[150px]"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <DatePicker
                          value={editForm.dataEfetiva || ''}
                          onChange={(value) =>
                            setEditForm({ ...editForm, dataEfetiva: value || null })
                          }
                          placeholder="Selecione a data"
                          className="w-full min-w-[150px]"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={editForm.valorPrevisto}
                          onChange={(e) => setEditForm({ ...editForm, valorPrevisto: Number(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={editForm.valorLiberado || ''}
                          onChange={(e) => setEditForm({ ...editForm, valorLiberado: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Parcela['status'] })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="PENDENTE">Pendente</option>
                          <option value="LIBERADO">Liberado</option>
                          <option value="ATRASADO">Atrasado</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={handleSaveEdit}
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
                      <td className="py-3 px-4 font-medium text-gray-500">{parcela.numero}</td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900">{parcela.descricao}</p>
                        {parcela.observacao && (
                          <p className="text-xs text-gray-500 mt-1">{parcela.observacao}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{parcela.rubricaVinculada || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{parcela.metaVinculada || '-'}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{formatDate(parcela.dataPrevista)}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{formatDate(parcela.dataEfetiva)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(parcela.valorPrevisto)}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {parcela.valorLiberado ? formatCurrency(parcela.valorLiberado) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(parcela.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {parcela.status === 'PENDENTE' && (
                            <button
                              onClick={() => handleMarkAsReleased(parcela.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded text-xs"
                              title="Marcar como liberado"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleStartEdit(parcela)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(parcela.id)}
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
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td colSpan={6} className="py-3 px-4 text-right text-gray-600">Totais:</td>
                <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(totalPrevisto)}</td>
                <td className="py-3 px-4 text-right text-green-600">{formatCurrency(totalLiberado)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Legenda de status */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Legenda:
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span> Pendente
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span> Liberado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Atrasado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span> Cancelado
        </span>
      </div>
    </div>
  );
}
