export interface URLMetadata {
  title: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
}

export interface URLMetadataCache {
  [url: string]: {
    data: URLMetadata;
    timestamp: number;
  };
}

// Cache metadata for 1 hour
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const metadataCache: URLMetadataCache = {};

/**
 * Sanitize and validate a URL
 */
export function sanitizeUrl(url: string): string {
  // Remove whitespace and convert to lowercase
  const cleanUrl = url.trim().toLowerCase();

  // Add protocol if missing
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    return `https://${cleanUrl}`;
  }

  return cleanUrl;
}

/**
 * Fallback metadata extraction using regex for non-browser environments
 */
function extractMetadataFromHTMLFallback(
  html: string,
  url: string,
): URLMetadata {
  // Extract title using regex
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : url;

  // Extract meta description
  const descriptionMatch = html.match(
    /<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i,
  );
  const description = descriptionMatch ? descriptionMatch[1].trim() : undefined;

  // Extract OpenGraph title
  const ogTitleMatch = html.match(
    /<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i,
  );
  const finalTitle = ogTitleMatch ? ogTitleMatch[1].trim() : title;

  // Extract OpenGraph description
  const ogDescriptionMatch = html.match(
    /<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i,
  );
  const finalDescription = ogDescriptionMatch
    ? ogDescriptionMatch[1].trim()
    : description;

  return {
    title: finalTitle,
    description: finalDescription,
    url,
  };
}

/**
 * Extract metadata from HTML content
 */
function extractMetadataFromHTML(html: string, url: string): URLMetadata {
  // Create a temporary DOM parser
  let parser: DOMParser;
  let doc: Document;

  if (typeof window !== "undefined" && window.DOMParser) {
    // Browser environment
    parser = new DOMParser();
    doc = parser.parseFromString(html, "text/html");
  } else if (typeof DOMParser !== "undefined") {
    // Node.js environment with JSDOM
    parser = new DOMParser();
    doc = parser.parseFromString(html, "text/html");
  } else {
    // Fallback: simple regex extraction for non-browser environments
    return extractMetadataFromHTMLFallback(html, url);
  }

  // Try OpenGraph tags first
  const ogTitle = doc
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content");
  const ogDescription = doc
    .querySelector('meta[property="og:description"]')
    ?.getAttribute("content");
  const ogImage = doc
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content");
  const ogSiteName = doc
    .querySelector('meta[property="og:site_name"]')
    ?.getAttribute("content");

  // Fallback to HTML title tags
  const htmlTitle = doc.querySelector("title")?.textContent;
  const title = ogTitle || htmlTitle || url;

  // Fallback to meta description
  const metaDescription = doc
    .querySelector('meta[name="description"]')
    ?.getAttribute("content");
  const description = ogDescription || metaDescription;

  // Convert relative image URLs to absolute
  let image: string | undefined = ogImage || undefined;
  if (image && !image.startsWith("http")) {
    const baseUrl = new URL(url);
    image = new URL(image, baseUrl).href;
  }

  return {
    title: title.trim(),
    description: description?.trim() || undefined,
    image,
    url,
    siteName: ogSiteName?.trim() || undefined,
  };
}

/**
 * Check if cached metadata is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Fetch URL metadata with caching
 */
export async function fetchURLMetadata(
  url: string,
): Promise<URLMetadata | null> {
  try {
    const sanitizedUrl = sanitizeUrl(url);

    // Check cache first
    if (
      metadataCache[sanitizedUrl] &&
      isCacheValid(metadataCache[sanitizedUrl].timestamp)
    ) {
      return metadataCache[sanitizedUrl].data;
    }

    // Fetch the webpage
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(sanitizedUrl, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
        mode: "cors", // Explicitly set CORS mode
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const metadata = extractMetadataFromHTML(html, sanitizedUrl);

      // Cache the result
      metadataCache[sanitizedUrl] = {
        data: metadata,
        timestamp: Date.now(),
      };

      return metadata;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle specific errors
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(`Timeout fetching metadata for ${url}`);
      } else if (error instanceof Error && error.message.includes("Failed to fetch")) {
        console.warn(
          `CORS blocked or network error fetching metadata for ${url}`,
        );
      } else {
        console.warn(`Failed to fetch metadata for ${url}:`, error);
      }

      return null;
    }
  } catch (error) {
    console.warn(`Unexpected error fetching metadata for ${url}:`, error);
    return null;
  }
}

/**
 * Clear cached metadata (useful for testing or forced refresh)
 */
export function clearMetadataCache(): void {
  Object.keys(metadataCache).forEach((key) => delete metadataCache[key]);
}

/**
 * Get just the title from a URL (convenience function)
 */
export async function fetchURLTitle(url: string): Promise<string> {
  const metadata = await fetchURLMetadata(url);
  return metadata?.title || url;
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
