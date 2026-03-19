import { NextResponse } from 'next/server';
import type { ApiError, RequestContext } from './types';
import {
  getCodeErrorMessage,
  getStatusErrorMessage,
} from '@/src/lib/feedback/user-messages';

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
    const fieldErrors = extractFieldErrors(errorObj);
    return {
      message: (errorObj.message as string) || getDefaultErrorMessage(statusCode),
      code: (errorObj.code as string) || `HTTP_${statusCode}`,
      details: errorObj.details || errorObj,
      timestamp: (errorObj.timestamp as string) || new Date().toISOString(),
      path: (errorObj.path as string) || context?.endpoint,
      fieldErrors,
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
  return getStatusErrorMessage(statusCode) || `Erro ${statusCode}: Requisição falhou`;
}

function isApiFieldError(item: unknown): item is { field: string; message: string } {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as { field?: unknown }).field === 'string' &&
    typeof (item as { message?: unknown }).message === 'string'
  );
}

function extractFieldErrors(errorObj: Record<string, unknown>) {
  if (Array.isArray(errorObj.fieldErrors)) {
    return errorObj.fieldErrors
      .filter(isApiFieldError)
      .map((item) => ({ field: item.field, message: item.message }));
  }

  const details = errorObj.details;
  if (details && typeof details === 'object' && Array.isArray((details as { fieldErrors?: unknown[] }).fieldErrors)) {
    return (details as { fieldErrors: unknown[] }).fieldErrors
      .filter(isApiFieldError)
      .map((item) => ({ field: item.field, message: item.message }));
  }

  return undefined;
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
        ...(error.fieldErrors?.length
          ? {
              fieldErrors: error.fieldErrors,
              ...(process.env.NODE_ENV === 'development' || statusCode >= 500
                ? {}
                : { details: { fieldErrors: error.fieldErrors } }),
            }
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
    message:
      getCodeErrorMessage('CONNECTION_ERROR') ||
      'Erro ao conectar com o servidor. Tente novamente mais tarde.',
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
    message:
      getCodeErrorMessage('TIMEOUT_ERROR') ||
      `A requisição demorou mais de ${timeoutMs / 1000}s para responder. Tente novamente.`,
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
