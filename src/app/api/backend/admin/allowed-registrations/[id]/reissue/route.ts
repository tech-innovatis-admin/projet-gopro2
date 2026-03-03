import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../../../_shared';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/admin/allowed-registrations/${id}/reissue`, {
    method: 'POST',
  });
}

