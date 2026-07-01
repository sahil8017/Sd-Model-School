import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { DataTableShell } from "@/components/app/DataTableShell";
import { PageFade } from "@/components/app/PageFade";
import { TableSkeleton } from "@/components/app/TableSkeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { useAuth, useDelayedReady } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { sendMarksEmails } from "@/lib/email";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Save, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/gradebook")({
  component: Gradebook,
});

const SUBJECTS = ["English", "Mathematics", "Science", "Social Science", "Hindi"];
const EXAM_TYPES = ["Unit Test 1", "Mid-Term", "Unit Test 2", "Final"];

type Student = { _id?: string; id?: string; name: string; class_name: string; roll_no?: number };

function Gradebook() {
  const { session }  = useAuth();
  const classes      = session?.classes_taught ?? [];
  const [cls, setCls]       = useState<string>(classes[0] ?? "");
  const [examType, setExam] = useState(EXAM_TYPES[0]);
  const ready               = useDelayedReady(400);
  const [students, setStudents]   = useState<Student[]>([]);
  const [loadingStudents, setLS]  = useState(false);
  const [marks, setMarks]         = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving]       = useState(false);
  const [emailing, setEmailing]   = useState(false);

  useEffect(() => {
    if (!cls) return;
    setLS(true);
    apiGet<Student[]>(`/api/students?class_name=${encodeURIComponent(cls)}`)
      .then((data) => {
        setStudents(data);
        setMarks({});
      })
      .catch((err) => toast.error("Failed to load students", { description: err.message }))
      .finally(() => setLS(false));
  }, [cls]);

  function setMark(studentId: string, subject: string, value: string) {
    setMarks((p) => ({ ...p, [studentId]: { ...(p[studentId] ?? {}), [subject]: value } }));
  }

  const totals = useMemo(() =>
    Object.fromEntries(students.map((s) => {
      const sid = s._id || s.id!;
      const m   = marks[sid] ?? {};
      const sum = SUBJECTS.reduce((acc, sub) => acc + (parseFloat(m[sub] ?? "") || 0), 0);
      return [sid, sum];
    })),
  [students, marks]);

  async function saveGrades() {
    const grades = students.flatMap((s) => {
      const sid = s._id || s.id!;
      return SUBJECTS
        .filter((sub) => marks[sid]?.[sub] !== undefined && marks[sid][sub] !== "")
        .map((sub) => ({
          student_id:     sid,
          subject:        sub,
          marks_obtained: parseFloat(marks[sid][sub]),
          total_marks:    100,
          exam_type:      examType,
        }));
    });
    if (!grades.length) { toast.error("Enter at least one mark before saving"); return; }
    setSaving(true);
    try {
      await apiPost("/api/grades", { grades });
      toast.success(`Grades saved for ${examType}`, { description: `${grades.length} entries recorded` });
      setMarks({});
    } catch (err) {
      toast.error("Failed to save grades", { description: (err as Error).message });
    } finally { setSaving(false); }
  }

  return (
    <>
      <AppHeader title="Gradebook" subtitle={`Enter marks — ${examType}`} />
      <PageFade>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          {classes.length > 0 ? (
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">No classes assigned</span>
          )}
          <Select value={examType} onValueChange={setExam}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{EXAM_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {!ready || loadingStudents ? <TableSkeleton rows={8} cols={8} /> : students.length === 0 ? (
          <EmptyState icon={GraduationCap} title={cls ? `No students in Class ${cls}` : "Select a class"} showCrest />
        ) : (
        <DataTableShell minWidth={780}>
          <Table>
            <TableHeader>
              <TableRow className="bg-brand hover:bg-brand">
                <TableHead className="text-brand-foreground font-semibold uppercase text-[11px] tracking-wider">Roll</TableHead>
                <TableHead className="text-brand-foreground font-semibold uppercase text-[11px] tracking-wider">Student</TableHead>
                {SUBJECTS.map((s) => (
                  <TableHead key={s} className="text-brand-foreground font-semibold uppercase text-[11px] tracking-wider text-center">{s}</TableHead>
                ))}
                <TableHead className="text-brand-foreground font-semibold uppercase text-[11px] tracking-wider text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => {
                const sid = s._id || s.id!;
                return (
                  <TableRow key={sid}>
                    <TableCell className="font-mono font-semibold">{s.roll_no ?? i + 1}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{s.name}</TableCell>
                    {SUBJECTS.map((sub) => (
                      <TableCell key={sub} className="px-2">
                        <Input
                          type="number" min={0} max={100}
                          value={marks[sid]?.[sub] ?? ""}
                          onChange={(e) => setMark(sid, sub, e.target.value)}
                          placeholder="—"
                          aria-label={`${s.name} ${sub}`}
                          className="h-9 w-20 text-center"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">{totals[sid] > 0 ? totals[sid] : "—"}</TableCell>
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
              onClick={saveGrades} disabled={saving}
              className="flex-1 h-12 text-base bg-crimson hover:bg-crimson/90 text-crimson-foreground shadow-lg shadow-crimson/20"
            >
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving grades…</>
                : <><Save className="mr-2 h-4 w-4" />Save {examType} Grades</>}
            </Button>
            <Button
              variant="outline"
              className="h-12 border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              disabled={emailing}
              onClick={async () => {
                const grades = students.flatMap((s) => {
                  const sid = s._id || s.id!;
                  return SUBJECTS
                    .filter((sub) => marks[sid]?.[sub] !== undefined && marks[sid][sub] !== "")
                    .map((sub) => ({
                      student_id: sid, subject: sub,
                      marks_obtained: parseFloat(marks[sid][sub]),
                      total_marks: 100, exam_type: examType,
                    }));
                });
                if (!grades.length) { toast.error("Enter at least one mark first"); return; }
                setEmailing(true);
                await sendMarksEmails({ grades, teacher_name: session?.name ?? "", exam_type: examType });
                setEmailing(false);
              }}
            >
              {emailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Email Parents
            </Button>
          </div>
        )}
      </div>
      </PageFade>
    </>
  );
}
