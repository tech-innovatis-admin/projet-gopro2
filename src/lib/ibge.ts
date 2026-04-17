const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";
const IBGE_REQUEST_TIMEOUT_MS = 8000;
const STATES_BROWSER_CACHE_KEY = "gopro.ibge.states.v1";
const CITIES_BROWSER_CACHE_PREFIX = "gopro.ibge.cities.v1.";

export type IbgeStateResponse = {
  id: number;
  sigla: string;
  nome: string;
};

export type IbgeCityResponse = {
  id: number;
  nome: string;
};

export type LocationOption = {
  value: string;
  label: string;
};

export type LocationLookupSource =
  | "live"
  | "server-cache"
  | "browser-cache"
  | "fallback";

export type LocationLookupResponse = {
  options: LocationOption[];
  source: LocationLookupSource;
  stale: boolean;
  updatedAt: string | null;
  allowManualEntry: boolean;
  message?: string;
};

type CacheEntry = {
  options: LocationOption[];
  updatedAt: string;
};

type ServerLocationCache = {
  states: CacheEntry | null;
  cities: Record<string, CacheEntry>;
};

type BrowserCachePayload = {
  options: LocationOption[];
  updatedAt: string;
};

declare global {
  var __goproIbgeCache: ServerLocationCache | undefined;
}

export const FALLBACK_STATE_OPTIONS: LocationOption[] = [
  { value: "AC", label: "AC - Acre" },
  { value: "AL", label: "AL - Alagoas" },
  { value: "AP", label: "AP - Amapa" },
  { value: "AM", label: "AM - Amazonas" },
  { value: "BA", label: "BA - Bahia" },
  { value: "CE", label: "CE - Ceara" },
  { value: "DF", label: "DF - Distrito Federal" },
  { value: "ES", label: "ES - Espirito Santo" },
  { value: "GO", label: "GO - Goias" },
  { value: "MA", label: "MA - Maranhao" },
  { value: "MT", label: "MT - Mato Grosso" },
  { value: "MS", label: "MS - Mato Grosso do Sul" },
  { value: "MG", label: "MG - Minas Gerais" },
  { value: "PA", label: "PA - Para" },
  { value: "PB", label: "PB - Paraiba" },
  { value: "PR", label: "PR - Parana" },
  { value: "PE", label: "PE - Pernambuco" },
  { value: "PI", label: "PI - Piaui" },
  { value: "RJ", label: "RJ - Rio de Janeiro" },
  { value: "RN", label: "RN - Rio Grande do Norte" },
  { value: "RS", label: "RS - Rio Grande do Sul" },
  { value: "RO", label: "RO - Rondonia" },
  { value: "RR", label: "RR - Roraima" },
  { value: "SC", label: "SC - Santa Catarina" },
  { value: "SP", label: "SP - Sao Paulo" },
  { value: "SE", label: "SE - Sergipe" },
  { value: "TO", label: "TO - Tocantins" },
];

function createLookupResponse(
  options: LocationOption[],
  source: LocationLookupSource,
  stale: boolean,
  message?: string,
  updatedAt: string | null = new Date().toISOString(),
  allowManualEntry = false,
): LocationLookupResponse {
  return {
    options,
    source,
    stale,
    updatedAt,
    allowManualEntry,
    ...(message ? { message } : {}),
  };
}

function getServerCacheStore(): ServerLocationCache {
  if (!globalThis.__goproIbgeCache) {
    globalThis.__goproIbgeCache = {
      states: null,
      cities: {},
    };
  }

  return globalThis.__goproIbgeCache;
}

function isLocationOptionArray(value: unknown): value is LocationOption[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as LocationOption).value === "string" &&
        typeof (item as LocationOption).label === "string",
    )
  );
}

function readBrowserCache(cacheKey: string): BrowserCachePayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(cacheKey);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<BrowserCachePayload>;
    if (!isLocationOptionArray(parsed.options) || typeof parsed.updatedAt !== "string") {
      return null;
    }

    return {
      options: parsed.options,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

function writeBrowserCache(
  cacheKey: string,
  options: LocationOption[],
  updatedAt: string | null,
): void {
  if (typeof window === "undefined" || options.length === 0) {
    return;
  }

  try {
    const payload: BrowserCachePayload = {
      options,
      updatedAt: updatedAt ?? new Date().toISOString(),
    };

    window.localStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    // Ignora falha de cache local para nao interromper o formulario.
  }
}

function getBrowserCitiesCacheKey(uf: string): string {
  return `${CITIES_BROWSER_CACHE_PREFIX}${normalizeUf(uf)}`;
}

function getBrowserFallbackResponse(
  cacheKey: string,
  emptyFallback: LocationLookupResponse,
): LocationLookupResponse {
  const cached = readBrowserCache(cacheKey);
  if (!cached) {
    return emptyFallback;
  }

  return createLookupResponse(
    cached.options,
    "browser-cache",
    true,
    "IBGE indisponivel no momento. Usando a ultima lista salva neste navegador.",
    cached.updatedAt,
  );
}

async function fetchLookupFromRoute(
  path: string,
  cacheKey: string,
  emptyFallback: LocationLookupResponse,
  signal?: AbortSignal,
): Promise<LocationLookupResponse> {
  try {
    const response = await fetch(path, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar ${path}: ${response.status}`);
    }

    const data = (await response.json()) as LocationLookupResponse;

    if (isLocationOptionArray(data.options) && data.options.length > 0 && !data.allowManualEntry) {
      writeBrowserCache(cacheKey, data.options, data.updatedAt);
    }

    return data;
  } catch {
    return getBrowserFallbackResponse(cacheKey, emptyFallback);
  }
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IBGE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar o IBGE: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function normalizeUf(uf: string): string {
  return uf.trim().toUpperCase();
}

export function getServerStatesCache(): CacheEntry | null {
  return getServerCacheStore().states;
}

export function getServerCitiesCache(uf: string): CacheEntry | null {
  return getServerCacheStore().cities[normalizeUf(uf)] ?? null;
}

export function setServerStatesCache(options: LocationOption[]): CacheEntry {
  const cacheEntry: CacheEntry = {
    options,
    updatedAt: new Date().toISOString(),
  };

  getServerCacheStore().states = cacheEntry;
  return cacheEntry;
}

export function setServerCitiesCache(uf: string, options: LocationOption[]): CacheEntry {
  const normalizedUf = normalizeUf(uf);
  const cacheEntry: CacheEntry = {
    options,
    updatedAt: new Date().toISOString(),
  };

  getServerCacheStore().cities[normalizedUf] = cacheEntry;
  return cacheEntry;
}

export async function fetchIbgeStatesFromSource(): Promise<LocationOption[]> {
  const data = await fetchJsonWithTimeout<IbgeStateResponse[]>(`${IBGE_BASE_URL}/estados`);

  return data
    .filter((item) => item.sigla?.trim() && item.nome?.trim())
    .sort((a, b) => a.sigla.localeCompare(b.sigla, "pt-BR"))
    .map((item) => ({
      value: item.sigla.trim().toUpperCase(),
      label: `${item.sigla.trim().toUpperCase()} - ${item.nome.trim()}`,
    }));
}

export async function fetchIbgeCitiesFromSource(uf: string): Promise<LocationOption[]> {
  const normalizedUf = normalizeUf(uf);
  if (!normalizedUf) {
    return [];
  }

  const data = await fetchJsonWithTimeout<IbgeCityResponse[]>(
    `${IBGE_BASE_URL}/estados/${normalizedUf}/municipios`,
  );

  return data
    .filter((item) => item.nome?.trim())
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((item) => ({
      value: item.nome.trim(),
      label: item.nome.trim(),
    }));
}

export function createStatesFallbackResponse(): LocationLookupResponse {
  return createLookupResponse(
    FALLBACK_STATE_OPTIONS,
    "fallback",
    true,
    "IBGE indisponivel no momento. Usando a lista local de UFs.",
    null,
  );
}

export function createCitiesManualFallbackResponse(uf: string): LocationLookupResponse {
  const normalizedUf = normalizeUf(uf);

  return createLookupResponse(
    [],
    "fallback",
    true,
    normalizedUf
      ? `Nao foi possivel carregar as cidades de ${normalizedUf} agora. Informe a cidade manualmente.`
      : "Nao foi possivel carregar as cidades agora. Informe a cidade manualmente.",
    null,
    true,
  );
}

export function createServerCachedStatesResponse(cacheEntry: CacheEntry): LocationLookupResponse {
  return createLookupResponse(
    cacheEntry.options,
    "server-cache",
    true,
    "IBGE indisponivel no momento. Usando a ultima lista de estados carregada.",
    cacheEntry.updatedAt,
  );
}

export function createServerCachedCitiesResponse(cacheEntry: CacheEntry): LocationLookupResponse {
  return createLookupResponse(
    cacheEntry.options,
    "server-cache",
    true,
    "IBGE indisponivel no momento. Usando a ultima lista de cidades carregada para esta UF.",
    cacheEntry.updatedAt,
  );
}

export async function fetchBrazilStates(signal?: AbortSignal): Promise<LocationLookupResponse> {
  return fetchLookupFromRoute(
    "/api/ibge/states",
    STATES_BROWSER_CACHE_KEY,
    createStatesFallbackResponse(),
    signal,
  );
}

export async function fetchCitiesByState(
  uf: string,
  signal?: AbortSignal,
): Promise<LocationLookupResponse> {
  const normalizedUf = normalizeUf(uf);
  if (!normalizedUf) {
    return createLookupResponse([], "fallback", false, undefined, null);
  }

  return fetchLookupFromRoute(
    `/api/ibge/states/${normalizedUf}/cities`,
    getBrowserCitiesCacheKey(normalizedUf),
    createCitiesManualFallbackResponse(normalizedUf),
    signal,
  );
}
