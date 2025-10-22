import { useEffect, useRef, useCallback, useState } from 'react';

interface ReconnectionState {
  isReconnecting: boolean;
  attemptCount: number;
  lastAttempt: number;
  nextAttemptIn: number;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 30000; // 30 seconds
const BACKOFF_MULTIPLIER = 1.5;

export function useReconnectionManager(
  onReconnect: () => Promise<boolean>,
  isConnected: boolean
) {
  const [reconnectionState, setReconnectionState] = useState<ReconnectionState>({
    isReconnecting: false,
    attemptCount: 0,
    lastAttempt: 0,
    nextAttemptIn: 0,
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualReconnectRef = useRef(false);

  // Calculate next delay with exponential backoff
  const calculateDelay = useCallback((attemptCount: number): number => {
    const delay = Math.min(
      INITIAL_DELAY * Math.pow(BACKOFF_MULTIPLIER, attemptCount),
      MAX_DELAY
    );
    // Add jitter to prevent thundering herd
    return delay + (Math.random() * 1000);
  }, []);

  // Clear any pending reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Reset reconnection state when successfully connected
  useEffect(() => {
    if (isConnected && reconnectionState.isReconnecting) {
      clearReconnectTimeout();
      setReconnectionState({
        isReconnecting: false,
        attemptCount: 0,
        lastAttempt: 0,
        nextAttemptIn: 0,
      });
      isManualReconnectRef.current = false;
    }
  }, [isConnected, reconnectionState.isReconnecting, clearReconnectTimeout]);

  // Perform reconnection attempt
  const performReconnect = useCallback(async (isManual: boolean = false) => {
    if (isConnected) {
      return true; // Already connected
    }

    clearReconnectTimeout();

    const newAttemptCount = isManual ? 1 : reconnectionState.attemptCount + 1;

    if (!isManual && newAttemptCount > MAX_RECONNECT_ATTEMPTS) {
      console.warn('Max reconnection attempts reached, giving up');
      setReconnectionState(prev => ({
        ...prev,
        isReconnecting: false,
        nextAttemptIn: 0,
      }));
      return false;
    }

    console.log(`Reconnection attempt ${newAttemptCount}${isManual ? ' (manual)' : ''}`);

    setReconnectionState(prev => ({
      ...prev,
      isReconnecting: true,
      attemptCount: newAttemptCount,
      lastAttempt: Date.now(),
      nextAttemptIn: 0,
    }));

    try {
      const success = await onReconnect();

      if (success) {
        console.log('Reconnection successful');
        setReconnectionState({
          isReconnecting: false,
          attemptCount: 0,
          lastAttempt: 0,
          nextAttemptIn: 0,
        });
        return true;
      } else {
        throw new Error('Reconnection failed');
      }
    } catch (error) {
      console.error('Reconnection attempt failed:', error);

      if (isManual) {
        // For manual reconnects, don't schedule automatic retry
        setReconnectionState(prev => ({
          ...prev,
          isReconnecting: false,
          nextAttemptIn: 0,
        }));
        return false;
      }

      // Schedule next attempt
      const nextDelay = calculateDelay(newAttemptCount);

      reconnectTimeoutRef.current = setTimeout(() => {
        performReconnect(false);
      }, nextDelay);

      setReconnectionState(prev => ({
        ...prev,
        nextAttemptIn: nextDelay,
      }));

      return false;
    }
  }, [isConnected, reconnectionState.attemptCount, onReconnect, clearReconnectTimeout, calculateDelay]);

  // Manual reconnect function
  const manualReconnect = useCallback(() => {
    isManualReconnectRef.current = true;
    return performReconnect(true);
  }, [performReconnect]);

  // Start automatic reconnection if connection is lost
  useEffect(() => {
    if (!isConnected && !reconnectionState.isReconnecting && !isManualReconnectRef.current) {
      // Start first reconnect attempt after a short delay
      reconnectTimeoutRef.current = setTimeout(() => {
        performReconnect(false);
      }, INITIAL_DELAY);

      setReconnectionState(prev => ({
        ...prev,
        isReconnecting: true,
        nextAttemptIn: INITIAL_DELAY,
      }));
    }
  }, [isConnected, reconnectionState.isReconnecting, performReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
    };
  }, [clearReconnectTimeout]);

  return {
    isReconnecting: reconnectionState.isReconnecting,
    attemptCount: reconnectionState.attemptCount,
    lastAttempt: reconnectionState.lastAttempt,
    nextAttemptIn: reconnectionState.nextAttemptIn,
    manualReconnect,
    stopReconnecting: () => {
      clearReconnectTimeout();
      setReconnectionState(prev => ({
        ...prev,
        isReconnecting: false,
        nextAttemptIn: 0,
      }));
    },
  };
}