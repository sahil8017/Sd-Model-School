import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { setToken, clearToken, getToken } from "@/lib/api";

export type Role = "admin" | "teacher";

export type Session = {
  role:           Role;
  id:             string;       // MongoDB ObjectId
  name:           string;
  email:          string;
  classes_taught: string[];     // teacher's assigned classes (empty for admin)
};

const SESSION_KEY   = "sdmodel.session";
const SCHOOL_DOMAIN = "@sdmodelkarnal.edu";

export function detectRole(email: string): Role | null {
  const e = email.trim().toLowerCase();
  if (!e.endsWith(SCHOOL_DOMAIN)) return null;
  return e === `admin${SCHOOL_DOMAIN}` ? "admin" : "teacher";
}

function isValidSession(raw: unknown): raw is Session {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as Record<string, unknown>;
  return (
    (s.role === "admin" || s.role === "teacher") &&
    typeof s.id    === "string" && s.id.length > 0 &&
    typeof s.name  === "string" && s.name.length > 0 &&
    typeof s.email === "string" && (s.email as string).endsWith(SCHOOL_DOMAIN)
  );
}

type LoginResult = { ok: true; role: Role } | { ok: false; error: string };

type AuthCtx = {
  session:  Session | null;
  loading:  boolean;
  login:    (email: string, password: string) => Promise<LoginResult>;
  logout:   () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);   // true until localStorage is read

  const clearSession = useCallback(() => {
    setSession(null);
    clearToken();
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }, []);

  useEffect(() => {
    // Restore persisted session
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidSession(parsed)) setSession(parsed);
        else localStorage.removeItem(SESSION_KEY);
      }
    } catch {}
    setLoading(false);

    // Cross-tab sign-out
    function onStorage(e: StorageEvent) {
      if (e.key !== SESSION_KEY) return;
      if (e.newValue === null) {
        setSession(null);
        clearToken();
        toast.info("You were signed out from another tab.");
        window.location.href = "/login";
      } else {
        try {
          const parsed = JSON.parse(e.newValue);
          if (isValidSession(parsed)) setSession(parsed);
        } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login(email: string, password: string): Promise<LoginResult> {
    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Login failed" };

      // Persist JWT
      setToken(data.token);

      const s: Session = {
        role:           data.role,
        id:             String(data.id),
        name:           data.name,
        email:          data.email,
        classes_taught: data.classes_taught ?? [],
      };
      setSession(s);
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
      return { ok: true, role: data.role };
    } catch {
      return { ok: false, error: "Cannot connect to server. Make sure the backend is running." };
    }
  }

  function logout() { clearSession(); }

  return (
    <Ctx.Provider value={{ session, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

export function useDelayedReady(ms = 500) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ready;
}
