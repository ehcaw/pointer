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
    collaborative: v.boolean(),
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
  imageReferences: defineTable({
    storageId: v.string(),
    tenantId: v.string(),
    format: v.union(v.literal("image")),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
    documentOwner: v.union(v.id("notes"), v.id("whiteboards")),
    createdAt: v.string(),
  })
    .index("by_doc", ["documentOwner"])
    .index("by_storage", ["storageId"])
    .index("by_doc_storage", ["documentOwner", "storageId"]),
  imageReferencesCleanup: defineTable({
    storageId: v.string(),
    tenantId: v.string(),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
    documentOwner: v.union(v.id("notes"), v.id("whiteboards")),
    createdAt: v.string(),
  })
    .index("by_doc", ["documentOwner"])
    .index("by_storage", ["storageId"])
    .index("by_doc_storage", ["documentOwner", "storageId"]),
  documentShares: defineTable({
    documentId: v.id("notes"),
    userEmail: v.string(),
    userId: v.string(),
    ownerEmail: v.string(),
    ownerId: v.string(),
  })
    .index("by_document_user", ["documentId", "userId", "userEmail"])
    .index("by_userId", ["userId"]),
});
