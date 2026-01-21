import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '../../../../../_shared';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Placeholder até o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/api/contracts/${params.id}/initiation/move`, { method: 'PATCH' });
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
  // Quando implementado, usar: return proxyToJava(req, `/api/contracts/${params.id}/initiation/move`, { method: 'POST' });
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementação no backend Java' },
    { status: 501 }
  );
}
