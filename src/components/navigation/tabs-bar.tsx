"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  title: string;
  isDirty?: boolean;
  type: "note" | "home";
}

interface TabsBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function TabsBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}: TabsBarProps) {
  return (
    <div className="flex items-center bg-muted/30 border-b border-border min-h-[35px] overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "group flex items-center gap-2 px-3 py-1.5 border-r border-border/50 cursor-pointer select-none min-w-0 max-w-[200px] relative",
            "hover:bg-muted/50 transition-colors",
            activeTabId === tab.id &&
              "bg-background border-b-2 border-b-primary",
          )}
          onClick={() => onTabClick(tab.id)}
        >
          <span className="text-sm truncate flex-1">
            {tab.title}
            {tab.isDirty && (
              <span className="ml-1 text-muted-foreground">•</span>
            )}
          </span>
          <button
            className={cn(
              "opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 rounded-sm p-0.5 transition-opacity",
              activeTabId === tab.id && "opacity-100",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
