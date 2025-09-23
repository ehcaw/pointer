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

    // Excalidraw core data
    elements: v.array(v.any()), // Excalidraw elements

    // Selected persistent app state
    appState: v.object({
      viewBackgroundColor: v.optional(v.string()),
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
      gridSize: v.optional(v.number()),
      name: v.optional(v.string()),
    }),
  }).index("by_owner", ["tenantId"]),
});
