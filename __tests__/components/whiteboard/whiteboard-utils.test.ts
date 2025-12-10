import {
  isValidTheme,
  normalizeTheme,
  isWhiteboard,
  transformConvexWhiteboard,
  createDefaultWhiteboardState,
  serializeWhiteboardData,
  deserializeWhiteboardData,
} from "../../../src/components/whiteboard/whiteboard-utils";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../../convex/schema";
import { api } from "../../../convex/_generated/api";
import { modules } from "./test.setup";
import { serializedWhiteboardData } from "./whiteboard-utils.test-data";

describe("whiteboard-utils", () => {
  describe("isValidTheme", () => {
    it('should return true for "light" theme', () => {
      expect(isValidTheme("light")).toBe(true);
    });

    it('should return true for "dark" theme', () => {
      expect(isValidTheme("dark")).toBe(true);
    });

    it("should return false for invalid themes", () => {
      expect(isValidTheme("invalid")).toBe(false);
      expect(isValidTheme("")).toBe(false);
      expect(isValidTheme("LIGHT")).toBe(false);
      expect(isValidTheme("DARK")).toBe(false);
      expect(isValidTheme("auto")).toBe(false);
    });
  });

  describe("normalizeTheme", () => {
    it('should return "light" for valid light theme', () => {
      expect(normalizeTheme("light")).toBe("light");
    });

    it('should return "dark" for valid dark theme', () => {
      expect(normalizeTheme("dark")).toBe("dark");
    });

    it('should return "light" as default for invalid themes', () => {
      expect(normalizeTheme("invalid")).toBe("light");
      expect(normalizeTheme("")).toBe("light");
      expect(normalizeTheme("LIGHT")).toBe("light");
      expect(normalizeTheme(undefined)).toBe("light");
    });
  });

  describe("isWhiteboard", () => {
    it("should return true for valid whiteboard object", () => {
      const whiteboard = {
        _id: "test-id",
        title: "Test Whiteboard",
        tenantId: "tenant-123",
        serializedData: '{"elements": []}',
        lastModified: new Date().toISOString(),
      };
      const result = isWhiteboard(whiteboard);
      expect(result).toBeTruthy();
    });

    it("should return null/undefined for null/undefined input", () => {
      expect(isWhiteboard(null)).toBe(null); // Current implementation returns null
      expect(isWhiteboard(undefined)).toBe(undefined); // Current implementation returns undefined
    });

    it("should return false for objects missing required properties", () => {
      const incomplete = {
        _id: "test-id",
        title: "Test Whiteboard",
        // Missing tenantId, serializedData, lastModified
      };
      expect(isWhiteboard(incomplete)).toBe(false);
    });

    it("should return false for objects with wrong property types", () => {
      const invalidWhiteboard = {
        _id: 123, // Should be string
        title: "Test Whiteboard",
        tenantId: "tenant-123",
        serializedData: '{"elements": []}',
        lastModified: new Date().toISOString(),
      };
      expect(isWhiteboard(invalidWhiteboard)).toBe(false);
    });

    it("should return false for empty objects", () => {
      expect(isWhiteboard({})).toBe(false);
    });
  });

  describe("transformConvexWhiteboard", () => {
    const validWhiteboardData = {
      _id: "test-id",
      title: "Test Whiteboard",
      tenantId: "tenant-123",
      serializedData: '{"elements": []}',
      lastModified: new Date().toISOString(),
      _creationTime: Date.now(),
    };

    it("should transform valid convex whiteboard data", () => {
      const result = transformConvexWhiteboard(validWhiteboardData);
      expect(result).toEqual(validWhiteboardData);
    });

    it("should return null for invalid data", () => {
      const invalidData = { invalid: "data" };
      const result = transformConvexWhiteboard(invalidData);
      expect(result).toBe(null);
    });

    it("should return null for null/undefined", () => {
      expect(transformConvexWhiteboard(null)).toBe(null);
      expect(transformConvexWhiteboard(undefined)).toBe(null);
    });
  });

  describe("createDefaultWhiteboardState", () => {
    it("should create default whiteboard state", () => {
      const result = createDefaultWhiteboardState();
      expect(result).toEqual({
        elements: [],
        appState: {
          viewBackgroundColor: "#ffffff",
          theme: "light",
        },
        scrollToContent: false,
      });
    });

    it("should have empty elements array", () => {
      const result = createDefaultWhiteboardState();
      expect(Array.isArray(result.elements)).toBe(true);
      expect(result.elements).toHaveLength(0);
    });

    it("should have light theme by default", () => {
      const result = createDefaultWhiteboardState();
      expect(result.appState.theme).toBe("light");
    });

    it("should have white background by default", () => {
      const result = createDefaultWhiteboardState();
      expect(result.appState.viewBackgroundColor).toBe("#ffffff");
    });

    it("should have scrollToContent set to false", () => {
      const result = createDefaultWhiteboardState();
      expect(result.scrollToContent).toBe(false);
    });
  });

  describe("transformConvexWhiteboard with Convex test", () => {
    it("should return null when no whiteboard state is stored", async () => {
      const t = convexTest(schema, modules);

      const whiteboardData = await t
        .withIdentity({ subject: "test-user-12345" })
        .query(api.whiteboards.getWhiteboard);
      expect(whiteboardData).toBeNull();
    });
    it("should return the whiteboard state", async () => {
      const t = convexTest(schema, modules);
      const whiteboardData = await t
        .withIdentity({ subject: "test-user-12345" })
        .mutation(api.whiteboards.getOrCreateWhiteboard);

      const transformedConvexWhiteboardData =
        transformConvexWhiteboard(whiteboardData);
      expect(transformedConvexWhiteboardData).not.toBeNull();
      expect(transformedConvexWhiteboardData).toStrictEqual({
        _id: whiteboardData?._id,
        _creationTime: whiteboardData?._creationTime,
        title: whiteboardData?.title,
        tenantId: whiteboardData?.tenantId,
        serializedData: whiteboardData?.serializedData,
        lastModified: whiteboardData?.lastModified,
      });
    });
  });
  describe("deserializeWhiteboardData", () => {
    // Mock window object for client-side detection
    const mockWindow = {
      Blob: class Blob {
        constructor(data: any[], options: { type: string }) {
          this.data = data;
          this.type = options.type;
        }
        data: any[];
        type: string;
      },
    };

    beforeEach(() => {
      // Set up window object
      Object.defineProperty(global, "window", {
        value: mockWindow,
        writable: true,
      });

      // Mock Excalidraw's loadFromBlob function
      const mockLoadFromBlob = vi.fn().mockResolvedValue({
        elements: [
          {
            id: "test-element-1",
            type: "rectangle",
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            strokeColor: "#1e1e1e",
            backgroundColor: "transparent",
          },
        ],
        appState: {
          viewBackgroundColor: "#ffffff",
          theme: "light",
          gridSize: 20,
        },
      });

      vi.doMock("@excalidraw/excalidraw", () => ({
        loadFromBlob: mockLoadFromBlob,
      }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should deserialize valid whiteboard data", async () => {
      const result = await deserializeWhiteboardData(serializedWhiteboardData);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty("elements");
      expect(result).toHaveProperty("appState");
      expect(result).toHaveProperty("scrollToContent", true);
      expect(Array.isArray(result?.elements)).toBe(true);
      expect(typeof result?.appState).toBe("object");
    });

    it("should return null on server side (window undefined)", async () => {
      // Temporarily remove window object
      delete (global as any).window;

      const result = await deserializeWhiteboardData(serializedWhiteboardData);

      expect(result).toBeNull();

      // Restore window for other tests
      global.window = mockWindow;
    });

    it("should handle invalid JSON data", async () => {
      const invalidJSON = '{"invalid": json}';

      const result = await deserializeWhiteboardData(invalidJSON);

      // Should return null when parsing fails
      expect(result).toBeNull();
    });

    it("should handle empty string", async () => {
      const result = await deserializeWhiteboardData("");

      expect(result).toBeNull();
    });

    it("should handle null input", async () => {
      const result = await deserializeWhiteboardData(null as any);

      expect(result).toBeNull();
    });

    it("should handle malformed Excalidraw data", async () => {
      // Mock loadFromBlob to throw an error
      const { loadFromBlob } = await import("@excalidraw/excalidraw");
      vi.mocked(loadFromBlob).mockRejectedValueOnce(new Error("Invalid data"));

      const result = await deserializeWhiteboardData(serializedWhiteboardData);

      expect(result).toBeNull();
    });

    it("should preserve element properties during deserialization", async () => {
      // Mock loadFromBlob to return specific data
      const { loadFromBlob } = await import("@excalidraw/excalidraw");
      vi.mocked(loadFromBlob).mockResolvedValueOnce({
        elements: [
          {
            id: "test-rect",
            type: "rectangle",
            x: 50,
            y: 50,
            width: 100,
            height: 80,
            strokeColor: "#ff0000",
            backgroundColor: "#00ff00",
            strokeWidth: 2,
            opacity: 100,
          },
          {
            id: "test-line",
            type: "line",
            x: 200,
            y: 100,
            width: 150,
            height: 50,
            points: [
              [0, 0],
              [150, 50],
            ],
            strokeColor: "#0000ff",
          },
        ],
        appState: {
          viewBackgroundColor: "#f0f0f0",
          theme: "dark" as const,
          gridSize: 10,
          name: "Test Whiteboard",
        },
      });

      const result = await deserializeWhiteboardData(serializedWhiteboardData);

      expect(result?.elements).toHaveLength(2);
      expect(result?.elements[0]).toMatchObject({
        id: "test-rect",
        type: "rectangle",
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        strokeColor: "#ff0000",
        backgroundColor: "#00ff00",
      });

      expect(result?.elements[1]).toMatchObject({
        id: "test-line",
        type: "line",
        x: 200,
        y: 100,
        width: 150,
        height: 50,
        strokeColor: "#0000ff",
      });

      expect(result?.appState).toMatchObject({
        viewBackgroundColor: "#f0f0f0",
        theme: "dark",
        gridSize: 10,
        name: "Test Whiteboard",
      });
    });

    it("should always set scrollToContent to true", async () => {
      const { loadFromBlob } = await import("@excalidraw/excalidraw");
      vi.mocked(loadFromBlob).mockResolvedValueOnce({
        elements: [],
        appState: {},
      });

      const result = await deserializeWhiteboardData(serializedWhiteboardData);

      expect(result?.scrollToContent).toBe(true);
    });

    it("should handle large whiteboard data", async () => {
      // Create a large serialized data string
      const largeElements = Array.from({ length: 1000 }, (_, i) => ({
        id: `element-${i}`,
        type: "rectangle",
        x: i * 10,
        y: i * 10,
        width: 50,
        height: 50,
      }));

      const { loadFromBlob } = await import("@excalidraw/excalidraw");
      vi.mocked(loadFromBlob).mockResolvedValueOnce({
        elements: largeElements,
        appState: {
          viewBackgroundColor: "#ffffff",
          theme: "light" as const,
        },
      });

      const result = await deserializeWhiteboardData(serializedWhiteboardData);

      expect(result?.elements).toHaveLength(1000);
      expect(result?.elements[999]).toMatchObject({
        id: "element-999",
        x: 9990,
        y: 9990,
      });
    });

    it("should console.warn on server side calls", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      delete (global as any).window;

      await deserializeWhiteboardData(serializedWhiteboardData);

      expect(consoleSpy).toHaveBeenCalledWith(
        "deserializeWhiteboardData called on server side",
      );

      consoleSpy.mockRestore();
      global.window = mockWindow;
    });

    it("should console.error on parsing failures", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { loadFromBlob } = await import("@excalidraw/excalidraw");
      vi.mocked(loadFromBlob).mockRejectedValueOnce(new Error("Parse error"));

      await deserializeWhiteboardData(serializedWhiteboardData);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to deserialize whiteboard data:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
