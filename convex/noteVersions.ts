import { action, mutation, query, MutationCtx } from "./_generated/server";
import { NoteContent } from "@/types/note";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getNoteVersions = query({
  args: { note_id: v.string() },
  handler: async (ctx, { note_id }) => {
    const noteId = ctx.db.normalizeId("notes", note_id);
    if (!noteId) {
      return [];
    }
    const versions = await ctx.db
      .query("notesHistoryMetadata")
      .withIndex("by_note_id", (q) => q.eq("noteId", noteId))
      .collect();

    return versions;
  },
});

export const getNoteContentVersion = query({
  args: { metadata_id: v.id("notesHistoryMetadata") },
  handler: async (ctx, { metadata_id }) => {
    const metadataId = ctx.db.normalizeId("notesHistoryMetadata", metadata_id);
    if (!metadataId) {
      throw new Error("Invalid version ID");
    }

    const content = await ctx.db
      .query("notesHistoryContent")
      .withIndex("by_metadata_id", (q) => q.eq("metadataId", metadataId))
      .unique();
    return content;
  },
});
