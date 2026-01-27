import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '../../../../../../_shared';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  await params;
  // Placeholder até o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/api/contracts/${params.id}/trail/activities/${params.activityId}`, { method: 'PATCH' });
  // Tabela: contract_initiation_activities
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementação no backend Java' },
    { status: 501 }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  await params;
  // Placeholder até o Java implementar
  // Quando implementado, usar: return proxyToJava(req, `/api/contracts/${params.id}/trail/activities/${params.activityId}`, { method: 'PUT' });
  // Tabela: contract_initiation_activities
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementação no backend Java' },
    { status: 501 }
  );
}
