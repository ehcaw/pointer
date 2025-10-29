import { Skeleton } from "@/components/ui/skeleton";

export function EditorSkeleton() {
  return (
    <div className="bg-card rounded-sm shadow-sm border border-border overflow-hidden">
      <div className="w-full min-h-[calc(100vh-240px)] p-8 space-y-4">
        {/* Title skeleton */}
        <Skeleton className="h-12 w-3/4 mb-8" />

        {/* Content lines skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
        </div>

        <div className="space-y-3 mt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-9/12" />
          <Skeleton className="h-4 w-11/12" />
        </div>

        <div className="space-y-3 mt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-8/12" />
        </div>
      </div>
    </div>
  );
}
