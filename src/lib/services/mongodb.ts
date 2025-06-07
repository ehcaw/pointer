import type { Node } from "@/types/note";

// Define Tauri invoke commands
interface TauriMongoCommands {
  connect_mongodb: (args: { uri: string }) => Promise<void>;
  disconnect_mongodb: () => Promise<void>;
  get_all_notes: (args: { tenant_id: string }) => Promise<Node[]>;
  create_note: (args: { note: Omit<Node, "_id" | "createdAt" | "updatedAt"> }) => Promise<Node>;
  update_note: (args: { note_id: string; updates: Partial<Node> }) => Promise<Node>;
  delete_note: (args: { note_id: string }) => Promise<boolean>;
  bulk_save_notes: (args: { notes: Array<Node | Omit<Node, "_id" | "createdAt" | "updatedAt">> }) => Promise<Node[]>;
}

// Type-safe wrapper for Tauri invoke
async function invoke<T extends keyof TauriMongoCommands>(
  cmd: T,
  args?: Parameters<TauriMongoCommands[T]>[0]
): Promise<ReturnType<TauriMongoCommands[T]>> {
  if (typeof window !== 'undefined' && window.__TAURI__) {
    return window.__TAURI__.invoke(cmd, args);
  }
  throw new Error('Tauri API not available');
}

/**
 * MongoDB service for handling note operations via Tauri backend.
 * This service communicates with the Rust backend which handles actual MongoDB operations.
 */
export class MongoDBService {
  private connected: boolean = false;

  /**
   * Initialize the MongoDB connection via Tauri backend.
   */
  async connect(uri: string): Promise<void> {
    try {
      await invoke('connect_mongodb', { uri });
      this.connected = true;
      console.log('Connected to MongoDB via Tauri backend');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Close the MongoDB connection via Tauri backend.
   */
  async disconnect(): Promise<void> {
    try {
      await invoke('disconnect_mongodb');
      this.connected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Check if connected to MongoDB.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get all notes for a specific tenant.
   */
  async getAllNotes(tenantId: string): Promise<Node[]> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      const notes = await invoke('get_all_notes', { tenant_id: tenantId });
      return notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  /**
   * Create a new note.
   */
  async createNote(note: Omit<Node, "_id" | "createdAt" | "updatedAt">): Promise<Node> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      const createdNote = await invoke('create_note', { note });
      return createdNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Update an existing note.
   */
  async updateNote(noteId: string, updates: Partial<Node>): Promise<Node> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      const updatedNote = await invoke('update_note', { 
        note_id: noteId, 
        updates 
      });
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  /**
   * Delete a note.
   */
  async deleteNote(noteId: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      const result = await invoke('delete_note', { note_id: noteId });
      return result;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Bulk save multiple notes (for saving unsaved buffer).
   */
  async bulkSaveNotes(
    notes: Array<Node | Omit<Node, "_id" | "createdAt" | "updatedAt">>
  ): Promise<Node[]> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      const savedNotes = await invoke('bulk_save_notes', { notes });
      return savedNotes;
    } catch (error) {
      console.error('Error bulk saving notes:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const mongoDBService = new MongoDBService();

// Helper function to check if running in Tauri environment
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.__TAURI__;
}

// Declare global types for Tauri
declare global {
  interface Window {
    __TAURI__?: {
      invoke(cmd: string, args?: any): Promise<any>;
    };
  }
}