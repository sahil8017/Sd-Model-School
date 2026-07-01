import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import logo from "@/assets/logo.png";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  showCrest = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  showCrest?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      {showCrest && (
        <img
          src={logo}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-8 -bottom-8 h-48 w-48 opacity-[0.06] select-none"
        />
      )}
      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
