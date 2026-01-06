"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/ui/NavBar";
import {
  ChevronRight,
  Home,
  Plus,
  AlertCircle,
} from "lucide-react";
import { type InitiationStage, MOCK_PIPELINE_CONTRACTS } from "../types";
import { StageConfigColumn } from "../_components/StageConfigColumn";
import { usePipelineStages } from "../context/PipelineStagesContext";

// =============================================================================
// FUNIL EDIT - Página de Configuração do Funil de Contratos
// =============================================================================

export default function FunilEditPage() {
  const router = useRouter();
  const { stages: contextStages, updateStages } = usePipelineStages();
  const [stages, setStages] = useState<InitiationStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedStageIds, setDeletedStageIds] = useState<string[]>([]);

  // Carregar etapas do contexto
  useEffect(() => {
    setStages(contextStages);
    setIsLoading(false);
  }, [contextStages]);

  // Contar contratos por etapa
  const getContractCountInStage = (stageId: string): number => {
    return MOCK_PIPELINE_CONTRACTS.filter(c => c.stageId === stageId).length;
  };

  // Handler para atualizar etapa
  const handleUpdateStage = (updatedStage: InitiationStage) => {
    setStages(prev =>
      prev.map(stage => (stage.id === updatedStage.id ? updatedStage : stage))
    );
  };

  // Handler para deletar etapa
  const handleDeleteStage = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage || stage.isFinal) return;

    const contractCount = getContractCountInStage(stageId);
    if (contractCount > 0) {
      setError(
        `Não é possível excluir a etapa "${stage.name}" pois há ${contractCount} contrato(s) associado(s).`
      );
      return;
    }

    setStages(prev => prev.filter(s => s.id !== stageId));
    setDeletedStageIds(prev => [...prev, stageId]);
    setError(null);
  };

  // Handler para adicionar nova etapa
  const handleAddNewStage = () => {
    const newOrder = Math.max(...stages.map(s => s.order), 0) + 1;
    const newStage: InitiationStage = {
      id: `stage_new_${Date.now()}`,
      name: "Nova Etapa",
      order: newOrder,
      isFinal: false,
      isActive: true,
      slaDays: 3,
    };
    setStages(prev => [...prev, newStage]);
  };

  // Handler para salvar alterações
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Reordenar stages por order e atualizar indices
      const reorderedStages = stages
        .sort((a, b) => a.order - b.order)
        .map((stage, index) => ({
          ...stage,
          order: index + 1,
        }));

      // TODO: Quando backend estiver pronto, descomente:
      // const response = await fetch("/api/contracts/initiation/stages", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     stages: reorderedStages,
      //     deletedIds: deletedStageIds,
      //   }),
      // });
      //
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || "Erro ao salvar alterações");
      // }

      // Atualizar contexto com as novas etapas
      updateStages(reorderedStages);

      console.log("Stages salvos:", reorderedStages);
      console.log("Deletados:", deletedStageIds);

      // Redirecionar após sucesso
      router.push("/contratos/funil");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar alterações"
      );
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para cancelar
  const handleCancel = () => {
    router.push("/contratos/funil");
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/contratos" className="hover:text-gray-700">
            Contratos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/contratos/funil" className="hover:text-gray-700">
            Funil
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Configuração de Etapas</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#003319] mb-2">
                Configuração do Funil de Contratos
              </h1>
              <p className="text-sm text-gray-600 max-w-2xl">
                Ajuste o nome das etapas e o prazo de estagnação usados no Funil de
                Contratos (entre contrato assinado e início da execução).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isLoading || isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-[#004225] border border-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
        </div>

        {/* Stages Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Carregando etapas...</div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Stage Columns */}
            {stages
              .sort((a, b) => a.order - b.order)
              .map(stage => (
                <StageConfigColumn
                  key={stage.id}
                  stage={stage}
                  contractCountInStage={getContractCountInStage(stage.id)}
                  onUpdate={handleUpdateStage}
                  onDelete={handleDeleteStage}
                  canDelete={getContractCountInStage(stage.id) === 0}
                />
              ))}

            {/* Add New Stage Card */}
            <div className="flex-shrink-0 w-80 border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-[#004225] hover:bg-[#004225]/5 transition-colors"
              onClick={handleAddNewStage}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Plus className="h-6 w-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  Adicionar nova etapa
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
