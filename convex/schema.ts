import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  notes: defineTable({
    content: v.object({
      text: v.string(),
      tiptap: v.optional(v.string()),
    }),
    createdAt: v.string(),
    lastAccessed: v.string(),
    lastEdited: v.string(),
    name: v.string(),
    quibble_id: v.optional(v.string()),
    pointer_id: v.string(),
    tenantId: v.string(),
    updatedAt: v.string(),
  }).searchIndex("notes_full_text_search_index", {
    searchField: "content.text",
    filterFields: ["name"],
  }),
  jots: defineTable({
    tenantId: v.string(),
    type: v.string(),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
    link: v.optional(v.string()),
    description: v.optional(v.string()),
  }),
  tags: defineTable({
    tenantId: v.string(),
    name: v.string(),
  }),
  whiteboards: defineTable({
    // Basic metadata
    title: v.string(),
    tenantId: v.string(),
    // Serialized JSON data for export/import
    serializedData: v.optional(v.string()),
    lastModified: v.string(),
  }).index("by_owner", ["tenantId"]),
  image_references: defineTable({
    body: v.string(),
    owner: v.string(),
    format: v.union(v.literal("image")),
    document_owner_type: v.union(v.literal("notes"), v.literal("whiteboards")),
    document_owner: v.union(v.id("notes"), v.id("whiteboards")),
  }),
});
