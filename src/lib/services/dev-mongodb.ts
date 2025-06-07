import type { Node } from "@/types/note";
import { createObjectId } from "@/types/note";

/**
 * Development MongoDB service for testing without Tauri backend.
 * This service simulates MongoDB operations using localStorage for persistence.
 * Use this during development when you don't have the Rust backend running.
 */
export class DevMongoDBService {
  private connected: boolean = false;
  private storageKey = 'quibble-dev-notes';

  /**
   * Simulate MongoDB connection.
   */
  async connect(uri: string): Promise<void> {
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 100));
      this.connected = true;
      console.log('Connected to development MongoDB service (localStorage)');
    } catch (error) {
      console.error('Failed to connect to development MongoDB:', error);
      throw error;
    }
  }

  /**
   * Simulate MongoDB disconnection.
   */
  async disconnect(): Promise<void> {
    try {
      this.connected = false;
      console.log('Disconnected from development MongoDB service');
    } catch (error) {
      console.error('Error disconnecting from development MongoDB:', error);
      throw error;
    }
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get all notes from localStorage.
   */
  async getAllNotes(tenantId: string): Promise<Node[]> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      const allNotes: Node[] = stored ? JSON.parse(stored) : [];
      
      // Filter by tenant ID
      return allNotes.filter(note => note.tenantId.toString() === tenantId);
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  /**
   * Create a new note in localStorage.
   */
  async createNote(note: Omit<Node, "_id" | "createdAt" | "updatedAt">): Promise<Node> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      const now = new Date();
      const newNote: Node = {
        ...note,
        _id: createObjectId(),
        createdAt: now,
        updatedAt: now,
      };

      // Get existing notes
      const stored = localStorage.getItem(this.storageKey);
      const allNotes: Node[] = stored ? JSON.parse(stored) : [];
      
      // Add new note
      allNotes.push(newNote);
      
      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(allNotes));
      
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Update an existing note in localStorage.
   */
  async updateNote(noteId: string, updates: Partial<Node>): Promise<Node> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      // Get existing notes
      const stored = localStorage.getItem(this.storageKey);
      const allNotes: Node[] = stored ? JSON.parse(stored) : [];
      
      // Find note to update
      const noteIndex = allNotes.findIndex(note => note._id.toString() === noteId);
      
      if (noteIndex === -1) {
        throw new Error(`Note with ID ${noteId} not found`);
      }
      
      // Don't allow updating these fields
      const { _id, createdAt, tenantId, ...validUpdates } = updates;
      
      // Update the note
      const updatedNote = {
        ...allNotes[noteIndex],
        ...validUpdates,
        updatedAt: new Date(),
      };
      
      allNotes[noteIndex] = updatedNote;
      
      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(allNotes));
      
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  /**
   * Delete a note from localStorage.
   */
  async deleteNote(noteId: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      // Get existing notes
      const stored = localStorage.getItem(this.storageKey);
      const allNotes: Node[] = stored ? JSON.parse(stored) : [];
      
      // Find note to delete
      const noteIndex = allNotes.findIndex(note => note._id.toString() === noteId);
      
      if (noteIndex === -1) {
        return false;
      }
      
      // Remove the note
      allNotes.splice(noteIndex, 1);
      
      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(allNotes));
      
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Bulk save multiple notes to localStorage.
   */
  async bulkSaveNotes(
    notes: Array<Node | Omit<Node, "_id" | "createdAt" | "updatedAt">>
  ): Promise<Node[]> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      const now = new Date();
      const savedNotes: Node[] = [];
      
      // Get existing notes
      const stored = localStorage.getItem(this.storageKey);
      let allNotes: Node[] = stored ? JSON.parse(stored) : [];
      
      for (const note of notes) {
        if ('_id' in note && note._id) {
          // Update existing note
          const noteIndex = allNotes.findIndex(n => n._id.toString() === note._id.toString());
          
          if (noteIndex !== -1) {
            const updatedNote = {
              ...allNotes[noteIndex],
              ...note,
              updatedAt: now,
            };
            allNotes[noteIndex] = updatedNote;
            savedNotes.push(updatedNote);
          }
        } else {
          // Create new note
          const newNote: Node = {
            ...note,
            _id: createObjectId(),
            createdAt: now,
            updatedAt: now,
          };
          allNotes.push(newNote);
          savedNotes.push(newNote);
        }
      }
      
      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(allNotes));
      
      return savedNotes;
    } catch (error) {
      console.error('Error bulk saving notes:', error);
      throw error;
    }
  }

  /**
   * Clear all notes (for development/testing).
   */
  async clearAllNotes(): Promise<void> {
    if (!this.connected) {
      throw new Error('MongoDB not connected');
    }
    
    try {
      localStorage.removeItem(this.storageKey);
      console.log('All notes cleared from development storage');
    } catch (error) {
      console.error('Error clearing notes:', error);
      throw error;
    }
  }

  /**
   * Get development statistics.
   */
  getDevStats(): { totalNotes: number; storageUsed: string } {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const allNotes: Node[] = stored ? JSON.parse(stored) : [];
      const storageSize = stored ? (stored.length * 2) / 1024 : 0; // Rough estimate in KB
      
      return {
        totalNotes: allNotes.length,
        storageUsed: `${storageSize.toFixed(2)} KB`
      };
    } catch (error) {
      console.error('Error getting dev stats:', error);
      return { totalNotes: 0, storageUsed: '0 KB' };
    }
  }
}

// Export a singleton instance for development
export const devMongoDBService = new DevMongoDBService();

// Helper function to check if we should use dev service
export function shouldUseDevService(): boolean {
  // Use dev service if not in Tauri environment or if explicitly set
  return typeof window !== 'undefined' && (
    !window.__TAURI__ || 
    localStorage.getItem('quibble-use-dev-db') === 'true'
  );
}