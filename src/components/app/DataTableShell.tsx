import type { ReactNode } from "react";

export function DataTableShell({ children, minWidth = 900 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border/70 dark:border-white/5 bg-card dark:bg-black/20 shadow-sm">
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}
