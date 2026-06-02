import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../../_shared/backend';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/contracts/${id}/partners`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/contracts/${id}/partners`);
}
