import dynamic from "next/dynamic";

const ExcalidrawWrapper = dynamic(
  async () => (await import("../ExcalidrawWrapper")).default,
  {
    ssr: false,
  },
);

export default function WhiteboardView() {
  return <ExcalidrawWrapper />;
}
