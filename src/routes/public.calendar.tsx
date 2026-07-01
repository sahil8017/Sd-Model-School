import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PublicShell } from "@/components/app/PublicShell";
import { holidays } from "@/data/holidays";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/public/calendar")({
  head: () => ({
    meta: [
      { title: "Academic Calendar — S. D. Model Sr. Sec. School, Karnal" },
      { name: "description", content: "Holidays and key events for academic session 2026–27." },
      { property: "og:title", content: "Academic Calendar — S. D. Model Sr. Sec. School" },
      { property: "og:description", content: "Holidays and key events for academic session 2026–27." },
    ],
  }),
  component: PublicCalendar,
});

function pillClass(type: string) {
  if (type === "national") return "bg-crimson/25 text-white ring-crimson/50";
  if (type === "festival") return "bg-amber-400/20 text-amber-100 ring-amber-300/40";
  return "bg-white/[0.12] text-white/90 ring-white/20";
}

function PublicCalendar() {
  return (
    <PublicShell active="calendar">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-xs text-white/95 backdrop-blur">
          <CalendarDays className="h-3 w-3 text-crimson" /> Academic session 2026–27
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-white/85 bg-clip-text text-transparent" style={{ fontFamily: "var(--font-serif)" }}>
          School Calendar
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80">
          Festivals, national holidays, and school observances at a glance.
        </p>
      </motion.div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 600 }}>
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.05] text-left text-[11px] uppercase tracking-wider text-white/70">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Day</th>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => {
                const d = new Date(h.date);
                return (
                  <tr key={h.date} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.04] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-white">
                      {d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-white/80">{d.toLocaleDateString("en-IN", { weekday: "long" })}</td>
                    <td className="px-4 py-3 text-white">{h.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ${pillClass(h.type)}`}>
                        {h.type}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PublicShell>
  );
}
