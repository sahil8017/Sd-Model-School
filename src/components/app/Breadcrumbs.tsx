import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  admin: "Admin",
  teacher: "Teacher",
  teachers: "Teacher Directory",
  calendar: "School Calendar",
  students: "Student Roster",
  attendance: "Daily Attendance",
  gradebook: "Gradebook",
  complaints: "Send Notice",
  profile: "My Profile",
  public: "Public",
  faculty: "Faculty",
};


function pretty(seg: string) {
  return LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const root = segments[0] === "admin" || segments[0] === "teacher" ? `/${segments[0]}` : "/";

  const crumbs = segments.map((seg, i) => ({
    href: "/" + segments.slice(0, i + 1).join("/"),
    label: pretty(seg),
    last: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
      <Link to={root} className="inline-flex items-center gap-1 hover:text-foreground transition-colors shrink-0">
        <Home className="h-3 w-3" />
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="inline-flex items-center gap-1 min-w-0">
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
          {c.last ? (
            <span className="text-foreground/80 truncate">{c.label}</span>
          ) : (
            <Link to={c.href} className="hover:text-foreground transition-colors truncate">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
