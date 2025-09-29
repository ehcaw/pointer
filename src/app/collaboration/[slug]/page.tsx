import { Metadata } from "next";
import { CollaborativeNotebookView } from "@/components/views/CollaborativeNotebookView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `Collaboration Test - ${slug}`,
    description: "Collaboration Test",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function CollaborativeNotebookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <CollaborativeNotebookView params={params} />;
}
