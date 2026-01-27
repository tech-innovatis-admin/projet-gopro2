import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../_shared';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/api/budget-transfers/${id}`);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/api/budget-transfers/${id}`, { method: 'PUT' });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/api/budget-transfers/${id}`, { method: 'DELETE' });
}
