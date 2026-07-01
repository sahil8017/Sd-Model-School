import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { SchoolFooter } from "@/components/app/SchoolFooter";
import { ArrowRight, ShieldCheck, Users, CalendarDays, Mail, Menu, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "S. D. Model Sr. Sec. School, Karnal — Management System" },
      { name: "description", content: "Modern school management portal for S. D. Model Sr. Sec. School, Karnal." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: session.role === "admin" ? "/admin" : "/teacher" });
  }, [session, navigate]);

  if (session) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07070b] text-white">
      {/* Background: grid + radial glow */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_45%_at_50%_35%,rgba(242,24,79,0.28),transparent_70%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[#F2184F]/20 blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07070b] to-transparent" />

      {/* Spotlight floating navbar */}
      <div className="sticky top-4 z-30 px-4">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`mx-auto max-w-6xl glass-nav px-3 py-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] transition-all duration-300 ${
            mobileMenuOpen ? "rounded-2xl" : "rounded-full"
          }`}
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
              <a href="#top" className="nav-spot rounded-full px-4 py-1.5 text-xs text-white/90 hover:text-white hover:bg-white/[0.1]">Home</a>
              <a href="#features" className="nav-spot rounded-full px-4 py-1.5 text-xs text-white/90 hover:text-white hover:bg-white/[0.1]">Features</a>
              <Link to="/public/faculty" className="nav-spot rounded-full px-4 py-1.5 text-xs text-white/90 hover:text-white hover:bg-white/[0.1]">Faculty</Link>
              <Link to="/public/calendar" className="nav-spot rounded-full px-4 py-1.5 text-xs text-white/90 hover:text-white hover:bg-white/[0.1]">Calendar</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button className="h-9 px-4 sm:px-5 bg-crimson hover:bg-crimson/90 text-crimson-foreground text-xs sm:text-sm">
                  Go to Login <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.14] transition-colors"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Animated Mobile dropdown menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden flex flex-col gap-1 mt-2 px-2 py-3 border-t border-white/10"
              >
                <a
                  href="#top"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-spot rounded-xl px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  Home
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-spot rounded-xl px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  Features
                </a>
                <Link
                  to="/public/faculty"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-spot rounded-xl px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  Faculty
                </Link>
                <Link
                  to="/public/calendar"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-spot rounded-xl px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  Calendar
                </Link>
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.header>
      </div>

      {/* Hero */}
      <section id="top" className="relative">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-xs text-white/95 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse" />
            Academic Session 2026–27
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-white/85 bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            School Management,<br />refined.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-sm sm:text-base text-white/85"
          >
            One secure portal for the Principal and faculty — 100+ teachers, classes, attendance, marks,
            and parent communications, in one elegant workspace.
          </motion.p>


          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/login">
              <Button size="lg" className="bg-crimson hover:bg-crimson/90 text-crimson-foreground h-12 px-8 text-base">
                Go to Login <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a
              href="#features"
              className="nav-spot inline-flex h-12 items-center rounded-full border border-white/25 bg-white/[0.08] px-6 text-sm text-white/95 hover:bg-white/[0.14]"
            >
              Explore features
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative mx-auto max-w-6xl px-4 pb-24">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>Built for how the school actually runs</h2>
          <p className="mt-2 text-sm text-white/80">Two role-based portals. Real data. Gmail-powered parent notifications.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck,  title: "Secure Admin Panel",   desc: "Principal-only access to staff directory, salary emails and credentials." },
            { icon: Users,        title: "104+ Faculty Records", desc: "Complete teacher directory with subjects, classes and experience." },
            { icon: CalendarDays, title: "Holiday Calendar",     desc: "Academic calendar with the official 2026–27 schedule." },
            { icon: Mail,         title: "Gmail Notifications",  desc: "Send attendance, marks and notices to parents via Gmail." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/[0.1] hover:border-white/30 hover:shadow-[0_0_30px_-10px_rgba(242,24,79,0.5)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-crimson/25 text-white ring-1 ring-crimson/50">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-white/85">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <SchoolFooter />

    </div>
  );
}
