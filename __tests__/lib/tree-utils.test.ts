import { describe, it, expect } from "vitest";
import { buildTreeStructure, nodeToTreeItem } from "@/lib/tree-utils";
import {
  collaborativeNodes,
  deeplyNestedNodes,
  hierarchicalNodes,
  simpleFlatNodes,
} from "../helpers/tree-constants";
import { Node, FileNode, FolderNode } from "@/types/note";

describe("tree utils tests", () => {
  describe("nodeToTreeItem", () => {
    it("throws an error if the node doesn't have an _id", () => {
      const folderChildrenMap: Map<string, Node[]> = new Map();
      const node: FileNode = {
        type: "file",
        name: "test node",
        pointer_id: "test-node",
        tenantId: "tenant-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborative: false,
      };
      expect(() => nodeToTreeItem(folderChildrenMap, node)).toThrowError(
        "Node test node does not have _id, cannot include in tree structure",
      );
    });
    it("should return a tree item for a note with no children by default", () => {
      const folderChildrenMap: Map<string, Node[]> = new Map();
      const node: FileNode = {
        _id: "node-1",
        type: "file",
        name: "test node",
        pointer_id: "test-node",
        tenantId: "tenant-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborative: false,
      };
      const treeItem = nodeToTreeItem(folderChildrenMap, node);
      expect(treeItem.children).toBeUndefined();
      expect(treeItem.draggable).toBeTruthy();
      expect(treeItem.droppable).toBeFalsy();
    });
    it("should return a tree item for a note with no children by default", () => {
      const folderChildrenMap: Map<string, Node[]> = new Map();
      const node: FolderNode = {
        _id: "node-1",
        type: "folder",
        name: "test node",
        pointer_id: "test-node",
        tenantId: "tenant-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborative: false,
      };
      const treeItem = nodeToTreeItem(folderChildrenMap, node);
      expect(treeItem.children).toBeDefined();
      expect(treeItem.draggable).toBeTruthy();
      expect(treeItem.droppable).toBeTruthy();
    });
    it("should return a tree data item with children", () => {
      const folderChildrenMap: Map<string, Node[]> = new Map();
      const parentNode: FolderNode = {
        _id: "parent-node",
        type: "folder",
        name: "Parent Node",
        pointer_id: "parent-node-ptr",
        tenantId: "tenant-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborative: false,
      };
      const secondParentNode: FolderNode = {
        _id: "parent-node-2",
        type: "folder",
        name: "Parent Node 2",
        pointer_id: "parent-node-ptr-2",
        tenantId: "tenant-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborative: false,
      };
      const children = [];
      const children2 = [];
      for (let i = 2; i >= -0; i--) {
        const childNode: FileNode = {
          _id: `child-node-${i}`,
          type: "file",
          name: `Child Node ${i}`,
          pointer_id: `child-node-ptr-${i}`,
          tenantId: "tenant-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          collaborative: false,
        };
        children.push(childNode);
        children2.push(childNode);
      }
      folderChildrenMap.set(parentNode._id!, children);
      folderChildrenMap.set(secondParentNode._id!, children);

      const parentOneTreeItem = nodeToTreeItem(folderChildrenMap, parentNode);
      const parentTwoTreeItem = nodeToTreeItem(
        folderChildrenMap,
        secondParentNode,
      );

      expect(parentOneTreeItem.children).toHaveLength(3);
      expect(parentOneTreeItem.droppable).toBeTruthy();
      expect(parentOneTreeItem.draggable).toBeTruthy();
      expect(parentOneTreeItem.children![0].name).toBe("Child Node 0");
      expect(parentOneTreeItem.children![2].name).toBe("Child Node 2");

      expect(parentTwoTreeItem.children).toHaveLength(3);
      expect(parentTwoTreeItem.droppable).toBeTruthy();
      expect(parentTwoTreeItem.draggable).toBeTruthy();
      expect(parentTwoTreeItem.children![0].name).toBe("Child Node 0");
      expect(parentTwoTreeItem.children![2].name).toBe("Child Node 2");
    });
  });
  describe("buildTreeStructure", () => {
    it("should build a proper flat tree structure", () => {
      const simpleTreeStructureRootNodes = [
        {
          id: "node_1",
          name: "Documents",
          data: simpleFlatNodes[0],
          pointer_id: "ptr_1",
          droppable: true,
          draggable: true,
          children: [],
        },
        {
          id: "node_3",
          name: "Projects",
          data: simpleFlatNodes[2],
          pointer_id: "ptr_3",
          droppable: true,
          draggable: true,
          children: [],
        },
        {
          id: "node_2",
          name: "Meeting Notes.md",
          data: simpleFlatNodes[1],
          pointer_id: "ptr_2",
          draggable: true,
        },
      ];
      const simpleTreeStructure = {
        id: "virtual-root",
        pointer_id: "virtual-root",
        name: "Root",
        droppable: true,
        draggable: false,
        children: simpleTreeStructureRootNodes,
      };
      expect(buildTreeStructure(simpleFlatNodes)).toStrictEqual([
        simpleTreeStructure,
      ]);
    });
    it("should build a proper nested tree structure", () => {
      const nestedStructureRootNodes = [
        {
          id: "folder_root",
          name: "My Workspace",
          data: hierarchicalNodes[0],
          pointer_id: "ptr_root",
          droppable: true,
          draggable: true,
          children: [
            {
              id: "folder_personal",
              name: "Personal",
              data: hierarchicalNodes[3],
              pointer_id: "ptr_personal",
              droppable: true,
              draggable: true,
              children: [
                {
                  id: "file_todo",
                  name: "TODO.md",
                  data: hierarchicalNodes[4],
                  pointer_id: "ptr_todo",
                  draggable: true,
                },
              ],
            },
            {
              id: "folder_projects",
              name: "Projects",
              data: hierarchicalNodes[1],
              pointer_id: "ptr_projects",
              droppable: true,
              draggable: true,
              children: [
                {
                  id: "file_project_plan",
                  name: "Project Plan.md",
                  data: hierarchicalNodes[2],
                  pointer_id: "ptr_plan",
                  draggable: true,
                },
              ],
            },
          ],
        },
      ];
      const nestedTreeStructure = {
        id: "virtual-root",
        pointer_id: "virtual-root",
        name: "Root",
        droppable: true,
        draggable: false,
        children: nestedStructureRootNodes,
      };
      expect(buildTreeStructure(hierarchicalNodes)).toStrictEqual([
        nestedTreeStructure,
      ]);
    });
    it("should build a proper deeply nested structure", () => {
      const deepNestedStructureRootNodes = [
        {
          id: "level_0",
          name: "Root",
          data: deeplyNestedNodes[0],
          pointer_id: "ptr_l0",
          droppable: true,
          draggable: true,
          children: [
            {
              id: "level_1",
              name: "Level 1",
              data: deeplyNestedNodes[1],
              pointer_id: "ptr_l1",
              droppable: true,
              draggable: true,
              children: [
                {
                  id: "level_2",
                  name: "Level 2",
                  data: deeplyNestedNodes[2],
                  pointer_id: "ptr_l2",
                  droppable: true,
                  draggable: true,
                  children: [
                    {
                      id: "level_3_file",
                      name: "Deep File.md",
                      data: deeplyNestedNodes[3],
                      pointer_id: "ptr_l3",
                      draggable: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const deeplyNestedTreeStructure = {
        id: "virtual-root",
        pointer_id: "virtual-root",
        name: "Root",
        droppable: true,
        draggable: false,
        children: deepNestedStructureRootNodes,
      };
      expect(buildTreeStructure(deeplyNestedNodes)).toStrictEqual([
        deeplyNestedTreeStructure,
      ]);
    });
    it("should handle collaborative and non-collaborative notes fine", () => {
      const mixedTreeStructureRootNodes = [
        {
          id: "collab_folder",
          name: "Team Folder",
          data: collaborativeNodes[0],
          pointer_id: "ptr_collab",
          droppable: true,
          draggable: true,
          children: [
            {
              id: "collab_file",
              name: "Shared Document.md",
              data: collaborativeNodes[1],
              pointer_id: "ptr_collab_file",
              draggable: true,
            },
          ],
        },
        {
          id: "private_file",
          name: "My Private Notes.md",
          data: collaborativeNodes[2],
          pointer_id: "ptr_private",
          draggable: true,
        },
      ];
      const mixedTreeStructure = {
        id: "virtual-root",
        pointer_id: "virtual-root",
        name: "Root",
        droppable: true,
        draggable: false,
        children: mixedTreeStructureRootNodes,
      };
      expect(buildTreeStructure(collaborativeNodes)).toStrictEqual([
        mixedTreeStructure,
      ]);
    });
  });
});
