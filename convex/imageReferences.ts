import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const linkImage = mutation({
  args: {
    storageId: v.id("_storage"),
    tenantId: v.string(),
    documentOwner: v.string(),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
  },
  handler: async (ctx, args) => {
    let documentOwnerId: Id<"notes" | "whiteboards"> | null;

    if (args.documentOwnerType === "notes") {
      documentOwnerId = ctx.db.normalizeId("notes", args.documentOwner);
    } else {
      documentOwnerId = ctx.db.normalizeId("whiteboards", args.documentOwner);
    }

    if (documentOwnerId) {
      const existing = await ctx.db
        .query("imageReferences")
        .withIndex("by_doc_storage", (q) =>
          q
            .eq("documentOwner", documentOwnerId)
            .eq("storageId", args.storageId),
        )
        .unique();
      if (existing) return;

      await ctx.db.insert("imageReferences", {
        storageId: args.storageId,
        tenantId: args.tenantId,
        documentOwnerType: args.documentOwnerType,
        documentOwner: documentOwnerId,
        format: "image" as const,
        createdAt: new Date().toISOString(),
      });
    }
  },
});

export const unlinkImage = mutation({
  args: {
    storageId: v.id("_storage"),
    documentOwner: v.string(),
    documentOwnerType: v.union(v.literal("notes"), v.literal("whiteboards")),
  },
  handler: async (ctx, { documentOwner, documentOwnerType, storageId }) => {
    let documentOwnerId: Id<"notes" | "whiteboards"> | null;

    if (documentOwnerType === "notes") {
      documentOwnerId = ctx.db.normalizeId("notes", documentOwner);
    } else {
      documentOwnerId = ctx.db.normalizeId("whiteboards", documentOwner);
    }
    if (documentOwnerId) {
      const link = await ctx.db
        .query("imageReferences")
        .withIndex("by_doc_storage", (q) =>
          q.eq("documentOwner", documentOwnerId).eq("storageId", storageId),
        )
        .unique();
      if (!link) return;
      await ctx.db.delete(link._id);

      await ctx.db.insert("imageReferencesCleanup", {
        storageId: storageId,
        tenantId: link.tenantId,
        documentOwnerType: documentOwnerType,
        documentOwner: documentOwnerId,
        createdAt: new Date().toISOString(),
      });
    }
  },
});

export const maybeGc = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const stillUsed = await ctx.db
      .query("imageReferences")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .first();
    if (!stillUsed) await ctx.storage.delete(storageId);
  },
});

// Helper function to safely detect images in TipTap content
const detectImagesInTiptapContent = (
  content: any,
  storageId: string,
): boolean => {
  if (!content || typeof content !== "object") return false;

  const searchForImages = (obj: any): boolean => {
    if (Array.isArray(obj)) {
      return obj.some(searchForImages);
    }

    if (typeof obj === "object" && obj !== null) {
      // Check if this is an image node with matching storage ID
      if (obj.type === "image" && obj.attrs?.src) {
        return obj.attrs.src.includes(`storageId=${storageId}`);
      }

      // Recursively search nested content
      return Object.values(obj).some(searchForImages);
    }

    if (typeof obj === "string") {
      return obj.includes(`storageId=${storageId}`);
    }

    return false;
  };

  return searchForImages(content);
};

// Helper function to safely detect images in whiteboard data
const detectImagesInWhiteboardData = (
  data: any,
  storageId: string,
): boolean => {
  if (!data) return false;

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return detectImagesInWhiteboardData(parsed, storageId);
    } catch {
      return data.includes(`storageId=${storageId}`);
    }
  }

  if (Array.isArray(data)) {
    return data.some((item) => detectImagesInWhiteboardData(item, storageId));
  }

  if (typeof data === "object" && data !== null) {
    // Look for image-related properties
    if (data.type === "image" || data.element === "image") {
      if (data.src || data.url || data.href) {
        const imageUrl = data.src || data.url || data.href;
        return imageUrl.includes(`storageId=${storageId}`);
      }
    }

    return Object.values(data).some((value) =>
      detectImagesInWhiteboardData(value, storageId),
    );
  }

  return false;
};

export const resolveImageReferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const imageReferencesCleanup = await ctx.db
      .query("imageReferencesCleanup")
      .collect();

    if (imageReferencesCleanup.length === 0) return;

    // Group cleanup entries by storage ID to handle atomically
    const storageGroups = new Map<
      string,
      Array<{
        ref: any;
        document: any;
        documentType: "notes" | "whiteboards";
      }>
    >();

    // Separate and batch fetch documents
    const noteRefs = imageReferencesCleanup.filter(
      (ref) => ref.documentOwnerType === "notes",
    );
    const whiteboardRefs = imageReferencesCleanup.filter(
      (ref) => ref.documentOwnerType === "whiteboards",
    );

    try {
      // Batch fetch all documents with error handling
      const [notes, whiteboards] = await Promise.all([
        Promise.all(
          noteRefs.map(async (ref) => {
            try {
              const note = await ctx.db.get(ref.documentOwner as Id<"notes">);
              return { ref, note };
            } catch (error) {
              console.error(
                `Failed to fetch note ${ref.documentOwner}:`,
                error,
              );
              return { ref, note: null };
            }
          }),
        ),
        Promise.all(
          whiteboardRefs.map(async (ref) => {
            try {
              const whiteboard = await ctx.db.get(
                ref.documentOwner as Id<"whiteboards">,
              );
              return { ref, whiteboard };
            } catch (error) {
              console.error(
                `Failed to fetch whiteboard ${ref.documentOwner}:`,
                error,
              );
              return { ref, whiteboard: null };
            }
          }),
        ),
      ]);

      // Group by storage ID for atomic processing
      notes.forEach(({ ref, note }) => {
        if (!storageGroups.has(ref.storageId)) {
          storageGroups.set(ref.storageId, []);
        }

        storageGroups.get(ref.storageId)!.push({
          ref,
          document: note,
          documentType: "notes" as const,
        });
      });

      whiteboards.forEach(({ ref, whiteboard }) => {
        if (!storageGroups.has(ref.storageId)) {
          storageGroups.set(ref.storageId, []);
        }

        storageGroups.get(ref.storageId)!.push({
          ref,
          document: whiteboard,
          documentType: "whiteboards" as const,
        });
      });

      // Process each storage ID atomically
      const results = await Promise.allSettled(
        Array.from(storageGroups.entries()).map(async ([storageId, group]) => {
          let isStillUsed = false;

          // Check if storage ID is still used in any document
          for (const { document, documentType } of group) {
            if (!document) continue;

            if (documentType === "notes" && document.content?.tiptap) {
              if (
                detectImagesInTiptapContent(document.content.tiptap, storageId)
              ) {
                isStillUsed = true;
                break;
              }
            } else if (
              documentType === "whiteboards" &&
              document.serializedData
            ) {
              if (
                detectImagesInWhiteboardData(document.serializedData, storageId)
              ) {
                isStillUsed = true;
                break;
              }
            }
          }

          if (isStillUsed) {
            // Re-insert references for this storage ID
            const insertPromises = group.map(({ ref }) =>
              ctx.db.insert("imageReferences", {
                storageId: ref.storageId,
                tenantId: ref.tenantId,
                documentOwnerType: ref.documentOwnerType,
                documentOwner: ref.documentOwner,
                format: "image" as const,
                createdAt: new Date().toISOString(),
              }),
            );
            await Promise.all(insertPromises);
          } else {
            // Delete unused storage
            await ctx.storage.delete(storageId as Id<"_storage">);
          }

          return { storageId, processed: true };
        }),
      );

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to process storage group ${index}:`,
            result.reason,
          );
        }
      });

      // Always clean up the cleanup records, even if some operations failed
      const cleanupPromises = imageReferencesCleanup.map(async (ref) => {
        try {
          await ctx.db.delete(ref._id);
        } catch (error) {
          console.error(`Failed to delete cleanup record ${ref._id}:`, error);
        }
      });

      await Promise.allSettled(cleanupPromises);
    } catch (error) {
      console.error("Critical error in resolveImageReferences:", error);
      // Don't delete cleanup records if there was a critical error
      throw error;
    }
  },
});
