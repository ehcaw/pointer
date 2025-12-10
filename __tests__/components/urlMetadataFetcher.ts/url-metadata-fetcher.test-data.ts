/**
 * Test data for URL metadata fetcher functions
 */

import { URLMetadata } from "@/lib/utils/urlMetadataFetcher";

// =============================================================================
// HTML Test Cases for extractMetadataFromHTML
// =============================================================================

export interface HTMLTestCase {
  name: string;
  html: string;
  url: string;
  expected: URLMetadata;
}

export const htmlTestCases: HTMLTestCase[] = [
  // Basic HTML with title only
  {
    name: "Basic HTML with title tag only",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Simple Page Title</title>
        </head>
        <body>Content here</body>
      </html>
    `,
    url: "https://example.com",
    expected: {
      title: "Simple Page Title",
      url: "https://example.com",
    },
  },

  // Full OpenGraph metadata
  {
    name: "Complete OpenGraph metadata",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>HTML Title</title>
          <meta property="og:title" content="OpenGraph Title" />
          <meta property="og:description" content="This is a detailed description from OpenGraph" />
          <meta property="og:image" content="https://example.com/image.jpg" />
          <meta property="og:site_name" content="Example Site" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com/article",
    expected: {
      title: "OpenGraph Title",
      description: "This is a detailed description from OpenGraph",
      image: "https://example.com/image.jpg",
      url: "https://example.com/article",
      siteName: "Example Site",
    },
  },

  // Meta description without OpenGraph
  {
    name: "Meta description without OpenGraph",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Page with Meta Description</title>
          <meta name="description" content="This is a standard meta description" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com/page",
    expected: {
      title: "Page with Meta Description",
      description: "This is a standard meta description",
      url: "https://example.com/page",
    },
  },

  // OpenGraph overrides HTML title
  {
    name: "OpenGraph title overrides HTML title",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>HTML Title Should Be Ignored</title>
          <meta property="og:title" content="OG Title Takes Priority" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com",
    expected: {
      title: "OG Title Takes Priority",
      url: "https://example.com",
    },
  },

  // Relative image URL conversion
  {
    name: "Relative image URL should be converted to absolute",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Page with Relative Image</title>
          <meta property="og:image" content="/images/thumbnail.png" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com/blog/post",
    expected: {
      title: "Page with Relative Image",
      image: "https://example.com/images/thumbnail.png",
      url: "https://example.com/blog/post",
    },
  },

  // Empty/missing metadata
  {
    name: "HTML with no title or metadata",
    html: `
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>Content without any metadata</body>
      </html>
    `,
    url: "https://example.com/no-metadata",
    expected: {
      title: "https://example.com/no-metadata",
      url: "https://example.com/no-metadata",
    },
  },

  // Whitespace handling
  {
    name: "Metadata with extra whitespace",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>  Title with Spaces  </title>
          <meta property="og:description" content="  Description with spaces  " />
          <meta property="og:site_name" content="  Site Name  " />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com",
    expected: {
      title: "Title with Spaces",
      description: "Description with spaces",
      url: "https://example.com",
      siteName: "Site Name",
    },
  },

  // Twitter/X metadata (should not be picked up without OG)
  {
    name: "Twitter card metadata only",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Twitter Card Test</title>
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Twitter Title" />
          <meta name="twitter:description" content="Twitter Description" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com",
    expected: {
      title: "Twitter Card Test",
      url: "https://example.com",
    },
  },

  // Special characters in metadata
  {
    name: "Special characters and HTML entities",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Title with &amp; Special &lt;Characters&gt;</title>
          <meta property="og:description" content="Description with &quot;quotes&quot; and 'apostrophes'" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com",
    expected: {
      title: "Title with & Special <Characters>",
      description: "Description with \"quotes\" and 'apostrophes'",
      url: "https://example.com",
    },
  },

  // Very long metadata
  {
    name: "Very long title and description",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${"A".repeat(200)}</title>
          <meta property="og:description" content="${"B".repeat(500)}" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com",
    expected: {
      title: "A".repeat(200),
      description: "B".repeat(500),
      url: "https://example.com",
    },
  },

  // Multiple meta tags (first one should win)
  {
    name: "Multiple og:title tags",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>HTML Title</title>
          <meta property="og:title" content="First OG Title" />
          <meta property="og:title" content="Second OG Title" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://example.com",
    expected: {
      title: "First OG Title",
      url: "https://example.com",
    },
  },

  // Real-world example: GitHub
  {
    name: "GitHub-style metadata",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>username/repo: A cool project - GitHub</title>
          <meta property="og:title" content="username/repo" />
          <meta property="og:description" content="A cool project. Contribute to username/repo development by creating an account on GitHub." />
          <meta property="og:image" content="https://opengraph.githubassets.com/abc123/username/repo" />
          <meta property="og:site_name" content="GitHub" />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://github.com/username/repo",
    expected: {
      title: "username/repo",
      description:
        "A cool project. Contribute to username/repo development by creating an account on GitHub.",
      image: "https://opengraph.githubassets.com/abc123/username/repo",
      url: "https://github.com/username/repo",
      siteName: "GitHub",
    },
  },

  // Real-world example: Medium
  {
    name: "Medium-style metadata",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>How to Build Amazing Apps | by Author Name | Medium</title>
          <meta property="og:title" content="How to Build Amazing Apps" />
          <meta property="og:description" content="A comprehensive guide to building amazing applications from scratch..." />
          <meta property="og:image" content="https://miro.medium.com/max/1200/1*abc123.jpeg" />
          <meta name="description" content="A comprehensive guide to building amazing applications from scratch..." />
        </head>
        <body>Content</body>
      </html>
    `,
    url: "https://medium.com/@author/article-slug-123",
    expected: {
      title: "How to Build Amazing Apps",
      description:
        "A comprehensive guide to building amazing applications from scratch...",
      image: "https://miro.medium.com/max/1200/1*abc123.jpeg",
      url: "https://medium.com/@author/article-slug-123",
    },
  },
];

// =============================================================================
// URL Test Cases for fetchURLMetadata
// =============================================================================

export interface URLTestCase {
  name: string;
  input: string;
  shouldSucceed: boolean;
  expectedUrl?: string; // After sanitization
  description: string;
}

export const urlTestCases: URLTestCase[] = [
  // Valid URLs
  {
    name: "Standard HTTPS URL",
    input: "https://example.com",
    shouldSucceed: true,
    expectedUrl: "https://example.com",
    description: "Should handle standard HTTPS URL",
  },
  {
    name: "Standard HTTP URL",
    input: "http://example.com",
    shouldSucceed: true,
    expectedUrl: "http://example.com",
    description: "Should handle standard HTTP URL",
  },
  {
    name: "URL without protocol",
    input: "example.com",
    shouldSucceed: true,
    expectedUrl: "https://example.com",
    description: "Should add HTTPS protocol if missing",
  },
  {
    name: "URL with www",
    input: "www.example.com",
    shouldSucceed: true,
    expectedUrl: "https://www.example.com",
    description: "Should handle www subdomain",
  },
  {
    name: "URL with path",
    input: "https://example.com/path/to/page",
    shouldSucceed: true,
    expectedUrl: "https://example.com/path/to/page",
    description: "Should handle URL with path",
  },
  {
    name: "URL with query parameters",
    input: "https://example.com/search?q=test&page=1",
    shouldSucceed: true,
    expectedUrl: "https://example.com/search?q=test&page=1",
    description: "Should handle query parameters",
  },
  {
    name: "URL with fragment",
    input: "https://example.com/page#section",
    shouldSucceed: true,
    expectedUrl: "https://example.com/page#section",
    description: "Should handle URL fragments",
  },
  {
    name: "URL with port",
    input: "https://example.com:8080/page",
    shouldSucceed: true,
    expectedUrl: "https://example.com:8080/page",
    description: "Should handle custom ports",
  },
  {
    name: "URL with subdomain",
    input: "https://blog.example.com",
    shouldSucceed: true,
    expectedUrl: "https://blog.example.com",
    description: "Should handle subdomains",
  },
  {
    name: "URL with whitespace",
    input: "  https://example.com  ",
    shouldSucceed: true,
    expectedUrl: "https://example.com",
    description: "Should trim whitespace",
  },
  {
    name: "URL with uppercase",
    input: "HTTPS://EXAMPLE.COM",
    shouldSucceed: true,
    expectedUrl: "https://example.com",
    description: "Should convert to lowercase",
  },

  // Invalid/Edge case URLs
  {
    name: "Empty string",
    input: "",
    shouldSucceed: false,
    description: "Should fail on empty string",
  },
  {
    name: "Just whitespace",
    input: "   ",
    shouldSucceed: false,
    description: "Should fail on whitespace only",
  },
  {
    name: "Invalid characters",
    input: "https://exam ple.com",
    shouldSucceed: false,
    description: "Should fail on URLs with spaces",
  },
  {
    name: "Missing domain",
    input: "https://",
    shouldSucceed: false,
    description: "Should fail on incomplete URL",
  },
  {
    name: "Local file path",
    input: "file:///path/to/file",
    shouldSucceed: false,
    description: "Should not fetch local file paths",
  },
  {
    name: "JavaScript protocol",
    input: "javascript:alert(1)",
    shouldSucceed: false,
    description: "Should reject javascript: URLs",
  },
  {
    name: "Data URI",
    input: "data:text/html,<h1>Hello</h1>",
    shouldSucceed: false,
    description: "Should reject data URIs",
  },
];

// =============================================================================
// Mock Response Data for fetchURLMetadata
// =============================================================================

export interface MockResponse {
  url: string;
  status: number;
  statusText: string;
  html?: string;
  shouldTimeout?: boolean;
  shouldFailCORS?: boolean;
}

export const mockResponses: MockResponse[] = [
  {
    url: "https://success.example.com",
    status: 200,
    statusText: "OK",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Success Page</title>
          <meta property="og:description" content="This page loaded successfully" />
        </head>
        <body>Content</body>
      </html>
    `,
  },
  {
    url: "https://notfound.example.com",
    status: 404,
    statusText: "Not Found",
  },
  {
    url: "https://servererror.example.com",
    status: 500,
    statusText: "Internal Server Error",
  },
  {
    url: "https://timeout.example.com",
    status: 200,
    statusText: "OK",
    shouldTimeout: true,
  },
  {
    url: "https://cors.example.com",
    status: 200,
    statusText: "OK",
    shouldFailCORS: true,
  },
  {
    url: "https://redirect.example.com",
    status: 301,
    statusText: "Moved Permanently",
  },
  {
    url: "https://unauthorized.example.com",
    status: 401,
    statusText: "Unauthorized",
  },
  {
    url: "https://forbidden.example.com",
    status: 403,
    statusText: "Forbidden",
  },
];

// =============================================================================
// Cache Test Scenarios
// =============================================================================

export interface CacheTestCase {
  name: string;
  url: string;
  cacheAge: number; // in milliseconds
  shouldBeValid: boolean;
}

export const cacheTestCases: CacheTestCase[] = [
  {
    name: "Fresh cache (1 minute old)",
    url: "https://cached1.example.com",
    cacheAge: 60 * 1000, // 1 minute
    shouldBeValid: true,
  },
  {
    name: "Valid cache (30 minutes old)",
    url: "https://cached2.example.com",
    cacheAge: 30 * 60 * 1000, // 30 minutes
    shouldBeValid: true,
  },
  {
    name: "Almost expired cache (59 minutes old)",
    url: "https://cached3.example.com",
    cacheAge: 59 * 60 * 1000, // 59 minutes
    shouldBeValid: true,
  },
  {
    name: "Expired cache (61 minutes old)",
    url: "https://cached4.example.com",
    cacheAge: 61 * 60 * 1000, // 61 minutes
    shouldBeValid: false,
  },
  {
    name: "Very old cache (24 hours old)",
    url: "https://cached5.example.com",
    cacheAge: 24 * 60 * 60 * 1000, // 24 hours
    shouldBeValid: false,
  },
  {
    name: "Just created cache (0 milliseconds)",
    url: "https://cached6.example.com",
    cacheAge: 0,
    shouldBeValid: true,
  },
];

// =============================================================================
// Real-world URL examples for integration tests
// =============================================================================

export const realWorldURLs = {
  social: [
    "https://twitter.com/username/status/123456789",
    "https://www.linkedin.com/posts/username_activity-123456789",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://github.com/facebook/react",
  ],
  news: [
    "https://www.nytimes.com/2024/01/01/technology/article.html",
    "https://techcrunch.com/2024/01/01/startup-raises-millions/",
    "https://arstechnica.com/science/2024/01/discovery/",
  ],
  documentation: [
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    "https://nextjs.org/docs/getting-started",
    "https://react.dev/learn",
  ],
  blogs: [
    "https://medium.com/@author/article-title-123",
    "https://dev.to/username/article-title-abc",
    "https://blog.example.com/2024/01/post-title",
  ],
};

// =============================================================================
// Edge cases for sanitizeUrl function
// =============================================================================

export interface SanitizeURLTestCase {
  input: string;
  expected: string;
}

export const sanitizeURLTestCases: SanitizeURLTestCase[] = [
  {
    input: "example.com",
    expected: "https://example.com",
  },
  {
    input: "HTTP://EXAMPLE.COM",
    expected: "http://example.com",
  },
  {
    input: "  https://example.com  ",
    expected: "https://example.com",
  },
  {
    input: "HTTPS://EXAMPLE.COM/PATH",
    expected: "https://example.com/path",
  },
  {
    input: "www.Example.Com",
    expected: "https://www.example.com",
  },
  {
    input: "ftp://example.com",
    expected: "https://ftp://example.com", // Edge case: non-http protocols get https added
  },
];
