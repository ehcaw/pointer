import { TreeDataItem } from "@/components/ui/tree-view";
import { Node, isFolder } from "@/types/note";
import { isFile } from "@/types/note";

/**
 * Converts a flat list of notes and folders into a hierarchical tree structure
 * compatible with TreeView component.
 *
 * @param notes - Flat array of nodes (files and folders)
 * @returns Hierarchical array of TreeDataItem objects wrapped in a virtual root folder
 */
export function buildTreeStructure(notes: Node[]): TreeDataItem[] {
  // Create a map for quick lookup of nodes by ID
  const nodeMap = new Map<string, Node>();

  // Create a map for tracking folder children
  const folderChildrenMap = new Map<string, Node[]>();

  // Initialize maps and separate root nodes
  notes.forEach((note) => {
    // Always use _id for tree building - this is the Convex database ID
    if (note._id) {
      nodeMap.set(note._id, note);
    }

    // Initialize children array for folders
    if (isFolder(note) && note._id) {
      folderChildrenMap.set(note._id, []);
    }
  });

  // Populate folder children relationships
  notes.forEach((note) => {
    if (note.parent_id) {
      const parentId = note.parent_id;
      const existingChildren = folderChildrenMap.get(parentId) || [];
      folderChildrenMap.set(parentId, [...existingChildren, note]);
    }
  });

  // Recursive function to convert Node to TreeDataItem
  function nodeToTreeItem(node: Node): TreeDataItem {
    // Only use _id for TreeView ID - nodes without _id won't be included in tree
    if (!node._id) {
      throw new Error(
        `Node ${node.name} does not have _id, cannot include in tree structure`,
      );
    }

    const treeItem: TreeDataItem = {
      id: node._id,
      name: node.name,
    };

    // Add children if this is a folder
    if (isFolder(node)) {
      // Use _id for finding children
      const children = folderChildrenMap.get(node._id) || [];
      treeItem.children = children
        .sort((a, b) => {
          // Sort folders first, then files
          if (isFolder(a) && !isFolder(b)) return -1;
          if (!isFolder(a) && isFolder(b)) return 1;
          // Then sort by name
          return a.name.localeCompare(b.name);
        })
        .map((child) => nodeToTreeItem(child));
    }

    // Add optional properties based on node type
    if (isFile(node)) {
      // Files are draggable
      treeItem.draggable = true;
    }

    if (isFolder(node)) {
      // Folders are both draggable and droppable
      treeItem.draggable = true;
      treeItem.droppable = true;
    }

    return treeItem;
  }

  // Find root nodes (nodes without parent_id) that have _id
  const rootNodes = notes.filter((note) => !note.parent_id && note._id);

  // Build tree structure from root nodes
  const rootItems = rootNodes
    .sort((a, b) => {
      // Sort folders first, then files
      if (isFolder(a) && !isFolder(b)) return -1;
      if (!isFolder(a) && isFolder(b)) return 1;
      // Then sort by name
      return a.name.localeCompare(b.name);
    })
    .map((rootNode) => {
      try {
        return nodeToTreeItem(rootNode);
      } catch (error) {
        console.warn(error instanceof Error ? error.message : String(error));
        return null;
      }
    })
    .filter((item): item is TreeDataItem => item !== null); // Remove null entries

  // Create virtual root folder
  const virtualRoot: TreeDataItem = {
    id: "virtual-root",
    name: "Root",
    droppable: true,
    draggable: false, // Root folder cannot be dragged
    children: rootItems,
  };

  return [virtualRoot];
}
