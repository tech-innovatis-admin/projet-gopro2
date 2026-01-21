import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

function getProxyConfig(): ProxyConfig {
  if (proxyConfig) {
    return proxyConfig;
  }

  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      'API_BASE_URL não configurada. Configure a variável de ambiente API_BASE_URL no .env.local'
    );
  }

  try {
    new URL(baseUrl);
  } catch {
    throw new Error(`API_BASE_URL inválida: ${baseUrl}`);
  }

  proxyConfig = {
    baseUrl: baseUrl.replace(/\/$/, ''),
    defaultTimeout: parseInt(process.env.API_TIMEOUT_MS || '30000', 10), // 15s default
    isDevelopment: process.env.NODE_ENV === 'development',
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

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('access_token')?.value || cookieStore.get('token')?.value;
    return token || null;
  } catch {
    return null;
  }
}

async function buildHeaders(
  req: NextRequest,
  options: ProxyOptions
): Promise<HeadersInit> {
  const config = getProxyConfig();
  const headers: Record<string, string> = {
    ...config.defaultHeaders,
  };

  if (options.requireAuth !== false) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

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

  // multipart/form-data: usar arrayBuffer para preservar binários (PDF, imagens, etc.)
  // IMPORTANTE: não usar req.text() pois corrompe o boundary e payload binário
  if (contentType.includes('multipart/form-data')) {
    try {
      const arrayBuffer = await req.arrayBuffer();
      return arrayBuffer.byteLength > 0 ? arrayBuffer : undefined;
    } catch {
      return undefined;
    }
  }

  // application/x-www-form-urlencoded: pode usar text
  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      return await req.text();
    } catch {
      return undefined;
    }
  }

  // Fallback: qualquer outro content-type, tratar como binário
  try {
    const arrayBuffer = await req.arrayBuffer();
    return arrayBuffer.byteLength > 0 ? arrayBuffer : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Faz proxy de requisição para a API Java
 * 
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   return proxyToJava(req, '/api/projects');
 * }
 * 
 * export async function POST(req: NextRequest) {
 *   return proxyToJava(req, '/api/projects', { method: 'POST' });
 * }
 * ```
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
      message: 'Endpoint inválido. Deve começar com "/"',
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
  const upstreamUrl = `${config.baseUrl}${endpoint}${url.search}`;

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

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      if (!response.ok) {
        console.error(`[BFF Error] ${method} ${endpoint} -> ${response.status}`, {
          upstream: upstreamUrl,
          status: response.status,
        });

        let errorData: unknown;
        try {
          errorData = responseText ? JSON.parse(responseText) : null;
        } catch {
          errorData = responseText;
        }

        const error = normalizeApiError(errorData, response.status, context);
        return createErrorResponse(error, response.status, context);
      }

      const nextResponse = new NextResponse(responseText, {
        status: response.status,
        statusText: response.statusText,
      });

      response.headers.forEach((value, key) => {
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
