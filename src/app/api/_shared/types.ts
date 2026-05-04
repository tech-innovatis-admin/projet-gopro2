export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

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

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ProxyOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  requireAuth?: boolean;
  returnRawError?: boolean;
}

export interface RequestContext {
  requestId: string;
  endpoint: string;
  method: string;
  timestamp: string;
  clientIp?: string;
}

export interface ProxyConfig {
  baseUrl: string;
  defaultTimeout: number;
  isDevelopment: boolean;
  defaultHeaders: Record<string, string>;
}
