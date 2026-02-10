import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '../../../../../_shared';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  // Placeholder atÃ© o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/contracts/${params.id}/trail/activities`);
  // Tabela: contract_initiation_activities
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
  // Quando implementado, usar: return proxyToJava(req, `/contracts/${params.id}/trail/activities`, { method: 'POST' });
  // Tabela: contract_initiation_activities
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementaÃ§Ã£o no backend Java' },
    { status: 501 }
  );
}

