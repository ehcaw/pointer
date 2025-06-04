// types/nodes.ts

import { ObjectId } from "mongodb";

/**
 * Base fields shared by both folders and files.
 */
export interface BaseNode {
  /** Unique identifier for this node (folder or file). */
  _id: ObjectId;

  /** ID of the user (tenant) who owns this node. */
  tenantId: ObjectId;

  /** Name of the folder or file (e.g. "app", "route.ts"). */
  name: string;

  /**
   * The parent folder’s ObjectId.
   * - `null` if this node is a top‐level item in the bucket.
   */
  parentId: ObjectId | null;

  /**
   * Materialized path of ancestor folder IDs.
   * - Example: If this node lives at `/app/api/hello/route.ts`, then
   *   path = [ appFolderId, apiFolderId, helloFolderId ].
   */
  path: ObjectId[];

  /** Timestamp when this node was first created. */
  createdAt: Date;

  /** Timestamp when this node was last updated. */
  updatedAt: Date;

  /**
   * OPTIONAL FIELDS (uncomment and adjust as needed):
   *
   * // If you need to support sharing/permissions in the future:
   * // permissions?: Permission[];
   *
   * // If you want to track a custom state or badge (e.g. "M", "U", "A"):
   * // state?: "M" | "U" | "A";
   *
   * // If you want to add tags to the node:
   * // tags?: string[];
   *
   * // For a “soft delete” feature:
   * // deleted?: boolean;
   * // deletedAt?: Date;
   */
}

/**
 * A folder node (no `content` field).
 */
export interface FolderNode extends BaseNode {
  type: "folder";
  // No `content` property here
}

/**
 * A file node (holds JSON content).
 */
export interface FileNode extends BaseNode {
  type: "file";

  /**
   * Arbitrary JSON object representing the file’s contents.
   * Adjust the generic type if you have a stricter schema.
   */
  content: Record<string, any>;
}

/**
 * Discriminated union: either a folder or a file.
 */
export type Node = FolderNode | FileNode;

/**
 * OPTIONAL: If you plan to support per‐node permissions in the future,
 * you could define a Permission interface like this:
 *
 * export interface Permission {
 *   /** ID of a user who has permission *\/
 *   userId?: ObjectId;
 *
 *   /** ID of a team or group that has permission *\/
 *   teamId?: ObjectId;
 *
 *   /** Type of access granted *\/
 *   access: "read" | "write";
 * }
 *
 * Then you could add:
 *   permissions?: Permission[];
 * inside BaseNode or a specific node type.
 */
