import { mutation } from "./_generated/server";

export const migrateData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all data from old table
    const oldData = await ctx.db.query("notes").collect();

    // Transform and insert into new table
    for (const item of oldData) {
      const notesContentReference = await ctx.db
        .query("notesContent")
        .withIndex("by_noteid", (q) => q.eq("noteId", item._id))
        .first();
      
      const content = item.content || { text: "", tiptap: "" };
      
      if (notesContentReference) {
        await ctx.db.patch(notesContentReference._id, {
          content: content,
        });
      } else {
        await ctx.db.insert("notesContent", {
          content: content,
          tenantId: item.tenantId,
          noteId: item._id,
        });
      }
    }
    return { migrated: oldData.length };
  },
});

export const deleteNotesContent = mutation({
  args: {},
  handler: async (ctx) => {
    const oldData = await ctx.db.query("notes").collect();
    for (const item of oldData) {
      const newNote = {
        ...item,
        content: undefined,
      };
      await ctx.db.patch(item._id, newNote);
    }
  },
});
