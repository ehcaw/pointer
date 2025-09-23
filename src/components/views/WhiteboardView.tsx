import dynamic from "next/dynamic";
import { useWhiteboardStore } from "@/lib/stores/whiteboard-store";
import { useWhiteboardApi } from "@/hooks/use-whiteboard-api";

const ExcalidrawWrapper = dynamic(
  async () => (await import("../whiteboard/ExcalidrawWrapper")).default,
  {
    ssr: false,
  },
);

export default function WhiteboardView() {
  return <ExcalidrawWrapper />;
}
