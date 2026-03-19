import type { BackendFieldError } from '@/src/lib/api/types';

export const DEFAULT_USER_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';

const STATUS_ERROR_MESSAGES: Record<number, string> = {
  400: 'Não foi possível concluir a solicitação. Revise os dados e tente novamente.',
  401: 'Sua sessão expirou. Faça login novamente.',
  403: 'Você não tem permissão para executar esta ação.',
  404: 'Não encontramos o recurso solicitado.',
  409: 'Já existe um registro com estes dados ou ele esta em uso.',
  422: 'Verifique os campos obrigatórios e tente novamente.',
  429: 'Muitas solicitações em sequencia. Aguarde um instante e tente novamente.',
  500: 'Ocorreu um erro interno. Tente novamente mais tarde.',
  502: 'O serviço esta temporariamente indisponivel. Tente novamente mais tarde.',
  503: 'O sistema esta em manutenção. Tente novamente mais tarde.',
  504: 'A solicitação demorou mais do que o esperado. Tente novamente.',
};

const CODE_ERROR_MESSAGES: Record<string, string> = {
  CONNECTION_ERROR: 'Não foi possível conectar ao servidor. Tente novamente em instantes.',
  TIMEOUT_ERROR: 'A solicitação demorou mais do que o esperado. Tente novamente.',
};

const GENERIC_ERROR_MESSAGE_KEYS = new Set(
  [
    '',
    'erro de validação nos campos',
    'erro de validação nos filtros',
    'violacao de integridade de dados',
    'requisição inválida. verifique os dados enviados.',
    'dados inválidos. verifique os campos obrigatórios.',
    'erro inesperado.',
    'ocorreu um erro inesperado',
    'ocorreu um erro inesperado. tente novamente.',
    'falha de conexão com a api',
  ].map(normalizeMessageKey)
);

const TECHNICAL_ERROR_PREFIXES = [
  'erro http ',
  'erro ',
  'timeout da requisição',
  'falha de conexão com a api',
];

type ErrorLike = {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  fieldErrors?: unknown;
  details?: unknown;
  error?: unknown;
};

function normalizeWhitespace(value?: string | null) {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeMessageKey(value?: string | null) {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isFieldError(value: unknown): value is BackendFieldError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BackendFieldError).field === 'string' &&
    typeof (value as BackendFieldError).message === 'string'
  );
}

function asErrorLike(value: unknown): ErrorLike | null {
  return typeof value === 'object' && value !== null ? (value as ErrorLike) : null;
}

function extractFieldErrors(value: unknown): BackendFieldError[] | undefined {
  const errorLike = asErrorLike(value);
  if (!errorLike) {
    return undefined;
  }

  if (Array.isArray(errorLike.fieldErrors)) {
    const fieldErrors = errorLike.fieldErrors.filter(isFieldError);
    if (fieldErrors.length > 0) {
      return fieldErrors;
    }
  }

  return extractFieldErrors(errorLike.details) ?? extractFieldErrors(errorLike.error);
}

function extractMessage(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return normalizeWhitespace(value);
  }

  if (value instanceof Error) {
    return normalizeWhitespace(value.message);
  }

  const errorLike = asErrorLike(value);
  if (!errorLike) {
    return undefined;
  }

  if (typeof errorLike.message === 'string') {
    return normalizeWhitespace(errorLike.message);
  }

  return extractMessage(errorLike.error);
}

function extractStatus(value: unknown): number | undefined {
  const errorLike = asErrorLike(value);
  if (!errorLike) {
    return undefined;
  }

  const candidate = errorLike.status ?? errorLike.statusCode;
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate;
  }

  return extractStatus(errorLike.error);
}

function extractCode(value: unknown): string | undefined {
  const errorLike = asErrorLike(value);
  if (!errorLike) {
    return undefined;
  }

  if (typeof errorLike.code === 'string' && errorLike.code.trim()) {
    return errorLike.code.trim().toUpperCase();
  }

  return extractCode(errorLike.error);
}

function shouldUseGenericReplacement(message?: string | null) {
  const normalizedKey = normalizeMessageKey(message);
  return (
    GENERIC_ERROR_MESSAGE_KEYS.has(normalizedKey) ||
    TECHNICAL_ERROR_PREFIXES.some((prefix) => normalizedKey.startsWith(prefix))
  );
}

export function getFieldErrorMessage(fieldErrors?: BackendFieldError[] | null) {
  if (!fieldErrors?.length) {
    return undefined;
  }

  const messages = fieldErrors
    .map((fieldError) => normalizeWhitespace(fieldError.message))
    .filter((message): message is string => Boolean(message));

  if (!messages.length) {
    return undefined;
  }

  return Array.from(new Set(messages)).join(' | ');
}

export function getStatusErrorMessage(status?: number | null) {
  if (!status) {
    return undefined;
  }

  return STATUS_ERROR_MESSAGES[status];
}

export function getCodeErrorMessage(code?: string | null) {
  if (!code) {
    return undefined;
  }

  return CODE_ERROR_MESSAGES[code.trim().toUpperCase()];
}

export function resolveUserMessage(
  message?: string | null,
  options: {
    fieldErrors?: BackendFieldError[] | null;
    status?: number | null;
    code?: string | null;
    fallback?: string;
  } = {}
) {
  const normalizedMessage = normalizeWhitespace(message);
  const fieldMessage = getFieldErrorMessage(options.fieldErrors);
  const codeMessage = getCodeErrorMessage(options.code);
  const statusMessage = getStatusErrorMessage(options.status);
  const fallback = normalizeWhitespace(options.fallback) || DEFAULT_USER_ERROR_MESSAGE;
  const shouldReplaceGeneric = shouldUseGenericReplacement(normalizedMessage);

  if (fieldMessage && (!normalizedMessage || shouldReplaceGeneric)) {
    return fieldMessage;
  }

  if (codeMessage && (!normalizedMessage || shouldReplaceGeneric)) {
    return codeMessage;
  }

  if (statusMessage && (!normalizedMessage || shouldReplaceGeneric)) {
    return statusMessage;
  }

  if (normalizedMessage) {
    return normalizedMessage;
  }

  return fieldMessage || codeMessage || statusMessage || fallback;
}

export function getUserErrorMessage(error: unknown, fallback?: string) {
  return resolveUserMessage(extractMessage(error), {
    fieldErrors: extractFieldErrors(error),
    status: extractStatus(error),
    code: extractCode(error),
    fallback,
  });
}
