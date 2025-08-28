"use client";

import { useState } from 'react';
import logger from '@/lib/logger';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string>('');

  const exportLogs = () => {
    const exportedLogs = logger.exportLogs();
    setLogs(exportedLogs || 'No logs available');
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs('');
    alert('Logs cleared');
  };

  const copyLogs = () => {
    if (logs) {
      navigator.clipboard.writeText(logs).then(() => {
        alert('Logs copied to clipboard');
      });
    }
  };

  if (process.env.NODE_ENV === 'development') {
    return null; // Only show in production builds
  }

  return (
    <>
      {/* Debug button - fixed position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-3 py-2 rounded-full text-sm font-mono shadow-lg hover:bg-red-700"
        style={{ fontSize: '12px' }}
      >
        DEBUG
      </button>

      {/* Debug panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Debug Panel
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={exportLogs}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Export Logs
                </button>
                <button
                  onClick={copyLogs}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  disabled={!logs}
                >
                  Copy Logs
                </button>
                <button
                  onClick={clearLogs}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Clear Logs
                </button>
              </div>
              
              <div className="flex-1 overflow-auto">
                <textarea
                  value={logs}
                  readOnly
                  className="w-full h-full min-h-[300px] p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white"
                  placeholder="Click 'Export Logs' to see error logs and debug information..."
                />
              </div>
              
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Environment:</strong> {process.env.NODE_ENV || 'unknown'}</p>
                <p><strong>Tauri:</strong> {typeof window !== 'undefined' && window.__TAURI__ ? 'Yes' : 'No'}</p>
                <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'unknown'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
