import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { PageFade } from "@/components/app/PageFade";
import { EmptyState } from "@/components/app/EmptyState";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { sendComplaintEmail } from "@/lib/email";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareWarning, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/complaints")({
  component: SendNotice,
});

type Student = { _id?: string; id?: string; name: string; class_name: string; parent_email?: string };

const NOTICE_TEMPLATES = [
  { label: "Homework not submitted", text: "Your child has not been submitting homework regularly. Please ensure this is done on time." },
  { label: "Behaviour concern", text: "We would like to bring to your attention a behavioural concern regarding your child in class. Please contact us at your earliest convenience." },
  { label: "Low attendance warning", text: "Your child's attendance has dropped below the required threshold. Please ensure regular attendance." },
  { label: "Exam performance below average", text: "Your child's performance in recent examinations has been below average. We recommend additional practice at home." },
];

function SendNotice() {
  const { session }           = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    apiGet<Student[]>("/api/students")
      .then((data) => setStudents(data.filter(s => s.parent_email)))
      .catch(() => {});
  }, []);

  const selected = students.find(s => (s._id || s.id) === selectedId);
  const withEmail = students.filter(s => s.parent_email);

  async function send() {
    if (!selectedId || !message.trim()) { toast.error("Select a student and write a message"); return; }
    setSending(true);
    await sendComplaintEmail(selectedId, message.trim(), session?.name ?? "Class Teacher");
    setSending(false);
    setMessage("");
    setSelectedId("");
  }

  return (
    <>
      <AppHeader title="Send Notice to Parent" subtitle="Email a notice or complaint directly to parent" />
      <PageFade>
      <div className="p-4 sm:p-6 max-w-2xl space-y-5">

        {withEmail.length === 0 ? (
          <EmptyState
            icon={MessageSquareWarning}
            title="No students with parent email"
            description="Add parent email addresses to student records (Student Roster page) before sending notices."
            showCrest
          />
        ) : (
          <>
            <div className="rounded-lg border bg-card shadow-sm p-4 sm:p-6 space-y-4">
              <div>
                <Label>Select Student *</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a student…" />
                  </SelectTrigger>
                  <SelectContent>
                    {withEmail.map(s => (
                      <SelectItem key={s._id || s.id} value={(s._id || s.id)!}>
                        {s.name} — Class {s.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected?.parent_email && (
                  <p className="mt-1 text-xs text-muted-foreground">Email will be sent to: <strong>{selected.parent_email}</strong></p>
                )}
              </div>

              <div>
                <Label>Quick Templates</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {NOTICE_TEMPLATES.map(t => (
                    <button
                      key={t.label}
                      onClick={() => setMessage(t.text)}
                      className="rounded-full border px-3 py-1 text-xs hover:bg-muted transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Notice / Message *</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your notice to the parent here…"
                  rows={5}
                  className="mt-1 resize-none"
                />
                <p className="mt-1 text-xs text-muted-foreground">{message.length} characters</p>
              </div>

              <Button
                onClick={send}
                disabled={sending || !selectedId || !message.trim()}
                className="w-full h-11 bg-crimson hover:bg-crimson/90 text-crimson-foreground"
              >
                {sending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending notice…</>
                  : <><MessageSquareWarning className="mr-2 h-4 w-4" />Send Notice to Parent</>}
              </Button>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Only students with a parent email address are listed.
              To add parent emails, go to <strong>Student Roster</strong> → Edit Student.
            </div>
          </>
        )}
      </div>
      </PageFade>
    </>
  );
}
