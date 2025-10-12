import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getNoteContentById = query({
  args: { noteId: v.string() },
  handler: async (ctx, args) => {
    const noteId = ctx.db.normalizeId("notes", args.noteId);
    if (!noteId) {
      return {
        text: "",
        tiptap: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
            },
          ],
        }),
      };
    }
    const noteContentData = await ctx.db
      .query("notesContent")
      .withIndex("by_noteid", (q) => q.eq("noteId", noteId))
      .unique();
    if (noteContentData && noteContentData.content) {
      return noteContentData["content"];
    } else {
      return {
        text: "",
        tiptap: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
            },
          ],
        }),
      };
    }
  },
});

export const createNoteContent = mutation({
  args: {
    noteId: v.string(),
    content: v.object({
      text: v.string(),
      tiptap: v.optional(v.string()),
    }),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const noteContentId = await ctx.db.insert("notesContent", {
      noteId: ctx.db.normalizeId("notes", args.noteId)!,
      content: args.content,
      tenantId: args.tenantId,
    });
    return noteContentId;
  },
});

export const updateNoteContentById = mutation({
  args: {
    noteId: v.string(),
    content: v.object({ text: v.string(), tiptap: v.optional(v.string()) }),
  },
  handler: async (ctx, args) => {
    const noteId = ctx.db.normalizeId("notes", args.noteId);
    if (!noteId) {
      throw new Error("Invalid note ID");
    }

    const noteContentData = await ctx.db
      .query("notesContent")
      .withIndex("by_noteid", (q) => q.eq("noteId", noteId))
      .first();
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {};
    if (!noteContentData) {
      throw new Error("Note content not found");
    }
    update["content"] = args.content;
    await ctx.db.patch(noteContentData._id, update);
  },
});

export const createNoteContentInternal = internalMutation({
  args: {
    noteId: v.id("notes"),
    content: v.object({
      text: v.string(),
      tiptap: v.optional(v.string()),
    }),
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const noteContentId = await ctx.db.insert("notesContent", {
      noteId: args.noteId,
      content: args.content,
      tenantId: args.tenantId,
    });
    return noteContentId;
  },
});
