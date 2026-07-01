import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { PageFade } from "@/components/app/PageFade";
import { WidgetSkeleton } from "@/components/app/TableSkeleton";
import { useAuth, useDelayedReady } from "@/lib/auth";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { holidays } from "@/data/holidays";
import { Users, UserCheck, CalendarDays, UserPlus, KeyRound, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function daysUntil(dateStr: string, now: Date) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

type Stats = { totalTeachers: number; totalStudents: number; todayPresent: number; todayAbsent: number };

function AdminDashboard() {
  const { session } = useAuth();
  const president = "Sh. Rahul Katyal";
  const ready = useDelayedReady(500);
  const [stats, setStats] = useState<Stats>({ totalTeachers: 0, totalStudents: 0, todayPresent: 0, todayAbsent: 0 });

  useEffect(() => {
    apiGet<Stats>("/api/stats").then(setStats).catch(() => {});
  }, []);

  // Use a fixed "today" for the SSR build to avoid hydration mismatch. The
  // dashboard always references the 2026–27 academic year.
  const referenceToday = new Date("2026-07-01T00:00:00");
  const upcoming = holidays
    .map((h) => ({ ...h, in: daysUntil(h.date, referenceToday) }))
    .filter((h) => h.in >= 0)
    .slice(0, 5);
  const nextHoliday = upcoming[0];

  return (
    <>
      <AppHeader title={`Welcome, Principal ${session?.name ?? ""}`} subtitle={`President: ${president}`} />
      <PageFade>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!ready ? (
            <>
              <WidgetSkeleton /><WidgetSkeleton /><WidgetSkeleton />
            </>
          ) : (
            <>
              <StatCard icon={Users} label="Total Staff" value={String(stats.totalTeachers)} accent />
              <StatCard icon={UserCheck} label="Total Students" value={String(stats.totalStudents)} />
              <StatCard
                icon={CalendarDays}
                label="Next Holiday"
                value={nextHoliday ? `${nextHoliday.in}d` : "—"}
                hint={nextHoliday?.name}
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <section className="rounded-lg border bg-card shadow-sm">
          <header className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Quick Actions</h2>
            <p className="text-xs text-muted-foreground">Common tasks</p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
            <QuickAction to="/admin/teachers" icon={UserPlus}    label="Add a teacher"       hint="Open the directory"      />
            <QuickAction to="/admin/calendar" icon={CalendarDays} label="Review calendar"    hint="Plan academic year"      />
            <QuickAction to="/admin/teachers" icon={KeyRound}    label="Send credentials"    hint="Email login to all staff" />
          </div>
        </section>

        <section className="rounded-lg border bg-card shadow-sm">
          <header className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Upcoming Holidays</h2>
            <p className="text-xs text-muted-foreground">Academic year 2026–27</p>
          </header>
          <ul className="divide-y">
            {upcoming.map((h) => (
              <li key={h.date} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{h.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(h.date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}
                    {" · in "}
                    <span className="font-medium text-foreground/80">{h.in} day{h.in === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  h.type === "national" ? "bg-crimson/10 text-crimson" : h.type === "festival" ? "bg-amber-500 text-white" : "bg-brand/10 text-brand"
                }`}>{h.type}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      </PageFade>
    </>
  );
}

function StatCard({ icon: Icon, label, value, accent, hint }: { icon: typeof Users; label: string; value: string; accent?: boolean; hint?: string }) {
  return (
    <div className={`card-soft p-5 ${accent ? "border-l-4 border-l-crimson" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="chip-icon">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold leading-tight">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, hint }: { to: string; icon: typeof Users; label: string; hint: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 px-4 py-4 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:bg-muted/60"
    >
      <div className="chip-icon-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-[11px] text-muted-foreground truncate">{hint}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

