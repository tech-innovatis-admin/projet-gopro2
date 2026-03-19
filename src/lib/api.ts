/**
 * API Client para consumir o BFF (Backend for Frontend)
 * 
 * DECISÃO ARQUITETURAL:
 * - O BFF faz passthrough das respostas do Java (não envelopa em { data })
 * - O BFF padroniza erros no formato: { error: { message, code, details?, timestamp?, path? } }
 * - Este client centraliza o tratamento de erros e tipagem
 * 
 * @example
 * ```typescript
 * // GET simples
 * const projects = await api.get<Project[]>('/api/backend/projects');
 * 
 * // GET com query params
 * const filtered = await api.get<Project[]>('/api/backend/projects', {
 *   params: { status: 1, page: 0, size: 10 }
 * });
 * 
 * // POST com body
 * const created = await api.post<Project>('/api/backend/projects', {
 *   body: { name: 'Novo Projeto', code: 'PRJ-001' }
 * });
 * 
 * // Upload de arquivo
 * const formData = new FormData();
 * formData.append('file', file);
 * const uploaded = await api.upload<Document>('/api/backend/documents', formData);
 * ```
 */

import {
  getUserErrorMessage,
  getStatusErrorMessage,
  resolveUserMessage,
} from "@/src/lib/feedback/user-messages";

// =============================================================================
// TIPOS
// =============================================================================

/** Formato de erro padronizado do BFF */
export interface BackendFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
  fieldErrors?: BackendFieldError[];
  timestamp?: string;
  path?: string;
}

/** Resposta de erro do BFF */
export interface ApiErrorResponse {
  error: ApiError;
}

/** Resposta paginada (formato Spring) */
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  number: number;
  size: number;
  empty: boolean;
}

/** Opções para requisições */
export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** Opções para requisições com body */
export interface RequestWithBodyOptions extends RequestOptions {
  body?: unknown;
}

/** Exceção customizada para erros de API */
export class ApiException extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly fieldErrors?: BackendFieldError[];
  public readonly timestamp?: string;
  public readonly path?: string;

  constructor(error: ApiError, statusCode: number) {
    super(error.message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.code = error.code;
    this.details = error.details;
    this.fieldErrors = error.fieldErrors;
    this.timestamp = error.timestamp;
    this.path = error.path;
  }

  /** Verifica se é erro de autenticação */
  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  /** Verifica se é erro de permissão */
  isForbidden(): boolean {
    return this.statusCode === 403;
  }

  /** Verifica se é erro de validação */
  isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  /** Verifica se é erro de conflito (recurso já existe) */
  isConflict(): boolean {
    return this.statusCode === 409;
  }

  /** Verifica se é erro de servidor */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /** Verifica se é erro de conexão/timeout */
  isConnectionError(): boolean {
    return this.code === 'CONNECTION_ERROR' || this.code === 'TIMEOUT_ERROR';
  }
}

// =============================================================================
// HELPERS INTERNOS
// =============================================================================

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(endpoint, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  
  return url.toString();
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error?.message === 'string'
  );
}

function extractFieldErrors(
  error: Pick<ApiError, 'fieldErrors' | 'details'>
): BackendFieldError[] | undefined {
  if (Array.isArray(error.fieldErrors) && error.fieldErrors.length > 0) {
    return error.fieldErrors;
  }

  if (
    error.details &&
    typeof error.details === 'object' &&
    Array.isArray((error.details as { fieldErrors?: BackendFieldError[] }).fieldErrors)
  ) {
    return (error.details as { fieldErrors: BackendFieldError[] }).fieldErrors;
  }

  return undefined;
}

function resolveDisplayMessage(message: string, fieldErrors?: BackendFieldError[]): string {
  return resolveUserMessage(message, { fieldErrors });
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Resposta sem conteúdo (ex: DELETE 204)
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  
  // Resposta não-JSON (ex: arquivo, texto)
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiException(
        { message: `Erro ${response.status}: ${response.statusText}` },
        response.status
      );
    }
    // Retorna como blob para downloads
    return response.blob() as unknown as T;
  }

  // Resposta JSON
  const data = await response.json();

  if (!response.ok) {
    if (isApiErrorResponse(data)) {
      const fieldErrors = extractFieldErrors(data.error);
      throw new ApiException(
        {
          ...data.error,
          message: resolveDisplayMessage(data.error.message, fieldErrors),
          fieldErrors,
          details:
            data.error.details ?? (fieldErrors?.length ? { fieldErrors } : undefined),
        },
        response.status
      );
    }
    throw new ApiException(
      {
        message: resolveDisplayMessage(data.message || `Erro ${response.status}`, data.fieldErrors),
        fieldErrors: Array.isArray(data.fieldErrors) ? data.fieldErrors : undefined,
        details: data,
      },
      response.status
    );
  }

  // Passthrough: retorna o JSON como veio do Java
  return data as T;
}

// =============================================================================
// CLIENT API
// =============================================================================

/**
 * Cliente para consumir a API via BFF
 * 
 */
export const api = {
  /**
   * GET - Buscar recurso(s)
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint, options.params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: options.signal,
    });

    return handleResponse<T>(response);
  },

  /**
   * POST - Criar recurso
   */
  async post<T>(endpoint: string, options: RequestWithBodyOptions = {}): Promise<T> {
    const url = buildUrl(endpoint, options.params);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: options.signal,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * PUT - Atualizar recurso (completo)
   */
  async put<T>(endpoint: string, options: RequestWithBodyOptions = {}): Promise<T> {
    const url = buildUrl(endpoint, options.params);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: options.signal,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * PATCH - Atualizar recurso (parcial)
   */
  async patch<T>(endpoint: string, options: RequestWithBodyOptions = {}): Promise<T> {
    const url = buildUrl(endpoint, options.params);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: options.signal,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * DELETE - Remover recurso
   */
  async delete<T = void>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint, options.params);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: options.signal,
    });

    return handleResponse<T>(response);
  },

  /**
   * Upload de arquivo (multipart/form-data)
   * 
   * @example
   * ```typescript
   * const formData = new FormData();
   * formData.append('file', file);
   * formData.append('project_id', '123');
   * const doc = await api.upload<Document>('/api/backend/documents', formData);
   * ```
   */
  async upload<T>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    const url = buildUrl(endpoint, options.params);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: options.signal,
      body: formData,
    });

    return handleResponse<T>(response);
  },

  /**
   * Download de arquivo
   * 
   * @example
   * ```typescript
   * const blob = await api.download('/api/backend/documents/123/file');
   * const url = URL.createObjectURL(blob);
   * ```
   */
  async download(endpoint: string, options: RequestOptions = {}): Promise<Blob> {
    const url = buildUrl(endpoint, options.params);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      signal: options.signal,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (isApiErrorResponse(data)) {
          throw new ApiException(data.error, response.status);
        }
      }
      throw new ApiException(
        { message: getStatusErrorMessage(response.status) || `Erro ao baixar arquivo: ${response.status}` },
        response.status
      );
    }

    return response.blob();
  },
};

// =============================================================================
// HOOKS HELPERS (para usar com React)
// =============================================================================

/**
 * Verifica se um erro é ApiException
 */
export function isApiException(error: unknown): error is ApiException {
  return error instanceof ApiException;
}

export function getErrorMessage(error: unknown): string {
  return getUserErrorMessage(error);
}

/**
 * Handler padrão para erros de API
 * Redireciona para login se 401, ou retorna mensagem
 */
export function handleApiError(error: unknown): string {
  return getUserErrorMessage(error);
}

/**
 * Extrai erros de campo de um ApiException (útil para validação de formulários)
 * 
 * @param error - Erro capturado do try/catch
 * @returns Record<campo, mensagem> ou null se não houver erros de campo
 * 
 * @example
 * ```typescript
 * try {
 *   await api.post('/api/backend/projects', { body: data });
 * } catch (error) {
 *   const fieldErrors = getFieldErrors(error);
 *   if (fieldErrors) {
 *     // { name: 'Campo obrigatório', cpf: 'CPF inválido' }
 *     setFormErrors(fieldErrors);
 *   }
 * }
 * ```
 */
export function getFieldErrors(error: unknown): Record<string, string> | null {
  if (!isApiException(error)) return null;

  const fieldErrors = error.fieldErrors || extractFieldErrors(error);
  if (!fieldErrors?.length) return null;

  return fieldErrors.reduce((acc, { field, message }) => {
    acc[field] = message;
    return acc;
  }, {} as Record<string, string>);
}

export default api;
