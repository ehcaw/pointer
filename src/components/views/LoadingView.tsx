import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingView = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-card border-r border-border p-4">
        <div className="space-y-4">
          {/* Logo area */}
          <div className="pb-4 border-b border-border">
            <Skeleton className="h-6 w-24 mb-2 bg-muted/50 animate-pulse rounded-md" />
            <Skeleton className="h-3 w-32 bg-muted/50 animate-pulse rounded-md" />
          </div>

          {/* Navigation section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-20 bg-muted/50 animate-pulse rounded-md" />
            <div className="space-y-2 ml-2">
              <Skeleton className="h-8 w-full bg-muted/50 animate-pulse rounded-lg" />
              <Skeleton className="h-8 w-full bg-muted/50 animate-pulse rounded-lg" />
              <Skeleton className="h-8 w-full bg-muted/50 animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Recent Notes section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 bg-muted/50 animate-pulse rounded-md" />
            <div className="space-y-2 ml-2">
              <Skeleton className="h-8 w-full bg-muted/70 animate-pulse rounded-lg" />
              <Skeleton className="h-8 w-full bg-muted/50 animate-pulse rounded-lg" />
              <Skeleton className="h-8 w-full bg-muted/50 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>

        {/* Bottom area */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-3">
          <Skeleton className="h-8 w-8 bg-muted/50 animate-pulse rounded-full" />
          <Skeleton className="h-6 w-6 bg-muted/50 animate-pulse rounded-md" />
          <Skeleton className="h-6 w-6 bg-muted/50 animate-pulse rounded-md" />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="h-14 border-b border-border bg-background px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20 bg-muted/50 animate-pulse rounded-md" />
              <span className="text-muted-foreground">›</span>
              <Skeleton className="h-4 w-16 bg-muted/50 animate-pulse rounded-md" />
              <span className="text-muted-foreground">›</span>
              <Skeleton className="h-4 w-20 bg-muted/50 animate-pulse rounded-md" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 bg-muted/50 animate-pulse rounded-lg" />
              <Skeleton className="h-8 w-8 bg-muted/50 animate-pulse rounded-lg" />
              <Skeleton className="h-8 w-8 bg-muted/50 animate-pulse rounded-full" />
            </div>
          </div>
        </div>

        {/* Toolbar skeleton */}
        <div className="h-12 border-b border-border bg-muted/30 px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="ml-auto">
              <Skeleton className="h-8 w-8 bg-muted/50 animate-pulse rounded-md" />
            </div>
          </div>
        </div>

        {/* Editor content skeleton */}
        <div className="flex-1 bg-card p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Placeholder text */}
            <Skeleton className="h-5 w-72 bg-muted/40 animate-pulse rounded-md" />

            {/* Content blocks */}
            <div className="space-y-4 mt-12">
              <Skeleton className="h-4 w-full bg-muted/40 animate-pulse rounded-md" />
              <Skeleton className="h-4 w-11/12 bg-muted/40 animate-pulse rounded-md" />
              <Skeleton className="h-4 w-5/6 bg-muted/40 animate-pulse rounded-md" />

              <div className="py-3" />

              <Skeleton className="h-4 w-full bg-muted/40 animate-pulse rounded-md" />
              <Skeleton className="h-4 w-4/5 bg-muted/40 animate-pulse rounded-md" />
              <Skeleton className="h-4 w-11/12 bg-muted/40 animate-pulse rounded-md" />

              <div className="py-3" />

              <Skeleton className="h-4 w-5/6 bg-muted/40 animate-pulse rounded-md" />
              <Skeleton className="h-4 w-full bg-muted/40 animate-pulse rounded-md" />
              <Skeleton className="h-4 w-3/4 bg-muted/40 animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingView;
