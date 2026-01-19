"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Calendar, Check, CheckCircle, Edit, Plus, Save, Trash2, X } from "lucide-react";
import { ResizableTable } from "@/components/ui/resizable-table";
import { mockContrato } from "../types";
import { MoneyInput } from "./_components/MoneyImput";

type StatusDesembolso = 0 | 1 | 2 | 3; // 0=previsto, 1=parcial, 2=recebido, 3=cancelado

type ParcelaPrevista = {
  id: string;
  numero: number;
  dataPrevista: string; // yyyy-mm-dd
  valorPrevisto: number;
  status: StatusDesembolso;
  observacao?: string;
};

// Mock (substituir por fetch real baseado no contratoId)
const parcelasMock: ParcelaPrevista[] = [
  {
    id: "1",
    numero: 1,
    dataPrevista: "2025-02-15",
    valorPrevisto: 350000,
    status: 2, // recebido
    observacao: "Parcela inicial",
  },
  {
    id: "2",
    numero: 2,
    dataPrevista: "2025-06-15",
    valorPrevisto: 450000,
    status: 1, // parcial
    observacao: "Parcela intermediária",
  },
  {
    id: "3",
    numero: 3,
    dataPrevista: "2025-12-15",
    valorPrevisto: 450000,
    status: 0, // previsto
    observacao: "Parcela final",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR");
};

const formatOrdinal = (num: number): string => {
  return `${num}º`;
};

const statusOptions: { value: StatusDesembolso; label: string; color: string }[] = [
  { value: 0, label: "Previsto", color: "bg-gray-100 text-gray-800" },
  { value: 1, label: "Parcial", color: "bg-blue-100 text-blue-800" },
  { value: 2, label: "Recebido", color: "bg-green-100 text-green-800" },
  { value: 3, label: "Cancelado", color: "bg-red-100 text-red-800" },
];

const getStatusLabel = (status: StatusDesembolso): string => {
  return statusOptions.find((opt) => opt.value === status)?.label || "Desconhecido";
};

const getStatusColor = (status: StatusDesembolso): string => {
  return statusOptions.find((opt) => opt.value === status)?.color || "bg-gray-100 text-gray-800";
};

function StatusBadge({ status }: { status: StatusDesembolso }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

const parseNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const isValidISODate = (value: string) => {
  if (!value) return false;
  const d = new Date(value + "T00:00:00");
  return !Number.isNaN(d.getTime());
};

export default function DesembolsoPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const contrato = useMemo(() => {
    // TODO: buscar contrato real via API usando contratoId
    return { ...mockContrato, id: contratoId };
  }, [contratoId]);

  const sortAndRenumber = (items: ParcelaPrevista[]) =>
    [...items].sort((a, b) => a.numero - b.numero).map((p, idx) => ({ ...p, numero: idx + 1 }));

  const validateParcela = (p: Partial<ParcelaPrevista>) => {
    const valor = parseNumber(p.valorPrevisto);
    return Boolean(p.dataPrevista && isValidISODate(p.dataPrevista) && valor > 0);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [parcelas, setParcelas] = useState<ParcelaPrevista[]>(sortAndRenumber(parcelasMock));
  const [editParcelas, setEditParcelas] = useState<ParcelaPrevista[]>(sortAndRenumber(parcelasMock));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ParcelaPrevista | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newParcela, setNewParcela] = useState<Partial<ParcelaPrevista>>({
    dataPrevista: "",
    valorPrevisto: 0,
    status: 0, // previsto por padrão
    observacao: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const currentParcelas = isEditing ? editParcelas : parcelas;
  const valorTotalContrato = contrato.valorTotal || 0;
  const totalPrevisto = currentParcelas.reduce((acc, p) => acc + (p.valorPrevisto || 0), 0);
  const restante = Math.max(valorTotalContrato - totalPrevisto, 0);
  const excedente = Math.max(totalPrevisto - valorTotalContrato, 0);
  const percentualPrevisto = valorTotalContrato > 0 ? (totalPrevisto / valorTotalContrato) * 100 : 0;

  const canSave = useMemo(() => {
    if (!isEditing) return true;
    if (isAdding && !validateParcela(newParcela)) return false;
    if (editingId && (!editForm || !validateParcela(editForm))) return false;
    return editParcelas.every((p) => validateParcela(p));
  }, [editForm, editParcelas, editingId, isAdding, isEditing, newParcela]);

  const handleEdit = () => {
    setEditParcelas(sortAndRenumber(JSON.parse(JSON.stringify(parcelas))));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditParcelas(sortAndRenumber(JSON.parse(JSON.stringify(parcelas))));
    setIsEditing(false);
    setIsAdding(false);
    setEditingId(null);
    setEditForm(null);
    setNewParcela({ dataPrevista: "", valorPrevisto: 0, status: 0, observacao: "" });
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    // TODO: salvar via API
    await new Promise((resolve) => setTimeout(resolve, 900));
    setParcelas(sortAndRenumber(JSON.parse(JSON.stringify(editParcelas))));
    setIsSaving(false);
    setIsEditing(false);
    setIsAdding(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const handleAdd = () => {
    if (!validateParcela(newParcela)) return;

    const novaParcela: ParcelaPrevista = {
      id: Date.now().toString(),
      numero: editParcelas.length + 1,
      dataPrevista: newParcela.dataPrevista!,
      valorPrevisto: parseNumber(newParcela.valorPrevisto),
      status: newParcela.status ?? 0,
      observacao: newParcela.observacao || "",
    };

    setEditParcelas(sortAndRenumber([...editParcelas, novaParcela]));
    setNewParcela({ dataPrevista: "", valorPrevisto: 0, status: 0, observacao: "" });
    setIsAdding(false);
  };

  const handleStartEdit = (parcela: ParcelaPrevista) => {
    setEditingId(parcela.id);
    setEditForm({ ...parcela });
  };

  const handleSaveEdit = () => {
    if (!editForm || !editingId) return;
    if (!validateParcela(editForm)) return;
    setEditParcelas(sortAndRenumber(editParcelas.map((p) => (p.id === editingId ? editForm : p))));
    setEditingId(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleRemove = (id: string) => {
    if (confirm("Deseja realmente remover esta parcela?")) {
      setEditParcelas(sortAndRenumber(editParcelas.filter((p) => p.id !== id)));
    }
  };

  const handleNovaParcela = () => {
    if (!isEditing) {
      setEditParcelas(sortAndRenumber(JSON.parse(JSON.stringify(parcelas))));
      setIsEditing(true);
    }
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cronograma de Desembolso - Previsto</h2>
          <p className="text-sm text-gray-500">
            Cadastre os desembolsos previstas de recebimento do valor total do projeto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso!
            </div>
          )}

          <button
            onClick={handleNovaParcela}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Desembolso
          </button>

          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !canSave}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Valor Total do Projeto</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorTotalContrato)}</p>
          <p className="text-xs text-gray-400 mt-1">Contrato: {contrato.codigo}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Desembolsos</p>
          <p className="text-2xl font-bold text-gray-900">{currentParcelas.length}</p>
          <p className="text-xs text-gray-400 mt-1">Quantidade prevista</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Total Previsto</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrevisto)}</p>
          <p className="text-xs text-gray-400 mt-1">Somatório do cronograma</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">{excedente > 0 ? "Excedente" : "Restante"}</p>
          <p className={`text-2xl font-bold ${excedente > 0 ? "text-red-600" : "text-[#004225]"}`}>
            {formatCurrency(excedente > 0 ? excedente : restante)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{excedente > 0 ? "Ultrapassa o total" : "Falta para fechar"}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">% Previsto</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${excedente > 0 ? "text-red-600" : "text-[#004225]"}`}>
              {percentualPrevisto.toFixed(1)}%
            </p>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${excedente > 0 ? "bg-red-600" : "bg-[#004225]"} h-2 rounded-full transition-all`}
              style={{ width: `${Math.min(percentualPrevisto, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status do fechamento do total */}
      {valorTotalContrato > 0 && (excedente > 0 || restante > 0) && (
        <div
          className={`rounded-lg border p-4 ${
            excedente > 0
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className={`${excedente > 0 ? "text-red-600" : "text-blue-600"} w-5 h-5 mt-0.5`}
            />
            <div className="flex-1">
              <p className={`text-sm font-medium ${excedente > 0 ? "text-red-900" : "text-blue-900"}`}>
                {excedente > 0
                  ? `O cronograma excede o valor total do projeto em ${formatCurrency(excedente)}.`
                  : `Faltam ${formatCurrency(restante)} para completar o valor total do projeto.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form para nova parcela */}
      {isEditing && isAdding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="font-medium text-[#004225]">Nova Desembolso</h4>
              <p className="text-xs text-[#004225]/80 mt-0.5">Informe data, valor previsto e status. Observação é opcional.</p>
            </div>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewParcela({ dataPrevista: "", valorPrevisto: 0, status: 0, observacao: "" });
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data prevista <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newParcela.dataPrevista || ""}
                onChange={(e) => setNewParcela({ ...newParcela, dataPrevista: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor previsto <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                valueCents={Math.round((newParcela.valorPrevisto || 0) * 100)}
                onValueChange={(cents) => setNewParcela({ ...newParcela, valorPrevisto: cents / 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={newParcela.status ?? 0}
                onChange={(e) => setNewParcela({ ...newParcela, status: Number(e.target.value) as StatusDesembolso })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <input
                type="text"
                value={newParcela.observacao || ""}
                onChange={(e) => setNewParcela({ ...newParcela, observacao: e.target.value })}
                placeholder="Opcional (ex.: condicionada a entrega, marco, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewParcela({ dataPrevista: "", valorPrevisto: 0, status: 0, observacao: "" });
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!validateParcela(newParcela)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar Parcela
            </button>
          </div>
        </div>
      )}

      {/* Lista de parcelas */}
      {currentParcelas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Nenhuma parcela cadastrada</p>
          <p className="text-gray-500 text-sm mt-1">
            Cadastre os desembolsos previstas para recebimento do valor total do projeto.
          </p>
          {isEditing && (
            <button onClick={() => setIsAdding(true)} className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
              + Adicionar primeira parcela
            </button>
          )}
        </div>
      ) : (
        <ResizableTable
          columnCount={isEditing ? 7 : 6}
          defaultWidths={[80, 160, 180, 140, 140, 320, ...(isEditing ? [120] : [])]}
          minColumnWidth={90}
        >
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-center py-3 px-4 font-medium text-gray-600">Desembolsos</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Data prevista</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Valor previsto</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">% do total</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Observação</th>
              {isEditing && <th className="text-center py-3 px-4 font-medium text-gray-600">Ações</th>}
            </tr>
          </thead>

          <tbody>
            {currentParcelas.map((parcela) => {
              const parcelaPercentual = valorTotalContrato > 0 ? (parcela.valorPrevisto / valorTotalContrato) * 100 : 0;

              return (
                <tr key={parcela.id} className="border-b border-gray-100 hover:bg-gray-50">
                  {isEditing && editingId === parcela.id && editForm ? (
                    <>
                      <td className="py-3 px-4 font-medium text-gray-500 text-center">{formatOrdinal(parcela.numero)}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="date"
                          value={editForm.dataPrevista}
                          onChange={(e) => setEditForm({ ...editForm, dataPrevista: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <MoneyInput
                          valueCents={Math.round(editForm.valorPrevisto * 100)}
                          onValueChange={(cents) => setEditForm({ ...editForm, valorPrevisto: cents / 100 })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: Number(e.target.value) as StatusDesembolso })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700 font-medium">
                        {valorTotalContrato > 0 ? `${((editForm.valorPrevisto / valorTotalContrato) * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.observacao || ""}
                          onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Opcional"
                        />
                        {!validateParcela(editForm) && <p className="text-xs text-red-600 mt-1">Preencha data e valor (&gt; 0).</p>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={handleSaveEdit} className="p-1 text-green-700 hover:bg-green-50 rounded" title="Salvar">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancelEdit} className="p-1 text-gray-700 hover:bg-gray-100 rounded" title="Cancelar">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 font-medium text-gray-500 text-center">{formatOrdinal(parcela.numero)}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{formatDate(parcela.dataPrevista)}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900">{formatCurrency(parcela.valorPrevisto)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={parcela.status} />
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700 font-medium">{valorTotalContrato > 0 ? `${parcelaPercentual.toFixed(1)}%` : "—"}</td>
                      <td className="py-3 px-4 text-gray-700">{parcela.observacao ? parcela.observacao : <span className="text-gray-400">—</span>}</td>
                      {isEditing && (
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(parcela)}
                              className="p-1 text-gray-700 hover:bg-gray-100 rounded"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
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
                      )}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-gray-50 font-medium">
              <td colSpan={2} className="py-3 px-4 text-right text-gray-600">
                Totais:
              </td>
              <td className="py-3 px-4 text-center text-gray-900">{formatCurrency(totalPrevisto)}</td>
              <td className="py-3 px-4 text-center text-gray-500">—</td>
              <td className="py-3 px-4 text-center text-gray-700">
                {valorTotalContrato > 0 ? `${Math.min(percentualPrevisto, 999).toFixed(1)}%` : "—"}
              </td>
              <td className="py-3 px-4 text-left text-gray-500">
                {excedente > 0 ? `Excede em ${formatCurrency(excedente)}` : restante > 0 ? `Falta ${formatCurrency(restante)}` : "Fechado"}
              </td>
              {isEditing && <td />}
            </tr>
          </tfoot>
        </ResizableTable>
      )}

      {/* Aviso de validação (modo edição) */}
      {isEditing && !canSave && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Existem desembolsos com informações inválidas.</p>
            <p className="text-xs text-amber-800 mt-1">Verifique: data prevista e valor previsto (&gt; 0).</p>
          </div>
        </div>
      )}
    </div>
  );
}


