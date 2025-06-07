import React, { useState } from 'react';
import { dbService, devMongoDBService } from '@/lib/services/index';
import { useNotesStore } from '@/lib/notes-store';
import { createObjectId } from '@/types/note';
import type { FileNode } from '@/types/note';

interface DevToolsProps {
  className?: string;
}

/**
 * Development tools component for testing the notes system.
 * Only shows in development environment and provides utilities for:
 * - Switching between dev/production database services
 * - Creating sample notes
 * - Viewing storage statistics
 * - Clearing all data
 */
export const DevTools: React.FC<DevToolsProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  
  const {
    userNotes,
    unsavedNotes,
    newUnsavedNotes,
    createNewNote,
    saveAllUnsavedNotes,
    fetchAllNotes,
  } = useNotesStore();

  // Don't show in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleSwitchToDevService = () => {
    dbService.useDevelopmentService();
    window.location.reload(); // Reload to apply changes
  };

  const handleSwitchToProductionService = () => {
    dbService.useProductionService();
    window.location.reload(); // Reload to apply changes
  };

  const handleCreateSampleNote = async () => {
    setIsCreatingNote(true);
    try {
      const randomId = Math.random().toString(36).substring(2, 8);
      const sampleNote = createNewNote(`Sample Note ${randomId}`, null, []);
      
      // Add some sample content
      const noteWithContent: FileNode = {
        ...sampleNote,
        content: {
          tiptap: {
            type: 'doc',
            content: [
              {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: `Sample Note ${randomId}` }]
              },
              {
                type: 'paragraph',
                content: [
                  { 
                    type: 'text', 
                    text: 'This is a sample note created by the development tools. It contains some sample content to test the TipTap editor integration.' 
                  }
                ]
              },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Sample bullet point 1' }]
                      }
                    ]
                  },
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Sample bullet point 2' }]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          text: `Sample Note ${randomId}\n\nThis is a sample note created by the development tools. It contains some sample content to test the TipTap editor integration.\n\n• Sample bullet point 1\n• Sample bullet point 2`,
          meta: {
            createdBy: 'dev-tools',
            sampleData: true
          }
        }
      };
      
      console.log('Created sample note:', noteWithContent);
    } catch (error) {
      console.error('Error creating sample note:', error);
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
      try {
        if (dbService.isUsingDevService()) {
          await devMongoDBService.clearAllNotes();
        }
        // Reload to refresh the store
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  };

  const handleRefreshNotes = async () => {
    try {
      // Use a dummy tenant ID for development
      await fetchAllNotes('dev-tenant-123');
    } catch (error) {
      console.error('Error refreshing notes:', error);
    }
  };

  const handleSaveAll = async () => {
    try {
      await saveAllUnsavedNotes();
      console.log('All unsaved notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const getDevStats = () => {
    if (dbService.isUsingDevService()) {
      return devMongoDBService.getDevStats();
    }
    return { totalNotes: userNotes.length, storageUsed: 'N/A' };
  };

  const stats = getDevStats();

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <div className="bg-gray-800 text-white rounded-lg shadow-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 text-left font-semibold text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          🛠️ Dev Tools {isExpanded ? '▼' : '▶'}
        </button>
        
        {isExpanded && (
          <div className="p-4 space-y-3 border-t border-gray-600">
            {/* Service Status */}
            <div className="text-xs">
              <div className="font-semibold mb-1">Database Service:</div>
              <div className={`px-2 py-1 rounded text-xs ${
                dbService.isUsingDevService() 
                  ? 'bg-yellow-600 text-yellow-100' 
                  : 'bg-green-600 text-green-100'
              }`}>
                {dbService.isUsingDevService() ? 'Development (localStorage)' : 'Production (Tauri)'}
              </div>
            </div>

            {/* Statistics */}
            <div className="text-xs">
              <div className="font-semibold mb-1">Statistics:</div>
              <div className="space-y-1 text-gray-300">
                <div>Total Notes: {stats.totalNotes}</div>
                <div>Unsaved Changes: {unsavedNotes.size}</div>
                <div>New Unsaved: {newUnsavedNotes.length}</div>
                <div>Storage Used: {stats.storageUsed}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="text-xs font-semibold">Actions:</div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCreateSampleNote}
                  disabled={isCreatingNote}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded transition-colors"
                >
                  {isCreatingNote ? 'Creating...' : 'Create Sample'}
                </button>
                
                <button
                  onClick={handleRefreshNotes}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors"
                >
                  Refresh Notes
                </button>
                
                <button
                  onClick={handleSaveAll}
                  className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                >
                  Save All
                </button>
                
                <button
                  onClick={handleClearAllData}
                  className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Service Switching */}
            <div className="space-y-2">
              <div className="text-xs font-semibold">Switch Service:</div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSwitchToDevService}
                  disabled={dbService.isUsingDevService()}
                  className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 rounded transition-colors"
                >
                  Use Dev DB
                </button>
                
                <button
                  onClick={handleSwitchToProductionService}
                  disabled={!dbService.isUsingDevService()}
                  className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 rounded transition-colors"
                >
                  Use Prod DB
                </button>
              </div>
            </div>

            {/* Notes List (if any) */}
            {userNotes.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold">Recent Notes:</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {userNotes.slice(0, 5).map((note) => (
                    <div key={note._id.toString()} className="text-xs text-gray-300 truncate">
                      📄 {note.name}
                    </div>
                  ))}
                  {userNotes.length > 5 && (
                    <div className="text-xs text-gray-400">
                      ... and {userNotes.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevTools;