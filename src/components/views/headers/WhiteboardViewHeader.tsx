// Header for note view
import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { UserButton } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { FileText, Home, Share2, Clock } from "lucide-react";

import { useWhiteboardStore } from "@/lib/stores/whiteboard-store";

export default function WhiteboardViewHeader() {
  const [title, setTitle] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  const { whiteboard, hasPendingChanges } = useWhiteboardStore();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setTitle(e.target.value);
    if (whiteboard) {
      whiteboard.title = e.target.value;
    }
  };

  const handleShareWhiteboard = async () => {
    if (!whiteboard) return;
    if (typeof window === "undefined") return;

    const previewUrl = `${window.location.origin}/preview/whiteboard/${whiteboard._id}`;

    try {
      await navigator.clipboard.writeText(previewUrl);
      toast.success("Preview link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback: open the preview in a new tab
      window.open(previewUrl, "_blank");
      toast.info("Preview opened in new tab");
    }
  };

  useEffect(() => {
    setTitle(whiteboard?.title || "Untitled Whiteboard");
  }, [whiteboard]);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink
              href="#"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-3 w-3" />
              workspace
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block text-muted-foreground" />
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink
              href="#"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-3 w-3" />
              notes
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block text-muted-foreground" />
          <BreadcrumbItem>
            <div className="relative group">
              <Input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
                placeholder="Untitled Note"
                className={cn(
                  "text-lg font-semibold bg-transparent border-0 shadow-none px-3 py-2 h-auto rounded-md",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus-visible:ring-0 transition-all duration-200",
                  "min-w-[200px] max-w-[400px]",
                  isTitleFocused
                    ? "bg-card shadow-sm ring-2 ring-primary/20 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent",
                )}
              />
              {/* Visual indicator for editable state */}
              <div
                className={cn(
                  "absolute inset-0 rounded-md border-2 border-dashed transition-opacity duration-200 pointer-events-none",
                  isTitleFocused
                    ? "opacity-0"
                    : "opacity-0 group-hover:opacity-30 border-border",
                )}
              />
            </div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/*Status Indicators*/}
      <div className="ml-auto flex items-center gap-2">
        {hasPendingChanges && (
          <Badge
            variant="secondary"
            className="bg-accent text-accent-foreground border-border"
          >
            <Clock className="h-3 w-3 mr-1" />
            Unsaved changes
          </Badge>
        )}

        {whiteboard && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleShareWhiteboard}
            title="Share preview link"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}

        <UserButton />
      </div>
    </header>
  );
}
