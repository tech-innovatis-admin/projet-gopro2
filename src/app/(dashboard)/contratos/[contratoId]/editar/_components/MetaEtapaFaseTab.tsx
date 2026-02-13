"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Milestone,
  Flag,
  GripVertical,
  Edit2,
  Check,
  X,
} from "lucide-react";

// Tipos   square-stack
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
];

interface MetaEtapaFaseTabProps {
  contratoId: string;
  onChange?: () => void;
}

export function MetaEtapaFaseTab({ contratoId, onChange }: MetaEtapaFaseTabProps) {
  const [metas, setMetas] = useState<Meta[]>(mockMetas);
  const [expandedMetas, setExpandedMetas] = useState<Set<string>>(new Set(["1"]));
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set(["1-1"]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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

  // Adicionar nova meta
  const addMeta = () => {
    const novoNumero = metas.length + 1;
    const novaMeta: Meta = {
      id: `meta-${Date.now()}`,
      numero: novoNumero,
      titulo: `Meta ${novoNumero}`,
      etapas: [],
    };
    setMetas([...metas, novaMeta]);
    setExpandedMetas((prev) => new Set(prev).add(novaMeta.id));
    setEditingId(novaMeta.id);
    setEditValue(novaMeta.titulo);
    onChange?.();
  };

  // Adicionar nova etapa
  const addEtapa = (metaId: string) => {
    setMetas((prev) =>
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
    onChange?.();
  };

  // Adicionar nova fase
  const addFase = (metaId: string, etapaId: string) => {
    setMetas((prev) =>
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
    onChange?.();
  };

  // Remover meta
  const removeMeta = (id: string) => {
    setMetas((prev) => prev.filter((m) => m.id !== id));
    onChange?.();
  };

  // Remover etapa
  const removeEtapa = (metaId: string, etapaId: string) => {
    setMetas((prev) =>
      prev.map((meta) => {
        if (meta.id !== metaId) return meta;
        return { ...meta, etapas: meta.etapas.filter((e) => e.id !== etapaId) };
      })
    );
    onChange?.();
  };

  // Remover fase
  const removeFase = (metaId: string, etapaId: string, faseId: string) => {
    setMetas((prev) =>
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
    onChange?.();
  };

  // Edição inline
  const startEdit = (id: string, value: string) => {
    setEditingId(id);
    setEditValue(value);
  };

  const saveEdit = (type: "meta" | "etapa" | "fase", ids: string[]) => {
    if (type === "meta") {
      setMetas((prev) =>
        prev.map((m) => (m.id === ids[0] ? { ...m, titulo: editValue } : m))
      );
    } else if (type === "etapa") {
      setMetas((prev) =>
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
      setMetas((prev) =>
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
    onChange?.();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Meta, Etapa e Fase
          </h2>
          <p className="text-sm text-gray-500">
            Estruture as metas, etapas e fases do contrato.
          </p>
        </div>
        <button
          onClick={addMeta}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </button>
      </div>

      {/* Lista de Metas */}
      {metas.length === 0 ? (
        <EmptyState
          icon={Crosshair}
          title="Nenhuma meta cadastrada"
          description="Adicione metas para estruturar o contrato."
          buttonLabel="Adicionar Meta"
          onButtonClick={addMeta}
        />
      ) : (
        <div className="space-y-4">
          {metas.map((meta) => (
            <div
              key={meta.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Header da Meta */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-b border-slate-200">
                <button
                  onClick={() => toggleMeta(meta.id)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  {expandedMetas.has(meta.id) ? (
                    <ChevronDown className="h-5 w-5 text-slate-700" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-700" />
                  )}
                </button>
                <span className="text-sm font-bold text-slate-800">
                  Meta {meta.numero}:
                </span>
                {editingId === meta.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 rounded border border-[#004225] bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit("meta", [meta.id]);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <button
                      onClick={() => saveEdit("meta", [meta.id])}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
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
                    <button
                      onClick={() => startEdit(meta.id, meta.titulo)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-slate-200 rounded transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => removeMeta(meta.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Excluir meta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Conteúdo da Meta (Etapas) */}
              {expandedMetas.has(meta.id) && (
                <div className="p-4 space-y-3">
                  {meta.etapas.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      Nenhuma etapa cadastrada.
                      <button
                        onClick={() => addEtapa(meta.id)}
                        className="ml-2 text-[#004225] hover:underline font-medium"
                      >
                        Adicionar etapa
                      </button>
                    </div>
                  ) : (
                    <>
                      {meta.etapas.map((etapa) => (
                        <div
                          key={etapa.id}
                          className="ml-4 border-l-2 border-slate-300 pl-4"
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
                            {editingId === etapa.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-[#004225] rounded focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      saveEdit("etapa", [meta.id, etapa.id]);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                />
                                <button
                                  onClick={() =>
                                    saveEdit("etapa", [meta.id, etapa.id])
                                  }
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
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
                                <button
                                  onClick={() => startEdit(etapa.id, etapa.titulo)}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => removeEtapa(meta.id, etapa.id)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir etapa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Fases da Etapa */}
                          {expandedEtapas.has(etapa.id) && (
                            <div className="ml-6 mt-2 space-y-2">
                              {etapa.fases.length === 0 ? (
                                <div className="text-sm text-gray-400 py-2">
                                  Nenhuma fase.
                                  <button
                                    onClick={() => addFase(meta.id, etapa.id)}
                                    className="ml-2 text-[#004225] hover:underline font-medium"
                                  >
                                    Adicionar fase
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {etapa.fases.map((fase) => (
                                    <div
                                      key={fase.id}
                                      className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-lg border border-slate-300"
                                    >
                                      <Flag className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="text-xs font-medium text-gray-600">
                                        Fase {fase.numero}:
                                      </span>
                                      {editingId === fase.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) =>
                                              setEditValue(e.target.value)
                                            }
                                            className="flex-1 px-2 py-0.5 text-xs border border-[#004225] rounded focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter")
                                                saveEdit("fase", [
                                                  meta.id,
                                                  etapa.id,
                                                  fase.id,
                                                ]);
                                              if (e.key === "Escape") cancelEdit();
                                            }}
                                          />
                                          <button
                                            onClick={() =>
                                              saveEdit("fase", [
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
                                            onClick={cancelEdit}
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
                                          <button
                                            onClick={() =>
                                              startEdit(fase.id, fase.titulo)
                                            }
                                            className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      )}
                                      <button
                                        onClick={() =>
                                          removeFase(meta.id, etapa.id, fase.id)
                                        }
                                        className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Excluir fase"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </>
                              )}
                              <button
                                onClick={() => addFase(meta.id, etapa.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                                Adicionar Fase
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  <button
                    onClick={() => addEtapa(meta.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Etapa
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente Empty State reutilizável
function EmptyState({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onButtonClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <button
        onClick={onButtonClick}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
      >
        <Plus className="h-4 w-4" />
        {buttonLabel}
      </button>
    </div>
  );
}
