import { vi } from "vitest";
import { Node } from "@/types/note";
import { buildTreeStructure } from "@/lib/tree-utils";
import {
  collaborativeNodes,
  deeplyNestedNodes,
  hierarchicalNodes,
  simpleFlatNodes,
} from "../helpers/tree-constants";

describe("tree utils tests", () => {
  describe("properly converts a node to a tree item", () => {
    it("should ");
  });
  describe("building correct tree structure", () => {
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
