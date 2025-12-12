"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Edit,
  Save,
  X,
  CheckCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Target,
  Milestone,
  Flag,
  Edit2,
  Check,
} from "lucide-react";

// Tipos
type Fase = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
};

type Etapa = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  fases: Fase[];
};

type Meta = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  etapas: Etapa[];
};

// Mock de dados
const mockMetas: Meta[] = [
  {
    id: "1",
    numero: 1,
    titulo: "Levantamento de Requisitos",
    descricao: "Análise e documentação dos requisitos do sistema",
    dataInicio: "2025-01-15",
    dataFim: "2025-03-15",
    etapas: [
      {
        id: "1-1",
        numero: 1,
        titulo: "Entrevistas com Stakeholders",
        dataInicio: "2025-01-15",
        dataFim: "2025-02-15",
        fases: [
          { id: "1-1-1", numero: 1, titulo: "Preparação do roteiro", dataInicio: "2025-01-15", dataFim: "2025-01-31" },
          { id: "1-1-2", numero: 2, titulo: "Realização das entrevistas", dataInicio: "2025-02-01", dataFim: "2025-02-15" },
        ],
      },
      {
        id: "1-2",
        numero: 2,
        titulo: "Documentação de Requisitos",
        dataInicio: "2025-02-16",
        dataFim: "2025-03-15",
        fases: [],
      },
    ],
  },
  {
    id: "2",
    numero: 2,
    titulo: "Desenvolvimento do Sistema",
    descricao: "Implementação das funcionalidades principais",
    dataInicio: "2025-03-16",
    dataFim: "2025-09-30",
    etapas: [],
  },
];

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export default function MetaEtapaFasePage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [metas, setMetas] = useState<Meta[]>(mockMetas);
  const [editMetas, setEditMetas] = useState<Meta[]>(mockMetas);
  const [expandedMetas, setExpandedMetas] = useState<Set<string>>(new Set(["1"]));
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set(["1-1"]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingDate, setEditingDate] = useState<{ id: string; type: "meta" | "etapa" | "fase"; field: "dataInicio" | "dataFim"; ids: string[] } | null>(null);
  const [editDateValue, setEditDateValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleEdit = () => {
    setEditMetas(JSON.parse(JSON.stringify(metas)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditMetas(JSON.parse(JSON.stringify(metas)));
    setEditingId(null);
    setEditValue("");
    setEditingDate(null);
    setEditDateValue("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMetas(JSON.parse(JSON.stringify(editMetas)));
    setIsSaving(false);
    setIsEditing(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  // Toggle expandir/colapsar
  const toggleMeta = (id: string) => {
    setExpandedMetas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEtapa = (id: string) => {
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Funções de edição
  const addMeta = () => {
    const novoNumero = editMetas.length + 1;
    const novaMeta: Meta = {
      id: `meta-${Date.now()}`,
      numero: novoNumero,
      titulo: `Meta ${novoNumero}`,
      etapas: [],
    };
    setEditMetas([...editMetas, novaMeta]);
    setExpandedMetas((prev) => new Set(prev).add(novaMeta.id));
    setEditingId(novaMeta.id);
    setEditValue(novaMeta.titulo);
  };

  const addEtapa = (metaId: string) => {
    setEditMetas((prev) =>
      prev.map((meta) => {
        if (meta.id !== metaId) return meta;
        const novoNumero = meta.etapas.length + 1;
        const novaEtapa: Etapa = {
          id: `etapa-${Date.now()}`,
          numero: novoNumero,
          titulo: `Etapa ${novoNumero}`,
          fases: [],
        };
        return { ...meta, etapas: [...meta.etapas, novaEtapa] };
      })
    );
  };

  const addFase = (metaId: string, etapaId: string) => {
    setEditMetas((prev) =>
      prev.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            const novoNumero = etapa.fases.length + 1;
            const novaFase: Fase = {
              id: `fase-${Date.now()}`,
              numero: novoNumero,
              titulo: `Fase ${novoNumero}`,
            };
            return { ...etapa, fases: [...etapa.fases, novaFase] };
          }),
        };
      })
    );
  };

  const removeMeta = (id: string) => {
    setEditMetas((prev) => prev.filter((m) => m.id !== id));
  };

  const removeEtapa = (metaId: string, etapaId: string) => {
    setEditMetas((prev) =>
      prev.map((meta) => {
        if (meta.id !== metaId) return meta;
        return { ...meta, etapas: meta.etapas.filter((e) => e.id !== etapaId) };
      })
    );
  };

  const removeFase = (metaId: string, etapaId: string, faseId: string) => {
    setEditMetas((prev) =>
      prev.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            return { ...etapa, fases: etapa.fases.filter((f) => f.id !== faseId) };
          }),
        };
      })
    );
  };

  const startEdit = (id: string, value: string) => {
    setEditingId(id);
    setEditValue(value);
  };

  const saveEditItem = (type: "meta" | "etapa" | "fase", ids: string[]) => {
    if (type === "meta") {
      setEditMetas((prev) =>
        prev.map((m) => (m.id === ids[0] ? { ...m, titulo: editValue } : m))
      );
    } else if (type === "etapa") {
      setEditMetas((prev) =>
        prev.map((m) =>
          m.id === ids[0]
            ? {
                ...m,
                etapas: m.etapas.map((e) =>
                  e.id === ids[1] ? { ...e, titulo: editValue } : e
                ),
              }
            : m
        )
      );
    } else if (type === "fase") {
      setEditMetas((prev) =>
        prev.map((m) =>
          m.id === ids[0]
            ? {
                ...m,
                etapas: m.etapas.map((e) =>
                  e.id === ids[1]
                    ? {
                        ...e,
                        fases: e.fases.map((f) =>
                          f.id === ids[2] ? { ...f, titulo: editValue } : f
                        ),
                      }
                    : e
                ),
              }
            : m
        )
      );
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEditItem = () => {
    setEditingId(null);
    setEditValue("");
  };

  // Funções para editar datas
  const startEditDate = (type: "meta" | "etapa" | "fase", field: "dataInicio" | "dataFim", ids: string[], currentValue?: string) => {
    setEditingDate({ id: ids[ids.length - 1], type, field, ids });
    // Converter data ISO para formato do input (YYYY-MM-DD)
    if (currentValue) {
      setEditDateValue(currentValue);
    } else {
      setEditDateValue("");
    }
  };

  const saveEditDate = () => {
    if (!editingDate) return;

    const { type, field, ids } = editingDate;
    const newValue = editDateValue || undefined;

    if (type === "meta") {
      setEditMetas((prev) =>
        prev.map((m) => (m.id === ids[0] ? { ...m, [field]: newValue } : m))
      );
    } else if (type === "etapa") {
      setEditMetas((prev) =>
        prev.map((m) =>
          m.id === ids[0]
            ? {
                ...m,
                etapas: m.etapas.map((e) =>
                  e.id === ids[1] ? { ...e, [field]: newValue } : e
                ),
              }
            : m
        )
      );
    } else if (type === "fase") {
      setEditMetas((prev) =>
        prev.map((m) =>
          m.id === ids[0]
            ? {
                ...m,
                etapas: m.etapas.map((e) =>
                  e.id === ids[1]
                    ? {
                        ...e,
                        fases: e.fases.map((f) =>
                          f.id === ids[2] ? { ...f, [field]: newValue } : f
                        ),
                      }
                    : e
                ),
              }
            : m
        )
      );
    }

    setEditingDate(null);
    setEditDateValue("");
  };

  const cancelEditDate = () => {
    setEditingDate(null);
    setEditDateValue("");
  };

  // Modo de visualização (read-only)
  const currentMetas = isEditing ? editMetas : metas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Meta, Etapa e Fase
          </h2>
          <p className="text-sm text-gray-500">
            Estrutura de metas, etapas e fases do contrato
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
            onClick={() => {
              if (!isEditing) {
                handleEdit();
              }
              addMeta();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
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
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lista de Metas */}
      {currentMetas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Nenhuma meta cadastrada
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {isEditing
              ? "Adicione metas para estruturar o contrato."
              : "Clique em Editar para adicionar metas."}
          </p>
          {isEditing && (
            <button
              onClick={addMeta}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar Meta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentMetas.map((meta) => (
            <div
              key={meta.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Header da Meta */}
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <button
                  onClick={() => toggleMeta(meta.id)}
                  className="p-1 hover:bg-emerald-100 rounded transition-colors"
                >
                  {expandedMetas.has(meta.id) ? (
                    <ChevronDown className="h-5 w-5 text-emerald-700" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-emerald-700" />
                  )}
                </button>
                <Target className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800">
                  Meta {meta.numero}:
                </span>
                {isEditing && editingId === meta.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditItem("meta", [meta.id]);
                        if (e.key === "Escape") cancelEditItem();
                      }}
                    />
                    <button
                      onClick={() => saveEditItem("meta", [meta.id])}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditItem}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-900">
                      {meta.titulo}
                    </span>
                    {isEditing && (
                      <button
                        onClick={() => startEdit(meta.id, meta.titulo)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-emerald-100 rounded transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    {editingDate?.id === meta.id && editingDate?.field === "dataInicio" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="px-2 py-1 text-xs border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditDate();
                            if (e.key === "Escape") cancelEditDate();
                          }}
                        />
                        <button
                          onClick={saveEditDate}
                          className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEditDate}
                          className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditDate("meta", "dataInicio", [meta.id], meta.dataInicio)}
                        className="text-xs text-gray-500 hover:text-gray-700 hover:bg-emerald-100 px-2 py-1 rounded"
                        title="Editar data de início"
                      >
                        {meta.dataInicio ? formatDate(meta.dataInicio) : "Sem data"}
                      </button>
                    )}
                    <span className="text-xs text-gray-400">-</span>
                    {editingDate?.id === meta.id && editingDate?.field === "dataFim" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="px-2 py-1 text-xs border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditDate();
                            if (e.key === "Escape") cancelEditDate();
                          }}
                        />
                        <button
                          onClick={saveEditDate}
                          className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEditDate}
                          className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditDate("meta", "dataFim", [meta.id], meta.dataFim)}
                        className="text-xs text-gray-500 hover:text-gray-700 hover:bg-emerald-100 px-2 py-1 rounded"
                        title="Editar data de fim"
                      >
                        {meta.dataFim ? formatDate(meta.dataFim) : "Sem data"}
                      </button>
                    )}
                  </div>
                ) : (
                  meta.dataInicio && meta.dataFim && (
                    <span className="text-xs text-gray-500">
                      {formatDate(meta.dataInicio)} - {formatDate(meta.dataFim)}
                    </span>
                  )
                )}
                {isEditing && (
                  <button
                    onClick={() => removeMeta(meta.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Excluir meta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Conteúdo da Meta (Etapas) */}
              {expandedMetas.has(meta.id) && (
                <div className="p-4 space-y-3">
                  {meta.etapas.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      Nenhuma etapa cadastrada.
                      {isEditing && (
                        <button
                          onClick={() => addEtapa(meta.id)}
                          className="ml-2 text-[#004225] hover:underline font-medium"
                        >
                          Adicionar etapa
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {meta.etapas.map((etapa) => (
                        <div
                          key={etapa.id}
                          className="ml-4 border-l-2 border-blue-200 pl-4"
                        >
                          {/* Header da Etapa */}
                          <div className="flex items-center gap-3 py-2">
                            <button
                              onClick={() => toggleEtapa(etapa.id)}
                              className="p-1 hover:bg-blue-50 rounded transition-colors"
                            >
                              {expandedEtapas.has(etapa.id) ? (
                                <ChevronDown className="h-4 w-4 text-blue-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                            <Milestone className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold text-blue-700">
                              Etapa {etapa.numero}:
                            </span>
                            {isEditing && editingId === etapa.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      saveEditItem("etapa", [meta.id, etapa.id]);
                                    if (e.key === "Escape") cancelEditItem();
                                  }}
                                />
                                <button
                                  onClick={() =>
                                    saveEditItem("etapa", [meta.id, etapa.id])
                                  }
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEditItem}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 text-sm text-gray-800">
                                  {etapa.titulo}
                                </span>
                                {isEditing && (
                                  <button
                                    onClick={() => startEdit(etapa.id, etapa.titulo)}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                {editingDate?.id === etapa.id && editingDate?.field === "dataInicio" ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="date"
                                      value={editDateValue}
                                      onChange={(e) => setEditDateValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveEditDate();
                                        if (e.key === "Escape") cancelEditDate();
                                      }}
                                    />
                                    <button
                                      onClick={saveEditDate}
                                      className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={cancelEditDate}
                                      className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditDate("etapa", "dataInicio", [meta.id, etapa.id], etapa.dataInicio)}
                                    className="text-xs text-gray-400 hover:text-gray-600 hover:bg-blue-50 px-2 py-0.5 rounded"
                                    title="Editar data de início"
                                  >
                                    {etapa.dataInicio ? formatDate(etapa.dataInicio) : "Sem data"}
                                  </button>
                                )}
                                <span className="text-xs text-gray-300">-</span>
                                {editingDate?.id === etapa.id && editingDate?.field === "dataFim" ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="date"
                                      value={editDateValue}
                                      onChange={(e) => setEditDateValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveEditDate();
                                        if (e.key === "Escape") cancelEditDate();
                                      }}
                                    />
                                    <button
                                      onClick={saveEditDate}
                                      className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={cancelEditDate}
                                      className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditDate("etapa", "dataFim", [meta.id, etapa.id], etapa.dataFim)}
                                    className="text-xs text-gray-400 hover:text-gray-600 hover:bg-blue-50 px-2 py-0.5 rounded"
                                    title="Editar data de fim"
                                  >
                                    {etapa.dataFim ? formatDate(etapa.dataFim) : "Sem data"}
                                  </button>
                                )}
                              </div>
                            ) : (
                              etapa.dataInicio && etapa.dataFim && (
                                <span className="text-xs text-gray-400">
                                  {formatDate(etapa.dataInicio)} - {formatDate(etapa.dataFim)}
                                </span>
                              )
                            )}
                            {isEditing && (
                              <button
                                onClick={() => removeEtapa(meta.id, etapa.id)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Excluir etapa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Fases da Etapa */}
                          {expandedEtapas.has(etapa.id) && (
                            <div className="ml-6 mt-2 space-y-2">
                              {etapa.fases.length === 0 ? (
                                <div className="text-sm text-gray-400 py-2">
                                  Nenhuma fase.
                                  {isEditing && (
                                    <button
                                      onClick={() => addFase(meta.id, etapa.id)}
                                      className="ml-2 text-[#004225] hover:underline font-medium"
                                    >
                                      Adicionar fase
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {etapa.fases.map((fase) => (
                                    <div
                                      key={fase.id}
                                      className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100"
                                    >
                                      <Flag className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="text-xs font-medium text-gray-600">
                                        Fase {fase.numero}:
                                      </span>
                                      {isEditing && editingId === fase.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) =>
                                              setEditValue(e.target.value)
                                            }
                                            className="flex-1 px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter")
                                                saveEditItem("fase", [
                                                  meta.id,
                                                  etapa.id,
                                                  fase.id,
                                                ]);
                                              if (e.key === "Escape") cancelEditItem();
                                            }}
                                          />
                                          <button
                                            onClick={() =>
                                              saveEditItem("fase", [
                                                meta.id,
                                                etapa.id,
                                                fase.id,
                                              ])
                                            }
                                            className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                          >
                                            <Check className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={cancelEditItem}
                                            className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="flex-1 text-xs text-gray-700">
                                            {fase.titulo}
                                          </span>
                                          {isEditing && (
                                            <button
                                              onClick={() =>
                                                startEdit(fase.id, fase.titulo)
                                              }
                                              className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {isEditing ? (
                                        <div className="flex items-center gap-2">
                                          {editingDate?.id === fase.id && editingDate?.field === "dataInicio" ? (
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="date"
                                                value={editDateValue}
                                                onChange={(e) => setEditDateValue(e.target.value)}
                                                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") saveEditDate();
                                                  if (e.key === "Escape") cancelEditDate();
                                                }}
                                              />
                                              <button
                                                onClick={saveEditDate}
                                                className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                              >
                                                <Check className="h-2.5 w-2.5" />
                                              </button>
                                              <button
                                                onClick={cancelEditDate}
                                                className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => startEditDate("fase", "dataInicio", [meta.id, etapa.id, fase.id], fase.dataInicio)}
                                              className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-1.5 py-0.5 rounded"
                                              title="Editar data de início"
                                            >
                                              {fase.dataInicio ? formatDate(fase.dataInicio) : "Sem data"}
                                            </button>
                                          )}
                                          <span className="text-xs text-gray-300">-</span>
                                          {editingDate?.id === fase.id && editingDate?.field === "dataFim" ? (
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="date"
                                                value={editDateValue}
                                                onChange={(e) => setEditDateValue(e.target.value)}
                                                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") saveEditDate();
                                                  if (e.key === "Escape") cancelEditDate();
                                                }}
                                              />
                                              <button
                                                onClick={saveEditDate}
                                                className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                              >
                                                <Check className="h-2.5 w-2.5" />
                                              </button>
                                              <button
                                                onClick={cancelEditDate}
                                                className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => startEditDate("fase", "dataFim", [meta.id, etapa.id, fase.id], fase.dataFim)}
                                              className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-1.5 py-0.5 rounded"
                                              title="Editar data de fim"
                                            >
                                              {fase.dataFim ? formatDate(fase.dataFim) : "Sem data"}
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        fase.dataInicio && fase.dataFim && (
                                          <span className="text-xs text-gray-400">
                                            {formatDate(fase.dataInicio)} - {formatDate(fase.dataFim)}
                                          </span>
                                        )
                                      )}
                                      {isEditing && (
                                        <button
                                          onClick={() =>
                                            removeFase(meta.id, etapa.id, fase.id)
                                          }
                                          className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Excluir fase"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </>
                              )}
                              {isEditing && (
                                <button
                                  onClick={() => addFase(meta.id, etapa.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                  Adicionar Fase
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => addEtapa(meta.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Etapa
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
