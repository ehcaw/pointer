import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWhiteboardStore } from "@/lib/stores/whiteboard-store";
import { ensureJSONString } from "@/lib/utils";
import { transformConvexWhiteboard, Whiteboard } from "@/types/whiteboard";

export function useWhiteboardApi() {
  const convex = useConvex();
  const {
    whiteboard,
    setWhiteboard,
    updateWhiteboardAppState,
    updateWhiteboardAppStateAndElements,
    updateWhiteboardElements,
  } = useWhiteboardStore();

  const fetchWhiteboard = async () => {
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
  };

  // const updateWhiteboardState = ()
  return {
    whiteboard,
    fetchWhiteboard,
  };
}
