"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useConvex } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWhiteboardStore } from "@/lib/stores/whiteboard-store";
import { Whiteboard } from "@/types/whiteboard";
import { transformConvexWhiteboard } from "@/components/whiteboard/whiteboard-utils";

interface WhiteboardContextType {
  whiteboard: Whiteboard | null;
  isLoading: boolean;
  error: string | null;
  refetchWhiteboard: () => Promise<void>;
}

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(
  undefined,
);

interface WhiteboardProviderProps {
  children: ReactNode;
}

export function WhiteboardProvider({ children }: WhiteboardProviderProps) {
  const convex = useConvex();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { whiteboard, setWhiteboard } = useWhiteboardStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWhiteboard = useCallback(async () => {
    if (!isAuthenticated || authLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // First try to get existing whiteboard only
      const existingWhiteboard = await convex.query(
        api.whiteboards.getWhiteboard,
        {},
      );

      let rawWhiteboard = existingWhiteboard;

      // Only create if no existing whiteboard found
      if (!existingWhiteboard) {
        rawWhiteboard = await convex.mutation(
          api.whiteboards.getOrCreateWhiteboard,
          {},
        );
      } else {
        console.log("Found existing whiteboard");
      }

      if (rawWhiteboard) {
        const normalizedWhiteboard = transformConvexWhiteboard(rawWhiteboard);
        if (normalizedWhiteboard) {
          setWhiteboard(normalizedWhiteboard);
        }
      }
    } catch (err) {
      console.error("Failed to fetch whiteboard:", err);
      setError("Failed to load whiteboard");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, convex, setWhiteboard]);

  // Initialize whiteboard when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && !whiteboard) {
      fetchWhiteboard();
    }
  }, [isAuthenticated, authLoading, whiteboard, fetchWhiteboard]);

  const contextValue: WhiteboardContextType = {
    whiteboard,
    isLoading,
    error,
    refetchWhiteboard: fetchWhiteboard,
  };

  return (
    <WhiteboardContext.Provider value={contextValue}>
      {children}
    </WhiteboardContext.Provider>
  );
}

export function useWhiteboardContext() {
  const context = useContext(WhiteboardContext);
  if (context === undefined) {
    throw new Error(
      "useWhiteboardContext must be used within a WhiteboardProvider",
    );
  }
  return context;
}
