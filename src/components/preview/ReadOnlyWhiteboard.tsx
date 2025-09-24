"use client";

import { use, Suspense, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { AppState } from "@excalidraw/excalidraw/types";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import {
  deserializeWhiteboardData,
  createDefaultWhiteboardState,
} from "@/components/whiteboard/whiteboard-utils";
import { Clock, Palette, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

import "@excalidraw/excalidraw/index.css";

// Dynamically import Excalidraw to prevent SSR issues
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading whiteboard...
          </p>
        </div>
      </div>
    ),
  },
);

function WhiteboardContent({ slug }: { slug: string }) {
  const whiteboard = useQuery(api.whiteboards.getWhiteboardById, {
    id: slug as Id<"whiteboards">,
  });

  const [initialData, setInitialData] = useState<{
    elements: ExcalidrawElement[];
    appState: Partial<AppState>;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Process whiteboard data when it loads
  useEffect(() => {
    const processWhiteboardData = async () => {
      if (!whiteboard) {
        setIsProcessing(false);
        return;
      }

      try {
        setIsProcessing(true);
        let processedData = null;

        if (whiteboard.serializedData) {
          processedData = await deserializeWhiteboardData(
            whiteboard.serializedData,
          );
        }

        if (!processedData) {
          processedData = createDefaultWhiteboardState();
        }

        setInitialData({
          elements: (processedData.elements || []) as ExcalidrawElement[],
          appState: {
            ...processedData.appState,
            viewModeEnabled: true,
          },
        });
      } catch (error) {
        console.error("Failed to process whiteboard data:", error);
        const defaultData = createDefaultWhiteboardState();
        setInitialData({
          elements: (defaultData.elements || []) as ExcalidrawElement[],
          appState: {
            ...defaultData.appState,
            viewModeEnabled: true,
          },
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processWhiteboardData();
  }, [whiteboard]);

  if (whiteboard === undefined || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading whiteboard...
          </p>
        </div>
      </div>
    );
  }

  if (whiteboard === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <Palette className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Whiteboard not found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            The whiteboard you&apos;re looking for doesn&apos;t exist or may
            have been deleted.
          </p>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Failed to load whiteboard data
          </p>
        </div>
      </div>
    );
  }

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
                  width={24}
                  height={24}
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
                {whiteboard.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="hidden sm:flex text-sm">
                <Palette className="h-3 w-3 mr-1" />
                Read-only
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="h-[calc(100vh-240px)]">
            <Excalidraw
              initialData={initialData}
              viewModeEnabled={true}
              UIOptions={{
                canvasActions: {
                  clearCanvas: false,
                  loadScene: false,
                  saveToActiveFile: false,
                  changeViewBackgroundColor: false,
                  toggleTheme: false,
                  export: {
                    saveFileToDisk: true,
                  },
                },
                tools: {
                  image: false,
                },
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>Whiteboard ID: {slug}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                Last updated{" "}
                {new Date(whiteboard.lastModified).toLocaleDateString("en-US", {
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

export function ReadOnlyBoard({
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
              Loading whiteboard preview...
            </p>
          </div>
        </div>
      }
    >
      <WhiteboardContent slug={slug} />
    </Suspense>
  );
}
