import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { DataTableShell } from "@/components/app/DataTableShell";
import { PageFade } from "@/components/app/PageFade";
import { TableSkeleton } from "@/components/app/TableSkeleton";
import { HashAvatar } from "@/components/app/HashAvatar";
import { EmptyState } from "@/components/app/EmptyState";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { getStudentsForClass } from "@/data/students";
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
import { Plus, Search, Pencil, Trash2, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/students")({
  component: StudentRoster,
});

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  "A":  "bg-green-100  text-green-800  dark:bg-green-950/50  dark:text-green-300",
  "B+": "bg-blue-100   text-blue-800   dark:bg-blue-950/50   dark:text-blue-300",
  "B":  "bg-sky-100    text-sky-800    dark:bg-sky-950/50    dark:text-sky-300",
  "C":  "bg-amber-100  text-amber-800  dark:bg-amber-950/50  dark:text-amber-300",
  "D":  "bg-red-100    text-red-800    dark:bg-red-950/50    dark:text-red-300",
};

type Student = {
  _id?: string; id?: string;
  roll_no?: number;
  name: string; age?: number; address?: string;
  parent_guardian_phone: string; parent_email?: string;
  overall_grade?: string;
  class_name: string;
};

function StudentRoster() {
  const { session }           = useAuth();
  const classes               = session?.classes_taught ?? [];
  const [cls, setCls]         = useState<string>(classes[0] ?? "");
  const [list, setList]       = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [q, setQ]             = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);

  const loadClass = useCallback(async (className: string) => {
    if (!className) return;
    setLoading(true);
    try {
      const data = await apiGet<Student[]>(`/api/students?class_name=${encodeURIComponent(className)}`);
      if (data.length > 0) {
        setList(data);
      } else {
        // Auto-seed generated students for this class
        setSeeding(true);
        const generated = getStudentsForClass(className);
        const created = await Promise.allSettled(
          generated.map(s => apiPost<Student>("/api/students", s))
        );
        const saved = created
          .filter((r): r is PromiseFulfilledResult<Student> => r.status === "fulfilled")
          .map(r => r.value);
        setList(saved.length > 0 ? saved : generated.map((s, i) => ({ ...s, id: `local_${i}` })));
        setSeeding(false);
        toast.success(`30 students loaded for Class ${className}`);
      }
    } catch (err) {
      toast.error("Failed to load students", { description: (err as Error).message });
    } finally { setLoading(false); setSeeding(false); }
  }, []);

  useEffect(() => { loadClass(cls); }, [cls, loadClass]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(s =>
      s.name.toLowerCase().includes(t) ||
      (s.address ?? "").toLowerCase().includes(t) ||
      String(s.roll_no ?? "").includes(t)
    );
  }, [list, q]);

  async function handleDelete() {
    if (!deleting) return;
    const sid = deleting._id || deleting.id;
    try {
      await apiDelete(`/api/students/${sid}`);
      setList(p => p.filter(s => (s._id || s.id) !== sid));
      toast.success(`${deleting.name} removed`);
    } catch (err) {
      toast.error("Delete failed", { description: (err as Error).message });
    } finally { setDeleting(null); }
  }

  const isLoading = loading || seeding;

  return (
    <>
      <AppHeader
        title="Student Roster"
        subtitle={cls ? `Class ${cls} — ${list.length} students` : "Select a class"}
      />
      <PageFade>
      <div className="p-4 sm:p-6 space-y-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            {classes.length > 0 ? (
              <Select value={cls} onValueChange={v => { setCls(v); setQ(""); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">No classes assigned</span>
            )}
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or address…" className="pl-9 w-60" />
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-crimson hover:bg-crimson/90 text-crimson-foreground h-10 shrink-0">
            <Plus className="mr-1 h-4 w-4" /> Add Student
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : !cls ? (
          <EmptyState icon={GraduationCap} title="Select a class" description="Choose a class from the dropdown above." showCrest />
        ) : filtered.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students found" description={q ? "Try a different search." : "Add students using the button above."} showCrest />
        ) : (
          <DataTableShell minWidth={900}>
            <Table>
              <TableHeader>
                <TableRow className="bg-brand hover:bg-brand">
                  {["Roll","Student","Age","Address","Parent Phone","Email ID","Grade",""].map((h, i) => (
                    <TableHead key={i} className="text-brand-foreground font-semibold uppercase text-[11px] tracking-wider">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, i) => (
                  <TableRow key={s._id || s.id || i}>
                    <TableCell className="font-mono font-semibold text-sm w-12">{s.roll_no ?? i + 1}</TableCell>
                    <TableCell className="min-w-[160px]">
                      <div className="flex items-center gap-2.5">
                        <HashAvatar name={s.name} size={32} />
                        <span className="font-medium whitespace-nowrap">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground w-12">{s.age ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{s.address || "—"}</TableCell>
                    <TableCell className="text-sm font-mono whitespace-nowrap">{s.parent_guardian_phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{s.parent_email || "—"}</TableCell>
                    <TableCell className="w-14">
                      {s.overall_grade ? (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${GRADE_COLORS[s.overall_grade] ?? "bg-muted text-muted-foreground"}`}>
                          {s.overall_grade}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="w-20">
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setEditing(s)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setDeleting(s)}>
                          <Trash2 className="h-3 w-3" />
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

      <StudentFormDialog
        open={addOpen} onOpenChange={setAddOpen}
        mode="add" defaultClass={cls}
        onSaved={s => { setList(p => [...p, s]); toast.success("Student added"); }}
      />
      <StudentFormDialog
        open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}
        mode="edit" initial={editing ?? undefined}
        onSaved={s => {
          setList(p => p.map(x => (x._id || x.id) === (s._id || s.id) ? s : x));
          setEditing(null);
          toast.success("Student updated");
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will also delete their attendance and grade records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StudentFormDialog({
  open, onOpenChange, mode, initial, defaultClass = "", onSaved,
}: {
  open: boolean; onOpenChange: (b: boolean) => void;
  mode: "add" | "edit"; initial?: Student; defaultClass?: string;
  onSaved: (s: Student) => void;
}) {
  const [name, setName]     = useState(initial?.name ?? "");
  const [age, setAge]       = useState(String(initial?.age ?? ""));
  const [cls, setCls]       = useState(initial?.class_name ?? defaultClass);
  const [roll, setRoll]     = useState(String(initial?.roll_no ?? ""));
  const [phone, setPhone]   = useState(initial?.parent_guardian_phone ?? "");
  const [pEmail, setPEmail] = useState(initial?.parent_email ?? "");
  const [addr, setAddr]     = useState(initial?.address ?? "");
  const [grade, setGrade]   = useState(initial?.overall_grade ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name); setAge(String(initial.age ?? ""));
      setCls(initial.class_name); setRoll(String(initial.roll_no ?? ""));
      setPhone(initial.parent_guardian_phone); setPEmail(initial.parent_email ?? "");
      setAddr(initial.address ?? ""); setGrade(initial.overall_grade ?? "");
    } else {
      setName(""); setAge(""); setCls(defaultClass); setRoll("");
      setPhone(""); setPEmail(""); setAddr(""); setGrade("");
    }
  }, [initial, defaultClass, open]);

  async function submit() {
    if (!name.trim() || !cls || !phone) { toast.error("Name, class and parent phone are required"); return; }
    setSaving(true);
    try {
      const payload = {
        name, age, class_name: cls, roll_no: roll,
        parent_guardian_phone: phone, parent_email: pEmail,
        address: addr, overall_grade: grade,
      };
      let saved: Student;
      if (mode === "add") {
        saved = await apiPost<Student>("/api/students", payload);
      } else {
        saved = await apiPut<Student>(`/api/students/${initial!._id || initial!.id}`, payload);
      }
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save student", { description: (err as Error).message });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)]">
        <DialogHeader><DialogTitle>{mode === "add" ? "Add Student" : "Edit Student"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Full Name *</Label><Input className="mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="Arjun Sharma" /></div>
          <div><Label>Class *</Label><Input className="mt-1" value={cls} onChange={e => setCls(e.target.value)} placeholder="10-A" /></div>
          <div><Label>Roll No</Label><Input type="number" className="mt-1" value={roll} onChange={e => setRoll(e.target.value)} /></div>
          <div><Label>Age</Label><Input type="number" className="mt-1" value={age} onChange={e => setAge(e.target.value)} /></div>
          <div><Label>Grade</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>
                {["A+","A","B+","B","C","D"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Parent Phone *</Label><Input className="mt-1" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9XXXXXXXXX" /></div>
          <div><Label>Parent Email</Label><Input type="email" className="mt-1" value={pEmail} onChange={e => setPEmail(e.target.value)} /></div>
          <div className="col-span-2"><Label>Address</Label><Input className="mt-1" value={addr} onChange={e => setAddr(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-brand hover:bg-brand/90 text-brand-foreground">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
