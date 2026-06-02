import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../../../_shared/backend';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; parceiroId: string }> }
) {
  const { id, parceiroId } = await params;
  return proxyToJava(req, `/contracts/${id}/partners/${parceiroId}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; parceiroId: string }> }
) {
  const { id, parceiroId } = await params;
  return proxyToJava(req, `/contracts/${id}/partners/${parceiroId}`);
}
