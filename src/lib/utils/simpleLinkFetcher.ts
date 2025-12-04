/**
 * Simple link title fetcher that works around CORS limitations
 * This tries multiple strategies to get link titles
 */

// Common patterns for extracting titles from URLs
const DOMAIN_TITLE_MAP: Record<string, string> = {
  'github.com': 'GitHub',
  'stackoverflow.com': 'Stack Overflow',
  'vitest.dev': 'Vitest',
  'react.dev': 'React Documentation',
  'nextjs.org': 'Next.js Documentation',
  'facebook.com': 'Facebook',
  'twitter.com': 'Twitter',
  'x.com': 'X (Twitter)',
  'linkedin.com': 'LinkedIn',
  'youtube.com': 'YouTube',
  'notion.so': 'Notion',
  'figma.com': 'Figma',
  'discord.com': 'Discord',
  'slack.com': 'Slack',
  'medium.com': 'Medium',
  'wikipedia.org': 'Wikipedia',
  'reddit.com': 'Reddit',
};

/**
 * Extract a readable title from URL using heuristics
 */
export function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // Check for domain mapping first
    for (const [domain, title] of Object.entries(DOMAIN_TITLE_MAP)) {
      if (hostname.includes(domain)) {
        // Add path context if available
        if (pathname && pathname !== '/') {
          const pathSegments = pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            // Convert kebab-case or snake_case to Title Case
            const lastSegment = pathSegments[pathSegments.length - 1]
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());

            return `${title} - ${lastSegment}`;
          }
        }
        return title;
      }
    }

    // Fallback: Extract domain name and format it
    const domainParts = hostname.split('.');
    const mainDomain = domainParts.length > 1
      ? domainParts[domainParts.length - 2]
      : domainParts[0];

    // Capitalize domain name
    const formattedDomain = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);

    // Add path context if available
    if (pathname && pathname !== '/') {
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0 && pathSegments.length <= 2) {
        const lastSegment = pathSegments[pathSegments.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
          .substring(0, 30); // Limit length

        return `${formattedDomain} - ${lastSegment}`;
      }
    }

    return formattedDomain;

  } catch {
    // If URL parsing fails, extract domain from string
    const domainMatch = url.match(/https?:\/\/([^\/]+)/i);
    if (domainMatch) {
      const domain = domainMatch[1];
      const mainDomain = domain.split('.')[0] || domain;
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }

    return url; // Last resort: return the URL
  }
}

/**
 * Try to fetch actual title (with fallback to heuristics)
 */
export async function fetchLinkTitle(url: string): Promise<string> {
  try {
    // First try the real metadata fetcher
    const { fetchURLMetadata } = await import('./urlMetadataFetcher');
    const metadata = await fetchURLMetadata(url);

    if (metadata && metadata.title && metadata.title !== url) {
      return metadata.title;
    }
  } catch {
    // Metadata fetcher failed, continue with fallback
  }

  // Fallback to heuristic extraction
  return extractTitleFromUrl(url);
}