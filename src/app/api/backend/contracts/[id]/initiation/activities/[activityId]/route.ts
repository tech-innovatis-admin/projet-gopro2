import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '../../../../../../_shared';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; activityId: string } }
) {
  // Placeholder até o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/api/contracts/${params.id}/initiation/activities/${params.activityId}`, { method: 'PATCH' });
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementação no backend Java' },
    { status: 501 }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; activityId: string } }
) {
  // Placeholder até o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/api/contracts/${params.id}/initiation/activities/${params.activityId}`, { method: 'PUT' });
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementação no backend Java' },
    { status: 501 }
  );
}
