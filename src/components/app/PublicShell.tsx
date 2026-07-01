import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { SchoolFooter } from "@/components/app/SchoolFooter";
import { ArrowRight } from "lucide-react";

/**
 * Shared marketing/public shell used by the landing page and the public
 * (no-login) Faculty & Calendar routes. Keeps header, nav, and background
 * mood identical so navigating between them feels like one site.
 */
export function PublicShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: "home" | "faculty" | "calendar";
}) {
  const navLinks: { label: string; href: string; key: "home" | "faculty" | "calendar"; to?: string }[] = [
    { label: "Home", href: "/", key: "home", to: "/" },
    { label: "Faculty", href: "/public/faculty", key: "faculty", to: "/public/faculty" },
    { label: "Calendar", href: "/public/calendar", key: "calendar", to: "/public/calendar" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07070b] text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_45%_at_50%_15%,rgba(242,24,79,0.22),transparent_70%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[#F2184F]/15 blur-[120px]" />

      <div className="sticky top-4 z-30 px-4">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-6xl glass-nav rounded-full px-3 py-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/90 p-1.5 shadow-sm ring-1 ring-white/10">
                <img src={logo} alt="S. D. Model Sr. Sec. School" className="h-full w-auto object-contain" />
              </span>
              <span className="hidden sm:block leading-tight">
                <span className="block text-sm font-semibold text-white" style={{ fontFamily: "var(--font-serif)" }}>S. D. Model Sr. Sec. School</span>
                <span className="block text-[10px] text-white/80">Sr. Sec. School · Karnal</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10">
              {navLinks.map((l) => {
                const isActive = active === l.key;
                return (
                  <Link
                    key={l.key}
                    to={l.to!}
                    className={`nav-spot rounded-full px-4 py-1.5 text-xs transition-colors ${
                      isActive ? "bg-white/[0.14] text-white" : "text-white/85 hover:text-white hover:bg-white/[0.1]"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            <Link to="/login">
              <Button className="h-9 px-5 bg-crimson hover:bg-crimson/90 text-crimson-foreground">
                Go to Login <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.header>
      </div>

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {children}
      </main>

      <SchoolFooter />
    </div>
  );
}
