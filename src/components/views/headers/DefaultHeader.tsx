// Default Header for non-note / whiteboard views

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileText, Home } from "lucide-react";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { UserButton } from "@clerk/nextjs";

export default function DefaultHeader() {
  const { currentView } = usePreferencesStore();

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
              {currentView.toLowerCase()}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* User Button for non-note views */}
      <div className="ml-auto">
        <UserButton />
      </div>
    </header>
  );
}
