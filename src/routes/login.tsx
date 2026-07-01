import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth, detectRole } from "@/lib/auth";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, GraduationCap, ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — S. D. Model Sr. Sec. School, Karnal" },
      { name: "description", content: "Sign in to the S. D. Model Sr. Sec. School Management portal." },
    ],
  }),
  component: Login,
});

function Login() {
  const { login, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: session.role === "admin" ? "/admin" : "/teacher" });
  }, [session, navigate]);

  if (session) return null;

  const detected = detectRole(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(`Signed in as ${result.role === "admin" ? "Principal" : "Teacher"}`);
    navigate({ to: result.role === "admin" ? "/admin" : "/teacher" });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#07070b] text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_45%_at_50%_15%,rgba(242,24,79,0.22),transparent_70%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[#F2184F]/15 blur-[120px]" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md rounded-xl bg-card text-foreground shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-b from-brand to-[oklch(0.2_0.04_265)] p-6 border-b border-white/10 flex items-center justify-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-md bg-white/95 p-1.5 shadow-md ring-1 ring-white/20">
            <img src={logo} alt="S. D. Model Sr. Sec. School, Karnal" className="h-full w-auto object-contain" />
          </span>
        </div>
        <div className="p-6 sm:p-8">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to home
          </Link>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your school email. We'll route you to the right portal.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">School email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@sdmodelkarnal.edu"
                  className="pl-9 h-11"
                />
              </div>
              {detected && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {detected === "admin" ? (
                    <><ShieldCheck className="h-3 w-3 text-crimson" /> Detected: Admin (Principal)</>
                  ) : (
                    <><GraduationCap className="h-3 w-3 text-brand" /> Detected: Teacher portal</>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-crimson hover:bg-crimson/90 text-crimson-foreground">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
            </Button>

          </form>
        </div>
      </motion.div>
    </div>
  );
}
