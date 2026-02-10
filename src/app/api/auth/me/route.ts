import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type LegacyAuthToken = {
  userId?: string;
  exp?: number;
};

function parseLegacyToken(token: string): LegacyAuthToken | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded) as LegacyAuthToken;

    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ isAuthenticated: false }, { status: 200 });
    }

    const payload = parseLegacyToken(token);
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return NextResponse.json({ isAuthenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: payload.userId ?? '1',
        name: 'Administrador',
        email: 'admin@gopro.local',
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('[AuthMe] Erro ao verificar autenticacao:', error);
    return NextResponse.json(
      { isAuthenticated: false, error: 'Erro ao verificar autenticacao' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
