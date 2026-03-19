import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PAGES = new Set(['/login', '/register', '/termos', '/privacidade']);
const PUBLIC_API_PREFIXES = ['/api/auth'];
const PUBLIC_API_ROUTES = new Set([
  '/api/backend/auth/login',
  '/api/backend/register/validate',
  '/api/backend/register/complete',
]);

function hasAuthCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get('access_token')?.value);
}

function isPublicPage(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) {
    return true;
  }

  for (const page of PUBLIC_PAGES) {
    if (pathname.startsWith(`${page}/`)) {
      return true;
    }
  }

  return false;
}

function isPublicApi(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.has(pathname)) {
    return true;
  }

  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Arquivos estaticos em /public (fonts, manifests, etc.)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  const authenticated = hasAuthCookie(request);
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }

    if (!authenticated) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (isPublicPage(pathname)) {
    if (authenticated && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL('/login', request.url);
    const redirectTarget = `${pathname}${search}`;
    loginUrl.searchParams.set('next', redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
