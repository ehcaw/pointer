import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const sendImage = mutation({
  args: {
    storageId: v.id("_storage"),
    owner: v.string(),
    document_type: v.union(v.literal("notes"), v.literal("whiteboards")),
    document_owner_id: v.union(v.id("notes"), v.id("whiteboards")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("image_references", {
      body: args.storageId,
      owner: args.owner,
      format: "image",
      document_owner_type: args.document_type,
      document_owner: args.document_owner_id,
    });
  },
});
