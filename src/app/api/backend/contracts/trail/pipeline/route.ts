import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '../../../../_shared';

export async function GET(req: NextRequest) {
  // Placeholder atÃ© o Java implementar
  // Quando implementado, usar: return proxyToJava(req, '/contracts/trail/pipeline');
  // Tabela: contract_initiation_stages
  return NextResponse.json(
    { message: 'Not Implemented - Aguardando implementaÃ§Ã£o no backend Java' },
    { status: 501 }
  );
}

