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
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink
              href="#"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <Home className="h-3 w-3" />
              workspace
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block text-slate-400 dark:text-slate-600" />
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink
              href="#"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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
