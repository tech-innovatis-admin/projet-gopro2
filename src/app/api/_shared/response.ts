import { NextResponse } from 'next/server';
import type { ApiResponse, PaginatedResponse } from './types';

export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  message?: string
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    data,
    ...(message && { message }),
  };

  return NextResponse.json(response, { status: statusCode });
}

export function createCreatedResponse<T>(
  data: T,
  location?: string
): NextResponse<ApiResponse<T>> {
  const response = NextResponse.json<ApiResponse<T>>(
    {
      data,
      message: 'Recurso criado com sucesso.',
    },
    { status: 201 }
  );

  if (location) {
    response.headers.set('Location', location);
  }

  return response;
}

export function createUpdatedResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>(
    {
      data,
      message: 'Recurso atualizado com sucesso.',
    },
    { status: 200 }
  );
}

export function createDeletedResponse(includeBody: boolean = false): NextResponse {
  if (includeBody) {
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        message: 'Recurso excluído com sucesso.',
      },
      { status: 200 }
    );
  }

  return new NextResponse(null, { status: 204 });
}

export function createPaginatedResponse<T>(
  paginatedData: PaginatedResponse<T>,
  statusCode: number = 200
): NextResponse<ApiResponse<PaginatedResponse<T>>> {
  return NextResponse.json<ApiResponse<PaginatedResponse<T>>>(
    {
      data: paginatedData,
    },
    { status: statusCode }
  );
}

export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function createRedirectResponse(url: string, permanent: boolean = false): NextResponse {
  return NextResponse.redirect(url, { status: permanent ? 301 : 302 });
}

export function addHeaders(
  response: NextResponse,
  headers: Record<string, string>
): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export function createCachedResponse<T>(
  data: T,
  maxAge: number,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  const response = NextResponse.json<ApiResponse<T>>(
    {
      data,
    },
    { status: statusCode }
  );

  response.headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  response.headers.set('CDN-Cache-Control', `max-age=${maxAge}`);

  return response;
}
