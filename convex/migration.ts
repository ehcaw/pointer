import { mutation } from "./_generated/server";

export const migrateData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all data from old table
    const oldData = await ctx.db.query("notes").collect();

    // Transform and insert into new table
    for (const item of oldData) {
      await ctx.db.insert("notesContent", {
        content: item.content,
        tenantId: item.tenantId,
        noteId: item._id,
      });
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
