'use client';

import { useState } from 'react';
import { AlertCircle, ArrowRight, FileText } from 'lucide-react';
import { AppModalShell } from '@/components/ui/app-modal-shell';
import { DatePicker } from '@/components/ui/DatePicker';
import { MoneyInput } from '../../desembolso/_components/MoneyImput';

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
  subitens?: unknown[];
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
}

const REMANEJAMENTO_FORM_ID = 'rubrica-remanejamento-form';

export function RemanejamentoModal({
  isOpen,
  onClose,
  onConfirm,
  itemOrigem,
  rubricas,
}: RemanejamentoModalProps) {
  const [form, setForm] = useState<RemanejamentoForm>({
    itemOrigemId: itemOrigem.id,
    itemDestinoId: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    motivo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const itemOrigemAtual = rubricas
    .flatMap((rubrica) => rubrica.itens)
    .find((item) => item.id === itemOrigem.id);

  const calcularSaldoDisponivel = (item: ItemRubrica): number => {
    return item.valorTotal;
  };

  const saldoDisponivel = itemOrigemAtual ? calcularSaldoDisponivel(itemOrigemAtual) : 0;

  const todosItens = rubricas.flatMap((rubrica) =>
    rubrica.itens
      .filter((item) => item.id !== itemOrigem.id)
      .map((item) => ({
        ...item,
        rubricaNome: rubrica.nome,
        rubricaCodigo: rubrica.codigo,
      }))
  );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.itemDestinoId) {
      nextErrors.itemDestinoId = 'Selecione o item de destino.';
    }

    if (form.itemOrigemId === form.itemDestinoId) {
      nextErrors.itemDestinoId = 'O item de destino deve ser diferente do item de origem.';
    }

    if (!form.valor || form.valor <= 0) {
      nextErrors.valor = 'O valor deve ser maior que zero.';
    } else if (form.valor > saldoDisponivel) {
      nextErrors.valor = `O valor não pode ser maior que o saldo disponível (${formatCurrency(saldoDisponivel)}).`;
    }

    if (!form.data) {
      nextErrors.data = 'Informe a data do remanejamento.';
    }

    if (!form.motivo || form.motivo.trim().length < 10) {
      nextErrors.motivo = 'O motivo deve ter pelo menos 10 caracteres.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (validateForm()) {
      onConfirm(form);
      onClose();
    }
  };

  const itemDestinoSelecionado = todosItens.find((item) => item.id === form.itemDestinoId);

  if (!isOpen) {
    return null;
  }

  return (
    <AppModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Remanejamento de valores"
      description="Transfira valores entre itens das rubricas com um fluxo mais claro e padronizado."
      icon={<ArrowRight className="h-5 w-5" />}
      tone="brand"
      maxWidthClassName="max-w-3xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={REMANEJAMENTO_FORM_ID}
            className="rounded-xl bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319]"
          >
            Confirmar remanejamento
          </button>
        </div>
      }
    >
      <form id={REMANEJAMENTO_FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <label className="text-sm font-medium text-red-900">Item de origem (débito)</label>
          </div>

          <div className="rounded-xl border border-red-200 bg-white p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-900">{itemOrigem.descricao}</p>
                {itemOrigem.codigo && (
                  <p className="mt-1 font-mono text-xs text-slate-500">Código: {itemOrigem.codigo}</p>
                )}
                <p className="mt-2 text-sm text-slate-600">
                  Valor total: <span className="font-semibold">{formatCurrency(itemOrigem.valorTotal)}</span>
                </p>
                <p className="text-sm text-slate-600">
                  Saldo disponível:{' '}
                  <span className="font-semibold text-red-600">{formatCurrency(saldoDisponivel)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Item de destino (crédito) <span className="text-red-500">*</span>
          </label>
          <select
            value={form.itemDestinoId}
            onChange={(event) => setForm({ ...form, itemDestinoId: event.target.value })}
            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
              errors.itemDestinoId ? 'border-red-500' : 'border-slate-300 focus:border-[#004225]'
            }`}
          >
            <option value="">Selecione o item de destino</option>
            {rubricas.map((rubrica) => (
              <optgroup key={rubrica.id} label={`[${rubrica.codigo}] ${rubrica.nome}`}>
                {rubrica.itens
                  .filter((item) => item.id !== itemOrigem.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo ? `${item.codigo} - ` : ''}
                      {item.descricao} ({formatCurrency(item.valorTotal)})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>

          {errors.itemDestinoId && <p className="mt-1 text-sm text-red-600">{errors.itemDestinoId}</p>}

          {itemDestinoSelecionado && (
            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm text-emerald-900">
                <span className="font-medium">Valor atual:</span>{' '}
                {formatCurrency(itemDestinoSelecionado.valorTotal)}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Valor do remanejamento <span className="text-red-500">*</span>
            </label>
            <MoneyInput
              valueCents={Math.round((form.valor || 0) * 100)}
              onValueChange={(cents) => {
                setForm({ ...form, valor: cents / 100 });
              }}
              maxCents={Math.round(saldoDisponivel * 100)}
              className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                errors.valor ? 'border-red-500' : 'border-slate-300 focus:border-[#004225]'
              }`}
              placeholder="R$ 0,00"
            />
            {errors.valor && <p className="mt-1 text-sm text-red-600">{errors.valor}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data do remanejamento <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={form.data}
              onChange={(value) => setForm({ ...form, data: value })}
              placeholder="Selecione a data"
              error={Boolean(errors.data)}
              className="w-full"
            />
            {errors.data && <p className="mt-1 text-sm text-red-600">{errors.data}</p>}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Motivo/observação <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <textarea
              value={form.motivo}
              onChange={(event) => setForm({ ...form, motivo: event.target.value })}
              rows={4}
              className={`w-full rounded-xl border py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                errors.motivo ? 'border-red-500' : 'border-slate-300 focus:border-[#004225]'
              }`}
              placeholder="Descreva o motivo do remanejamento (mínimo de 10 caracteres)..."
            />
          </div>
          {errors.motivo && <p className="mt-1 text-sm text-red-600">{errors.motivo}</p>}
          <p className="mt-1 text-xs text-slate-500">{form.motivo.length} / 10 caracteres mínimos</p>
        </div>

        {form.valor > 0 && form.itemDestinoId && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 font-medium text-blue-900">Resumo do remanejamento</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Valor a remanejar:</span>
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
                  <span className="text-emerald-600">Saldo após crédito (destino):</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(itemDestinoSelecionado.valorTotal + form.valor)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </AppModalShell>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
