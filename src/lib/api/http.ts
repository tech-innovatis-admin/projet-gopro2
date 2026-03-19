import type { BackendErrorResponse, BackendFieldError, BffErrorEnvelope } from './types';
import { HttpError } from './types';
import { redirectToLogin } from '../auth/session';
import {
  getCodeErrorMessage,
  getStatusErrorMessage,
  resolveUserMessage,
} from '../feedback/user-messages';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  body?: unknown;
}

function parseTimeoutMs(value: string | undefined, fallbackMs: number): number {
  const normalized = value?.trim().replace(/^['"]|['"]$/g, '');
  const parsed = Number.parseInt(normalized ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackMs;
  }
  return parsed;
}

const DEFAULT_TIMEOUT_MS = parseTimeoutMs(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 15000);
const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api/backend').replace(/\/$/, '');

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const isAbsolute = /^https?:\/\//i.test(path);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL(isAbsolute ? path : `${BASE_URL}${normalizedPath}`, origin);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

interface NormalizedErrorPayload {
  message: string;
  details?: unknown;
  code?: string;
  timestamp?: string;
  path?: string;
  fieldErrors?: BackendFieldError[];
}

function isBffErrorEnvelope(payload: unknown): payload is BffErrorEnvelope {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof (payload as BffErrorEnvelope).error?.message === 'string'
  );
}

function isBackendErrorResponse(payload: unknown): payload is BackendErrorResponse {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    ('message' in payload || 'status' in payload || 'error' in payload)
  );
}

function resolveDisplayMessage(
  message: string,
  fieldErrors?: BackendFieldError[]
): string {
  return resolveUserMessage(message, { fieldErrors });
}

function normalizeErrorPayload(payload: unknown, status: number): NormalizedErrorPayload {
  const fallback = getStatusErrorMessage(status) ?? `Erro HTTP ${status}`;

  if (isBffErrorEnvelope(payload)) {
    const details = payload.error.details;
    const fieldErrors =
      payload.error.fieldErrors ||
      (details && typeof details === 'object' && 'fieldErrors' in details
        ? (details as { fieldErrors?: BackendFieldError[] }).fieldErrors
        : undefined);
    const message = resolveDisplayMessage(payload.error.message || fallback, fieldErrors);

    return {
      message,
      details,
      code: payload.error.code,
      timestamp: payload.error.timestamp,
      path: payload.error.path,
      fieldErrors,
    };
  }

  if (isBackendErrorResponse(payload)) {
    const message = resolveDisplayMessage(payload.message || fallback, payload.fieldErrors);
    return {
      message,
      details: payload,
      code: typeof payload.status === 'number' ? `HTTP_${payload.status}` : `HTTP_${status}`,
      timestamp: payload.timestamp,
      path: payload.path,
      fieldErrors: payload.fieldErrors,
    };
  }

  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return {
        message,
        details: payload,
        code: `HTTP_${status}`,
      };
    }
  }

  return {
    message: fallback,
    details: payload,
    code: `HTTP_${status}`,
  };
}

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): AbortController {
  const controller = new AbortController();

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }

  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || undefined;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { query, headers, timeoutMs = DEFAULT_TIMEOUT_MS, signal, body } = options;
  const url = buildUrl(path, query);
  const controller = withTimeout(signal, timeoutMs);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (!isFormData && body !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: requestHeaders,
      signal: controller.signal,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new HttpError(getCodeErrorMessage('TIMEOUT_ERROR') ?? `Timeout da requisição (${timeoutMs}ms)`, 504, error, {
        code: 'TIMEOUT_ERROR',
      });
    }
    throw new HttpError(getCodeErrorMessage('CONNECTION_ERROR') ?? 'Falha de conexão com a API', 0, error, {
      code: 'CONNECTION_ERROR',
    });
  }

  const payload = await parseResponsePayload(response);
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      await redirectToLogin();
    }

    const normalized = normalizeErrorPayload(payload, response.status);
    throw new HttpError(normalized.message, response.status, normalized.details, {
      code: normalized.code,
      timestamp: normalized.timestamp,
      path: normalized.path,
      fieldErrors: normalized.fieldErrors,
    });
  }

  return payload as T;
}

export const http = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>('GET', path, options);
  },
  post<T>(path: string, options?: RequestOptions) {
    return request<T>('POST', path, options);
  },
  put<T>(path: string, options?: RequestOptions) {
    return request<T>('PUT', path, options);
  },
  patch<T>(path: string, options?: RequestOptions) {
    return request<T>('PATCH', path, options);
  },
  delete<T>(path: string, options?: RequestOptions) {
    return request<T>('DELETE', path, options);
  },
};
