import { Metadata } from "next";
import { ReadOnlyBoard } from "@/components/preview/ReadOnlyWhiteboard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `Whiteboard Preview - ${slug}`,
    description: "Preview of a shared whiteboard",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function WhiteboardPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ReadOnlyBoard params={params} />;
}
