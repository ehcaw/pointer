import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const whiteboardId = await ctx.db.insert("whiteboards", {
      title: args.title,
      tenantId: identity.subject,
      elements: [],
      appState: {
        viewBackgroundColor: "#ffffff",
        theme: "light",
      },
    });

    const whiteboard = await ctx.db.get(whiteboardId);

    return whiteboard;
  },
});

export const getWhiteboard = query({
  args: { id: v.id("whiteboards") },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
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
    elements: v.array(v.any()),
    appState: v.object({
      viewBackgroundColor: v.optional(v.string()),
      theme: v.optional(v.string()),
      gridSize: v.optional(v.number()),
      name: v.optional(v.string()),
    }),
    lastModifiedBy: v.string(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;

    await ctx.db.patch(id, {
      ...updateData,
      lastModified: Date.now(),
    });

    return { success: true };
  },
});
