import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const linkImage = mutation({
  args: {
    storageId: v.id("_storage"),
    tenantId: v.string(),
    documentOwner: v.string(),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
  },
  handler: async (ctx, args) => {
    let documentOwnerId: Id<"notes" | "whiteboards">;

    if (args.documentOwnerType === "notes") {
      documentOwnerId = args.documentOwner as Id<"notes">;
    } else {
      documentOwnerId = args.documentOwner as Id<"whiteboards">;
    }

    const existing = await ctx.db
      .query("imageReferences")
      .withIndex("by_doc_storage", (q) =>
        q.eq("documentOwner", documentOwnerId).eq("storageId", args.storageId),
      )
      .unique();
    if (existing) return;

    await ctx.db.insert("imageReferences", {
      storageId: args.storageId,
      tenantId: args.tenantId,
      documentOwnerType: args.documentOwnerType,
      documentOwner: documentOwnerId,
      format: "image" as const,
      createdAt: new Date().toISOString(),
    });
  },
});

export const unlinkImage = mutation({
  args: {
    documentOwner: v.string(),
    storageId: v.id("_storage"),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
  },
  handler: async (ctx, { documentOwner, documentOwnerType, storageId }) => {
    let documentOwnerId: Id<"notes" | "whiteboards">;

    if (documentOwnerType === "notes") {
      documentOwnerId = documentOwner as Id<"notes">;
    } else {
      documentOwnerId = documentOwner as Id<"whiteboards">;
    }

    const link = await ctx.db
      .query("imageReferences")
      .withIndex("by_doc_storage", (q) =>
        q.eq("documentOwner", documentOwnerId).eq("storageId", storageId),
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

export const resolveImageReferences = internalMutation({});
