import { TreeView, TreeDataItem } from "../ui/tree-view";
import { Node } from "@/types/note";
import { buildTreeStructure } from "@/lib/tree-utils";
import { useMemo, useState, useCallback } from "react";
import { useFolderOperations } from "@/hooks/use-folder-operations";
import { useNotesStore } from "@/lib/stores/notes-store";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { usePreferencesStore } from "@/lib/stores/preferences-store";

export const TreeViewComponent = ({ nodes }: { nodes: Node[] }) => {
  const { moveNode, deleteFolder } = useFolderOperations();
  const { moveNodeInTree, setCurrentNote } = useNotesStore();
  const { setCurrentView } = usePreferencesStore();
  const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);
  const { deleteNote } = useNoteEditor();

  // Get the latest userNotes from store (includes optimistic updates)
  const userNotes = useNotesStore((state) => state.userNotes);

  const handleDeleteClick = useCallback((e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    setNodeToDelete(node);
  }, []);

  // Convert userNotes to TreeDataItem for TreeView component
  const treeData = useMemo(() => {
    const builtTree = buildTreeStructure(userNotes);

    // Add delete actions to each tree item
    const addDeleteActions = (items: TreeDataItem[]): TreeDataItem[] => {
      return items.map((item) => {
        const node = userNotes.find((n) => n._id === item.id);
        if (!node) return item;

        const deleteButton = (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleDeleteClick(e, node)}
            className="h-5 w-5 rounded-sm opacity-0 group-hover:opacity-100 group-hover/item:opacity-100 transition-all hover:bg-destructive/10 hover:scale-105"
          >
            <Trash className="h-3 w-3 text-muted-foreground group-hover:text-destructive group-hover/item:text-destructive transition-colors" />
            <span className="sr-only">Delete {node.type}</span>
          </Button>
        );

        const itemWithActions: TreeDataItem = {
          ...item,
          actions: deleteButton,
          children: item.children ? addDeleteActions(item.children) : undefined,
        };

        return itemWithActions;
      });
    };

    const treeWithActions = addDeleteActions(builtTree);
    return treeWithActions;
  }, [userNotes, handleDeleteClick]); // Depend on userNotes which includes optimistic updates

  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (!item) return;

    const selectedNode = userNotes.find((note) => note._id === item.id);
    if (selectedNode && !item.droppable) {
      // Only set current note for files (non-droppable), not folders
      setCurrentView("note");
      setCurrentNote(selectedNode);
    }
  };

  const confirmDelete = useCallback(async () => {
    if (!nodeToDelete) return;

    try {
      if (nodeToDelete.type === "folder") {
        await deleteFolder(nodeToDelete.pointer_id, true); // cascade = true to delete folder and contents
      } else {
        await deleteNote(nodeToDelete.pointer_id || "", nodeToDelete.tenantId);
      }
      setNodeToDelete(null);
    } catch (error) {
      console.error("Failed to delete node:", error);
      setNodeToDelete(null);
    }
  }, [nodeToDelete, deleteFolder, deleteNote]);

  const handleDeleteCancel = useCallback(() => {
    setNodeToDelete(null);
  }, []);

  const handleDocumentDrag = async (
    sourceItem: TreeDataItem,
    targetItem: TreeDataItem,
  ) => {
    // Find the actual source node from our original nodes array
    const sourceNode = nodes.find((n) => n._id === sourceItem.id);

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
      // Find the actual target node for normal folder drops
      const targetNode = nodes.find((n) => n._id === targetItem.id);

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
    }
    else {
      // Find the actual target node for normal folder drops
      const targetNode = nodes.find((n) => n._id === targetItem.id);

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
    const { userNotes: originalUserNotes, treeStructure: originalTreeStructure } = useNotesStore.getState();

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
        />
      </div>
      {nodeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. This will permanently delete the{" "}
              {nodeToDelete.type} titled &quot;{nodeToDelete.name}&quot;.
              {nodeToDelete.type === "folder" &&
                " All contents within this folder will also be deleted."}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDeleteCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
