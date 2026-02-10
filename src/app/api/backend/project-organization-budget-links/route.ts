import { NextRequest } from 'next/server';
import { proxyToJava } from '../../_shared';

export async function GET(req: NextRequest) {
  return proxyToJava(req, '/project-organization-budget-links');
}

export async function POST(req: NextRequest) {
  return proxyToJava(req, '/project-organization-budget-links', { method: 'POST' });
}

