import { Node } from "@/types/note";

export const simpleFlatNodes: Node[] = [
  {
    _id: "node_1",
    pointer_id: "ptr_1",
    tenantId: "user_123",
    name: "Documents",
    type: "folder",
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
    collaborative: false,
    isExpanded: true,
  },
  {
    _id: "node_2",
    pointer_id: "ptr_2",
    tenantId: "user_123",
    name: "Meeting Notes.md",
    type: "file",
    createdAt: "2024-01-02T14:30:00Z",
    updatedAt: "2024-01-02T14:30:00Z",
    lastAccessed: "2024-01-10T09:15:00Z",
    lastEdited: "2024-01-02T14:30:00Z",
    collaborative: false,
    content: {
      text: "Meeting with team about Q1 goals",
      tiptap:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Meeting with team about Q1 goals"}]}]}',
    },
  },
  {
    _id: "node_3",
    pointer_id: "ptr_3",
    tenantId: "user_123",
    name: "Projects",
    type: "folder",
    createdAt: "2024-01-03T11:00:00Z",
    updatedAt: "2024-01-03T11:00:00Z",
    collaborative: true,
    isExpanded: false,
  },
];

// Sample 2: Hierarchical structure with parent-child relationships
export const hierarchicalNodes: Node[] = [
  // Root folder
  {
    _id: "folder_root",
    pointer_id: "ptr_root",
    tenantId: "user_456",
    name: "My Workspace",
    type: "folder",
    createdAt: "2024-01-01T08:00:00Z",
    updatedAt: "2024-01-15T16:00:00Z",
    collaborative: false,
    isExpanded: true,
  },
  // Subfolder 1
  {
    _id: "folder_projects",
    pointer_id: "ptr_projects",
    tenantId: "user_456",
    name: "Projects",
    type: "folder",
    parent_id: "folder_root",
    createdAt: "2024-01-02T09:00:00Z",
    updatedAt: "2024-01-10T12:00:00Z",
    collaborative: true,
    isExpanded: true,
  },
  // File in subfolder 1
  {
    _id: "file_project_plan",
    pointer_id: "ptr_plan",
    tenantId: "user_456",
    name: "Project Plan.md",
    type: "file",
    parent_id: "folder_projects",
    createdAt: "2024-01-03T10:00:00Z",
    updatedAt: "2024-01-05T14:00:00Z",
    lastAccessed: "2024-01-15T11:30:00Z",
    lastEdited: "2024-01-05T14:00:00Z",
    collaborative: true,
    content: {
      text: "Project timeline and milestones",
      tiptap:
        '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Project Plan"}]},{"type":"paragraph","content":[{"type":"text","text":"Project timeline and milestones"}]}]}',
    },
  },
  // Subfolder 2
  {
    _id: "folder_personal",
    pointer_id: "ptr_personal",
    tenantId: "user_456",
    name: "Personal",
    type: "folder",
    parent_id: "folder_root",
    createdAt: "2024-01-02T09:30:00Z",
    updatedAt: "2024-01-08T10:00:00Z",
    collaborative: false,
    isExpanded: false,
  },
  // File in subfolder 2
  {
    _id: "file_todo",
    pointer_id: "ptr_todo",
    tenantId: "user_456",
    name: "TODO.md",
    type: "file",
    parent_id: "folder_personal",
    createdAt: "2024-01-04T11:00:00Z",
    updatedAt: "2024-01-14T15:30:00Z",
    lastAccessed: "2024-01-14T15:30:00Z",
    lastEdited: "2024-01-14T15:30:00Z",
    collaborative: false,
    content: {
      text: "- Buy groceries\n- Call dentist\n- Review PRs",
      tiptap:
        '{"type":"doc","content":[{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Buy groceries"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Call dentist"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Review PRs"}]}]}]}]}',
    },
  },
];

// Sample 3: Deep nesting structure
export const deeplyNestedNodes: Node[] = [
  {
    _id: "level_0",
    pointer_id: "ptr_l0",
    tenantId: "user_deep",
    name: "Root",
    type: "folder",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    collaborative: false,
    isExpanded: true,
  },
  {
    _id: "level_1",
    pointer_id: "ptr_l1",
    tenantId: "user_deep",
    name: "Level 1",
    type: "folder",
    parent_id: "level_0",
    createdAt: "2024-01-01T01:00:00Z",
    updatedAt: "2024-01-01T01:00:00Z",
    collaborative: false,
    isExpanded: true,
  },
  {
    _id: "level_2",
    pointer_id: "ptr_l2",
    tenantId: "user_deep",
    name: "Level 2",
    type: "folder",
    parent_id: "level_1",
    createdAt: "2024-01-01T02:00:00Z",
    updatedAt: "2024-01-01T02:00:00Z",
    collaborative: false,
    isExpanded: true,
  },
  {
    _id: "level_3_file",
    pointer_id: "ptr_l3",
    tenantId: "user_deep",
    name: "Deep File.md",
    type: "file",
    parent_id: "level_2",
    createdAt: "2024-01-01T03:00:00Z",
    updatedAt: "2024-01-01T03:00:00Z",
    collaborative: false,
    content: {
      text: "This file is nested 3 levels deep",
      tiptap:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This file is nested 3 levels deep"}]}]}',
    },
  },
];

// Sample 4: Collaborative vs non-collaborative mixed
export const collaborativeNodes: Node[] = [
  {
    _id: "collab_folder",
    pointer_id: "ptr_collab",
    tenantId: "team_001",
    name: "Team Folder",
    type: "folder",
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-20T16:00:00Z",
    collaborative: true,
    isExpanded: true,
  },
  {
    _id: "collab_file",
    pointer_id: "ptr_collab_file",
    tenantId: "team_001",
    name: "Shared Document.md",
    type: "file",
    parent_id: "collab_folder",
    createdAt: "2024-01-05T10:30:00Z",
    updatedAt: "2024-01-20T15:45:00Z",
    lastAccessed: "2024-01-20T16:00:00Z",
    lastEdited: "2024-01-20T15:45:00Z",
    collaborative: true,
    content: {
      text: "Team brainstorming session notes",
      tiptap:
        '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Brainstorming"}]},{"type":"paragraph","content":[{"type":"text","text":"Team brainstorming session notes"}]}]}',
    },
  },
  {
    _id: "private_file",
    pointer_id: "ptr_private",
    tenantId: "team_001",
    name: "My Private Notes.md",
    type: "file",
    createdAt: "2024-01-06T11:00:00Z",
    updatedAt: "2024-01-18T13:30:00Z",
    lastAccessed: "2024-01-19T09:00:00Z",
    lastEdited: "2024-01-18T13:30:00Z",
    collaborative: false,
    content: {
      text: "Personal thoughts and ideas",
      tiptap:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Personal thoughts and ideas"}]}]}',
    },
  },
];
