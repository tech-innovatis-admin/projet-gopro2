import { NextResponse } from "next/server";
import {
  createCitiesManualFallbackResponse,
  createServerCachedCitiesResponse,
  fetchIbgeCitiesFromSource,
  getServerCitiesCache,
  normalizeUf,
  setServerCitiesCache,
} from "@/src/lib/ibge";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

type RouteContext = {
  params: Promise<{
    uf: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { uf } = await context.params;
  const normalizedUf = normalizeUf(uf);

  if (!normalizedUf) {
    return NextResponse.json(
      {
        options: [],
        source: "fallback",
        stale: true,
        updatedAt: null,
        allowManualEntry: true,
        message: "UF invalida para consulta de cidades.",
      },
      {
        status: 400,
        headers: CACHE_HEADERS,
      },
    );
  }

  try {
    const options = await fetchIbgeCitiesFromSource(normalizedUf);
    const cacheEntry = setServerCitiesCache(normalizedUf, options);

    return NextResponse.json(
      {
        options,
        source: "live",
        stale: false,
        updatedAt: cacheEntry.updatedAt,
        allowManualEntry: false,
      },
      { headers: CACHE_HEADERS },
    );
  } catch {
    const cached = getServerCitiesCache(normalizedUf);

    if (cached) {
      return NextResponse.json(createServerCachedCitiesResponse(cached), {
        headers: CACHE_HEADERS,
      });
    }

    return NextResponse.json(createCitiesManualFallbackResponse(normalizedUf), {
      headers: CACHE_HEADERS,
    });
  }
}
