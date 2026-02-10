import { NextResponse } from 'next/server';
import type { ApiError, RequestContext } from './types';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Requisicao invalida. Verifique os dados enviados.',
  401: 'Nao autorizado. Faca login novamente.',
  403: 'Acesso negado. Voce nao tem permissao para esta acao.',
  404: 'Recurso nao encontrado.',
  409: 'Conflito. O recurso ja existe ou esta em uso.',
  422: 'Dados invalidos. Verifique os campos obrigatorios.',
  429: 'Muitas requisicoes. Tente novamente em alguns instantes.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
  502: 'Servico temporariamente indisponivel. Tente novamente mais tarde.',
  503: 'Servico em manutencao. Tente novamente mais tarde.',
  504: 'Timeout da requisicao. Tente novamente mais tarde.',
};

export function normalizeApiError(
  error: unknown,
  statusCode: number,
  context?: RequestContext
): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (typeof error === 'string') {
    return {
      message: error,
      code: `HTTP_${statusCode}`,
      timestamp: new Date().toISOString(),
      path: context?.endpoint,
    };
  }

  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    return {
      message: (errorObj.message as string) || getDefaultErrorMessage(statusCode),
      code: (errorObj.code as string) || `HTTP_${statusCode}`,
      details: errorObj.details || errorObj,
      timestamp: (errorObj.timestamp as string) || new Date().toISOString(),
      path: (errorObj.path as string) || context?.endpoint,
    };
  }

  return {
    message: getDefaultErrorMessage(statusCode),
    code: `HTTP_${statusCode}`,
    details: error,
    timestamp: new Date().toISOString(),
    path: context?.endpoint,
  };
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  );
}

function getDefaultErrorMessage(statusCode: number): string {
  return ERROR_MESSAGES[statusCode] || `Erro ${statusCode}: Requisicao falhou`;
}

export function createErrorResponse(
  error: ApiError,
  statusCode: number,
  context?: RequestContext
): NextResponse {
  if (process.env.NODE_ENV === 'development' || statusCode >= 500) {
    console.error('[BFF Error]', {
      statusCode,
      error,
      context,
    });
  }

  return NextResponse.json(
    {
      error: {
        message: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' || statusCode >= 500
          ? { details: error.details }
          : {}),
        timestamp: error.timestamp,
        path: error.path,
      },
    },
    { status: statusCode }
  );
}

export function createConnectionErrorResponse(
  endpoint: string,
  originalError: unknown
): NextResponse {
  const error: ApiError = {
    message: 'Erro ao conectar com o servidor. Tente novamente mais tarde.',
    code: 'CONNECTION_ERROR',
    details: originalError instanceof Error ? originalError.message : String(originalError),
    timestamp: new Date().toISOString(),
    path: endpoint,
  };

  console.error('[BFF Connection Error]', {
    endpoint,
    error: originalError,
  });

  return NextResponse.json(
    {
      error: {
        message: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' ? { details: error.details } : {}),
        timestamp: error.timestamp,
        path: error.path,
      },
    },
    { status: 502 }
  );
}

export function createTimeoutErrorResponse(
  endpoint: string,
  timeoutMs: number
): NextResponse {
  const error: ApiError = {
    message: `A requisicao demorou mais de ${timeoutMs / 1000}s para responder. Tente novamente.`,
    code: 'TIMEOUT_ERROR',
    timestamp: new Date().toISOString(),
    path: endpoint,
  };

  console.warn('[BFF Timeout]', {
    endpoint,
    timeoutMs,
  });

  return NextResponse.json(
    {
      error: {
        message: error.message,
        code: error.code,
        timestamp: error.timestamp,
        path: error.path,
      },
    },
    { status: 504 }
  );
}
