import { create } from "zustand";
import type { Node, TreeNode } from "@/types/note";
import { usePreferencesStore } from "./preferences-store";
import { useMemo } from "react";
import { isFolder } from "@/types/note";

interface NotesStore {
  // Core note collections
  userNotes: Node[];
  sharedNotes: Node[];
  treeStructure: TreeNode[];

  // UI state
  openUserNotes: Node[];
  currentNote: Node | null;
  isLoading: boolean;

  // Unsaved changes tracking
  unsavedNotes: Map<string, Node>; // Key: stringified _id, Value: modified note
  newUnsavedNotes: Node[]; // New notes that haven't been saved to DB yet
  dbSavedNotes: Map<string, Node>; // keeping track of how notes are currently saved in db

  // Content caching for performance
  noteContentCache: Map<string, string>; // Key: noteId, Value: cached content JSON
  contentFetchPromises: Map<string, Promise<string>>; // Key: noteId, Value: fetch promise

  // Basic state setters
  setUserNotes: (notes: Node[]) => void;
  setSharedNotes: (notes: Node[]) => void;
  setOpenUserNotes: (notes: Node[]) => void;
  setTreeStructure: (structure: Node[]) => void;
  setCurrentNote: (note: Node | null) => void;
  unsetCurrentNote: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setDBSavedNotes: (notes: Node[]) => void;
  saveDBSavedNote: (note: Node) => void; // update store with note as stored in database

  // Note UI management
  addOpenUserNote: (note: Node) => void;
  closeUserNote: (noteId: string) => void;
  addUserNote: (note: Node) => void;
  findNoteById: (noteId: string) => Node | undefined;

  // Unsaved changes management (pure state operations)
  markNoteAsUnsaved: (note: Node) => void;
  hasUnsavedChanges: () => boolean;
  getUnsavedChanges: () => Node[];
  discardAllChanges: () => void;
  discardChanges: (noteId: string) => void;
  clearUnsavedNote: (noteId: string) => void;
  addNewUnsavedNote: (note: Node) => void;
  removeUnsavedNote: (noteId: string) => void;
  removeNewUnsavedNote: (noteId: string) => void;
  saveAllUnsavedNotes: () => Promise<boolean>;

  // State synchronization helpers
  updateNoteInCollections: (note: Node) => void;
  removeNoteFromCollections: (noteId: string) => void;
  updateUserNote: (note: Node) => void;
  updateNote: (noteId: string, updates: Partial<Node>) => void;

  // Content cache management
  getCachedContent: (noteId: string) => string | undefined;
  setCachedContent: (noteId: string, content: string) => void;
  invalidateContentCache: (noteId: string) => void;
  fetchAndCacheContent: (
    noteId: string,
    fetcher: (noteId: string) => Promise<string>,
  ) => Promise<string>;

  // Folder operations
  addFolderToStore: (folder: Node) => void;
  removeFolderFromStore: (folderId: string) => void;
  handleDragEnd: (
    active: { id: string },
    over: { id: string } | null,
    context?: {
      dropTarget: "folder" | "between";
      dropPosition: "child" | "sibling";
    },
  ) => void;
  moveNodeInTree: (nodeId: string, newParentId?: string) => void;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  // Core note collections
  userNotes: [],
  sharedNotes: [],
  treeStructure: [],

  // UI state
  openUserNotes: [],
  currentNote: null,
  isLoading: false,

  // Unsaved changes tracking
  unsavedNotes: new Map([]),
  newUnsavedNotes: [],
  dbSavedNotes: new Map([]),

  // Content caching for performance
  noteContentCache: new Map([]),
  contentFetchPromises: new Map([]),

  // Basic state setters
  setUserNotes: (notes: Node[]) => {
    set({ userNotes: notes });

    // Check if we should restore the current note from preferences
    const currentNoteId = usePreferencesStore.getState().currentNoteId;
    if (currentNoteId && !get().currentNote) {
      const noteToRestore = notes.find(
        (n) => n.pointer_id.toString() === currentNoteId,
      );
      if (noteToRestore) {
        set({ currentNote: noteToRestore });
      }
    }
  },
  setSharedNotes: (notes: Node[]) => set({ sharedNotes: notes }),
  setOpenUserNotes: (notes: Node[]) => set({ openUserNotes: notes }),
  setTreeStructure: (structure: Node[]) => set({ treeStructure: structure }),
  setCurrentNote: (note: Node | null) => {
    set({ currentNote: note });
    // Persist current note ID to preferences
    usePreferencesStore
      .getState()
      .setCurrentNoteId(note?.pointer_id.toString() ?? null);
  },
  unsetCurrentNote: () => {
    set({ currentNote: null });
    // Clear persisted note ID
    usePreferencesStore.getState().setCurrentNoteId(null);
  },
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setDBSavedNotes: (notes: Node[]) => {
    const dbSavedNotes = new Map<string, Node>([]);
    notes.forEach((note) =>
      dbSavedNotes.set(note.pointer_id, JSON.parse(JSON.stringify(note))),
    );
    set({ dbSavedNotes });
  },
  saveDBSavedNote: (note: Node) => {
    const dbSavedNotes = get().dbSavedNotes;
    dbSavedNotes.set(note.pointer_id, JSON.parse(JSON.stringify(note)));
    set({ dbSavedNotes });
  },
  // Note UI management
  addOpenUserNote: (note: Node) => {
    const state = get();
    if (
      !state.openUserNotes.some(
        (n) => n.pointer_id.toString() === note.pointer_id.toString(),
      )
    ) {
      set({
        openUserNotes: [...state.openUserNotes, note],
        currentNote: note,
      });
    } else {
      // Just focus the note if already open
      set({
        currentNote: note,
      });
    }
  },

  closeUserNote: (noteId: string) => {
    const state = get();

    // Check if note has unsaved changes
    const isUnsaved =
      state.unsavedNotes.has(noteId) ||
      state.newUnsavedNotes.some((n) => n.pointer_id.toString() === noteId);

    if (isUnsaved) {
      console.warn("Closing a note with unsaved changes!");
    }

    // Remove from open notes
    const openUserNotes = state.openUserNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Set new current note (if any)
    const currentNote =
      openUserNotes.length > 0 ? openUserNotes[openUserNotes.length - 1] : null;

    set({ openUserNotes, currentNote });
  },

  addUserNote: (note: Node) => {
    const state = get();
    if (
      !state.userNotes.some(
        (n) => n.pointer_id.toString() === note.pointer_id.toString(),
      )
    ) {
      set({
        userNotes: [...state.userNotes, note],
        currentNote: note,
      });
    } else {
      set({
        currentNote: note,
      });
    }
  },
  findNoteById: (noteId: string) => {
    const state = get();
    return state.userNotes.find(
      (note) => note.pointer_id?.toString() === noteId,
    );
  },

  // Unsaved changes management
  markNoteAsUnsaved: (note: Node) => {
    const state = get();
    const unsavedNotes = new Map(state.unsavedNotes);
    unsavedNotes.set(note.pointer_id.toString(), note);
    set({ unsavedNotes });

    // Also update in the open notes list
    const openUserNotes = [...state.openUserNotes];
    const index = openUserNotes.findIndex(
      (n) => n.pointer_id.toString() === note.pointer_id.toString(),
    );

    let currentNote = state.currentNote;

    if (index !== -1) {
      openUserNotes[index] = note;
    }

    // Also update currentNote if it's the same note
    if (
      currentNote &&
      currentNote.pointer_id.toString() === note.pointer_id.toString()
    ) {
      currentNote = note;
    }

    set({ unsavedNotes, openUserNotes, currentNote });
  },

  hasUnsavedChanges: () => {
    const state = get();
    return state.unsavedNotes.size > 0 || state.newUnsavedNotes.length > 0;
  },

  getUnsavedChanges: () => {
    const state = get();
    return [
      ...Array.from(state.unsavedNotes.values()),
      ...state.newUnsavedNotes,
    ];
  },

  discardAllChanges: () => {
    const state = get();

    // Replace open notes with their original versions
    const openUserNotes = state.openUserNotes.map((note) => {
      if (state.unsavedNotes.has(note.pointer_id.toString())) {
        // Find original note
        return (
          state.userNotes.find(
            (n) => n.pointer_id.toString() === note.pointer_id.toString(),
          ) || note
        );
      }
      return note;
    });

    // Update current note if needed
    let currentNote = state.currentNote;
    if (
      currentNote &&
      state.unsavedNotes.has(currentNote.pointer_id.toString())
    ) {
      // If current note was unsaved
      currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
    }

    set({
      unsavedNotes: new Map(),
      newUnsavedNotes: [],
      openUserNotes,
      currentNote,
    });
  },

  discardChanges: (noteId: string) => {
    const state = get();
    const unsavedNotes = new Map(state.unsavedNotes);

    // Check if it's a new note or an existing one with unsaved changes
    const isNewNote = state.newUnsavedNotes.some(
      (n) => n.pointer_id.toString() === noteId,
    );

    if (isNewNote) {
      // Remove from new notes
      const newUnsavedNotes = state.newUnsavedNotes.filter(
        (n) => n.pointer_id.toString() !== noteId,
      );

      // Remove from open notes
      const openUserNotes = state.openUserNotes.filter(
        (n) => n.pointer_id.toString() !== noteId,
      );

      // Update current note if needed
      let currentNote = state.currentNote;
      if (currentNote && currentNote.pointer_id.toString() === noteId) {
        currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
      }

      set({
        newUnsavedNotes,
        openUserNotes,
        currentNote,
      });
    } else {
      // Remove from unsaved notes Map
      unsavedNotes.delete(noteId);

      // Replace with original in open notes
      const openUserNotes = [...state.openUserNotes];
      const index = openUserNotes.findIndex(
        (n) => n.pointer_id.toString() === noteId,
      );

      if (index !== -1) {
        // Find original note
        const originalNote = state.userNotes.find(
          (n) => n.pointer_id.toString() === noteId,
        );

        if (originalNote) {
          openUserNotes[index] = originalNote;
        }
      }

      // Update current note if needed
      let currentNote = state.currentNote;
      if (currentNote && currentNote.pointer_id.toString() === noteId) {
        currentNote =
          openUserNotes.find((n) => n.pointer_id.toString() === noteId) || null;
      }

      set({
        unsavedNotes,
        openUserNotes,
        currentNote,
      });
    }
  },

  clearUnsavedNote: (noteId: string) => {
    const state = get();
    const unsavedNotes = new Map(state.unsavedNotes);
    unsavedNotes.delete(noteId);
    set({ unsavedNotes });
  },

  addNewUnsavedNote: (note: Node) => {
    const state = get();
    const newUnsavedNotes = [...state.newUnsavedNotes, note];
    set({ newUnsavedNotes });
  },

  removeUnsavedNote: (noteId: string) => {
    const state = get();
    const unsavedNotes = state.unsavedNotes;
    unsavedNotes.delete(noteId);
    set({ unsavedNotes: unsavedNotes });
  },

  removeNewUnsavedNote: (noteId: string) => {
    const state = get();
    const newUnsavedNotes = state.newUnsavedNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );
    set({ newUnsavedNotes });
  },

  // State synchronization helpers
  updateNoteInCollections: (note: Node) => {
    const state = get();

    // Update in userNotes
    const userNotes = state.userNotes.map((n) =>
      n.pointer_id.toString() === note.pointer_id.toString() ? note : n,
    );

    // Update in open notes
    const openUserNotes = state.openUserNotes.map((n) =>
      n.pointer_id.toString() === note.pointer_id.toString() ? note : n,
    );

    // Update current note if needed
    let currentNote = state.currentNote;
    if (
      currentNote &&
      currentNote.pointer_id.toString() === note.pointer_id.toString()
    ) {
      currentNote = note;
    }

    // Update tree structure if needed
    const treeStructure = state.treeStructure.map((n) =>
      n.pointer_id.toString() === note.pointer_id.toString() ? note : n,
    );

    set({
      userNotes,
      openUserNotes,
      currentNote,
      treeStructure,
    });
  },

  updateUserNote: (note: Node) => {
    const state = get();

    // Update in userNotes
    const userNotes = state.userNotes.map((n) =>
      n.pointer_id.toString() === note.pointer_id.toString() ? note : n,
    );

    set({ userNotes });
  },

  updateNote: (noteId: string, updates: Partial<Node>) => {
    const state = get();

    // Helper function to update a note object with partial updates
    const updateNoteObject = (note: Node | null): Node | null => {
      if (!note) return null;

      // Check if this is the note we want to update (by pointer_id or _id)
      const isTargetNote =
        note.pointer_id.toString() === noteId || note._id === noteId;

      if (!isTargetNote) return note;

      // Apply partial updates, preserving existing properties
      return { ...note, ...updates };
    };

    // Update in userNotes
    const userNotes = state.userNotes
      .map(updateNoteObject)
      .filter((n): n is Node => n !== null);

    // Update in openUserNotes
    const openUserNotes = state.openUserNotes
      .map(updateNoteObject)
      .filter((n): n is Node => n !== null);

    // Update currentNote if it matches
    const currentNote = updateNoteObject(state.currentNote);

    // Update in treeStructure
    const treeStructure = state.treeStructure
      .map(updateNoteObject)
      .filter((n): n is Node => n !== null);

    // Update in unsavedNotes if present
    const unsavedNotes = new Map<string, Node>();
    state.unsavedNotes.forEach((note, key) => {
      const updatedNote = updateNoteObject(note);
      if (updatedNote) {
        unsavedNotes.set(key, updatedNote);
      }
    });

    // Update in newUnsavedNotes
    const newUnsavedNotes = state.newUnsavedNotes
      .map(updateNoteObject)
      .filter(Boolean) as Node[];

    set({
      userNotes,
      openUserNotes,
      currentNote,
      treeStructure,
      unsavedNotes,
      newUnsavedNotes,
    });
  },

  removeNoteFromCollections: (noteId: string) => {
    const state = get();

    // Remove from userNotes
    const userNotes = state.userNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Remove from open notes
    const openUserNotes = state.openUserNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Remove from tree structure
    const treeStructure = state.treeStructure.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Remove from unsaved changes if present
    const unsavedNotes = new Map(state.unsavedNotes);
    unsavedNotes.delete(noteId);

    const newUnsavedNotes = state.newUnsavedNotes.filter(
      (n) => n.pointer_id.toString() !== noteId,
    );

    // Update current note if needed
    let currentNote = state.currentNote;
    if (currentNote && currentNote.pointer_id.toString() === noteId) {
      currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
    }

    set({
      userNotes,
      openUserNotes,
      treeStructure,
      unsavedNotes,
      newUnsavedNotes,
      currentNote,
    });
  },
  saveAllUnsavedNotes: async () => {
    const state = get();
    const unsavedChanges = [
      ...Array.from(state.unsavedNotes.values()),
      ...state.newUnsavedNotes,
    ];

    if (unsavedChanges.length === 0) return true;

    try {
      const updatedUserNotes = [...state.userNotes];
      const updatedOpenUserNotes = [...state.openUserNotes];
      const updatedTreeStructure = [...state.treeStructure];
      let updatedCurrentNote = state.currentNote;

      for (const note of unsavedChanges) {
        const noteId = note.pointer_id.toString();

        // Update or add to userNotes
        const userNoteIndex = updatedUserNotes.findIndex(
          (n) => n.pointer_id.toString() === noteId,
        );
        if (userNoteIndex !== -1) {
          updatedUserNotes[userNoteIndex] = note;
        } else {
          updatedUserNotes.push(note); // Add new notes to userNotes
        }

        // Update open notes
        const openNoteIndex = updatedOpenUserNotes.findIndex(
          (n) => n.pointer_id.toString() === noteId,
        );
        if (openNoteIndex !== -1) {
          updatedOpenUserNotes[openNoteIndex] = note;
        }

        // Update current note if it's the one being saved
        if (
          updatedCurrentNote &&
          updatedCurrentNote.pointer_id.toString() === noteId
        ) {
          updatedCurrentNote = note;
        }

        // Update or add to tree structure
        const treeNoteIndex = updatedTreeStructure.findIndex(
          (n) => n.pointer_id.toString() === noteId,
        );
        if (treeNoteIndex !== -1) {
          updatedTreeStructure[treeNoteIndex] = note;
        } else {
          updatedTreeStructure.push(note); // Add new notes to treeStructure
        }
      }

      // Perform a single, batched state update
      set({
        userNotes: updatedUserNotes,
        openUserNotes: updatedOpenUserNotes,
        treeStructure: updatedTreeStructure,
        currentNote: updatedCurrentNote,
        unsavedNotes: new Map(),
        newUnsavedNotes: [],
      });
      return true;
    } catch (error) {
      console.error("Error saving all notes:", error);
      return false;
    }
  },

  // Content cache management
  getCachedContent: (noteId: string) => {
    const state = get();
    return state.noteContentCache.get(noteId);
  },

  setCachedContent: (noteId: string, content: string) => {
    const state = get();
    const noteContentCache = new Map(state.noteContentCache);
    noteContentCache.set(noteId, content);
    set({ noteContentCache });
  },

  invalidateContentCache: (noteId: string) => {
    const state = get();
    const noteContentCache = new Map(state.noteContentCache);
    const contentFetchPromises = new Map(state.contentFetchPromises);
    noteContentCache.delete(noteId);
    contentFetchPromises.delete(noteId);
    set({ noteContentCache, contentFetchPromises });
  },

  fetchAndCacheContent: async (
    noteId: string,
    fetcher: (noteId: string) => Promise<string>,
  ) => {
    const state = get();

    // Return cached content if available
    const cached = state.noteContentCache.get(noteId);
    if (cached) {
      return cached;
    }

    // Return existing promise if fetch is in progress
    const existingPromise = state.contentFetchPromises.get(noteId);
    if (existingPromise) {
      return existingPromise;
    }

    // Create new fetch promise
    const fetchPromise = fetcher(noteId)
      .then((content) => {
        // Cache the result
        const currentState = get();
        const noteContentCache = new Map(currentState.noteContentCache);
        const contentFetchPromises = new Map(currentState.contentFetchPromises);

        noteContentCache.set(noteId, content);
        contentFetchPromises.delete(noteId);

        set({ noteContentCache, contentFetchPromises });
        return content;
      })
      .catch((error) => {
        // Clean up on error
        const currentState = get();
        const contentFetchPromises = new Map(currentState.contentFetchPromises);
        contentFetchPromises.delete(noteId);
        set({ contentFetchPromises });
        throw error;
      });

    // Store the promise
    const contentFetchPromises = new Map(state.contentFetchPromises);
    contentFetchPromises.set(noteId, fetchPromise);
    set({ contentFetchPromises });

    return fetchPromise;
  },

  // Folder operations
  addFolderToStore: (folder: Node) => {
    const state = get();

    // Add to userNotes
    const userNotes = [...state.userNotes];
    if (
      !userNotes.some(
        (n) => n.pointer_id.toString() === folder.pointer_id.toString(),
      )
    ) {
      userNotes.push(folder);
    }

    // Add to tree structure
    const treeStructure = [...state.treeStructure];
    const treeNode: TreeNode = {
      ...folder,
      type: folder.type,
      children: isFolder(folder) ? [] : undefined,
    };
    if (
      !treeStructure.some(
        (n) => n.pointer_id.toString() === folder.pointer_id.toString(),
      )
    ) {
      treeStructure.push(treeNode);
    }

    set({ userNotes, treeStructure });
  },

  removeFolderFromStore: (folderId: string) => {
    const state = get();

    // Remove from all collections recursively
    const removeFromCollections = (
      items: (Node | TreeNode)[],
    ): (Node | TreeNode)[] => {
      return items
        .filter((item) => item.pointer_id.toString() !== folderId)
        .map((item) => {
          if ("children" in item && item.children) {
            return {
              ...item,
              children: removeFromCollections(item.children),
            };
          }
          return item;
        });
    };

    const userNotes = removeFromCollections(state.userNotes);
    const treeStructure = removeFromCollections(
      state.treeStructure,
    ) as TreeNode[];
    const openUserNotes = state.openUserNotes.filter(
      (n) => n.pointer_id.toString() !== folderId,
    );

    // Update current note if needed
    let currentNote = state.currentNote;
    if (currentNote && currentNote.pointer_id.toString() === folderId) {
      currentNote = openUserNotes.length > 0 ? openUserNotes[0] : null;
    }

    // Remove from unsaved changes
    const unsavedNotes = new Map(state.unsavedNotes);
    unsavedNotes.delete(folderId);

    const newUnsavedNotes = state.newUnsavedNotes.filter(
      (n) => n.pointer_id.toString() !== folderId,
    );

    set({
      userNotes: userNotes as Node[],
      treeStructure,
      openUserNotes,
      currentNote,
      unsavedNotes,
      newUnsavedNotes,
    });
  },

  handleDragEnd: (
    active: { id: string },
    over: { id: string } | null,
    context?: {
      dropTarget: "folder" | "between";
      dropPosition: "child" | "sibling";
    },
  ) => {
    const state = get();

    if (!over || active.id === over.id) return;

    const activeId = active.id;
    const overId = over.id;

    // Helper function to recursively find and move nodes
    const moveNodeInTree = (
      items: TreeNode[],
      activeId: string,
      overId: string,
      context?: {
        dropTarget: "folder" | "between";
        dropPosition: "child" | "sibling";
      },
    ): TreeNode[] => {
      let movedNode: TreeNode | null = null;

      // First, extract the node to be moved
      const extractNode = (items: TreeNode[]): TreeNode[] => {
        return items.filter((item) => {
          if (item.pointer_id === activeId) {
            movedNode = item;
            return false;
          }
          if (item.children) {
            item.children = extractNode(item.children);
          }
          return true;
        });
      };

      const itemsWithoutMoved = extractNode(items);

      if (!movedNode) return items;

      // Now insert the node at the new position
      const insertNode = (items: TreeNode[]): TreeNode[] => {
        const result: TreeNode[] = [];

        for (const item of items) {
          if (item.pointer_id === overId) {
            if (context?.dropTarget === "folder" && item.type === "folder") {
              // Insert as child of folder
              result.push({
                ...item,
                children: [
                  ...(item.children || []),
                  { ...movedNode, parent_id: overId } as TreeNode,
                ],
              });
            } else {
              // Insert as sibling
              const index = items.findIndex((i) => i.pointer_id === overId);
              const insertIndex =
                context?.dropPosition === "sibling" ? index + 1 : index;

              // Insert items before the insertion point
              for (let i = 0; i < insertIndex; i++) {
                // if (items[i].pointer_id !== overId) {
                // result.push(items[i]);
                result.push(items[i]);
              }

              // Insert the moved node
              result.push({
                ...movedNode,
                parent_id: item.parent_id,
              } as TreeNode);

              // Insert remaining items after the insertion point
              for (let i = insertIndex; i < items.length; i++) {
                result.push(items[i]);
              }

              return result;
            }
          } else {
            if (item.children) {
              result.push({
                ...item,
                children: insertNode(item.children),
              });
            } else {
              result.push(item);
            }
          }
        }

        return result;
      };

      return insertNode(itemsWithoutMoved);
    };

    // Update tree structure
    const newTreeStructure = moveNodeInTree(
      state.treeStructure,
      activeId,
      overId,
      context,
    );

    // Update userNotes flat list
    const flattenTree = (items: TreeNode[]): Node[] => {
      return items.reduce((acc: Node[], item) => {
        acc.push(item as Node);
        if (item.children) {
          acc.push(...flattenTree(item.children));
        }
        return acc;
      }, []);
    };

    const newUserNotes = flattenTree(newTreeStructure);

    set({
      treeStructure: newTreeStructure,
      userNotes: newUserNotes,
    });
  },

  moveNodeInTree: (nodeId: string, newParentId?: string) => {
    const state = get();

    // Find the node to move using _id
    const nodeToMove = state.userNotes.find(
      (n) => n._id === nodeId || n.pointer_id === nodeId,
    );
    if (!nodeToMove) {
      console.error(`Node with _id ${nodeId} not found`);
      return;
    }

    // Update the node's parent_id
    const updatedNode = { ...nodeToMove, parent_id: newParentId };

    // Update userNotes array - check both _id and pointer_id
    const updatedUserNotes = state.userNotes.map((n) =>
      n._id === nodeId || n.pointer_id === nodeId ? updatedNode : n,
    );

    // Update tree structure - check both _id and pointer_id
    const updatedTreeStructure = state.treeStructure.map((node) => {
      if (node._id === nodeId || node.pointer_id === nodeId) {
        return { ...node, parent_id: newParentId };
      }
      return node;
    });

    // Update open notes if the node is open - check both _id and pointer_id
    const updatedOpenNotes = state.openUserNotes.map((n) =>
      n._id === nodeId || n.pointer_id === nodeId ? updatedNode : n,
    );

    // Update current note if it's the one being moved - check both _id and pointer_id
    let updatedCurrentNote = state.currentNote;
    if (
      state.currentNote &&
      (state.currentNote._id === nodeId ||
        state.currentNote.pointer_id === nodeId)
    ) {
      updatedCurrentNote = updatedNode;
    }

    set({
      userNotes: updatedUserNotes,
      treeStructure: updatedTreeStructure,
      openUserNotes: updatedOpenNotes,
      currentNote: updatedCurrentNote,
    });
  },
}));

// Optimized selectors for performance
export const useRecentNotes = () => {
  const userNotes = useNotesStore((state) => state.userNotes);

  return useMemo(() => {
    return userNotes
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 5);
  }, [userNotes]);
};

export const useUnsavedNotesArray = () => {
  const unsavedNotes = useNotesStore((state) => state.unsavedNotes);

  return useMemo(() => {
    return Array.from(unsavedNotes.values());
  }, [unsavedNotes]);
};

export const useUnsavedNotesCount = () => {
  const unsavedNotes = useNotesStore((state) => state.unsavedNotes);

  return useMemo(() => {
    return unsavedNotes.size;
  }, [unsavedNotes]);
};

/**
 * Computed tree structure from userNotes
 * Builds hierarchical tree from flat notes array
 */
export const useTreeStructure = () => {
  const userNotes = useNotesStore((state) => state.userNotes);

  return useMemo(() => {
    // Create a map for quick lookup of nodes by ID
    const nodeMap = new Map<string, Node>();

    // Create a map for tracking folder children
    const folderChildrenMap = new Map<string, Node[]>();

    // Initialize maps
    userNotes.forEach((note) => {
      nodeMap.set(note._id || note.pointer_id, note);

      // Initialize children array for folders
      if (isFolder(note)) {
        folderChildrenMap.set(note._id || note.pointer_id, []);
      }
    });

    // Populate folder children relationships
    userNotes.forEach((note) => {
      if (note.parent_id) {
        const parentId = note.parent_id;
        const existingChildren = folderChildrenMap.get(parentId) || [];
        folderChildrenMap.set(parentId, [...existingChildren, note]);
      }
    });

    // Recursive function to convert Node to TreeNode
    const nodeToTreeNode = (node: Node): TreeNode => {
      const nodeId = node._id || node.pointer_id;
      const treeNode: TreeNode = {
        ...node,
        _id: node._id,
        pointer_id: node.pointer_id,
        tenantId: node.tenantId,
        name: node.name,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        lastAccessed: node.lastAccessed,
        lastEdited: node.lastEdited,
        collaborative: node.collaborative,
        type: node.type,
        parent_id: node.parent_id,
      };

      // Add file-specific properties
      if (node.type === "file" && "content" in node) {
        treeNode.content = node.content;
      }

      // Add folder-specific properties
      if (isFolder(node)) {
        treeNode.isExpanded = node.isExpanded;

        // Add children if this is a folder
        const children = folderChildrenMap.get(nodeId) || [];
        if (children.length > 0) {
          treeNode.children = children
            .sort((a, b) => {
              // Sort folders first, then files
              if (isFolder(a) && !isFolder(b)) return -1;
              if (!isFolder(a) && isFolder(b)) return 1;
              // Then sort by name
              return a.name.localeCompare(b.name);
            })
            .map((child) => nodeToTreeNode(child));
        }
      }

      return treeNode;
    };

    // Find root nodes (nodes without parent_id)
    const rootNodes = userNotes.filter((note) => !note.parent_id);

    // Build tree structure from root nodes
    return rootNodes
      .sort((a, b) => {
        // Sort folders first, then files
        if (isFolder(a) && !isFolder(b)) return -1;
        if (!isFolder(a) && isFolder(b)) return 1;
        // Then sort by name
        return a.name.localeCompare(b.name);
      })
      .map((rootNode) => nodeToTreeNode(rootNode));
  }, [userNotes]);
};
