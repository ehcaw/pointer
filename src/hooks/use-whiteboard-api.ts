import { useCallback } from "react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWhiteboardStore } from "@/lib/stores/whiteboard-store";
import { Whiteboard } from "@/types/whiteboard";
import { transformConvexWhiteboard } from "@/components/whiteboard/whiteboard-utils";

export function useWhiteboardApi() {
  const convex = useConvex();
  const { whiteboard, setWhiteboard } = useWhiteboardStore();

  const fetchWhiteboard = useCallback(async () => {
    const rawWhiteboard = await convex.query(api.whiteboards.getWhiteboard, {});
    const normalizedWhiteboard: Whiteboard | null =
      transformConvexWhiteboard(rawWhiteboard);
    if (normalizedWhiteboard) {
      setWhiteboard(normalizedWhiteboard);
    } else {
      const rawWhiteboard = await convex.mutation(api.whiteboards.create, {
        title: "Untitled Whiteboard",
      });
      const normalizedWhiteboard: Whiteboard | null =
        transformConvexWhiteboard(rawWhiteboard);
      setWhiteboard(normalizedWhiteboard!);
    }
  }, [convex, setWhiteboard]);

  // const updateWhiteboardState = ()
  return {
    whiteboard,
    fetchWhiteboard,
  };
}
