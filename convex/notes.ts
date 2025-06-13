import { mutation } from "./_generated/server";
import { v } from "convex/values";
// import { createObjectId } from "quibble/src/types/note"; // Uncomment if you want to use your ObjectId helper

export const createNoteInDb = mutation({
  args: {
    name: v.string(), // Use 'name' instead of 'title' to match your type
    content: v.object({
      tiptap: v.optional(v.any()), // Accepts TipTap JSON
      text: v.optional(v.string()),
    }),
    tenantId: v.string(), // Pass tenantId from the client
    parentId: v.optional(v.string()), // Optional parent folder
    path: v.optional(v.array(v.string())), // Optional path
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notes", {
      name: args.name,
      content: args.content,
      tenantId: args.tenantId,
      parentId: args.parentId,
      path: args.path,
    });
  },
});
