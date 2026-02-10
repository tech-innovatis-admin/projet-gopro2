import { NextRequest } from 'next/server';
import { proxyToJava } from '../../_shared';

export async function GET(req: NextRequest) {
  return proxyToJava(req, '/disbursement-schedules');
}

export async function POST(req: NextRequest) {
  return proxyToJava(req, '/disbursement-schedules', { method: 'POST' });
}

