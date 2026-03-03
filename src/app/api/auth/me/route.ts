import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function resolveBackendBaseUrl(): string {
  const candidates = [
    process.env.API_BASE_URL,
    process.env.BACKEND_API_BASE_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim()?.replace(/^['"]|['"]$/g, '');
    if (value && /^https?:\/\//i.test(value)) {
      return value.replace(/\/$/, '');
    }
  }

  return 'http://localhost:8080';
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ isAuthenticated: false }, { status: 200 });
    }

    const backendBaseUrl = resolveBackendBaseUrl();
    const backendResponse = await fetch(`${backendBaseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ isAuthenticated: false }, { status: 200 });
    }

    const user = await backendResponse.json();
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: String(user.id),
        name: user.fullName,
        email: user.email,
        role: String(user.role ?? '').toLowerCase(),
      },
    });
  } catch (error) {
    console.error('[Auth/Me] Erro ao verificar autenticacao:', error);
    return NextResponse.json(
      { isAuthenticated: false, error: 'Erro ao verificar autenticacao' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
