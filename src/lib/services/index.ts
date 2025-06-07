import { mongoDBService } from './mongodb';
import { devMongoDBService, shouldUseDevService } from './dev-mongodb';

/**
 * Service selector that chooses between production and development MongoDB services.
 * 
 * - In Tauri environment: Uses production service that communicates with Rust backend
 * - In web/development environment: Uses development service with localStorage
 * - Can be overridden with localStorage flag 'quibble-use-dev-db'
 */
class DatabaseServiceSelector {
  private _service: typeof mongoDBService | typeof devMongoDBService | null = null;

  /**
   * Get the appropriate database service based on environment.
   */
  get service() {
    if (!this._service) {
      this._service = shouldUseDevService() ? devMongoDBService : mongoDBService;
      
      console.log(
        `Using ${shouldUseDevService() ? 'development' : 'production'} MongoDB service`
      );
    }
    return this._service;
  }

  /**
   * Force refresh the service selection (useful for testing).
   */
  refresh() {
    this._service = null;
    return this.service;
  }

  /**
   * Check if currently using development service.
   */
  isUsingDevService(): boolean {
    return this.service === devMongoDBService;
  }

  /**
   * Switch to development service (useful for testing).
   */
  useDevelopmentService() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quibble-use-dev-db', 'true');
    }
    this._service = devMongoDBService;
    console.log('Switched to development MongoDB service');
  }

  /**
   * Switch to production service.
   */
  useProductionService() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quibble-use-dev-db');
    }
    this._service = mongoDBService;
    console.log('Switched to production MongoDB service');
  }
}

// Export singleton instance
export const dbService = new DatabaseServiceSelector();

// Export the service directly for convenience
export const database = dbService.service;

// Export individual services for direct access if needed
export { mongoDBService, devMongoDBService };

// Export utility functions
export { shouldUseDevService };

// Type definitions for the unified service interface
export interface DatabaseService {
  connect(uri: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getAllNotes(tenantId: string): Promise<import('@/types/note').Node[]>;
  createNote(note: Omit<import('@/types/note').Node, "_id" | "createdAt" | "updatedAt">): Promise<import('@/types/note').Node>;
  updateNote(noteId: string, updates: Partial<import('@/types/note').Node>): Promise<import('@/types/note').Node>;
  deleteNote(noteId: string): Promise<boolean>;
  bulkSaveNotes(notes: Array<import('@/types/note').Node | Omit<import('@/types/note').Node, "_id" | "createdAt" | "updatedAt">>): Promise<import('@/types/note').Node[]>;
}