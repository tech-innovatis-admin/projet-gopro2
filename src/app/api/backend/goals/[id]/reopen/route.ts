import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../../_shared';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/goals/${id}/reopen`, { method: 'PATCH' });
}
