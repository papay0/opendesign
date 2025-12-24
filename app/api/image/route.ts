/**
 * Image Proxy API
 *
 * Proxies image requests to Brave Search API for contextually relevant images.
 * Unlike stock photo APIs, Brave can find ANY image including Pokemon, cars, logos, etc.
 *
 * Usage: /api/image?q=pikachu,pokemon&w=200&h=200
 *
 * Caching Strategy:
 * - Uses Supabase for persistent cache (shared across all users/deployments)
 * - Cache entries expire after 7 days
 * - This dramatically reduces API calls (free tier: 2,000/month, 1 req/sec)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BRAVE_IMAGE_API_URL = "https://api.search.brave.com/res/v1/images/search";

// Lazy Supabase client initialization
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface BraveImageResult {
  type: string;
  title: string;
  url: string;
  source: string;
  thumbnail: {
    src: string;
  };
  properties: {
    url: string;
    placeholder?: string;
  };
}

interface BraveImageResponse {
  type: string;
  results: BraveImageResult[];
}

/**
 * Generate fallback picsum URL
 */
function getFallbackUrl(query: string, width: number, height: number): string {
  const seed = query.split(",")[0]?.trim().replace(/\s+/g, "-") || "default";
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Normalize query for consistent cache keys
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .split(",")
    .map((k) => k.trim())
    .sort()
    .join(" ");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const width = parseInt(searchParams.get("w") || "400", 10);
  const height = parseInt(searchParams.get("h") || "300", 10);

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  // Validate dimensions
  const safeWidth = Math.min(Math.max(width, 50), 2000);
  const safeHeight = Math.min(Math.max(height, 50), 2000);

  // Normalize query for cache key (lowercase, sorted, trimmed)
  const normalizedQuery = normalizeQuery(query);
  const supabase = getSupabaseAdmin();

  // Check Supabase cache first
  try {
    const { data: cached } = await supabase
      .from("image_cache")
      .select("image_url")
      .eq("query", normalizedQuery)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached?.image_url) {
      console.log(`[Image Proxy] Cache HIT for "${normalizedQuery}"`);
      return NextResponse.redirect(cached.image_url);
    }
  } catch {
    // Cache miss or error - continue to API
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    console.warn("[Image Proxy] No BRAVE_SEARCH_API_KEY configured, using fallback");
    return NextResponse.redirect(getFallbackUrl(query, safeWidth, safeHeight));
  }

  try {
    console.log(`[Image Proxy] Cache MISS - calling Brave API for "${normalizedQuery}"`);

    const url = new URL(BRAVE_IMAGE_API_URL);
    url.searchParams.set("q", normalizedQuery);
    url.searchParams.set("count", "1");
    url.searchParams.set("safesearch", "strict");

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      console.error(`[Image Proxy] Brave error: ${response.status}`);
      return NextResponse.redirect(getFallbackUrl(query, safeWidth, safeHeight));
    }

    const data: BraveImageResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log(`[Image Proxy] No results for "${normalizedQuery}"`);
      return NextResponse.redirect(getFallbackUrl(query, safeWidth, safeHeight));
    }

    const result = data.results[0];
    // Use the thumbnail for faster loading, or properties.url for full image
    const imageUrl = result.thumbnail?.src || result.properties?.url;

    if (!imageUrl) {
      console.log(`[Image Proxy] No image URL in result for "${normalizedQuery}"`);
      return NextResponse.redirect(getFallbackUrl(query, safeWidth, safeHeight));
    }

    // Save to Supabase cache in background (don't wait - fire and forget)
    supabase
      .from("image_cache")
      .upsert(
        {
          query: normalizedQuery,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "query" }
      )
      .then(() => console.log(`[Image Proxy] Cached "${normalizedQuery}"`));

    // Redirect immediately (don't wait for cache write)
    return NextResponse.redirect(imageUrl);
  } catch (error) {
    console.error("[Image Proxy] Error:", error);
    return NextResponse.redirect(getFallbackUrl(query, safeWidth, safeHeight));
  }
}
