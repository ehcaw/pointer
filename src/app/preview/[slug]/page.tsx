import { Metadata } from "next";
import { PreviewPageClient } from "@/components/preview/PreviewPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `Preview - ${slug}`,
    description: "Preview of a shared note",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <PreviewPageClient params={params} />;
}
