import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../__tests__/components/whiteboard/test.setup";

describe("whiteboards", () => {
  describe("create", () => {
    it("returns null when there is no authenticated user", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.whiteboards.create, {
          title: "whiteboard",
          serializedData: '{"content": "hello"',
        }),
      ).rejects.toThrowError();
    });
  });
  describe("getWhiteboard", () => {
    it("returns null when there is no authenticated user", async () => {
      const t = convexTest(schema, modules);

      // convexTest automatically handles unauthenticated state
      const result = await t.query(api.whiteboards.getWhiteboard, {});

      expect(result).toBeNull();
    });

    it("returns null when there is no whiteboard for the authenticated user", async () => {
      const t = convexTest(schema, modules);

      // Mock an authenticated user
      const userId = "test-user-123";
      const result = await t
        .withIdentity({
          subject: userId,
          name: "Test User",
          email: "test@example.com",
        })
        .query(api.whiteboards.getWhiteboard, {});

      expect(result).toBeNull();
    });

    it("returns the whiteboard when it exists for the authenticated user", async () => {
      const t = convexTest(schema, modules);

      const userId = "test-user-123";
      const whiteboardData = {
        tenantId: userId,
        title: "Test Whiteboard",
        serializedData: '{"test": true}',
        lastModified: new Date().toISOString(),
      };

      // Insert test data
      await t.run(async (ctx) => {
        await ctx.db.insert("whiteboards", whiteboardData);
      });

      // Run the query with mocked identity
      const result = await t
        .withIdentity({
          subject: userId,
          name: "Test User",
          email: "test@example.com",
        })
        .query(api.whiteboards.getWhiteboard, {});

      expect(result).not.toBeNull();
      expect(result?.tenantId).toBe(userId);
      expect(result?.title).toBe("Test Whiteboard");
      expect(result?.serializedData).toBe('{"test": true}');
    });

    it("returns only the whiteboard for the authenticated user (not other users)", async () => {
      const t = convexTest(schema, modules);

      const userId1 = "test-user-123";
      const userId2 = "test-user-456";

      // Insert whiteboards for two different users
      await t.run(async (ctx) => {
        await ctx.db.insert("whiteboards", {
          tenantId: userId1,
          title: "User 1 Whiteboard",
          serializedData: '{"user": 1}',
          lastModified: new Date().toISOString(),
        });

        await ctx.db.insert("whiteboards", {
          tenantId: userId2,
          title: "User 2 Whiteboard",
          serializedData: '{"user": 2}',
          lastModified: new Date().toISOString(),
        });
      });

      // Query as user 1 - should only get user 1's whiteboard
      const result1 = await t
        .withIdentity({
          subject: userId1,
          name: "User 1",
          email: "user1@example.com",
        })
        .query(api.whiteboards.getWhiteboard, {});

      expect(result1).not.toBeNull();
      expect(result1?.tenantId).toBe(userId1);
      expect(result1?.title).toBe("User 1 Whiteboard");

      // Query as user 2 - should only get user 2's whiteboard
      const result2 = await t
        .withIdentity({
          subject: userId2,
          name: "User 2",
          email: "user2@example.com",
        })
        .query(api.whiteboards.getWhiteboard, {});

      expect(result2).not.toBeNull();
      expect(result2?.tenantId).toBe(userId2);
      expect(result2?.title).toBe("User 2 Whiteboard");
    });
  });
  describe("updateWhiteboard", () => {
    it("returns false if the user is not logged in", async () => {
      const t = convexTest(schema, modules);
      const result = await t
        .withIdentity({ subject: "test-subject-12345" })
        .mutation(api.whiteboards.create, {
          title: "Test Note",
          serializedData: '{"test": "data"}',
        });
      const userWhiteboard = await t.mutation(
        api.whiteboards.updateWhiteboard,
        {
          id: result!._id,
          title: "New Title",
          serializedData: '{"new": "data"}',
        },
      );
      expect(userWhiteboard).toEqual({ success: false });
    });
    it("updates the whiteboard", async () => {
      const t = convexTest(schema, modules);
      await t
        .withIdentity({ subject: "test-subject-12345" })
        .mutation(api.whiteboards.create, {
          title: "Test Note",
          serializedData: '{"test": "data"}',
        });
      const userWhiteboard = await t
        .withIdentity({ subject: "test-subject-12345" })
        .query(api.whiteboards.getWhiteboard);
      expect(userWhiteboard).not.toBeNull();

      const updateResult = await t
        .withIdentity({ subject: "test-subject-12345" })
        .mutation(api.whiteboards.updateWhiteboard, {
          id: userWhiteboard!._id,
          title: "Hello!",
          serializedData: '{"updated": true}',
        });

      expect(updateResult).toEqual({ success: true });

      const updatedUserWhiteboard = await t
        .withIdentity({ subject: "test-subject-12345" })
        .query(api.whiteboards.getWhiteboard);

      expect(updatedUserWhiteboard).not.toBeNull();
      expect(updatedUserWhiteboard?.serializedData).toBe('{"updated": true}');
      expect(updatedUserWhiteboard?.title).toBe("Hello!");
    });
  });
  describe("getOrCreateWhiteboard", () => {
    it("returns null if the user isn't signed in", async () => {
      const t = convexTest(schema, modules);
      const result = await t.mutation(api.whiteboards.getOrCreateWhiteboard);
      expect(result).toBeNull();
    });
    it("returns a new whiteboard if one doesn't exist yet", async () => {
      const t = convexTest(schema, modules);
      const result = await t
        .withIdentity({ subject: "test-subject-12345" })
        .mutation(api.whiteboards.getOrCreateWhiteboard);
      expect(result).not.toBeNull();
      expect(result?.title).toBe("My Whiteboard");
      expect(result?.tenantId).toBe("test-subject-12345");
      expect(result?.serializedData).toBeDefined();
      expect(result?.serializedData).toBe(
        JSON.stringify({
          type: "excalidraw",
          version: 2,
          source: "https://excalidraw.com",
          elements: [],
          appState: {
            viewBackgroundColor: "#ffffff",
            theme: "light",
          },
        }),
      );
    });
    it("returns existing whiteboard content if a user already has a whiteboard", async () => {
      const t = convexTest(schema, modules);
      await t
        .withIdentity({ subject: "test-subject-12345" })
        .mutation(api.whiteboards.create, {
          title: "Existing User Whiteboard",
          serializedData: '{"existing": "data"}',
        });

      const result = await t
        .withIdentity({ subject: "test-subject-12345" })
        .mutation(api.whiteboards.getOrCreateWhiteboard);
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Existing User Whiteboard");
      expect(result?.tenantId).toBe("test-subject-12345");
      expect(result?.serializedData).toBe('{"existing": "data"}');
    });
  });
});
