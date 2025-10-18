import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useConvex } from "convex/react";

import { FolderNode, TreeNode } from "@/types/note";
import { useUser } from "@clerk/nextjs";

export function useFolderOperations() {
  const {
    addFolderToStore,
    removeFolderFromStore,
    handleDragEnd,
    treeStructure,
    updateUserNote,
  } = useNotesStore();

  const { user } = useUser();
  const userId = user?.id;
  const convex = useConvex();

  // Convex mutations
  const createFolderMutation = useMutation(api.notes.createFolderInDb);
  const deleteFolderMutation = useMutation(api.notes.deleteFolder);
  const moveNodeMutation = useMutation(api.notes.moveNode);

  const createFolder = async (name: string, parentId?: string) => {
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    const pointer_id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create optimistic folder object
    const newFolder: FolderNode = {
      type: "folder",
      pointer_id,
      tenantId: userId,
      name,
      createdAt: now,
      updatedAt: now,
      lastAccessed: now,
      lastEdited: now,
      collaborative: false,
      parent_id: parentId,
      isExpanded: false,
    };

    // Optimistically add to store
    addFolderToStore(newFolder);

    try {
      await createFolderMutation({
        name,
        tenantId: userId,
        pointer_id,
        parent_id: parentId ? findNoteDbId(parentId) : undefined,
      });

      // Fetch the newly created folder from DB to get the _id
      const createdFolder = await convex.query(api.notes.readNoteFromDb, {
        pointer_id,
      });

      if (createdFolder) {
        // Update the store with the folder that now has the _id
        updateUserNote(createdFolder as FolderNode);
      }

      console.log("Folder created successfully");
    } catch (error) {
      console.error("Error creating folder:", error);
      // Rollback on error
      removeFolderFromStore(pointer_id);
      throw error;
    }
  };

  const deleteFolder = async (folderId: string, cascade = false) => {
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    const confirmMessage = cascade
      ? "Are you sure you want to delete this folder and all its contents? This action cannot be undone."
      : "Are you sure you want to delete this empty folder?";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteFolderMutation({
        pointer_id: folderId,
        user_id: userId,
        cascade,
      });
      // Remove from store after successful deletion
      removeFolderFromStore(folderId);
      console.log("Folder deleted successfully");
    } catch (error) {
      console.error("Error deleting folder:", error);
      throw error;
    }
  };

  const moveNode = async (nodeId: string, newParentDbId?: string) => {
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    try {
      console.log("Moving node:", nodeId, "to parent DB ID:", newParentDbId);

      await moveNodeMutation({
        pointer_id: nodeId,
        new_parent_id: newParentDbId, // Now passing the actual Convex ID directly
        user_id: userId,
      });
      console.log("Item moved successfully");
    } catch (error) {
      console.error("Error moving node:", error);
      throw error;
    }
  };

  // Helper function to find database ID from pointer_id
  const findNoteDbId = (pointerId: string): string | null => {
    const findInTree = (nodes: TreeNode[]): string | null => {
      for (const node of nodes) {
        const nodeWithId = node as { pointer_id: string; _id?: string };
        if (nodeWithId.pointer_id === pointerId) {
          return nodeWithId._id || null;
        }
        if (node.children) {
          const found = findInTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findInTree(treeStructure);
  };

  const handleDragEndWithSync = (
    active: { id: string },
    over: { id: string } | null,
    context?: {
      dropTarget: "folder" | "between";
      dropPosition: "child" | "sibling";
    },
  ) => {
    if (!over) return;

    // First, handle the local drag operation
    handleDragEnd(active, over, context);

    // Then sync to database
    const activeId = active.id;
    const overId = over.id;

    // Find the over node to determine new parent
    const findNode = (
      nodes: TreeNode[],
      id: string,
    ): { pointer_id: string; type: string; children?: TreeNode[] } | null => {
      for (const node of nodes) {
        const nodeData = node as {
          pointer_id: string;
          type: string;
          children?: TreeNode[];
        };
        if (nodeData.pointer_id === id) {
          return nodeData;
        }
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const overNode = findNode(treeStructure, overId);
    let newParentId = null;

    // Determine new parent based on drop context
    if (context?.dropTarget === "folder" && overNode?.type === "folder") {
      // Dropping INTO a folder - the folder becomes the parent
      newParentId = overId;
    } else {
      // Dropping as sibling - find the parent of the target node
      const findParent = (
        nodes: TreeNode[],
        targetId: string,
        parent: { pointer_id: string } | null = null,
      ): { pointer_id: string } | null => {
        for (const node of nodes) {
          const nodeData = node as {
            pointer_id: string;
            children?: TreeNode[];
          };
          if (nodeData.pointer_id === targetId) {
            return parent;
          }
          if (node.children) {
            const result = findParent(node.children, targetId, nodeData);
            if (result !== null) return result;
          }
        }
        return null;
      };

      const parentNode = findParent(treeStructure, overId);
      newParentId = parentNode?.pointer_id || null;
    }

    // Sync to database
    moveNode(activeId, newParentId).catch((error) => {
      console.error("Failed to sync drag operation to database:", error);
      // TODO: Could implement rollback logic here if needed
    });
  };

  return {
    createFolder,
    deleteFolder,
    moveNode,
    handleDragEnd: handleDragEndWithSync,
  };
}
