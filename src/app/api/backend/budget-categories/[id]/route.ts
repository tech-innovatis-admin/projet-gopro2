import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../_shared';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToJava(req, `/api/budget-categories/${params.id}`);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToJava(req, `/api/budget-categories/${params.id}`, { method: 'PUT' });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToJava(req, `/api/budget-categories/${params.id}`, { method: 'DELETE' });
}
