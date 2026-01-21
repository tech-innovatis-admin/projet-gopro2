import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '../../../../../_shared';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Placeholder até o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/api/contracts/${params.id}/trail/activities`);
  // Tabela: contract_initiation_activities
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementação no backend Java' },
    { status: 501 }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Placeholder até o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/api/contracts/${params.id}/trail/activities`, { method: 'POST' });
  // Tabela: contract_initiation_activities
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementação no backend Java' },
    { status: 501 }
  );
}
