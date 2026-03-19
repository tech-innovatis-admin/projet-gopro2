import { NextRequest, NextResponse } from 'next/server';

type BackendLoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: {
    id: number;
    email: string;
    username: string | null;
    fullName: string;
    role: string;
  };
};

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const login = (body?.login ?? body?.identifier ?? '').toString().trim();
    const password = (body?.password ?? '').toString();

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Email ou usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const backendBaseUrl = resolveBackendBaseUrl();
    const backendResponse = await fetch(`${backendBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ login, password }),
    });

    let payload: unknown;
    try {
      payload = await backendResponse.json();
    } catch {
      payload = null;
    }

    if (!backendResponse.ok) {
      const message =
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof (payload as { message?: unknown }).message === 'string'
          ? ((payload as { message: string }).message || 'Credenciais inválidas')
          : 'Credenciais inválidas';

      return NextResponse.json({ error: message }, { status: backendResponse.status });
    }

    const loginResponse = payload as BackendLoginResponse;

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: String(loginResponse.user.id),
          name: loginResponse.user.fullName,
          email: loginResponse.user.email,
          role: loginResponse.user.role.toLowerCase(),
        },
      },
      { status: 200 }
    );

    response.cookies.set('access_token', loginResponse.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: loginResponse.expiresInSeconds,
      path: '/',
    });

    // cookie legado removido para evitar conflito com fluxo antigo
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Auth/Login] Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
