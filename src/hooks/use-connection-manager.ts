import { useEffect, useRef, useCallback, useState } from 'react';

interface TabMessage {
  type: 'TAB_FOCUS' | 'TAB_BLUR' | 'MASTER_TAB_HEARTBEAT' | 'REQUEST_MASTER' | 'BECOME_MASTER';
  tabId: string;
  timestamp: number;
}

interface ConnectionManagerState {
  isMasterTab: boolean;
  tabId: string;
  connectedTabs: Set<string>;
  lastHeartbeat: number;
}

export function useConnectionManager(documentId: string) {
  const [state, setState] = useState<ConnectionManagerState>(() => ({
    isMasterTab: false,
    tabId: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    connectedTabs: new Set(),
    lastHeartbeat: Date.now(),
  }));

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const masterCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldConnect, setShouldConnect] = useState(false);

  // Initialize broadcast channel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported, falling back to localStorage-only mode');
      return;
    }

    const channelName = `collaborative-editor-${documentId}`;
    broadcastChannelRef.current = new BroadcastChannel(channelName);

    const handleMessage = (event: MessageEvent<TabMessage>) => {
      const message = event.data;
      handleTabMessage(message);
    };

    broadcastChannelRef.current.addEventListener('message', handleMessage);

    // Announce this tab's presence
    broadcastChannelRef.current.postMessage({
      type: 'TAB_FOCUS',
      tabId: state.tabId,
      timestamp: Date.now(),
    } as TabMessage);

    // Request master status
    broadcastChannelRef.current.postMessage({
      type: 'REQUEST_MASTER',
      tabId: state.tabId,
      timestamp: Date.now(),
    } as TabMessage);

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.removeEventListener('message', handleMessage);
        broadcastChannelRef.current.close();
      }
    };
  }, [documentId, state.tabId]);

  // Handle incoming tab messages
  const handleTabMessage = useCallback((message: TabMessage) => {
    const now = Date.now();

    switch (message.type) {
      case 'TAB_FOCUS':
        setState(prev => ({
          ...prev,
          connectedTabs: new Set([...prev.connectedTabs, message.tabId]),
        }));
        break;

      case 'TAB_BLUR':
        setState(prev => {
          const newTabs = new Set(prev.connectedTabs);
          newTabs.delete(message.tabId);
          return { ...prev, connectedTabs: newTabs };
        });
        break;

      case 'MASTER_TAB_HEARTBEAT':
        setState(prev => ({
          ...prev,
          lastHeartbeat: now,
        }));
        break;

      case 'REQUEST_MASTER':
        // If no heartbeat received recently, this tab can become master
        if (now - state.lastHeartbeat > 5000) { // 5 seconds timeout
          becomeMasterTab();
        }
        break;

      case 'BECOME_MASTER':
        if (message.tabId !== state.tabId) {
          // Another tab became master, we're not master anymore
          setState(prev => ({ ...prev, isMasterTab: false }));
        }
        break;
    }
  }, [state.lastHeartbeat, state.tabId]);

  // Become the master tab
  const becomeMasterTab = useCallback(() => {
    setState(prev => ({ ...prev, isMasterTab: true }));
    setShouldConnect(true);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'BECOME_MASTER',
        tabId: state.tabId,
        timestamp: Date.now(),
      } as TabMessage);
    }
  }, [state.tabId]);

  // Send heartbeat as master tab
  useEffect(() => {
    if (state.isMasterTab) {
      heartbeatIntervalRef.current = setInterval(() => {
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'MASTER_TAB_HEARTBEAT',
            tabId: state.tabId,
            timestamp: Date.now(),
          } as TabMessage);
        }
      }, 2000); // Send heartbeat every 2 seconds
    } else {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [state.isMasterTab, state.tabId]);

  // Check if we should become master (no other master detected)
  useEffect(() => {
    masterCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (!state.isMasterTab && now - state.lastHeartbeat > 5000) {
        // No master heartbeat for 5 seconds, become master
        becomeMasterTab();
      }
    }, 3000); // Check every 3 seconds

    return () => {
      if (masterCheckIntervalRef.current) {
        clearInterval(masterCheckIntervalRef.current);
      }
    };
  }, [state.isMasterTab, state.lastHeartbeat, becomeMasterTab]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is being hidden
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'TAB_BLUR',
            tabId: state.tabId,
            timestamp: Date.now(),
          } as TabMessage);
        }
      } else {
        // Tab is becoming visible again
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'TAB_FOCUS',
            tabId: state.tabId,
            timestamp: Date.now(),
          } as TabMessage);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.tabId]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'TAB_BLUR',
          tabId: state.tabId,
          timestamp: Date.now(),
        } as TabMessage);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.tabId]);

  return {
    isMasterTab: state.isMasterTab,
    tabId: state.tabId,
    connectedTabs: Array.from(state.connectedTabs),
    shouldConnect,
    becomeMasterTab,
  };
}