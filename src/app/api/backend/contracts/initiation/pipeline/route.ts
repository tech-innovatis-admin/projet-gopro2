import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '../../../../_shared';

export async function GET(req: NextRequest) {
  // Placeholder até o Java implementar
  // Quando implementado, usar: return proxyToJava(req, '/api/contracts/initiation/pipeline');
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementação no backend Java' },
    { status: 501 }
  );
}
