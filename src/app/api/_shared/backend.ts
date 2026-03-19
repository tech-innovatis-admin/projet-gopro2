import { NextRequest, NextResponse } from 'next/server';
import type {
  ProxyOptions,
  RequestContext,
  ProxyConfig,
  ApiError,
} from './types';
import {
  normalizeApiError,
  createErrorResponse,
  createConnectionErrorResponse,
  createTimeoutErrorResponse,
} from './errors';

let proxyConfig: ProxyConfig | null = null;
const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8080';
const DEFAULT_API_TIMEOUT_MS = 30000;
const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

function getConfiguredBaseUrl(): string | undefined {
  const envCandidates = [
    process.env.API_BASE_URL,
    process.env.BACKEND_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ];

  for (const candidate of envCandidates) {
    const value = candidate?.trim()?.replace(/^['"]|['"]$/g, '');
    if (!value) {
      continue;
    }

    // NEXT_PUBLIC_API_BASE_URL is usually "/api/backend" on the frontend.
    // For the server-side proxy we only accept absolute upstream URLs.
    if (!/^https?:\/\//i.test(value)) {
      continue;
    }

    return value;
  }

  return undefined;
}

function parseTimeoutMs(value: string | undefined, fallbackMs: number): number {
  const normalized = value?.trim().replace(/^['"]|['"]$/g, '');
  const parsed = Number.parseInt(normalized ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackMs;
  }
  return parsed;
}

function getProxyConfig(): ProxyConfig {
  if (proxyConfig) {
    return proxyConfig;
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';
  const configuredBaseUrl = getConfiguredBaseUrl();
  const baseUrl = configuredBaseUrl || (isDevelopment ? DEFAULT_DEV_API_BASE_URL : undefined);

  if (!configuredBaseUrl && isDevelopment) {
    console.warn(
      `[BFF Config] API_BASE_URL not set. Using default ${DEFAULT_DEV_API_BASE_URL} for development.`
    );
  }

  if (!baseUrl) {
    throw new Error(
      'API_BASE_URL não configurada. Defina API_BASE_URL (ou BACKEND_API_BASE_URL) com URL absoluta do backend.'
    );
  }

  try {
    new URL(baseUrl);
  } catch {
    throw new Error(`API_BASE_URL inválida: ${baseUrl}`);
  }

  proxyConfig = {
    baseUrl: baseUrl.replace(/\/$/, ''),
    defaultTimeout: parseTimeoutMs(process.env.API_TIMEOUT_MS, DEFAULT_API_TIMEOUT_MS),
    isDevelopment,
    defaultHeaders: {
      Accept: 'application/json',
      'User-Agent': 'GoPro-BFF/1.0',
    },
  };

  return proxyConfig;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function normalizePaginationQuery(searchParams: URLSearchParams): string {
  const normalized = new URLSearchParams(searchParams);
  const page = normalized.get('page');
  const size = normalized.get('size');

  if (page !== null) {
    const parsedPage = Number.parseInt(page, 10);
    if (!Number.isFinite(parsedPage) || parsedPage < 0) {
      normalized.set('page', '0');
    }

    if (size === null) {
      normalized.set('size', String(DEFAULT_PAGE_SIZE));
    }
  }

  if (size !== null) {
    const parsedSize = Number.parseInt(size, 10);
    if (
      !Number.isFinite(parsedSize) ||
      parsedSize < MIN_PAGE_SIZE ||
      parsedSize > MAX_PAGE_SIZE
    ) {
      normalized.set('size', String(DEFAULT_PAGE_SIZE));
    }
  }

  return normalized.toString();
}

async function buildHeaders(
  req: NextRequest,
  options: ProxyOptions
): Promise<HeadersInit> {
  const config = getProxyConfig();
  const headers: Record<string, string> = {
    ...config.defaultHeaders,
  };

  const contentType = req.headers.get('content-type');
  if (contentType && !options.headers?.['Content-Type']) {
    headers['Content-Type'] = contentType;
  }

  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    headers['X-Forwarded-For'] = forwardedFor;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    headers['X-Real-IP'] = realIp;
  }

  const authorizationHeader = req.headers.get('authorization');
  if (authorizationHeader) {
    headers.Authorization = authorizationHeader;
  } else {
    const accessToken = req.cookies.get('access_token')?.value;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  return headers;
}

async function getRequestBody(
  req: NextRequest,
  options: ProxyOptions
): Promise<BodyInit | undefined> {
  if (options.body !== undefined) {
    return JSON.stringify(options.body);
  }

  const method = options.method || req.method;
  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const json = await req.json();
      return JSON.stringify(json);
    } catch {
      return undefined;
    }
  }

  // multipart/form-data: use arrayBuffer to preserve binary payload.
  if (contentType.includes('multipart/form-data')) {
    try {
      const arrayBuffer = await req.arrayBuffer();
      return arrayBuffer.byteLength > 0 ? arrayBuffer : undefined;
    } catch {
      return undefined;
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      return await req.text();
    } catch {
      return undefined;
    }
  }

  // Fallback for unknown content-types as binary.
  try {
    const arrayBuffer = await req.arrayBuffer();
    return arrayBuffer.byteLength > 0 ? arrayBuffer : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Proxy request to Java API.
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   return proxyToJava(req, '/api/projects');
 * }
 */
export async function proxyToJava(
  req: NextRequest,
  endpoint: string,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const config = getProxyConfig();
  const method = options.method || req.method;
  const timeout = options.timeout || config.defaultTimeout;

  if (!endpoint || !endpoint.startsWith('/')) {
    const error: ApiError = {
      message: 'Endpoint inválido. Deve comecar com "/"',
      code: 'INVALID_ENDPOINT',
      timestamp: new Date().toISOString(),
      path: endpoint,
    };
    return createErrorResponse(error, 500, {
      requestId,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });
  }

  const url = new URL(req.url);
  const normalizedQuery = normalizePaginationQuery(url.searchParams);
  const upstreamUrl = `${config.baseUrl}${endpoint}${
    normalizedQuery ? `?${normalizedQuery}` : ''
  }`;

  const context: RequestContext = {
    requestId,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    clientIp:
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      undefined,
  };

  try {
    const headers = await buildHeaders(req, options);
    const body = await getRequestBody(req, options);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(upstreamUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let resolvedResponse = response;
      let resolvedResponseText = await response.text();
      let resolvedEndpoint = endpoint;
      let resolvedUpstreamUrl = upstreamUrl;

      if (config.isDevelopment && response.status === 404 && endpoint.startsWith('/api/')) {
        const fallbackEndpoint = endpoint.replace(/^\/api/, '');

        if (fallbackEndpoint !== endpoint) {
          const fallbackUpstreamUrl = `${config.baseUrl}${fallbackEndpoint}${
            normalizedQuery ? `?${normalizedQuery}` : ''
          }`;
          const fallbackController = new AbortController();
          const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), timeout);

          try {
            const fallbackResponse = await fetch(fallbackUpstreamUrl, {
              method,
              headers,
              body,
              signal: fallbackController.signal,
            });
            clearTimeout(fallbackTimeoutId);

            if (fallbackResponse.status !== 404) {
              resolvedResponse = fallbackResponse;
              resolvedResponseText = await fallbackResponse.text();
              resolvedEndpoint = fallbackEndpoint;
              resolvedUpstreamUrl = fallbackUpstreamUrl;
              console.warn(
                `[BFF Compatibility] Falling back endpoint ${endpoint} -> ${fallbackEndpoint}.`
              );
            }
          } catch (fallbackError) {
            clearTimeout(fallbackTimeoutId);

            if (!(fallbackError instanceof Error && fallbackError.name === 'AbortError')) {
              console.warn(
                `[BFF Compatibility] Failed fallback request ${fallbackUpstreamUrl}.`,
                fallbackError
              );
            }
          }
        }
      }

      if (!resolvedResponse.ok) {
        console.error(`[BFF Error] ${method} ${resolvedEndpoint} -> ${resolvedResponse.status}`, {
          upstream: resolvedUpstreamUrl,
          status: resolvedResponse.status,
        });

        let errorData: unknown;
        try {
          errorData = resolvedResponseText ? JSON.parse(resolvedResponseText) : null;
        } catch {
          errorData = resolvedResponseText;
        }

        const error = normalizeApiError(errorData, resolvedResponse.status, context);
        return createErrorResponse(error, resolvedResponse.status, context);
      }

      const hasNoBodyStatus =
        resolvedResponse.status === 204 ||
        resolvedResponse.status === 205 ||
        resolvedResponse.status === 304;

      const responseBody =
        hasNoBodyStatus || resolvedResponseText.length === 0
          ? null
          : resolvedResponseText;

      const nextResponse = new NextResponse(responseBody, {
        status: resolvedResponse.status,
      });

      resolvedResponse.headers.forEach((value, key) => {
        if (
          key.toLowerCase() !== 'content-encoding' &&
          key.toLowerCase() !== 'content-length' &&
          key.toLowerCase() !== 'transfer-encoding'
        ) {
          nextResponse.headers.set(key, value);
        }
      });

      return nextResponse;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[BFF Timeout] ${method} ${endpoint}`, {
          upstream: upstreamUrl,
          timeout: `${timeout}ms`,
        });
        return createTimeoutErrorResponse(endpoint, timeout);
      }

      throw fetchError;
    }
  } catch (error) {
    console.error(`[BFF Connection Error] ${method} ${endpoint}`, {
      upstream: upstreamUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return createConnectionErrorResponse(endpoint, error);
  }
}

export function validateProxyConfig(): { valid: boolean; error?: string } {
  try {
    getProxyConfig();
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function resetProxyConfig(): void {
  proxyConfig = null;
}
