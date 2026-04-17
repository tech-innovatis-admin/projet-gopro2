import { NextResponse } from "next/server";
import {
  createServerCachedStatesResponse,
  createStatesFallbackResponse,
  fetchIbgeStatesFromSource,
  getServerStatesCache,
  setServerStatesCache,
} from "@/src/lib/ibge";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET() {
  try {
    const options = await fetchIbgeStatesFromSource();
    const cacheEntry = setServerStatesCache(options);

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
    const cached = getServerStatesCache();

    if (cached) {
      return NextResponse.json(createServerCachedStatesResponse(cached), {
        headers: CACHE_HEADERS,
      });
    }

    return NextResponse.json(createStatesFallbackResponse(), {
      headers: CACHE_HEADERS,
    });
  }
}
