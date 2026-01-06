import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// GET /api/contratos/:contratoId/iniciacao/history
// Endpoint para buscar histórico de movimentações de um contrato
// =============================================================================

// Mock de histórico - Em produção, viria do banco via Prisma
const MOCK_STAGE_HISTORY = [
  {
    id: "hist_1",
    contractId: "contract_8",
    fromStageId: null,
    fromStageName: null,
    toStageId: "stage_1",
    toStageName: "Contrato Assinado",
    movedAt: "2025-12-15T10:00:00Z",
    movedByUserId: "system",
    movedByUserName: "Sistema",
    daysInPreviousStage: null,
  },
  {
    id: "hist_2",
    contractId: "contract_8",
    fromStageId: "stage_1",
    fromStageName: "Contrato Assinado",
    toStageId: "stage_2",
    toStageName: "Documentação Completa",
    movedAt: "2025-12-18T14:00:00Z",
    movedByUserId: "user_2",
    movedByUserName: "Maria Santos",
    daysInPreviousStage: 3,
  },
  {
    id: "hist_3",
    contractId: "contract_8",
    fromStageId: "stage_2",
    fromStageName: "Documentação Completa",
    toStageId: "stage_3",
    toStageName: "Equipe Alocada",
    movedAt: "2025-12-23T09:00:00Z",
    movedByUserId: "user_3",
    movedByUserName: "Carlos Mendes",
    daysInPreviousStage: 5,
  },
  {
    id: "hist_4",
    contractId: "contract_8",
    fromStageId: "stage_3",
    fromStageName: "Equipe Alocada",
    toStageId: "stage_4",
    toStageName: "Planejamento Aprovado",
    movedAt: "2025-12-27T11:00:00Z",
    movedByUserId: "user_5",
    movedByUserName: "Prof. André Souza",
    daysInPreviousStage: 4,
  },
  {
    id: "hist_5",
    contractId: "contract_8",
    fromStageId: "stage_4",
    fromStageName: "Planejamento Aprovado",
    toStageId: "stage_5",
    toStageName: "Kickoff Realizado",
    movedAt: "2026-01-02T15:00:00Z",
    movedByUserId: "user_5",
    movedByUserName: "Prof. André Souza",
    daysInPreviousStage: 6,
  },
  {
    id: "hist_6",
    contractId: "contract_8",
    fromStageId: "stage_5",
    fromStageName: "Kickoff Realizado",
    toStageId: "stage_6",
    toStageName: "Pronto para Execução",
    movedAt: "2026-01-05T14:00:00Z",
    movedByUserId: "system",
    movedByUserName: "Sistema",
    daysInPreviousStage: 3,
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contratoId: string }> }
) {
  try {
    const { contratoId } = await params;

    // Filtrar histórico pelo contratoId
    // Em produção: const history = await prisma.contractInitiationStageHistory.findMany({ where: { contractId: contratoId } });
    const history = MOCK_STAGE_HISTORY.filter(h => h.contractId === contratoId);

    // Ordenar por data (mais recente primeiro)
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime()
    );

    return NextResponse.json({
      history: sortedHistory,
    });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar histórico" },
      { status: 500 }
    );
  }
}
