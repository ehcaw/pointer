import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    serializedData: v.optional(v.string()), // Accept serialized data from client
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const defaultSerializedData =
      args.serializedData ||
      JSON.stringify({
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: [],
        appState: {
          viewBackgroundColor: "#ffffff",
          theme: "light",
        },
      });

    const whiteboardId = await ctx.db.insert("whiteboards", {
      title: args.title,
      tenantId: identity.subject,
      serializedData: defaultSerializedData,
      lastModified: new Date().toISOString(),
    });

    return await ctx.db.get(whiteboardId);
  },
});

export const getWhiteboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("whiteboards")
      .filter((q) => q.eq(q.field("tenantId"), identity.subject))
      .first();
  },
});

export const updateWhiteboard = mutation({
  args: {
    id: v.id("whiteboards"),
    title: v.optional(v.string()), // Make title optional
    serializedData: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, title, serializedData } = args;

    const updateData: any = {
      serializedData,
      lastModified: new Date().toISOString(),
    };

    // Only update title if provided
    if (title !== undefined) {
      updateData.title = title;
    }

    await ctx.db.patch(id, updateData);

    return { success: true };
  },
});

export const getOrCreateWhiteboard = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Try to get existing whiteboard
    const existingWhiteboard = await ctx.db
      .query("whiteboards")
      .filter((q) => q.eq(q.field("tenantId"), identity.subject))
      .first();

    if (existingWhiteboard) {
      return existingWhiteboard;
    }

    // Create default whiteboard with empty serialized data
    const defaultSerializedData = JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements: [],
      appState: {
        viewBackgroundColor: "#ffffff",
        theme: "light",
      },
    });

    const whiteboardId = await ctx.db.insert("whiteboards", {
      title: "My Whiteboard",
      tenantId: identity.subject,
      serializedData: defaultSerializedData,
      lastModified: new Date().toISOString(),
    });

    return await ctx.db.get(whiteboardId);
  },
});
