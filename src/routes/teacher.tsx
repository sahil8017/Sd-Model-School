import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { BookOpen, ClipboardList, ClipboardCheck, GraduationCap, MessageSquareWarning } from "lucide-react";

export const Route = createFileRoute("/teacher")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("sdmodel.session");
      if (!raw) throw redirect({ to: "/login" });
      const s = JSON.parse(raw);
      if (s.role !== "teacher") throw redirect({ to: "/login" });
    } catch (e) {
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: TeacherLayout,
});

const items = [
  { title: "My Classes",       url: "/teacher",              icon: BookOpen,               group: "Overview"   },
  { title: "Student Roster",   url: "/teacher/students",     icon: ClipboardList,          group: "Classroom"  },
  { title: "Daily Attendance", url: "/teacher/attendance",   icon: ClipboardCheck,         group: "Classroom"  },
  { title: "Gradebook",        url: "/teacher/gradebook",    icon: GraduationCap,          group: "Classroom"  },
  { title: "Send Notice",      url: "/teacher/complaints",   icon: MessageSquareWarning,   group: "Communicate"},
];

function TeacherLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar items={items} label="Teacher Portal" />
        <SidebarInset className="app-bg">
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
