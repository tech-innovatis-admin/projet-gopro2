import { NextRequest } from 'next/server';
import { proxyToJava } from '../../../_shared';

export async function GET(req: NextRequest) {
  return proxyToJava(req, '/admin/allowed-registrations');
}

export async function POST(req: NextRequest) {
  return proxyToJava(req, '/admin/allowed-registrations', { method: 'POST' });
}

