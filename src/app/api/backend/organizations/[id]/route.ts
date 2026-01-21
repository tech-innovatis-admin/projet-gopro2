import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../_shared';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToJava(req, `/api/organizations/${params.id}`);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToJava(req, `/api/organizations/${params.id}`, { method: 'PUT' });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToJava(req, `/api/organizations/${params.id}`, { method: 'DELETE' });
}
