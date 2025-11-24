// types/nodes.ts

import { Id } from "../../convex/_generated/dataModel";

/**
 * Base fields shared by both folders and files.
 */
export interface BaseNode {
  /** Unique identifier for this node (folder or file). */
  _id?: string;

  pointer_id: string;

  /** ID of the user (tenant) who owns this node. */
  tenantId: string;

  /** Name of the folder or file (e.g. "app", "route.ts"). */
  name: string;

  /** Timestamp when this node was first created as a string*/
  createdAt: string;

  /** Timestamp when this node was last updated as a string */
  updatedAt: string;

  /** Last time this note was accessed by the user */
  lastAccessed?: string;

  /** Last time this note was edited (differs from updatedAt which includes metadata changes) */
  lastEdited?: string;

  collaborative: boolean;
}

/**
 * Discriminated union type for node types.
 */
export type NodeType = "file" | "folder";

/**
 * A file node (holds JSON content).
 */
export interface FileNode extends BaseNode {
  type: "file";
  /**
   * JSON object representing the file's contents.
   * For TipTap notes, this will contain the editor's JSON structure.
   */
  content?: {
    /**
     * Raw TipTap JSON content
     */
    tiptap?: string;

    /**
     * Plain text representation of the content
     */
    text?: string;
  };
  /**
   * Optional parent folder ID for hierarchical organization
   */
  parent_id?: string;
}

/**
 * A folder node (contains other nodes).
 */
export interface FolderNode extends BaseNode {
  type: "folder";
  /**
   * Optional parent folder ID for hierarchical organization
   */
  parent_id?: string;
  /**
   * Whether the folder is expanded in the UI
   */
  isExpanded?: boolean;
}

export interface NoteContent {
  text: string;
  tiptap?: string;
}

/**
 * Discriminated union: either a folder or a file.
 */
export type Node = FileNode | FolderNode;

/**
 * Tree node structure with children for UI rendering
 */
export interface TreeNode {
  // Base Node properties
  _id?: string;
  pointer_id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
  lastEdited?: string;
  collaborative: boolean;

  // Node type discriminator
  type: "file" | "folder";

  // File-specific properties
  content?: {
    tiptap?: string;
    text?: string;
  };

  // Folder-specific properties
  isExpanded?: boolean;

  // Hierarchy
  parent_id?: string;

  // Tree structure
  children?: TreeNode[];
}

/**
 * Helper function to check if a node is a folder
 */
export function isFolder(node: Node): node is FolderNode {
  return node.type === "folder";
}

/**
 * Helper function to check if a node is a file
 */
export function isFile(node: Node): node is FileNode {
  return node.type === "file";
}

export interface DocumentVersion {
  _id: Id<"notesHistoryMetadata">;
  _creationTime: number;
  tenantId: string;
  noteId: Id<"notes">;
  timestamp: number;
  content?: {
    tiptap?: string;
    text?: string;
  };
}

// Graph Stuff
export type GraphBaseNode = {
  id: string;
  createdAt: string;
  tags: string[];
} & (Thought | Bookmark | MediaPost);

export type Thought = {
  type: "thought";
  text: string;
};

export type Bookmark = {
  type: "bookmark";
  url: string;
  title: string;
  description?: string;
};

export type MediaPost = {
  type: "media";
  platform: "twitter" | "instagram";
  url: string;
  caption: string;
};

export type Edge = {
  id: string;
  from: string;
  to: string;
  kind: "SIMILAR_TO" | "TAGGED_AS" | "LINKS_TO" | "MENTIONS";
};
