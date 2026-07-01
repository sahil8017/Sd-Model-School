import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PublicShell } from "@/components/app/PublicShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { initials } from "@/lib/avatar-color";

export const Route = createFileRoute("/public/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty — S. D. Model Sr. Sec. School, Karnal" },
      { name: "description", content: "Meet our 100+ teachers — name, designation, and subjects taught." },
    ],
  }),
  component: PublicFaculty,
});

type FacultyMember = {
  id: string; name: string; designation: string;
  subjects: string[]; classes: string[]; experience: number;
};

const PAGE_SIZE = 20;

function PublicFaculty() {
  const [list, setList]   = useState<FacultyMember[]>([]);
  const [q, setQ]         = useState("");
  const [page, setPage]   = useState(1);

  useEffect(() => {
    fetch("/api/teachers/public")
      .then(r => r.json())
      .then(setList)
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(x =>
      x.name.toLowerCase().includes(t) ||
      x.designation.toLowerCase().includes(t) ||
      x.subjects.join(" ").toLowerCase().includes(t)
    );
  }, [list, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <PublicShell active="faculty">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-xs text-white/95 backdrop-blur">
          <Users className="h-3 w-3 text-crimson" /> {list.length} faculty members
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-white/85 bg-clip-text text-transparent" style={{ fontFamily: "var(--font-serif)" }}>
          Our Faculty
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80">
          Principal, PGTs, TGTs and PRTs guiding S. D. Model Sr. Sec. School students every day.
        </p>
      </motion.div>

      <div className="mt-8 mx-auto max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          <Input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by name, designation, or subject…"
            className="pl-11 h-12 rounded-full bg-white/[0.06] border-white/15 text-white placeholder:text-white/50 focus-visible:ring-crimson/50"
          />
        </div>
        <div className="mt-2 text-center text-xs text-white/60">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
          {filtered.length > PAGE_SIZE && <> · page {safePage} of {totalPages}</>}
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 640 }}>
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.05] text-left text-[11px] uppercase tracking-wider text-white/70">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Designation</th>
                <th className="px-4 py-3 font-semibold">Subjects</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((t, i) => (
                <tr key={t.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.04] transition-colors">
                  <td className="px-4 py-3 text-white/50 font-mono">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="chip-icon-sm !h-8 !w-8 !rounded-full !bg-crimson/25 !text-white text-[11px] font-bold">
                        {initials(t.name)}
                      </span>
                      <span className="font-medium text-white">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-white/90 ring-1 ring-white/10">
                      {t.designation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/85">{t.subjects.join(", ") || "—"}</td>
                </tr>
              ))}
              {slice.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-white/60">
                  {list.length === 0 ? "Loading…" : "No matching faculty."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
            className="border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-xs text-white/70 px-3">Page {safePage} / {totalPages}</span>
          <Button variant="outline" disabled={safePage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </PublicShell>
  );
}
