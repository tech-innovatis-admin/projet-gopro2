import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// GET /api/contracts/initiation/stages
// Retorna todas as etapas do funil de iniciação ordenadas por order
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // TODO: Integrar com Prisma quando backend estiver pronto
    // const stages = await prisma.contractInitiationStage.findMany({
    //   orderBy: { order: "asc" },
    // });

    // Por enquanto, retornar dados mock (será substituído por chamada ao banco)
    const mockStages = [
      {
        id: "stage_1",
        name: "Contrato Assinado",
        description: "Contrato recém-assinado aguardando próximos passos",
        order: 1,
        isFinal: false,
        isActive: true,
        slaDays: 5,
      },
      {
        id: "stage_2",
        name: "Documentação Completa",
        description: "Toda documentação necessária foi reunida",
        order: 2,
        isFinal: false,
        isActive: true,
        slaDays: 7,
      },
      {
        id: "stage_3",
        name: "Equipe Alocada",
        description: "Equipe técnica definida e alocada",
        order: 3,
        isFinal: false,
        isActive: true,
        slaDays: 10,
      },
      {
        id: "stage_4",
        name: "Planejamento Aprovado",
        description: "Plano de trabalho aprovado pelo cliente",
        order: 4,
        isFinal: false,
        isActive: true,
        slaDays: 7,
      },
      {
        id: "stage_5",
        name: "Kickoff Realizado",
        description: "Reunião de kickoff realizada com stakeholders",
        order: 5,
        isFinal: false,
        isActive: true,
        slaDays: 3,
      },
      {
        id: "stage_6",
        name: "Pronto para Execução",
        description: "Todas as etapas concluídas, projeto pronto para iniciar",
        order: 6,
        isFinal: true,
        isActive: true,
        slaDays: 2,
      },
    ];

    return NextResponse.json(mockStages);
  } catch (error) {
    console.error("Erro ao buscar etapas:", error);
    return NextResponse.json(
      { message: "Erro ao buscar etapas do funil" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/contracts/initiation/stages
// Atualiza as etapas do funil (criar, editar, deletar)
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { stages, deletedIds = [] } = body;

    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { message: "Campo 'stages' deve ser um array" },
        { status: 400 }
      );
    }

    // TODO: Integrar com Prisma quando backend estiver pronto
    // 1. Deletar etapas em deletedIds
    // await prisma.contractInitiationStage.deleteMany({
    //   where: { id: { in: deletedIds } },
    // });
    //
    // 2. Atualizar/criar etapas
    // for (const stage of stages) {
    //   if (stage.id.startsWith("stage_new_")) {
    //     // Criar nova etapa
    //     await prisma.contractInitiationStage.create({
    //       data: { ...stage, id: undefined }, // Remover ID temporário
    //     });
    //   } else {
    //     // Atualizar etapa existente
    //     await prisma.contractInitiationStage.update({
    //       where: { id: stage.id },
    //       data: stage,
    //     });
    //   }
    // }

    console.log("Etapas a atualizar:", stages);
    console.log("IDs deletados:", deletedIds);

    return NextResponse.json({
      message: "Etapas atualizadas com sucesso",
      stages,
    });
  } catch (error) {
    console.error("Erro ao atualizar etapas:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar etapas do funil" },
      { status: 500 }
    );
  }
}
