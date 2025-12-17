'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, AlertCircle, Calendar, FileText } from 'lucide-react';
import { MoneyInput } from '../../desembolso/_components/MoneyImput';

type ID = string;

interface ItemRubrica {
  id: string;
  codigo?: string;
  descricao: string;
  quantidade: number;
  meses: number;
  valorUnitario: number;
  valorTotal: number;
  meta?: string;
  metaId?: string;
  subitens?: any[];
}

interface Rubrica {
  id: string;
  codigo: string;
  nome: string;
  itens: ItemRubrica[];
  expanded: boolean;
}

interface RemanejamentoForm {
  itemOrigemId: string;
  itemDestinoId: string;
  valor: number;
  data: string;
  motivo: string;
}

interface RemanejamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remanejamento: RemanejamentoForm) => void;
  itemOrigem: ItemRubrica;
  rubricas: Rubrica[];
  contratoId: string;
}

export function RemanejamentoModal({
  isOpen,
  onClose,
  onConfirm,
  itemOrigem,
  rubricas,
  contratoId,
}: RemanejamentoModalProps) {
  const [form, setForm] = useState<RemanejamentoForm>({
    itemOrigemId: itemOrigem.id,
    itemDestinoId: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    motivo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Buscar item de origem para calcular saldo disponível
  const itemOrigemAtual = rubricas
    .flatMap(r => r.itens)
    .find(item => item.id === itemOrigem.id);

  // Calcular saldo disponível (valor total - débitos já realizados)
  const calcularSaldoDisponivel = (item: ItemRubrica): number => {
    // Por enquanto, retornamos o valor total. Quando integrarmos com API, 
    // subtrairemos os débitos já realizados
    return item.valorTotal;
  };

  const saldoDisponivel = itemOrigemAtual ? calcularSaldoDisponivel(itemOrigemAtual) : 0;

  // Lista de todos os itens disponíveis (exceto o de origem)
  const todosItens = rubricas.flatMap(rubrica =>
    rubrica.itens
      .filter(item => item.id !== itemOrigem.id)
      .map(item => ({
        ...item,
        rubricaNome: rubrica.nome,
        rubricaCodigo: rubrica.codigo,
      }))
  );

  useEffect(() => {
    if (isOpen) {
      setForm({
        itemOrigemId: itemOrigem.id,
        itemDestinoId: '',
        valor: 0,
        data: new Date().toISOString().split('T')[0],
        motivo: '',
      });
      setErrors({});
    }
  }, [isOpen, itemOrigem.id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.itemDestinoId) {
      newErrors.itemDestinoId = 'Selecione o item de destino';
    }

    if (form.itemOrigemId === form.itemDestinoId) {
      newErrors.itemDestinoId = 'O item de destino deve ser diferente do item de origem';
    }

    if (!form.valor || form.valor <= 0) {
      newErrors.valor = 'O valor deve ser maior que zero';
    } else if (form.valor > saldoDisponivel) {
      newErrors.valor = `O valor não pode ser maior que o saldo disponível (${formatCurrency(saldoDisponivel)})`;
    }

    if (!form.data) {
      newErrors.data = 'Informe a data do remanejamento';
    }

    if (!form.motivo || form.motivo.trim().length < 10) {
      newErrors.motivo = 'O motivo deve ter pelo menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onConfirm(form);
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!isOpen) return null;

  const itemDestinoSelecionado = todosItens.find(item => item.id === form.itemDestinoId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#004225] to-[#003319]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Remanejamento de Valores</h2>
              <p className="text-sm text-white/80">Transferir valor entre itens de rubricas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Item de Origem */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <label className="text-sm font-medium text-red-900">Item de Origem (Débito)</label>
            </div>
            <div className="bg-white rounded-md p-3 border border-red-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{itemOrigem.descricao}</p>
                  {itemOrigem.codigo && (
                    <p className="text-xs text-gray-500 font-mono mt-1">Código: {itemOrigem.codigo}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    Valor Total: <span className="font-semibold">{formatCurrency(itemOrigem.valorTotal)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Saldo Disponível: <span className="font-semibold text-red-600">{formatCurrency(saldoDisponivel)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Item de Destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item de Destino (Crédito) <span className="text-red-500">*</span>
            </label>
            <select
              value={form.itemDestinoId}
              onChange={(e) => setForm({ ...form, itemDestinoId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] ${
                errors.itemDestinoId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione o item de destino</option>
              {rubricas.map(rubrica => (
                <optgroup key={rubrica.id} label={`[${rubrica.codigo}] ${rubrica.nome}`}>
                  {rubrica.itens
                    .filter(item => item.id !== itemOrigem.id)
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.codigo ? `${item.codigo} - ` : ''}{item.descricao} ({formatCurrency(item.valorTotal)})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            {errors.itemDestinoId && (
              <p className="mt-1 text-sm text-red-600">{errors.itemDestinoId}</p>
            )}
            {itemDestinoSelecionado && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-900">
                  <span className="font-medium">Valor atual:</span> {formatCurrency(itemDestinoSelecionado.valorTotal)}
                </p>
              </div>
            )}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Remanejamento <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                valueCents={Math.round((form.valor || 0) * 100)}
                onValueChange={(cents) => {
                  const valorReais = cents / 100;
                  setForm({ ...form, valor: valorReais });
                }}
                maxCents={Math.round(saldoDisponivel * 100)}
                className={`w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] ${
                  errors.valor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="R$ 0,00"
              />
              {errors.valor && (
                <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Remanejamento <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] ${
                    errors.data ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.data && (
                <p className="mt-1 text-sm text-red-600">{errors.data}</p>
              )}
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo/Observação <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                rows={4}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] ${
                  errors.motivo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Descreva o motivo do remanejamento (mínimo 10 caracteres)..."
              />
            </div>
            {errors.motivo && (
              <p className="mt-1 text-sm text-red-600">{errors.motivo}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {form.motivo.length} / 10 caracteres mínimos
            </p>
          </div>

          {/* Resumo */}
          {form.valor > 0 && form.itemDestinoId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Resumo do Remanejamento</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor a remanejar:</span>
                  <span className="font-semibold">{formatCurrency(form.valor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Saldo após débito (origem):</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(saldoDisponivel - form.valor)}
                  </span>
                </div>
                {itemDestinoSelecionado && (
                  <div className="flex justify-between">
                    <span className="text-green-600">Saldo após crédito (destino):</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(itemDestinoSelecionado.valorTotal + form.valor)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#004225] text-white rounded-lg hover:bg-[#003319] transition-colors font-medium"
          >
            Confirmar Remanejamento
          </button>
        </div>
      </div>
    </div>
  );
}
