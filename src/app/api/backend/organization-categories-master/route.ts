import { NextRequest } from 'next/server';
import { proxyToJava } from '../../_shared';

export async function GET(req: NextRequest) {
  return proxyToJava(req, '/api/organization-categories-master');
}

export async function POST(req: NextRequest) {
  return proxyToJava(req, '/api/organization-categories-master', { method: 'POST' });
}
