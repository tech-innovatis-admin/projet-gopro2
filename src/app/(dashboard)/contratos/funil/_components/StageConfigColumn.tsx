"use client";

import { useState } from "react";
import { Trash2, GripVertical } from "lucide-react";
import { type InitiationStage } from "../types";

// =============================================================================
// STAGE CONFIG COLUMN - Coluna de configuração de etapa
// =============================================================================

type StageConfigColumnProps = {
  stage: InitiationStage;
  contractCountInStage: number;
  onUpdate: (updatedStage: InitiationStage) => void;
  onDelete: (stageId: string) => void;
  canDelete: boolean;
  isNew?: boolean;
};

export function StageConfigColumn({
  stage,
  contractCountInStage,
  onUpdate,
  onDelete,
  canDelete,
  isNew = false,
}: StageConfigColumnProps) {
  const [name, setName] = useState(stage.name);
  const [slaEnabled, setSlaEnabled] = useState(!!stage.slaDays);
  const [slaDays, setSlaDays] = useState(stage.slaDays?.toString() || "");

  // Handler para atualizar o nome
  const handleNameChange = (newName: string) => {
    setName(newName);
    onUpdate({
      ...stage,
      name: newName,
    });
  };

  // Handler para alternar SLA
  const handleToggleSla = () => {
    const newEnabled = !slaEnabled;
    setSlaEnabled(newEnabled);
    onUpdate({
      ...stage,
      slaDays: newEnabled ? (parseInt(slaDays) || 3) : undefined,
    });
  };

  // Handler para atualizar SLA dias
  const handleSlaDaysChange = (value: string) => {
    setSlaDays(value);
    if (value && parseInt(value) > 0) {
      onUpdate({
        ...stage,
        slaDays: parseInt(value),
      });
    }
  };

  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
          <div>
            <div className="text-xs text-gray-500 font-medium">
              Etapa {stage.order}
            </div>
          </div>
        </div>
      </div>

      {/* Nome da Etapa */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Nome da Etapa</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
          placeholder="Nome da etapa"
        />
      </div>

      {/* SLA Configuration */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">
            Estagnação (dias)
          </label>
          <button
            onClick={handleToggleSla}
            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
              slaEnabled
                ? "bg-[#004225] text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {slaEnabled ? "Ativo" : "Inativo"}
          </button>
        </div>

        {slaEnabled && (
          <input
            type="number"
            value={slaDays}
            onChange={(e) => handleSlaDaysChange(e.target.value)}
            min="1"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
            placeholder="Ex.: 3"
          />
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        {contractCountInStage > 0 ? (
          <span>
            <strong>{contractCountInStage}</strong>{" "}
            {contractCountInStage === 1 ? "contrato" : "contratos"} nesta etapa
          </span>
        ) : (
          <span>Nenhum contrato nesta etapa</span>
        )}
      </div>

      {/* Delete Button */}
      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={() => onDelete(stage.id)}
          disabled={!canDelete || stage.isFinal}
          title={
            stage.isFinal
              ? "Não é possível excluir a etapa final"
              : !canDelete
                ? "Não é possível excluir uma etapa com contratos"
                : "Excluir etapa"
          }
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            !canDelete || stage.isFinal
              ? "bg-red-50 text-red-400 cursor-not-allowed"
              : "bg-red-50 text-red-600 hover:bg-red-100"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </button>
      </div>
    </div>
  );
}
