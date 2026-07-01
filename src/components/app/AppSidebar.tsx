import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import type { LucideIcon } from "lucide-react";

export type NavItem = { title: string; url: string; icon: LucideIcon; group?: string };

export function AppSidebar({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session } = useAuth();

  // Group items, preserving order of first appearance
  const groups: { name: string; items: NavItem[] }[] = [];
  for (const item of items) {
    const g = item.group ?? "Main";
    let bucket = groups.find((x) => x.name === g);
    if (!bucket) {
      bucket = { name: g, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(item);
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 p-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/95 p-1.5 ring-1 ring-white/20 shadow-sm shrink-0">
            <img src={logo} alt="S. D. Model Sr. Sec. School" className="h-full w-auto object-contain" />
          </span>
          <span className="text-sm font-semibold text-sidebar-foreground leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            S. D. Model Sr. Sec. School
            <span className="block text-[10px] font-normal text-sidebar-foreground/60">{label}</span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.name}>
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.name}
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.url || (item.url !== "/admin" && item.url !== "/teacher" && pathname.startsWith(item.url));
                  const exactRoot =
                    (item.url === "/admin" && pathname === "/admin") ||
                    (item.url === "/teacher" && pathname === "/teacher");
                  const isActive = active || exactRoot;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.url} className="flex items-center gap-2 transition-colors">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-3 py-3">
          <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50">Signed in as</div>
          <div className="mt-1 text-sm font-medium text-sidebar-foreground truncate">{session?.name}</div>
          <div className="text-[11px] text-sidebar-foreground/60 truncate">{session?.email}</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
