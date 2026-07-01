import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { DataTableShell } from "@/components/app/DataTableShell";
import { PageFade } from "@/components/app/PageFade";
import { TableSkeleton } from "@/components/app/TableSkeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { useAuth, useDelayedReady } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { sendAttendanceEmails, downloadAttendanceCSV } from "@/lib/email";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send, CheckCircle2, XCircle, CheckCheck, Users, Loader2, Mail, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/attendance")({
  component: Attendance,
});

type Student = { _id?: string; id?: string; name: string; class_name: string; roll_no?: number; parent_guardian_phone: string };
type Entry   = { present: boolean; marks: string };

function Attendance() {
  const { session } = useAuth();
  const classes     = session?.classes_taught ?? [];
  const [cls, setCls] = useState<string>(classes[0] ?? "");
  const ready       = useDelayedReady(400);
  const [students, setStudents]   = useState<Student[]>([]);
  const [loadingStudents, setLS]  = useState(false);
  const [state, setState]         = useState<Record<string, Entry>>({});
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [emailingParents, setEmailing]  = useState(false);

  // Load students when class changes
  useEffect(() => {
    if (!cls) return;
    setLS(true);
    apiGet<Student[]>(`/api/students?class_name=${encodeURIComponent(cls)}`)
      .then((data) => {
        setStudents(data);
        setState(Object.fromEntries(data.map((s) => [s._id || s.id!, { present: true, marks: "" }])));
      })
      .catch((err) => toast.error("Failed to load students", { description: err.message }))
      .finally(() => setLS(false));
  }, [cls]);

  function update(id: string, patch: Partial<Entry>) {
    setState((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
  }
  function markAllPresent() {
    setState((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { ...v, present: true }])));
  }

  const presentCount = Object.values(state).filter((e) => e.present).length;
  const absentCount  = students.length - presentCount;
  const today        = new Date().toISOString().split("T")[0];

  async function submit() {
    setSubmitting(true);
    try {
      const records = students.map((s) => {
        const sid = s._id || s.id!;
        return { student_id: sid, status: (state[sid]?.present ?? true) ? "Present" : "Absent" };
      });
      await apiPost("/api/attendance", { date: today, records });
      toast.success(`Attendance saved for ${students.length} students`);
      setConfirmOpen(false);
    } catch (err) {
      toast.error("Failed to save attendance", { description: (err as Error).message });
    } finally { setSubmitting(false); }
  }

  return (
    <>
      <AppHeader title="Daily Attendance" subtitle={`${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`} />
      <PageFade>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-3 items-center">
            {classes.length > 0 ? (
              <Select value={cls} onValueChange={setCls}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">No classes assigned</span>
            )}
            <Button variant="outline" size="sm" onClick={markAllPresent} className="h-9">
              <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all present
            </Button>
          </div>
        </div>

        {!ready || loadingStudents ? <TableSkeleton rows={8} cols={5} /> : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={cls ? `No students in Class ${cls}` : "Select a class above"}
            description="Add students to the roster before marking attendance."
            showCrest
          />
        ) : (
        <DataTableShell minWidth={720}>
          <Table>
            <TableHeader>
              <TableRow className="bg-brand hover:bg-brand">
                {["Roll","Student","Parent Phone","Status","Exam Marks"].map((h) => (
                  <TableHead key={h} className="text-brand-foreground font-semibold uppercase text-[11px] tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => {
                const sid = s._id || s.id!;
                const e   = state[sid] ?? { present: true, marks: "" };
                return (
                  <TableRow key={sid}>
                    <TableCell className="font-mono font-semibold">{s.roll_no ?? i + 1}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{s.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.parent_guardian_phone}</TableCell>
                    <TableCell>
                      <button
                        type="button" role="switch" aria-checked={e.present}
                        aria-label={`Toggle attendance for ${s.name}`}
                        onClick={() => update(sid, { present: !e.present })}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                          e.present
                            ? "bg-success text-success-foreground hover:bg-success/90"
                            : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        }`}
                      >
                        {e.present ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {e.present ? "Present" : "Absent"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} max={100}
                        value={e.marks}
                        onChange={(ev) => update(sid, { marks: ev.target.value })}
                        placeholder="—" aria-label={`Marks for ${s.name}`}
                        className="h-9 w-24"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTableShell>
        )}

        {students.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setConfirmOpen(true)}
              className="flex-1 h-12 text-base bg-crimson hover:bg-crimson/90 text-crimson-foreground shadow-lg shadow-crimson/20"
            >
              <Send className="mr-2 h-4 w-4" /> Save Attendance
            </Button>
            <Button
              variant="outline"
              className="h-12 border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              disabled={emailingParents}
              onClick={async () => {
                setEmailing(true);
                const records = students.map((s) => {
                  const sid = s._id || s.id!;
                  return { student_id: sid, status: (state[sid]?.present ?? true) ? "Present" : "Absent" };
                });
                await sendAttendanceEmails({ date: today, records, teacher_name: session?.name ?? "", class_name: cls });
                setEmailing(false);
              }}
            >
              {emailingParents ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Email Parents
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => downloadAttendanceCSV(today, cls)}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        )}
      </div>
      </PageFade>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save attendance for Class {cls}?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-success font-medium">{presentCount} present</span>
              {" · "}
              <span className="text-destructive font-medium">{absentCount} absent</span>
              {" · date: "}{today}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submit} disabled={submitting} className="bg-crimson hover:bg-crimson/90 text-crimson-foreground">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
