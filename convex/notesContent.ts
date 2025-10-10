import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getNoteContentById = query({
  args: { noteId: v.string() },
  handler: async (ctx, args) => {
    const noteId = ctx.db.normalizeId("notes", args.noteId);
    if (!noteId) {
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
          },
        ],
      };
    }
    const noteContentData = await ctx.db
      .query("notesContent")
      .withIndex("by_noteid", (q) => q.eq("noteId", noteId))
      .unique();
    if (noteContentData && noteContentData.content) {
      return noteContentData["content"];
    } else {
      return JSON.stringify({
        text: "",
        tiptap: {
          type: "doc",
          content: [
            {
              type: "paragraph",
            },
          ],
        },
      });
    }
  },
});
