import { NextRequest, NextResponse } from 'next/server';

// Simple token validation for dev
function isValidToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Obtém o token de autenticação
  const token = request.cookies.get('token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Verifica se o token é válido
  const isAuthenticated = token ? isValidToken(token) : false;

  console.log(`🔒 [Middleware] ${pathname} | token: ${token ? 'presente' : 'ausente'} | auth: ${isAuthenticated}`);

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Rotas de API de autenticação (sempre públicas)
  const isAuthApi = pathname.startsWith('/api/auth');

  // Se for rota de API de auth, deixa passar
  if (isAuthApi) {
    return NextResponse.next();
  }

  // Usuário NÃO autenticado tentando acessar rota protegida
  if (!isAuthenticated && !isPublicRoute) {
    console.log(`🔒 [Middleware] Redirecionando para /login (não autenticado)`);
    // Redireciona para /login
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
