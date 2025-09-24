"use client";

import { use, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PreviewEditor } from "@/components/preview/PreviewEditor";
import { Clock, FileText, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

function PreviewContent({ slug }: { slug: string }) {
  const note = useQuery(api.notes.getPublicNote, { pointer_id: slug });

  if (note === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading note...</p>
        </div>
      </div>
    );
  }

  if (note === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Note not found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            The note you&apos;re looking for doesn&apos;t exist or may have been
            deleted.
          </p>
        </div>
      </div>
    );
  }

  const noteContent = note.content.tiptap
    ? typeof note.content.tiptap === "string"
      ? JSON.parse(note.content.tiptap)
      : note.content.tiptap
    : {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: note.content.text || "This note appears to be empty.",
              },
            ],
          },
        ],
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/images/pointerlogo-575-transparent.svg"
                  alt="Pointer Logo"
                  width={32}
                  height={32}
                  className="w-6 h-6"
                />
              </Link>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Preview
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
              </div>
              <h1 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {note.name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="hidden sm:flex text-sm">
                <FileText className="h-3 w-3 mr-1" />
                Read-only
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="min-h-[calc(100vh-240px)]">
            <PreviewEditor
              content={noteContent}
              className="prose-lg prose-slate dark:prose-invert"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>Note ID: {slug}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                Last updated{" "}
                {new Date(note.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PreviewPageClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 dark:text-slate-400">
              Loading preview...
            </p>
          </div>
        </div>
      }
    >
      <PreviewContent slug={slug} />
    </Suspense>
  );
}
