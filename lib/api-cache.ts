/**
 * Centralized, memory-safe in-memory cache to prevent duplicate AI API requests,
 * reducing token consumption and preventing server-side API rate-limiting crashes under high concurrent load.
 */

const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // Cache results for 2 minutes (short to allow re-optimizations to pick up prompt changes)
const MAX_CACHE_SIZE = 1000; // Limit cache entries to prevent memory exhaustion

export function getCachedResponse(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

export function setCachedResponse(key: string, data: any) {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Evict the oldest key (first item in the Map iterator)
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

/**
 * Generates a stable cache key based on truncated input sizes to allow fast comparisons.
 */
export function generateCacheKey(resume: string, jd: string): string {
  const normalizedResume = resume.substring(0, 300).replace(/\s+/g, "");
  const normalizedJd = jd.substring(0, 200).replace(/\s+/g, "");
  return `${normalizedResume}__${normalizedJd}__len_${resume.length}_${jd.length}`;
}

/**
 * Collapses redundant spaces and truncates input strings to drastically reduce input tokens
 * for LLM completions without affecting output quality.
 */
export function cleanAndTruncateText(text: string, maxLength: number): string {
  if (!text) return "";
  let cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n/g, "\n") // collapse multiple line breaks
    .replace(/[ \t]+/g, " "); // collapse multiple tabs/spaces
  
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + "... [truncated]";
  }
  return cleaned.trim();
}
