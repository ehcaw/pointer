import dynamic from "next/dynamic";
import { WhiteboardProvider } from "@/providers/WhiteboardProvider";

const ExcalidrawWrapper = dynamic(
  async () => (await import("../whiteboard/ExcalidrawWrapper")).default,
  {
    ssr: false,
  },
);

export default function WhiteboardView() {
  return (
    <WhiteboardProvider>
      <ExcalidrawWrapper />
    </WhiteboardProvider>
  );
}
