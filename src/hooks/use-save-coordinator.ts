import { useCallback, useRef, useState, useEffect } from "react";
import { useNotesStore } from "@/lib/stores/notes-store";
import { useNoteEditor } from "@/hooks/use-note-editor";
import { Node, isFile } from "@/types/note";
import { ensureJSONString } from "@/lib/utils";
import {
  customErrorToast,
  customInfoToast
} from "@/components/ui/custom-toast";

interface SaveRequest {
  noteId: string;
  changes: {
    title?: string;
    content?: {
      tiptap?: string;
      text?: string;
    };
    lastEdited?: string;
  };
  timestamp: number;
  version: number;
  resolve: (success: boolean) => void;
  reject: (error: Error) => void;
}

interface SaveCoordinatorState {
  isProcessing: boolean;
  pendingRequests: SaveRequest[];
  currentRequestId: string | null;
}

/**
 * Centralized save coordinator that prevents race conditions
 * by ensuring only one save operation runs at a time per note.
 *
 * This solves the race condition between title changes (NoteViewHeader)
 * and content changes (TipTap editors) by:
 * 1. Queuing all save requests
 * 2. Processing them sequentially
 * 3. Merging concurrent requests for the same note
 * 4. Using latest state when executing saves
 */
export function useSaveCoordinator() {
  const { currentNote, markNoteAsUnsaved, removeUnsavedNote } = useNotesStore();
  const { saveNote } = useNoteEditor();

  // State for tracking save operations
  const [coordinatorState, setCoordinatorState] = useState<SaveCoordinatorState>({
    isProcessing: false,
    pendingRequests: [],
    currentRequestId: null,
  });

  // Refs to prevent stale closures
  const processingRef = useRef(false);
  const requestQueueRef = useRef<SaveRequest[]>([]);
  const noteSnapshotsRef = useRef<Map<string, Node>>(new Map());
  const noteVersionsRef = useRef<Map<string, number>>(new Map());
  const retryAttemptsRef = useRef<Map<string, number>>(new Map());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastSaveContentRef = useRef<Map<string, { title?: string; content?: string }>>(new Map());

  const AUTO_SAVE_DELAY = 2500; // 2.5 seconds
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000; // 1 second

  /**
   * Create a snapshot of the current note state to prevent stale data issues
   */
  const captureNoteSnapshot = useCallback((noteId: string): Node | null => {
    const store = useNotesStore.getState();
    const currentStoreNote = store.currentNote;

    if (currentStoreNote && currentStoreNote.pointer_id === noteId) {
      const snapshot = JSON.parse(JSON.stringify(currentStoreNote));
      noteSnapshotsRef.current.set(noteId, snapshot);
      return snapshot;
    }

    return noteSnapshotsRef.current.get(noteId) || null;
  }, []);

  /**
   * Merge multiple save requests for the same note into a single request
   */
  const mergeRequests = useCallback((requests: SaveRequest[]): SaveRequest[] => {
    const mergedMap = new Map<string, SaveRequest>();

    // Process requests in chronological order
    requests
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(request => {
        const existing = mergedMap.get(request.noteId);

        if (!existing || request.timestamp > existing.timestamp) {
          // Merge changes if there's an existing request
          if (existing) {
            request.changes = {
              ...existing.changes,
              ...request.changes,
              // Use the latest timestamp
              lastEdited: request.changes.lastEdited || existing.changes.lastEdited
            };
            // Keep the latest resolve/reject handlers
            request.resolve = existing.resolve;
            request.reject = existing.reject;
          }

          mergedMap.set(request.noteId, request);
        }
      });

    return Array.from(mergedMap.values());
  }, []);

  /**
   * Process a single save request with version tracking and conflict detection
   */
  const processSaveRequest = useCallback(async (request: SaveRequest): Promise<boolean> => {
    try {
      // Get the latest note state at execution time (not at request time)
      const latestSnapshot = captureNoteSnapshot(request.noteId);

      if (!latestSnapshot) {
        console.warn(`Note ${request.noteId} not found for saving`);
        request.resolve(false);
        return false;
      }

      // Check for version conflicts
      const currentVersion = noteVersionsRef.current.get(request.noteId) || 0;
      if (request.version < currentVersion) {
        console.warn(`Save request version ${request.version} is outdated for note ${request.noteId}, current version: ${currentVersion}`);
        customInfoToast("Note was updated by another save, changes were merged");
        request.resolve(true); // Resolve as true to avoid blocking, but don't overwrite
        return true;
      }

      // Apply the changes to the latest snapshot
      const updatedNote = { ...latestSnapshot };

      if (request.changes.title !== undefined) {
        updatedNote.name = request.changes.title;
      }

      if (request.changes.content && isFile(updatedNote)) {
        if (!updatedNote.content) {
          updatedNote.content = {};
        }

        if (request.changes.content.tiptap !== undefined) {
          updatedNote.content.tiptap = ensureJSONString(request.changes.content.tiptap);
        }

        if (request.changes.content.text !== undefined) {
          updatedNote.content.text = request.changes.content.text;
        }
      }

      if (request.changes.lastEdited) {
        updatedNote.updatedAt = request.changes.lastEdited;
      }

      // Add metadata for tracking
      (updatedNote as Node & { _version?: number; _saveTimestamp?: string })._version = request.version;
      (updatedNote as Node & { _version?: number; _saveTimestamp?: string })._saveTimestamp = new Date().toISOString();

      // Perform the atomic save operation
      const success = await saveNote(updatedNote);

      if (success) {
        // Update the stored snapshot with the saved version
        noteSnapshotsRef.current.set(request.noteId, updatedNote);
        removeUnsavedNote(request.noteId);
        request.resolve(true);
      } else {
        throw new Error("Save operation returned false");
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown save error';
      console.error(`Save failed for note ${request.noteId}:`, error);

      // Only show error toast for real errors, not for version conflicts
      if (request.version >= (noteVersionsRef.current.get(request.noteId) || 0)) {
        customErrorToast(`Failed to save note: ${errorMessage}`);
      }

      request.reject(error instanceof Error ? error : new Error('Unknown save error'));
      return false;
    }
  }, [captureNoteSnapshot, saveNote, removeUnsavedNote]);

  /**
   * Process the request queue sequentially with retry logic
   */
  const processQueue = useCallback(async () => {
    if (processingRef.current || requestQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    setCoordinatorState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Merge concurrent requests for efficiency
      const mergedRequests = mergeRequests(requestQueueRef.current);
      requestQueueRef.current = [];

      for (const request of mergedRequests) {
        const requestId = `${request.noteId}-${request.timestamp}`;
        setCoordinatorState(prev => ({ ...prev, currentRequestId: requestId }));

        let success = false;
        let attempts = 0;
        const maxAttempts = MAX_RETRY_ATTEMPTS;

        while (!success && attempts < maxAttempts) {
          try {
            success = await processSaveRequest(request);
            if (success) {
              // Reset retry attempts on successful save
              retryAttemptsRef.current.delete(request.noteId);
            }
          } catch (error) {
            attempts++;
            const currentAttempts = retryAttemptsRef.current.get(request.noteId) || 0;
            retryAttemptsRef.current.set(request.noteId, currentAttempts + 1);

            console.error(`Save attempt ${attempts} failed for note ${request.noteId}:`, error);

            if (attempts < maxAttempts) {
              // Wait before retry with exponential backoff
              const delay = RETRY_DELAY * Math.pow(2, attempts - 1);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        if (!success) {
          // Max retries reached, show error toast
          customErrorToast(`Failed to save note after ${maxAttempts} attempts. Please check your connection.`);
          console.error(`Max retry attempts reached for note ${request.noteId}`);
        }

        // Small delay between saves to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      processingRef.current = false;
      setCoordinatorState(prev => ({
        ...prev,
        isProcessing: false,
        currentRequestId: null
      }));
    }
  }, [mergeRequests, processSaveRequest]);

  /**
   * Check if content has actually changed to prevent unnecessary saves
   */
  const hasContentChanged = useCallback((noteId: string, changes: SaveRequest['changes']): boolean => {
    const lastContent = lastSaveContentRef.current.get(noteId);

    if (!lastContent) return true;

    if (changes.title !== undefined && changes.title !== lastContent.title) return true;

    if (changes.content) {
      const currentContent = changes.content.text || '';
      if (currentContent !== lastContent.content) return true;
    }

    return false;
  }, []);

  /**
   * Queue a save operation with proper debouncing and change detection
   */
  const queueSave = useCallback((
    noteId: string,
    changes: SaveRequest['changes'],
    debounce: boolean = true
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      // Check if content actually changed
      if (!hasContentChanged(noteId, changes)) {
        resolve(true);
        return;
      }

      const timestamp = Date.now();

      // Clear existing debounce timer for this note
      const existingTimer = debounceTimersRef.current.get(noteId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Increment version for this note
      const currentVersion = noteVersionsRef.current.get(noteId) || 0;
      const newVersion = currentVersion + 1;
      noteVersionsRef.current.set(noteId, newVersion);

      const request: SaveRequest = {
        noteId,
        changes: {
          ...changes,
          lastEdited: changes.lastEdited || new Date().toISOString()
        },
        timestamp,
        version: newVersion,
        resolve,
        reject,
      };

      // Update last saved content to track changes
      const newContent = {
        title: changes.title,
        content: changes.content?.text || ''
      };
      lastSaveContentRef.current.set(noteId, newContent);

      // Add or update request in queue (replace existing for same note)
      const existingIndex = requestQueueRef.current.findIndex(req => req.noteId === noteId);
      if (existingIndex >= 0) {
        // Merge with existing request
        const existingRequest = requestQueueRef.current[existingIndex];
        request.changes = {
          ...existingRequest.changes,
          ...request.changes
        };
        request.resolve = existingRequest.resolve;
        request.reject = existingRequest.reject;
        requestQueueRef.current[existingIndex] = request;
      } else {
        requestQueueRef.current.push(request);
      }

      // Update pending requests in state for UI feedback
      setCoordinatorState(prev => ({
        ...prev,
        pendingRequests: [...requestQueueRef.current]
      }));

      // Start processing after debounce delay
      if (debounce) {
        const timer = setTimeout(() => {
          debounceTimersRef.current.delete(noteId);
          processQueue();
        }, AUTO_SAVE_DELAY);
        debounceTimersRef.current.set(noteId, timer);
      } else {
        // Process immediately if no debouncing
        processQueue();
      }
    });
  }, [processQueue, hasContentChanged]);

  /**
   * Save title changes through the coordinator
   */
  const saveTitle = useCallback((
    noteId: string,
    title: string
  ): Promise<boolean> => {
    // Capture current note state and mark as unsaved
    const snapshot = captureNoteSnapshot(noteId);
    if (snapshot) {
      const updatedNote = { ...snapshot, name: title };
      markNoteAsUnsaved(updatedNote);
    }

    return queueSave(noteId, { title });
  }, [queueSave, captureNoteSnapshot, markNoteAsUnsaved]);

  /**
   * Save content changes through the coordinator
   */
  const saveContent = useCallback((
    noteId: string,
    content: { tiptap: string; text: string }
  ): Promise<boolean> => {
    // Capture current note state and mark as unsaved
    const snapshot = captureNoteSnapshot(noteId);
    if (snapshot && isFile(snapshot)) {
      const updatedNote = {
        ...snapshot,
        content: { ...snapshot.content, ...content }
      };
      markNoteAsUnsaved(updatedNote);
    }

    return queueSave(noteId, { content });
  }, [queueSave, captureNoteSnapshot, markNoteAsUnsaved]);

  /**
   * Force immediate save (no debouncing)
   */
  const forceSave = useCallback(async (noteId?: string): Promise<boolean> => {
    if (noteId) {
      const snapshot = captureNoteSnapshot(noteId);
      if (snapshot) {
        return queueSave(noteId, {}, false);
      }
    } else if (currentNote) {
      const snapshot = captureNoteSnapshot(currentNote.pointer_id);
      if (snapshot) {
        return queueSave(currentNote.pointer_id, {}, false);
      }
    }
    return false;
  }, [queueSave, captureNoteSnapshot, currentNote]);

  /**
   * Clear note snapshot when note changes
   */
  const clearNoteSnapshot = useCallback((noteId: string) => {
    noteSnapshotsRef.current.delete(noteId);
  }, []);

  /**
   * Get the current save status for a specific note
   */
  const getSaveStatus = useCallback((noteId: string) => {
    const hasPendingRequest = requestQueueRef.current.some(req => req.noteId === noteId);
    const isCurrentlySaving = coordinatorState.currentRequestId?.startsWith(noteId);

    return {
      isSaving: isCurrentlySaving || coordinatorState.isProcessing,
      hasPendingSave: hasPendingRequest,
      pendingRequestCount: requestQueueRef.current.filter(req => req.noteId === noteId).length,
    };
  }, [coordinatorState]);

  // Setup cleanup for snapshots and timers
  useEffect(() => {
    const noteId = currentNote?.pointer_id;
    if (!noteId) return;

    // Clear old snapshots periodically to prevent memory leaks
    const cleanupInterval = setInterval(() => {
      // Cleanup snapshots
      if (noteSnapshotsRef.current.size > 10) {
        // Keep only the 5 most recent snapshots
        const entries = Array.from(noteSnapshotsRef.current.entries());
        noteSnapshotsRef.current = new Map(entries.slice(-5));
      }

      // Cleanup debounce timers for notes that no longer exist
      const activeNoteIds = new Set([noteId, ...Array.from(noteSnapshotsRef.current.keys())]);
      for (const [timerNoteId, timer] of debounceTimersRef.current.entries()) {
        if (!activeNoteIds.has(timerNoteId)) {
          clearTimeout(timer);
          debounceTimersRef.current.delete(timerNoteId);
        }
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(cleanupInterval);
      // Clear debounce timer for current note when unmounting
      const currentTimer = debounceTimersRef.current.get(noteId);
      if (currentTimer) {
        clearTimeout(currentTimer);
        debounceTimersRef.current.delete(noteId);
      }
    };
  }, [currentNote?.pointer_id]);

  return {
    // Core save operations
    saveTitle,
    saveContent,
    forceSave,

    // State management
    getSaveStatus,
    clearNoteSnapshot,

    // Debug/monitoring state
    coordinatorState: {
      isProcessing: coordinatorState.isProcessing,
      pendingRequests: coordinatorState.pendingRequests.length,
      currentRequestId: coordinatorState.currentRequestId,
    },
  };
}

export type { SaveCoordinatorState };