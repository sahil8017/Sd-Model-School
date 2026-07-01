import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { LayoutDashboard, Users, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("sdmodel.session");
      if (!raw) throw redirect({ to: "/login" });
      const s = JSON.parse(raw);
      if (s.role !== "admin") throw redirect({ to: "/login" });
    } catch (e) {
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

const items = [
  { title: "Dashboard",         url: "/admin",            icon: LayoutDashboard, group: "Overview"   },
  { title: "Teacher Directory", url: "/admin/teachers",   icon: Users,           group: "Management" },
  { title: "School Calendar",   url: "/admin/calendar",   icon: CalendarDays,    group: "Management" },
];

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar items={items} label="Admin Panel" />
        <SidebarInset className="app-bg">
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
