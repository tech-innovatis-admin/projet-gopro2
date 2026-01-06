import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// PATCH /api/contratos/:contratoId/iniciacao/move
// Endpoint centralizado para movimentação de etapas no funil
// =============================================================================

// Mock de histórico (em produção, seria salvo no banco)
let mockHistoryStore: any[] = [];

// Mock de contratos (em produção, viria do banco)
const mockContracts: Record<string, { stageId: string; stageEnteredAt: string }> = {};

// Mock de estágios para buscar nomes
const MOCK_STAGES_MAP: Record<string, string> = {
  stage_1: "Contrato Assinado",
  stage_2: "Documentação Completa",
  stage_3: "Equipe Alocada",
  stage_4: "Planejamento Aprovado",
  stage_5: "Kickoff Realizado",
  stage_6: "Pronto para Execução",
};

type MoveRequestBody = {
  fromStageId: string;
  toStageId: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contratoId: string }> }
) {
  try {
    const { contratoId } = await params;
    const body: MoveRequestBody = await request.json();
    const { fromStageId, toStageId } = body;

    // Validações básicas
    if (!fromStageId || !toStageId) {
      return NextResponse.json(
        { error: "fromStageId e toStageId são obrigatórios" },
        { status: 400 }
      );
    }

    if (fromStageId === toStageId) {
      return NextResponse.json(
        { error: "Etapa de origem e destino não podem ser iguais" },
        { status: 400 }
      );
    }

    // Validar que os estágios existem
    if (!MOCK_STAGES_MAP[fromStageId] || !MOCK_STAGES_MAP[toStageId]) {
      return NextResponse.json(
        { error: "Etapa inválida" },
        { status: 400 }
      );
    }

    // Calcular dias na etapa anterior
    const now = new Date();
    const previousStageEntry = mockContracts[contratoId];
    let daysInPreviousStage: number | null = null;

    if (previousStageEntry?.stageEnteredAt) {
      const enteredAt = new Date(previousStageEntry.stageEnteredAt);
      const diffTime = Math.abs(now.getTime() - enteredAt.getTime());
      daysInPreviousStage = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // TODO: Em produção, buscar usuário autenticado do token/session
    const currentUser = {
      id: "current_user",
      name: "Usuário Atual",
    };

    // Criar registro de histórico
    const historyEntry = {
      id: `hist_${Date.now()}`,
      contractId: contratoId,
      fromStageId,
      fromStageName: MOCK_STAGES_MAP[fromStageId],
      toStageId,
      toStageName: MOCK_STAGES_MAP[toStageId],
      movedAt: now.toISOString(),
      movedByUserId: currentUser.id,
      movedByUserName: currentUser.name,
      daysInPreviousStage,
    };

    // Salvar no mock store
    mockHistoryStore.push(historyEntry);

    // Atualizar contrato mock
    mockContracts[contratoId] = {
      stageId: toStageId,
      stageEnteredAt: now.toISOString(),
    };

    // TODO: Em produção, usar Prisma para:
    // 1. Atualizar o contrato (initiationStageId, stageEnteredAt)
    // 2. Criar registro em ContractInitiationStageHistory
    /*
    await prisma.$transaction([
      prisma.contract.update({
        where: { id: contratoId },
        data: {
          initiationStageId: toStageId,
          stageEnteredAt: now,
        },
      }),
      prisma.contractInitiationStageHistory.create({
        data: {
          contractId: contratoId,
          fromStageId,
          toStageId,
          movedAt: now,
          movedByUserId: currentUser.id,
          movedByUserName: currentUser.name,
          daysInPreviousStage,
        },
      }),
    ]);
    */

    return NextResponse.json({
      success: true,
      historyEntry,
      contract: {
        id: contratoId,
        stageId: toStageId,
        stageEnteredAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao mover contrato:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar movimentação" },
      { status: 500 }
    );
  }
}
