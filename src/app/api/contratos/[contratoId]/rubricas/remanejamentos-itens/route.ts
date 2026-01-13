import { NextRequest, NextResponse } from 'next/server';

// Mock de remanejamentos em memória (substituir por banco de dados)
const remanejamentosMock: any[] = [];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contratoId: string }> }
) {
  try {
    const { contratoId } = await params;
    const body = await request.json();

    // Validações
    if (!body.itemOrigemId || !body.itemDestinoId) {
      return NextResponse.json(
        { error: 'Item de origem e destino são obrigatórios' },
        { status: 400 }
      );
    }

    if (body.itemOrigemId === body.itemDestinoId) {
      return NextResponse.json(
        { error: 'O item de destino deve ser diferente do item de origem' },
        { status: 400 }
      );
    }

    if (!body.valor || body.valor <= 0) {
      return NextResponse.json(
        { error: 'O valor deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (!body.motivo || body.motivo.trim().length < 10) {
      return NextResponse.json(
        { error: 'O motivo deve ter pelo menos 10 caracteres' },
        { status: 400 }
      );
    }

    // Criar remanejamento
    const novoRemanejamento = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      contratoId,
      itemOrigemId: body.itemOrigemId,
      itemDestinoId: body.itemDestinoId,
      valor: parseFloat(body.valor),
      data: body.data || new Date().toISOString().split('T')[0],
      motivo: body.motivo.trim(),
      createdBy: body.createdBy || 'Sistema',
      createdAt: new Date().toISOString(),
      status: body.status || 'APROVADO',
    };

    // Adicionar ao mock (substituir por persistência no banco)
    remanejamentosMock.push(novoRemanejamento);

    return NextResponse.json(
      { success: true, remanejamento: novoRemanejamento },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar remanejamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contratoId: string }> }
) {
  try {
    const { contratoId } = await params;

    // Filtrar remanejamentos do contrato (substituir por consulta ao banco)
    const remanejamentos = remanejamentosMock.filter(
      rem => rem.contratoId === contratoId
    );

    return NextResponse.json(
      { success: true, remanejamentos },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar remanejamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
