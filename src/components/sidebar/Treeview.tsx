import { TreeView, TreeDataItem } from "../ui/tree-view";
import { Node, FileNode } from "@/types/note";
import { buildTreeStructure } from "@/lib/tree-utils";
import { useMemo, useState, useCallback } from "react";
import { useFolderOperations } from "@/hooks/use-folder-operations";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { useRouter } from "next/navigation";
import TreeContextMenu from "./TreeContextMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ensureJSONString } from "@/lib/utils";
import { customErrorToast, customSuccessToast } from "../ui/custom-toast";

export const TreeViewComponent = () => {
  const { moveNode } = useFolderOperations();
  const { moveNodeInTree, setCurrentNote, updateUserNote } = useNotesStore();
  const { setCurrentView } = usePreferencesStore();
  const [nodeToRename, setNodeToRename] = useState<Node | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const router = useRouter();
  const convex = useConvex();

  // Get the latest userNotes from store (includes optimistic updates)
  const userNotes = useNotesStore((state) => state.userNotes);

  // Helper function to check if a node is a descendant of another node
  const isDescendant = useCallback(
    (nodeId: string, potentialAncestorId: string): boolean => {
      const findNode = (nodes: Node[], id: string): Node | null => {
        for (const node of nodes) {
          if (node.pointer_id === id || node._id === id) return node;
        }
        return null;
      };

      let current = findNode(userNotes, nodeId);
      while (current && current.parent_id) {
        if (current.parent_id === potentialAncestorId) return true;
        current = findNode(userNotes, current.parent_id);
      }
      return false;
    },
    [userNotes],
  );

  // Helper to extract folders in tree display order (depth-first traversal)
  const extractFoldersInTreeOrder = useCallback(
    (treeItems: TreeDataItem[]): Node[] => {
      const folders: Node[] = [];

      const traverse = (items: TreeDataItem[]) => {
        for (const item of items) {
          const node = item.data as Node | undefined;
          if (node && node.type === "folder") {
            folders.push(node);
          }
          if (item.children) {
            traverse(item.children);
          }
        }
      };

      traverse(treeItems);
      return folders;
    },
    [],
  );

  // Get valid move target folders (excluding the node itself and its descendants)
  const getValidMoveTargets = useCallback(
    (node: Node | null, treeItems: TreeDataItem[]): Node[] => {
      if (!node) return [];

      // Get all folders in tree display order
      const foldersInOrder = extractFoldersInTreeOrder(treeItems);

      // Filter to get only valid targets
      return foldersInOrder.filter((n) => {
        // Can't move into itself
        if (n.pointer_id === node.pointer_id || n._id === node._id)
          return false;

        // Can't move a folder into its own descendants (would create a cycle)
        if (
          node.type === "folder" &&
          isDescendant(
            n.pointer_id || n._id || "",
            node.pointer_id || node._id || "",
          )
        ) {
          return false;
        }

        return true;
      });
    },
    [isDescendant, extractFoldersInTreeOrder],
  );

  // Convert userNotes to TreeDataItem for TreeView component
  const treeData = useMemo(() => {
    const builtTree = buildTreeStructure(userNotes);

    // Add badges to each tree item
    const addBadges = (items: TreeDataItem[]): TreeDataItem[] => {
      return items.map((item) => {
        // Get the node data stored in the TreeDataItem
        const node = item.data as Node | undefined;
        if (!node) return item;

        const collaborativeBadge =
          node.collaborative && node.type !== "folder" ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
              <Users className="h-3 w-3" />
            </div>
          ) : undefined;

        const itemWithBadge: TreeDataItem = {
          ...item,
          badge: collaborativeBadge,
          children: item.children ? addBadges(item.children) : undefined,
        };

        return itemWithBadge;
      });
    };

    const treeWithBadges = addBadges(builtTree);
    return treeWithBadges;
  }, [userNotes]); // Depend on userNotes which includes optimistic updates

  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (!item) return;

    const selectedNode = item.data as Node | undefined;
    if (selectedNode && !item.droppable) {
      // Only set current note for files (non-droppable), not folders
      // Optimistic update - set note first for immediate UI response
      setCurrentNote(selectedNode);

      if (selectedNode.collaborative) {
        router.push(`/main/collab/${selectedNode.pointer_id}`);
      } else {
        setCurrentView("note");
        router.push("/main");
      }
    }
  };

  const handleRenameRequest = useCallback((node: Node) => {
    setNodeToRename(node);
    setRenameValue(node.name);
  }, []);

  const handleRenameSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!nodeToRename || !renameValue.trim()) return;

      try {
        // Update the node with new name
        const updatedNode = {
          ...nodeToRename,
          name: renameValue.trim(),
          updatedAt: new Date().toISOString(),
        };

        // Update in database
        if (nodeToRename.type === "folder") {
          // For folders, update using the updateNoteInDb mutation
          await convex.mutation(api.notes.updateNoteInDb, {
            pointer_id: nodeToRename.pointer_id,
            name: updatedNode.name,
            tenantId: nodeToRename.tenantId,
            createdAt: String(nodeToRename.createdAt),
            updatedAt: String(updatedNode.updatedAt),
            lastAccessed: String(new Date()),
            lastEdited: String(nodeToRename.lastEdited || new Date()),
            content: { tiptap: "", text: "" },
            collaborative: nodeToRename.collaborative,
          });
        } else {
          // For files, include content
          const fileNode = nodeToRename as FileNode;
          const rawTiptapContent = fileNode.content?.tiptap || "";
          const serializedTiptapContent = ensureJSONString(rawTiptapContent);

          await convex.mutation(api.notes.updateNoteInDb, {
            pointer_id: nodeToRename.pointer_id,
            name: updatedNode.name,
            tenantId: nodeToRename.tenantId,
            createdAt: String(nodeToRename.createdAt),
            updatedAt: String(updatedNode.updatedAt),
            lastAccessed: String(new Date()),
            lastEdited: String(nodeToRename.lastEdited || new Date()),
            content: {
              tiptap: serializedTiptapContent,
              text: fileNode.content?.text || "",
            },
            collaborative: nodeToRename.collaborative,
          });
        }

        // Update local state
        updateUserNote(updatedNode);

        setNodeToRename(null);
        customSuccessToast(`Renamed to "${renameValue.trim()}"`);
      } catch (error) {
        console.error("Failed to rename:", error);
        customErrorToast("Failed to rename. Please try again.");
      }
    },
    [nodeToRename, renameValue, convex, updateUserNote],
  );

  const handleMoveRequest = useCallback(
    async (sourceNode: Node, targetFolderId: string | null) => {
      try {
        // Use the _id for optimistic updates (not pointer_id)
        const sourceNodeId = sourceNode._id || sourceNode.pointer_id;

        // Determine the new parent ID for optimistic update
        let newParentId: string | undefined = undefined;
        let newParentDbId: string | undefined = undefined;

        if (targetFolderId === null) {
          // Move to root
          newParentId = undefined;
          newParentDbId = undefined;
        } else {
          // Moving into a specific folder
          // Find the target folder to get its _id
          const targetFolder = userNotes.find(
            (n) => n.pointer_id === targetFolderId || n._id === targetFolderId,
          );

          if (!targetFolder) {
            customErrorToast("Target folder not found");
            return;
          }

          // Validate: prevent cycles
          if (
            sourceNode.type === "folder" &&
            isDescendant(targetFolderId, sourceNodeId)
          ) {
            customErrorToast("Cannot move a folder into its own descendant");
            return;
          }

          newParentId = targetFolder._id || targetFolder.pointer_id;
          newParentDbId = targetFolder._id;
        }

        // Save current state for potential rollback
        const {
          userNotes: originalUserNotes,
          treeStructure: originalTreeStructure,
        } = useNotesStore.getState();

        // Optimistic update - update local state immediately using _id
        moveNodeInTree(sourceNodeId, newParentId);

        // Persist to backend in background using pointer_id for database operations
        try {
          await moveNode(sourceNode.pointer_id, newParentDbId);
          customSuccessToast(`Moved "${sourceNode.name}" successfully`);
        } catch (error) {
          console.error("Failed to sync move operation to backend:", error);
          customErrorToast("Failed to move item");

          // Rollback optimistic update on failure
          const { setUserNotes, setTreeStructure } = useNotesStore.getState();
          setUserNotes(originalUserNotes);
          setTreeStructure(originalTreeStructure);
        }
      } catch (error) {
        console.error("Move operation failed:", error);
        customErrorToast("Failed to move item");
      }
    },
    [userNotes, isDescendant, moveNodeInTree, moveNode],
  );

  const handleDocumentDrag = async (
    sourceItem: TreeDataItem,
    targetItem: TreeDataItem,
  ) => {
    // Get the actual source node from the TreeDataItem data
    const sourceNode = sourceItem.data as Node | undefined;

    if (!sourceNode) {
      console.error("Could not find source node");
      return;
    }

    // Use the _id for optimistic updates (not pointer_id)
    const sourceNodeId = sourceNode._id || sourceItem.id;

    // Determine the new parent ID for optimistic update (use _id)
    let newParentId = undefined;
    if (targetItem.id === "virtual-root") {
      // Move to root level
      newParentId = undefined;
    } else if (targetItem.id === "" && targetItem.name === "parent_div") {
      // Move to root level (old root drop zone)
      newParentId = undefined;
    } else {
      // Get the actual target node from the TreeDataItem data
      const targetNode = targetItem.data as Node | undefined;

      if (!targetNode) {
        console.error("Could not find target node");
        return;
      }

      if (targetNode.type === "folder") {
        // Dropping INTO a folder - use the folder's _id
        newParentId = targetNode._id;
      } else {
        // Dropping as a sibling - use the target's parent
        newParentId = targetNode.parent_id;
      }
    }

    // Determine the new parent database ID for backend
    let newParentDbId = undefined;
    if (targetItem.id === "virtual-root") {
      // Move to root level (parent_id = undefined)
      newParentDbId = undefined;
    }
    // Check if target is the old root drop zone (for backwards compatibility)
    else if (targetItem.id === "" && targetItem.name === "parent_div") {
      // Move to root level (parent_id = undefined)
      newParentDbId = undefined;
    } else {
      // Get the actual target node from the TreeDataItem data
      const targetNode = targetItem.data as Node | undefined;

      if (!targetNode) {
        console.error("Could not find target node");
        return;
      }

      if (targetNode.type === "folder") {
        // Dropping INTO a folder - use the folder's database ID
        newParentDbId = targetNode._id;
      } else {
        // Dropping as a sibling - use the target's parent (already a DB ID)
        newParentDbId = targetNode.parent_id;
      }
    }

    // 1. Save current state for potential rollback
    const {
      userNotes: originalUserNotes,
      treeStructure: originalTreeStructure,
    } = useNotesStore.getState();

    // 2. Optimistic update - update local state immediately using _id
    moveNodeInTree(sourceNodeId, newParentId);

    // 3. Persist to backend in background using pointer_id for database operations
    try {
      await moveNode(sourceNode.pointer_id, newParentDbId);
    } catch (error) {
      console.error("Failed to sync move operation to backend:", error);
      // 4. Rollback optimistic update on failure
      const { setUserNotes, setTreeStructure } = useNotesStore.getState();
      setUserNotes(originalUserNotes);
      setTreeStructure(originalTreeStructure);
    }
  };

  return (
    <>
      <div className="h-full">
        <TreeView
          data={treeData}
          onDocumentDrag={handleDocumentDrag}
          onSelectChange={handleSelectChange}
          className="h-full"
          contextMenuWrapper={(children, item) => (
            <TreeContextMenu
              item={item}
              treeData={treeData}
              onRenameRequest={handleRenameRequest}
              onMoveRequest={handleMoveRequest}
              getValidMoveTargets={getValidMoveTargets}
            >
              {children}
            </TreeContextMenu>
          )}
        />
      </div>

      {nodeToRename && (
        <Dialog
          open={!!nodeToRename}
          onOpenChange={(isOpen) => !isOpen && setNodeToRename(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename {nodeToRename.type}</DialogTitle>
              <DialogDescription>
                Enter a new name for `&quot;`{nodeToRename.name}`&quot;`.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRenameSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="rename-input">Name</Label>
                  <Input
                    id="rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter new name"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNodeToRename(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Rename</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
