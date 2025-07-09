import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const readTagsFromDb = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tags")
      .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
      .collect();
  },
});

export const createTag = mutation({
  args: {
    tenantId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const tag = await ctx.db.insert("tags", {
      tenantId: args.tenantId,
      name: args.name,
    });
    return tag;
  },
});

export const deleteTag = mutation({
  args: {
    tenantId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const tag = await ctx.db
      .query("tags")
      .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    if (!tag) throw new Error("Tag not found");
    await ctx.db.delete(tag._id);
  },
});
