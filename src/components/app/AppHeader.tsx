import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/app/UserMenu";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-6">
        <SidebarTrigger className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base sm:text-lg font-semibold text-foreground leading-tight" style={{ fontFamily: "var(--font-serif)" }}>{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
