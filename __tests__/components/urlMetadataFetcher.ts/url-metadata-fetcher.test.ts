import { vi, describe, it, expect } from "vitest";
import { isValidUrl, sanitizeUrl } from "@/lib/utils/urlMetadataFetcher";

describe("url metadata fetcher tests", () => {
  describe("url sanitization tests", () => {
    it("should convert to lowercase", () => {
      const input = "HTTPs://Example.COM/SomePath";
      expect(sanitizeUrl(input)).toBe("https://example.com/somepath");
    });
    it("should add https", () => {
      const input = "example.com/somepath";
      expect(sanitizeUrl(input)).toBe("https://example.com/somepath");
    });
    it("should trim whitespace", () => {
      const input = "   https://example.com/somepath   ";
      expect(sanitizeUrl(input)).toBe("https://example.com/somepath");
    });
    it("should do all of that", () => {
      const input = "   http://example.COm/SomePath";
      expect(sanitizeUrl(input)).toBe("http://example.com/somepath");
    });
  });
  describe("valid url testing", () => {
    it("should return true for valid urls", () => {
      const validUrl = "https://pointer.ink";
      expect(isValidUrl(validUrl)).toBe(true);
    });
    it("should return false for invalid urls", () => {
      const invalidUrl = "/main/page.html";
      expect(isValidUrl(invalidUrl)).toBe(false);
    });
  });
});
