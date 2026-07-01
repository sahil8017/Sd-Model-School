import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { DataTableShell } from "@/components/app/DataTableShell";
import { PageFade } from "@/components/app/PageFade";
import { TableSkeleton } from "@/components/app/TableSkeleton";
import { HashAvatar } from "@/components/app/HashAvatar";
import { EmptyState } from "@/components/app/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Trash2, Wand2, Copy, Users, Loader2, Mail, IndianRupee, KeyRound, Send } from "lucide-react";
import { generatePassword, generateSchoolEmail } from "@/lib/credentials";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { sendSalaryEmail, sendCredentialsEmail, resetAndEmailCredentials, bulkSendAllCredentials } from "@/lib/email";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/teachers")({
  component: TeacherDirectory,
});

type Teacher = {
  id: string; _id?: string;
  name: string; designation: string;
  subjects_taught: string[]; classes_taught: string[];
  total_experience_years: number;
  school_email: string; phone_number?: string;
  date_joined_school?: string; salary_amount?: number;
};

function TeacherDirectory() {
  const [list, setList]           = useState<Teacher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState("");
  const [designation, setDesignation] = useState("all");
  const [addOpen, setAddOpen]       = useState(false);
  const [deleting, setDeleting]     = useState<Teacher | null>(null);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [paying, setPaying]           = useState<Teacher | null>(null);
  const [payMonth, setPayMonth]       = useState(() => new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }));
  const [sendingPay, setSendingPay]   = useState(false);
  const [sendingCreds, setSendingCreds] = useState<string | null>(null);
  const [bulkSending, setBulkSending]   = useState(false);

  async function load() {
    try {
      const data = await apiGet<Teacher[]>("/api/teachers");
      setList(data);
    } catch (err) {
      toast.error("Failed to load teachers", { description: (err as Error).message });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const designations = useMemo(() => ["all", ...Array.from(new Set(list.map((t) => t.designation).filter(Boolean)))], [list]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return list.filter((x) => {
      if (designation !== "all" && x.designation !== designation) return false;
      if (!t) return true;
      return (
        x.name.toLowerCase().includes(t) ||
        (x.subjects_taught ?? []).join(" ").toLowerCase().includes(t) ||
        (x.classes_taught  ?? []).join(" ").toLowerCase().includes(t) ||
        (x.school_email    ?? "").toLowerCase().includes(t)
      );
    });
  }, [list, q, designation]);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await apiDelete(`/api/teachers/${deleting.id || deleting._id}`);
      setList((p) => p.filter((t) => (t.id || t._id) !== (deleting.id || deleting._id)));
      toast.success(`${deleting.name} removed`);
    } catch (err) {
      toast.error("Delete failed", { description: (err as Error).message });
    } finally { setDeleting(null); }
  }

  return (
    <>
      <AppHeader title="Teacher Directory" subtitle={`${list.length} faculty members`} />
      <PageFade>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, subject, class…" className="pl-9 sm:w-72" />
            </div>
            <Select value={designation} onValueChange={setDesignation}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Designation" /></SelectTrigger>
              <SelectContent>
                {designations.map((d) => <SelectItem key={d} value={d}>{d === "all" ? "All designations" : d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="h-10 border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              disabled={bulkSending}
              onClick={async () => {
                if (!confirm("Reset ALL teacher passwords and email credentials to the school inbox?")) return;
                setBulkSending(true);
                await bulkSendAllCredentials();
                setBulkSending(false);
              }}
            >
              {bulkSending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Send All Credentials
            </Button>
            <Button onClick={() => setAddOpen(true)} className="bg-crimson hover:bg-crimson/90 text-crimson-foreground h-10">
              <Plus className="mr-1 h-4 w-4" /> Add Teacher
            </Button>
          </div>
        </div>

        {loading ? <TableSkeleton rows={8} cols={7} /> : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No teachers found" description="Add your first teacher using the button above." showCrest />
        ) : (
        <DataTableShell minWidth={1100}>
          <Table>
            <TableHeader>
              <TableRow className="bg-brand hover:bg-brand">
                {["Faculty","Designation","Subjects","Classes","Exp.","School Email","Actions"].map((h) => (
                  <TableHead key={h} className="text-brand-foreground font-semibold uppercase text-[11px] tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id || t._id}>
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <HashAvatar name={t.name} />
                      <span className="font-medium truncate">{t.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{t.designation || "—"}</span></TableCell>
                  <TableCell className="text-sm">{(t.subjects_taught ?? []).join(", ") || "—"}</TableCell>
                  <TableCell className="text-sm">{(t.classes_taught  ?? []).join(", ") || "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{t.total_experience_years ?? 0} yrs</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">{t.school_email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setEditTarget(t)}>
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="h-8 border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        disabled={sendingCreds === (t.id || t._id)}
                        onClick={async () => {
                          const id = t.id || t._id!;
                          setSendingCreds(id);
                          await resetAndEmailCredentials(id);
                          setSendingCreds(null);
                        }}
                      >
                        {sendingCreds === (t.id || t._id)
                          ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          : <KeyRound className="mr-1 h-3 w-3" />}
                        Credentials
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 border-crimson/40 text-crimson hover:bg-crimson/10" onClick={() => setPaying(t)}>
                        <IndianRupee className="mr-1 h-3 w-3" /> Salary
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setDeleting(t)}>
                        <Trash2 className="mr-1 h-3 w-3" /> Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableShell>
        )}
      </div>
      </PageFade>

      <TeacherFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={(t) => { setList((p) => [t, ...p]); }}
        mode="add"
      />
      <TeacherFormDialog
        open={!!editTarget}
        onOpenChange={(o) => { if (!o) setEditTarget(null); }}
        onSaved={(t) => { setList((p) => p.map((x) => (x.id || x._id) === (t.id || t._id) ? t : x)); setEditTarget(null); }}
        mode="edit"
        initial={editTarget ?? undefined}
      />

      {/* Salary email dialog */}
      <AlertDialog open={!!paying} onOpenChange={(o) => { if (!o) setPaying(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-crimson" /> Send Salary Email</AlertDialogTitle>
            <AlertDialogDescription>
              Send salary notification email to <strong className="text-foreground">{paying?.name}</strong>
              {paying?.salary_amount ? ` (₹${Number(paying.salary_amount).toLocaleString("en-IN")})` : ""}.
              <div className="mt-2">
                <Label className="text-xs">Month</Label>
                <input
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  placeholder="e.g. July 2026"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingPay}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendingPay}
              onClick={async () => {
                if (!paying) return;
                setSendingPay(true);
                await sendSalaryEmail(paying.id || paying._id!, paying.salary_amount ?? 0, payMonth);
                setSendingPay(false);
                setPaying(null);
              }}
              className="bg-crimson hover:bg-crimson/90 text-crimson-foreground"
            >
              {sendingPay ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : "Send Email"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teacher account. Their students will be unlinked but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TeacherFormDialog({
  open, onOpenChange, onSaved, mode, initial,
}: {
  open: boolean; onOpenChange: (b: boolean) => void;
  onSaved: (t: Teacher) => void;
  mode: "add" | "edit"; initial?: Teacher;
}) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [designation, setDesig] = useState(initial?.designation ?? "PGT");
  const [subjects, setSubjects] = useState((initial?.subjects_taught ?? []).join(", "));
  const [classes, setClasses]   = useState((initial?.classes_taught  ?? []).join(", "));
  const [exp, setExp]           = useState(String(initial?.total_experience_years ?? 5));
  const [phone, setPhone]       = useState(initial?.phone_number ?? "");
  const [salary, setSalary]     = useState(String(initial?.salary_amount ?? ""));
  const [joined, setJoined]     = useState(initial?.date_joined_school ?? "");
  const [email, setEmail]       = useState(initial?.school_email ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name); setDesig(initial.designation ?? "PGT");
      setSubjects((initial.subjects_taught ?? []).join(", "));
      setClasses((initial.classes_taught  ?? []).join(", "));
      setExp(String(initial.total_experience_years ?? 5));
      setPhone(initial.phone_number ?? ""); setSalary(String(initial.salary_amount ?? ""));
      setJoined(initial.date_joined_school ?? ""); setEmail(initial.school_email ?? "");
      setPassword("");
    }
  }, [initial]);

  function generate() {
    if (!name.trim()) { toast.error("Enter the teacher's full name first"); return; }
    setEmail(generateSchoolEmail(name));
    setPassword(generatePassword(12));
    toast.success("Credentials generated");
  }

  function copy(text: string) { navigator.clipboard.writeText(text).then(() => toast.success("Copied")); }

  async function submit() {
    if (!name.trim() || !joined) { toast.error("Name and joining date are required"); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name, designation: designation || "Teacher",
        classes_taught:  JSON.stringify(classes.split(",").map((s) => s.trim()).filter(Boolean)),
        subjects_taught: JSON.stringify(subjects.split(",").map((s) => s.trim()).filter(Boolean)),
        total_experience_years: exp,
        phone_number: phone,
        salary_amount: salary,
        date_joined_school: joined,
      };
      let saved: Teacher;
      if (mode === "add") {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
        const res = await fetch("/api/teachers", {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("sdmodel.token") ?? ""}` },
          body: formData,
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
        saved = await res.json();
        const genPw = (saved as Teacher & { generated_password?: string }).generated_password;
        toast.success("Teacher added", { description: `Email: ${saved.school_email}  Password: ${genPw ?? "—"}` });
        if (genPw && (saved._id || saved.id)) {
          sendCredentialsEmail((saved._id || saved.id)!, genPw);
        }
      } else {
        saved = await apiPut<Teacher>(`/api/teachers/${initial!.id || initial!._id}`, payload);
        toast.success("Teacher updated");
      }
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save teacher", { description: (err as Error).message });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === "add" ? "Add New Teacher" : "Edit Teacher"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Label>Full Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mrs. Anjali Verma" /></div>
          <div><Label>Designation</Label><Input value={designation} onChange={(e) => setDesig(e.target.value)} placeholder="PGT" /></div>
          <div><Label>Experience (yrs)</Label><Input type="number" value={exp} onChange={(e) => setExp(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Subjects (comma-separated)</Label><Input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="English, History" /></div>
          <div className="sm:col-span-2"><Label>Classes (comma-separated)</Label><Input value={classes} onChange={(e) => setClasses(e.target.value)} placeholder="10-A, 11-B" /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98XXXXXXXX" /></div>
          <div><Label>Salary (₹)</Label><Input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Date Joined *</Label><Input type="date" value={joined} onChange={(e) => setJoined(e.target.value)} /></div>
          {mode === "add" && (
            <div className="sm:col-span-2 rounded-lg border-2 border-dashed border-crimson/40 bg-crimson/5 p-3">
              <Button type="button" onClick={generate} className="w-full bg-crimson hover:bg-crimson/90 text-crimson-foreground">
                <Wand2 className="mr-2 h-4 w-4" /> Generate School Email &amp; Password
              </Button>
              {email && (
                <div className="mt-3 space-y-2 text-sm">
                  <CredRow label="Email"    value={email}    onCopy={() => copy(email)} />
                  <CredRow label="Password" value={password} onCopy={() => copy(password)} mono />
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-brand hover:bg-brand/90 text-brand-foreground">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save Teacher"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredRow({ label, value, onCopy, mono }: { label: string; value: string; onCopy: () => void; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <code className={`flex-1 truncate rounded bg-background px-2 py-1 text-xs ${mono ? "font-mono" : ""}`}>{value}</code>
      <button onClick={onCopy} aria-label={`Copy ${label}`} className="shrink-0 rounded p-1 hover:bg-muted">
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
