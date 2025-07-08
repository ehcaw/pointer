import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notes: defineTable({
    content: v.object({
      text: v.string(),
      tiptap: v.string(),
    }),
    createdAt: v.string(),
    lastAccessed: v.string(),
    lastEdited: v.string(),
    name: v.string(),
    quibble_id: v.string(),
    tenantId: v.string(),
    updatedAt: v.string(),
  }).searchIndex("notes_full_text_search_index", {
    searchField: "content.text",
    filterFields: ["name"],
  }),
  jots: defineTable({
    content: v.optional(v.string()),
    link: v.optional(v.string()),
  }),
});
