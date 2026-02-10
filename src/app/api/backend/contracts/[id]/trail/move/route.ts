import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '../../../../../_shared';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  // Placeholder atÃ© o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/contracts/${params.id}/trail/move`, { method: 'PATCH' });
  // Tabela: contract_initiation_stage_history
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementaÃ§Ã£o no backend Java' },
    { status: 501 }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  // Placeholder atÃ© o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/contracts/${params.id}/trail/move`, { method: 'POST' });
  // Tabela: contract_initiation_stage_history
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementaÃ§Ã£o no backend Java' },
    { status: 501 }
  );
}

