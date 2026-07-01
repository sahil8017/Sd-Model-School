import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageFade } from "@/components/app/PageFade";
import { AvatarUpload } from "@/components/app/AvatarUpload";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, Briefcase, BookOpen, LogOut, ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/teacher/profile")({
  component: TeacherProfile,
});

function TeacherProfile() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch full teacher profile details
  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher-profile", session?.id],
    queryFn: async () => {
      const token = localStorage.getItem("sdmodel.token");
      const res = await fetch(`/api/teachers/${session?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled: !!session?.id,
  });

  const initials = (session?.name ?? "T")
    .split(" ").filter(Boolean)
    .slice(-2).map((p: string) => p[0]).join("").toUpperCase();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-crimson" />
      </div>
    );
  }

  return (
    <PageFade>
      <div className="min-h-screen p-4 sm:p-6 max-w-2xl mx-auto space-y-5">

        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden border shadow-lg">

          {/* Banner */}
          <div className="relative h-32 bg-gradient-to-r from-[#1a1a2e] via-[#1f3c4d] to-[#1d527a]">
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 text-white text-[80px] font-black select-none pointer-events-none">SD</div>
          </div>

          {/* Avatar */}
          <div className="px-6 pb-6 bg-card">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <AvatarUpload email={session?.email ?? ""} initials={initials} size={88} ring />
            </div>

            {/* Badge */}
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-crimson/50 bg-crimson/10 px-3 py-0.5 text-xs font-semibold text-crimson uppercase tracking-wide">
                <ShieldCheck className="h-3 w-3" />
                Faculty · Teacher
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight">{teacher?.name ?? session?.name ?? "Teacher"}</h2>
            <p className="text-sm text-muted-foreground mt-0.5 uppercase tracking-widest font-medium">
              {teacher?.designation || "Teacher"}
            </p>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <InfoCard icon={Mail}      label="EMAIL"      value={teacher?.school_email ?? session?.email ?? "—"} />
              <InfoCard icon={Phone}     label="PHONE"      value={teacher?.phone_number || "—"} />
              <InfoCard icon={Briefcase} label="EXPERIENCE" value={`${teacher?.total_experience_years ?? 0} years`} />
              <InfoCard icon={BookOpen}  label="SUBJECTS"   value={teacher?.subjects_taught?.join(", ") || "—"} />
            </div>
          </div>
        </div>

        {/* ── Sign out ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-card shadow-sm p-5">
          <p className="font-semibold text-base">Sign out</p>
          <p className="text-sm text-muted-foreground mt-0.5 mb-4">End your session on this device.</p>
          <Button
            variant="outline"
            className="border-crimson/40 text-crimson hover:bg-crimson/10"
            onClick={() => { logout(); navigate({ to: "/login" }); }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>

      </div>
    </PageFade>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
      <div className="h-9 w-9 shrink-0 rounded-lg bg-crimson/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-crimson" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
