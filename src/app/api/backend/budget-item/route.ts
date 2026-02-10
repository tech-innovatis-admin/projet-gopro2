import { NextRequest } from 'next/server';
import { proxyToJava } from '../../_shared';

export async function GET(req: NextRequest) {
  return proxyToJava(req, '/budget-items');
}

export async function POST(req: NextRequest) {
  return proxyToJava(req, '/budget-items', { method: 'POST' });
}

