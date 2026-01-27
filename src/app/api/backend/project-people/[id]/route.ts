import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../_shared';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/api/project-people/${id}`);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/api/project-people/${id}`, { method: 'PUT' });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/api/project-people/${id}`, { method: 'DELETE' });
}
