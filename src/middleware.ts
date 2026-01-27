import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET não configurado. Defina JWT_SECRET no .env/.env.local para habilitar autenticação.'
  );
}

const JWT_KEY = new TextEncoder().encode(JWT_SECRET);

async function isValidAccessToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY);
    // Regras mínimas: token deve ser do tipo access e conter email
    return payload?.type === 'access' && typeof payload?.email === 'string';
  } catch {
    return false;
  }
}

// Compatibilidade temporária (somente DEV): token base64 antigo
function isValidLegacyToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isApiRoute = pathname.startsWith('/api');

  // Tokens suportados:
  // - access_token (JWT) [PREFERIDO]
  // - Authorization: Bearer <JWT> (para chamadas API)
  // - token (LEGACY base64) [SOMENTE DEV]
  const accessTokenCookie = request.cookies.get('access_token')?.value;
  const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  const legacyToken = request.cookies.get('token')?.value;

  let isAuthenticated = false;

  // 1) Preferir JWT
  const candidateJwt = accessTokenCookie || bearerToken;
  if (candidateJwt) {
    isAuthenticated = await isValidAccessToken(candidateJwt);
  } else if (process.env.NODE_ENV !== 'production' && legacyToken) {
    // 2) Compatibilidade DEV com token base64 antigo
    isAuthenticated = isValidLegacyToken(legacyToken);
    if (isAuthenticated) {
      console.warn(
        '[Middleware] Autenticação via cookie legacy "token" (base64) em uso. Migre para JWT (access_token).'
      );
    }
  }

  console.log(
    `🔒 [Middleware] ${pathname} | jwt: ${candidateJwt ? 'presente' : 'ausente'} | legacy: ${legacyToken ? 'presente' : 'ausente'} | auth: ${isAuthenticated}`
  );

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = ['/login', '/termos', '/privacidade'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Rotas de API de autenticação (sempre públicas)
  const isAuthApi = pathname.startsWith('/api/auth');

  // Se for rota de API de auth, deixa passar
  if (isAuthApi) {
    return NextResponse.next();
  }

  // Usuário NÃO autenticado tentando acessar rota protegida
  if (!isAuthenticated && !isPublicRoute) {
    // Para APIs, retornar 401 (não redirecionar)
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔒 [Middleware] Redirecionando para /login (não autenticado)`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Usuário JÁ autenticado tentando acessar /login
  if (isAuthenticated && pathname === '/login') {
    console.log(`🔒 [Middleware] Redirecionando para / (já autenticado)`);
    // Redireciona para / (que vai para /home)
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Define quais rotas o middleware deve ser acionado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (imagens, svgs, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$).*)',
  ],
};
