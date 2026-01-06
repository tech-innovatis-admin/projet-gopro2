"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Play,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  MOCK_STAGES,
  MOCK_PIPELINE_CONTRACTS,
  MOCK_INITIATION_ACTIVITIES,
  MOCK_STAGE_HISTORY,
  getContractActivities,
  getContractStageHistory,
  type InitiationActivity,
  type InitiationActivityStatus,
} from "../../funil/types";
import {
  InitiationProgressBar,
  InitiationSummary,
  InitiationActivities,
} from "./_components";

// =============================================================================
// PÁGINA DE INICIAÇÃO DO CONTRATO
// =============================================================================

export default function IniciacaoPage() {
  const params = useParams();
  const router = useRouter();
  const contratoId = params.contratoId as string;

  // Mock: busca o contrato (na vida real, viria da API)
  const contract = useMemo(() => {
    // Primeiro tenta encontrar nos contratos do pipeline
    const pipelineContract = MOCK_PIPELINE_CONTRACTS.find(c => c.id === contratoId);
    if (pipelineContract) return pipelineContract;

    // Se não encontrar, retorna um mock baseado no ID
    return {
      id: contratoId,
      title: "Sistema de Gestão Integrada",
      code: "PRJ-2025-001",
      type: "PROJETO" as const,
      partnerName: "Fundação de Apoio à Pesquisa",
      totalValue: 1250000,
      coordinatorName: "João Silva",
      stageId: "stage_3",
      stageEnteredAt: "2026-01-03T10:00:00Z",
      daysInStage: 3,
      hasScheduledActivities: true,
      warnings: [],
      executionStatus: "NAO_INICIADA" as const,
    };
  }, [contratoId]);

  // Busca atividades do contrato
  const activities = useMemo(() => {
    return getContractActivities(contratoId);
  }, [contratoId]);

  // Busca histórico de movimentação
  const stageHistory = useMemo(() => {
    return getContractStageHistory(contratoId);
  }, [contratoId]);

  // Estado para filtro de atividades
  const [activityFilter, setActivityFilter] = useState<"all" | "pending" | "done">("all");

  // Estado de atividades locais (para permitir marcar como concluída)
  const [localActivities, setLocalActivities] = useState<InitiationActivity[]>(activities);

  // Estado para armazenar o estágio atual (permite mudança)
  const [currentStageId, setCurrentStageId] = useState<string>(contract.stageId);

  // Busca o estágio atual baseado no estado
  const currentStage = useMemo(() => {
    return MOCK_STAGES.find(s => s.id === currentStageId);
  }, [currentStageId]);

  // Handler para mudar de etapa
  const handleStageChange = (newStageId: string) => {
    setCurrentStageId(newStageId);
    // Reseta o filtro de atividades quando muda de etapa
    setActivityFilter("all");
  };

  // Filtra atividades baseado no filtro selecionado
  const filteredActivities = useMemo(() => {
    switch (activityFilter) {
      case "pending":
        return localActivities.filter(a => a.status === "PLANNED");
      case "done":
        return localActivities.filter(a => a.status === "DONE");
      default:
        return localActivities;
    }
  }, [localActivities, activityFilter]);

  // Handler para marcar atividade como concluída
  const handleCompleteActivity = (activityId: string) => {
    setLocalActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              status: "DONE" as InitiationActivityStatus,
              completedAt: new Date().toISOString(),
            }
          : activity
      )
    );
  };

  // Handler para criar nova atividade
  const handleCreateActivity = (newActivity: Partial<InitiationActivity>) => {
    const activity: InitiationActivity = {
      id: `act_new_${Date.now()}`,
      contractId: contratoId,
      stageId: contract.stageId,
      title: newActivity.title || "Nova atividade",
      description: newActivity.description,
      type: newActivity.type || "INTERNAL_TASK",
      status: "PLANNED",
      dueAt: newActivity.dueAt || null,
      completedAt: null,
      ownerName: "Usuário Atual",
      ownerUserId: "current_user",
      createdByName: "Usuário Atual",
      createdByUserId: "current_user",
      createdAt: new Date().toISOString(),
    };
    setLocalActivities(prev => [activity, ...prev]);
  };

  // Verifica se pode iniciar o projeto
  const canStartProject = currentStage?.isFinal && 
    localActivities.filter(a => a.status === "PLANNED").length === 0;

  // Handler para iniciar projeto
  const handleStartProject = () => {
    if (!canStartProject) return;
    
    // Na vida real, chamaria a API
    alert(`Projeto ${contract.title} iniciado com sucesso! Redirecionando para a aba de Execução...`);
    router.push(`/contratos/${contratoId}/execucao`);
  };

  // Pendências bloqueantes
  const pendingActivities = localActivities.filter(a => a.status === "PLANNED").length;
  const hasBlockingPendencies = !currentStage?.isFinal || pendingActivities > 0;

  return (
    <div className="space-y-6">
      {/* Barra de Progresso dos Estágios */}
      <InitiationProgressBar
        stages={MOCK_STAGES}
        currentStageId={currentStageId}
        stageHistory={stageHistory}
        onStageChange={handleStageChange}
      />

      {/* Grid Principal: Resumo + Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Resumo do Contrato */}
        <div className="lg:col-span-1">
          <InitiationSummary
            contract={contract}
            currentStage={currentStage}
          />

          {/* Botão Iniciar Projeto */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Iniciar Execução</h3>
            
            {hasBlockingPendencies ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pendências para iniciar:</p>
                    <ul className="mt-1 space-y-1 text-yellow-600">
                      {!currentStage?.isFinal && (
                        <li>• Contrato não está no estágio final</li>
                      )}
                      {pendingActivities > 0 && (
                        <li>• {pendingActivities} atividade(s) pendente(s)</li>
                      )}
                    </ul>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                >
                  <Play className="h-4 w-4" />
                  Iniciar Projeto
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pronto para iniciar!</p>
                    <p className="text-green-600 mt-1">
                      Todas as etapas de preparação foram concluídas.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartProject}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Iniciar Projeto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Atividades */}
        <div className="lg:col-span-2">
          <InitiationActivities
            activities={filteredActivities}
            filter={activityFilter}
            onFilterChange={setActivityFilter}
            onCompleteActivity={handleCompleteActivity}
            onCreateActivity={handleCreateActivity}
            totalPending={localActivities.filter(a => a.status === "PLANNED").length}
            totalDone={localActivities.filter(a => a.status === "DONE").length}
          />
        </div>
      </div>
    </div>
  );
}
