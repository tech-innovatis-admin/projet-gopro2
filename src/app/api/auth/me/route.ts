import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type BackendAuthMeResponse = {
  id: number;
  fullName: string;
  email: string;
  role: string | null;
  avatarUrl?: string | null;
};

function isUuid(value?: string | null): boolean {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

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

async function resolveAvatarImageUrl(
  backendBaseUrl: string,
  accessToken: string,
  avatarReference?: string | null
): Promise<string | null> {
  const normalizedReference = avatarReference?.trim();
  if (!normalizedReference) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedReference)) {
    return normalizedReference;
  }

  if (!isUuid(normalizedReference)) {
    return null;
  }

  const response = await fetch(
    `${backendBaseUrl}/documents/${normalizedReference}/download?expiresInMinutes=60`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { url?: string };
  return typeof payload.url === 'string' && payload.url.trim() ? payload.url : null;
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

    const user = (await backendResponse.json()) as BackendAuthMeResponse;
    const avatarImageUrl = await resolveAvatarImageUrl(
      backendBaseUrl,
      accessToken,
      user.avatarUrl
    );

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: String(user.id),
        name: user.fullName,
        email: user.email,
        role: String(user.role ?? '').toLowerCase(),
        avatarUrl: user.avatarUrl ?? null,
        avatarImageUrl,
      },
    });
  } catch (error) {
    console.error('[Auth/Me] Erro ao verificar autenticação:', error);
    return NextResponse.json(
      { isAuthenticated: false, error: 'Erro ao verificar autenticação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
