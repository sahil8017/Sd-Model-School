import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { useAuth } from "@/lib/auth";
import { BookOpen, Users, ClipboardCheck, GraduationCap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/teacher/")({
  component: TeacherHome,
});

function TeacherHome() {
  const { session } = useAuth();
  const myClasses = session?.classes_taught?.length ? session.classes_taught : [];

  return (
    <>
      <AppHeader title={`Welcome, ${session?.name ?? "Teacher"}`} subtitle="Teacher Portal" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Today's tasks */}
        <section className="rounded-lg border bg-card shadow-sm">
          <header className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Today</h2>
            <p className="text-xs text-muted-foreground">Items waiting on you</p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
            <TodoLink to="/teacher/attendance" icon={ClipboardCheck} label="Mark attendance" hint={`${myClasses.length} class${myClasses.length === 1 ? "" : "es"} pending`} />
            <TodoLink to="/teacher/gradebook" icon={GraduationCap} label="Enter exam marks" hint="Open gradebook" />
            <TodoLink to="/teacher/students" icon={Users} label="Review roster" hint="View students" />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">My Classes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myClasses.map((c) => (
              <div key={c} className="rounded-lg border bg-card p-4 shadow-sm focus-within:ring-2 focus-within:ring-crimson/40 hover:shadow transition">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold">Class {c}</div>
                    <div className="text-xs text-muted-foreground truncate">Subjects</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to="/teacher/students" className="flex-1 rounded-md border px-3 py-2 text-center text-xs font-medium hover:bg-muted">View Roster</Link>
                  <Link to="/teacher/attendance" className="flex-1 rounded-md bg-crimson text-crimson-foreground px-3 py-2 text-center text-xs font-medium hover:bg-crimson/90">Take Attendance</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile icon={Users} label="Students" value="30 per class" />
          <Tile icon={ClipboardCheck} label="Attendance Today" value="Pending" />
          <Tile icon={BookOpen} label="My Classes" value={`${myClasses.length} assigned`} />
        </section>
      </div>
    </>
  );
}

function TodoLink({ to, icon: Icon, label, hint }: { to: string; icon: typeof BookOpen; label: string; hint: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-crimson/10 text-crimson">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-[11px] text-muted-foreground truncate">{hint}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Tile({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-brand-foreground"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}
