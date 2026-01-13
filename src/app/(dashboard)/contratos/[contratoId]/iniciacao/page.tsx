"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Play,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  MOCK_STAGES,
  MOCK_PIPELINE_CONTRACTS,
  getContractActivities,
  getContractStageHistory,
  type InitiationActivity,
  type InitiationActivityStatus,
  type StageHistoryEntry,
} from "../../funil/types";
import {
  InitiationProgressBar,
  InitiationSummary,
  FocusPanel,
  HistoryPanel,
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
  const initialStageHistory = useMemo(() => {
    return getContractStageHistory(contratoId);
  }, [contratoId]);

  // Estado de atividades locais (para permitir marcar como concluída)
  const [localActivities, setLocalActivities] = useState<InitiationActivity[]>(activities);

  // Estado de histórico de movimentação local (para atualizações em tempo real)
  const [localStageHistory, setLocalStageHistory] = useState<StageHistoryEntry[]>(initialStageHistory);

  // Estado para armazenar o estágio atual (permite mudança)
  const [currentStageId, setCurrentStageId] = useState<string>(contract.stageId);

  // Estado de loading para mudança de etapa
  const [isMovingStage, setIsMovingStage] = useState(false);

  // Busca o estágio atual baseado no estado
  const currentStage = useMemo(() => {
    return MOCK_STAGES.find(s => s.id === currentStageId);
  }, [currentStageId]);

  // Handler para mudar de etapa (via barra de progresso)
  const handleStageChange = useCallback(async (newStageId: string) => {
    if (newStageId === currentStageId || isMovingStage) return;

    const fromStageId = currentStageId;
    setIsMovingStage(true);

    // Atualização otimista do estado local
    setCurrentStageId(newStageId);

    // Chamar endpoint para registrar movimentação
    try {
      const response = await fetch(`/api/contratos/${contratoId}/iniciacao/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStageId, toStageId: newStageId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Adicionar novo registro ao histórico local
        if (data.historyEntry) {
          setLocalStageHistory(prev => [data.historyEntry, ...prev]);
        }
      } else {
        console.error("Erro ao mover contrato:", await response.text());
        // Reverter em caso de erro
        setCurrentStageId(fromStageId);
      }
    } catch (error) {
      console.error("Erro ao chamar endpoint de movimentação:", error);
      // Reverter em caso de erro
      setCurrentStageId(fromStageId);
    } finally {
      setIsMovingStage(false);
    }
  }, [contratoId, currentStageId, isMovingStage]);

  // Handler para toggle status da atividade (marcar/desmarcar como concluída)
  const handleToggleActivityStatus = (activityId: string) => {
    setLocalActivities(prev => 
      prev.map(activity => {
        if (activity.id !== activityId) return activity;

        // Se está concluída, volta para PLANNED (desmarcada)
        if (activity.status === "DONE") {
          return { 
            ...activity, 
            status: "PLANNED" as InitiationActivityStatus,
            completedAt: null,
          };
        }

        // Se está pendente, marca como DONE (concluída)
        return { 
          ...activity, 
          status: "DONE" as InitiationActivityStatus,
          completedAt: new Date().toISOString(),
        };
      })
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

  // Handler para editar atividade
  const handleEditActivity = (activityId: string, updatedData: Partial<InitiationActivity>) => {
    setLocalActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, ...updatedData }
          : activity
      )
    );
  };

  // Handler para excluir atividade
  const handleDeleteActivity = (activityId: string) => {
    setLocalActivities(prev => 
      prev.filter(activity => activity.id !== activityId)
    );
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

  // Estado para controlar abertura do form de nova atividade
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);

  // Pendências bloqueantes
  const pendingActivities = localActivities.filter(a => a.status === "PLANNED").length;
  const hasBlockingPendencies = !currentStage?.isFinal || pendingActivities > 0;

  return (
    <div className="space-y-6">
      {/* Barra de Progresso dos Estágios - Full Width */}
      <InitiationProgressBar
        stages={MOCK_STAGES}
        currentStageId={currentStageId}
        stageHistory={localStageHistory}
        onStageChange={handleStageChange}
        isLoading={isMovingStage}
      />

      {/* Grid Principal: Layout Pipedrive (30/70) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* Coluna Esquerda: Resumo + Ações */}
        <div className="space-y-4">
          <InitiationSummary
            contract={contract}
            currentStage={currentStage}
          />

          {/* Card Iniciar Execução */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Iniciar Execução</h3>
            
            {hasBlockingPendencies ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 p-2.5 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pendências:</p>
                    <ul className="mt-1 space-y-0.5 text-yellow-600">
                      {!currentStage?.isFinal && (
                        <li>• Não está no estágio final</li>
                      )}
                      {pendingActivities > 0 && (
                        <li>• {pendingActivities} atividade(s) pendente(s)</li>
                      )}
                    </ul>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                >
                  <Play className="h-4 w-4" />
                  Iniciar Projeto
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 p-2.5 rounded-lg">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pronto para iniciar!</p>
                    <p className="text-green-600 mt-0.5">
                      Todas as etapas concluídas.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStartProject}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Iniciar Projeto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Foco + Histórico (estilo Pipedrive) */}
        <div className="space-y-4">
          {/* Painel de Foco */}
          <FocusPanel
            activities={localActivities}
            onToggleActivityStatus={handleToggleActivityStatus}
            onEditActivity={handleEditActivity}
            onDeleteActivity={handleDeleteActivity}
          />

          {/* Painel de Histórico */}
          <HistoryPanel
            activities={localActivities}
            stageHistory={localStageHistory}
            onToggleActivityStatus={handleToggleActivityStatus}
            onCreateActivity={handleCreateActivity}
          />
        </div>
      </div>
    </div>
  );
}
