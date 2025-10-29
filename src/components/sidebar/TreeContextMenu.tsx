import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
} from "../ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Node } from "@/types/note";
import { useFolderOperations } from "@/hooks/use-folder-operations";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { Check, Home, FolderInput, Edit3, Eye, Trash2 } from "lucide-react";
import { TreeDataItem } from "../ui/tree-view";

const TreeContextMenu = ({
  children,
  item,
  treeData,
  onRenameRequest,
  onMoveRequest,
  getValidMoveTargets,
}: {
  children: any;
  item: any;
  treeData: TreeDataItem[];
  onRenameRequest: (node: Node) => void;
  onMoveRequest: (sourceNode: Node, targetFolderId: string | null) => void;
  getValidMoveTargets: (node: Node | null, treeData: TreeDataItem[]) => Node[];
}) => {
  const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);
  const { deleteFolder } = useFolderOperations();
  const { deleteNote } = useNoteEditor();

  // Get the current node from item
  const currentNode = item.data as Node | undefined;

  // Get valid move targets (filtered folders excluding cycles) in tree display order
  const validFolders = getValidMoveTargets(currentNode || null, treeData);

  const copyPreviewLink = () => {
    if (typeof window === "undefined") {
      toast("Failed to copy preview link, please try again");
      return;
    }
    return navigator.clipboard.writeText(
      `${window.location.origin}/preview/${item.pointer_id}`,
    );
  };

  const handleDeleteClick = () => {
    // Get the node data from the TreeDataItem
    const node = item.data as Node | undefined;
    if (node) {
      setNodeToDelete(node);
    }
  };

  const handleRenameClick = () => {
    // Get the node data from the TreeDataItem
    const node = item.data as Node | undefined;
    if (node) {
      onRenameRequest(node);
    }
  };

  const handleMoveClick = (targetFolderId: string | null) => {
    if (currentNode) {
      onMoveRequest(currentNode, targetFolderId);
    }
  };

  const confirmDelete = async () => {
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
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56 p-2">
          {/* Move submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md hover:bg-accent">
              <FolderInput className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">Move to...</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="min-w-[220px] p-2">
              {/* Root option */}
              <ContextMenuItem
                onClick={() => handleMoveClick(null)}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-md cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>Root</span>
                </div>
                {!currentNode?.parent_id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </ContextMenuItem>

              {validFolders.length > 0 && (
                <div className="my-2 h-px bg-border" />
              )}

              {/* Valid folder options */}
              {validFolders.map((folder) => {
                const isCurrentParent =
                  currentNode?.parent_id === folder._id ||
                  currentNode?.parent_id === folder.pointer_id;
                return (
                  <ContextMenuItem
                    key={folder._id || folder.pointer_id}
                    onClick={() => handleMoveClick(folder.pointer_id)}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-md cursor-pointer"
                  >
                    <span className="truncate">{folder.name}</span>
                    {isCurrentParent && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </ContextMenuItem>
                );
              })}

              {validFolders.length === 0 &&
                currentNode?.parent_id === undefined && (
                  <ContextMenuItem
                    disabled
                    className="text-muted-foreground text-sm px-3 py-2"
                  >
                    No available folders
                  </ContextMenuItem>
                )}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Separator */}
          <div className="my-2 h-px bg-border" />

          {/* Rename */}
          <ContextMenuItem
            onClick={handleRenameClick}
            className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent"
          >
            <Edit3 className="h-4 w-4 text-muted-foreground" />
            <span>Rename</span>
          </ContextMenuItem>

          {/* Preview */}
          <ContextMenuItem
            onClick={copyPreviewLink}
            className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent"
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span>Preview link</span>
          </ContextMenuItem>

          {/* Separator before destructive action */}
          <div className="my-2 h-px bg-border" />

          {/* Delete */}
          <ContextMenuItem
            onClick={handleDeleteClick}
            className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-destructive/10 text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {nodeToDelete && (
        <AlertDialog
          open={!!nodeToDelete}
          onOpenChange={(isOpen) => !isOpen && setNodeToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the{" "}
                {nodeToDelete.type} titled &quot;{nodeToDelete.name}&quot;.
                {nodeToDelete.type === "folder" &&
                  " All contents within this folder will also be deleted."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default TreeContextMenu;
