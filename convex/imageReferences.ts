import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const linkImage = mutation({
  args: {
    storageId: v.id("_storage"),
    tenantId: v.string(),
    documentOwner: v.union(v.id("notes"), v.id("whiteboards")),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("imageReferences")
      .withIndex("by_doc_storage", (q) =>
        q
          .eq("documentOwner", args.documentOwner)
          .eq("storageId", args.storageId),
      )
      .unique();
    if (existing) return;

    await ctx.db.insert("imageReferences", {
      ...args,
      format: "image",
      createdAt: new Date().toISOString(),
    });
  },
});

export const unlinkImage = mutation({
  args: {
    documentOwner: v.union(v.id("notes"), v.id("whiteboards")),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { documentOwner, storageId }) => {
    const link = await ctx.db
      .query("imageReferences")
      .withIndex("by_doc_storage", (q) =>
        q.eq("documentOwner", documentOwner).eq("storageId", storageId),
      )
      .unique();
    if (!link) return;

    await ctx.db.delete(link._id);

    // Is this storageId still used anywhere?
    const stillUsed = await ctx.db
      .query("imageReferences")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .first();

    if (!stillUsed) {
      await ctx.scheduler.runAfter(5000, internal.imageReferences.maybeGc, {
        storageId,
      });
    }
  },
});

export const maybeGc = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const stillUsed = await ctx.db
      .query("imageReferences")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .first();
    if (!stillUsed) await ctx.storage.delete(storageId);
  },
});
