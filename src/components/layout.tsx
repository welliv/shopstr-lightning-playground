import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { FloatingActivityPanel } from "./floating-activity-panel";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-2" />
          <span className="font-semibold">Shopstr Lightning Playground</span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
        <footer className="shrink-0 border-t px-4 py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground/70 flex-wrap">
          <span className="inline-flex items-center gap-1">
            Built by
            <a
              href="https://shopstr.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg">⚡</span>
              Shopstr
            </a>
          </span>
          <span className="opacity-40">·</span>
          <a
            href="https://github.com/shopstr-eng/shopstr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            Source Code
          </a>
        </footer>
      </SidebarInset>
      <FloatingActivityPanel />
    </SidebarProvider>
  );
}
