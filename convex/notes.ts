import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
// import { createObjectId } from "quibble/src/types/note"; // Uncomment if you want to use your ObjectId helper

// export const readNotesFromDb = async (ctx, user_id) => {
//   return await ctx.db
//     .query("notes")
//     .filter((q) => q.eq(q.field("tenantId"), user_id));
// };

export const readNotesFromDb = query({
  handler: async (ctx, user_id) => {
    return ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("tenantId"), user_id));
  },
});

export const createNoteInDb = mutation({
  args: {
    _id: v.string(),
    name: v.string(), // Use 'name' instead of 'title' to match your type
    content: v.object({
      tiptap: v.optional(v.any()), // Accepts TipTap JSON
      text: v.optional(v.string()),
    }),
    tenantId: v.string(), // Pass tenantId from the client
    parentId: v.optional(v.string()), // Optional parent folder
    path: v.optional(v.array(v.string())), // Optional path,
    createdAt: v.string(),
    updatedAt: v.string(),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notes", {
      _id: args._id,
      name: args.name,
      content: args.content,
      tenantId: args.tenantId,
      parentId: args.parentId,
      path: args.path,
    });
  },
});

export const updateNoteInDb = mutation({
  args: {
    _id: v.id("notes"),
    name: v.optional(v.string()),
    content: v.optional(
      v.object({ tiptap: v.optional(v.any()), text: v.optional(v.string()) }),
    ),
    lastAccessed: v.optional(v.string()),
    lastEdited: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { _id, ...fields } = args;
    const update: Record<string, any> = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) {
        update[key] = value;
      }
    });
    update.updatedAt = String(new Date());
    await ctx.db.patch(_id, { update });
  },
});

export const deleteNoteInDb = mutation({
  args: {
    _id: v.id("notes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args._id);
  },
});
