import { apiPost, getToken } from "@/lib/api";
import { toast } from "sonner";

// ── Salary ─────────────────────────────────────────────────────────────────
export async function sendSalaryEmail(teacherId: string, amount: number, month: string) {
  try {
    const data = await apiPost<{ message: string }>("/api/email/salary", {
      teacher_id: teacherId, amount, month,
    });
    toast.success("Salary email sent", { description: data.message });
    return true;
  } catch (err) {
    toast.error("Failed to send salary email", { description: (err as Error).message });
    return false;
  }
}

export async function sendBulkSalaryEmail(month: string) {
  try {
    const data = await apiPost<{ message: string }>("/api/email/salary/bulk", { month });
    toast.success("Bulk salary emails sent", { description: data.message });
    return true;
  } catch (err) {
    toast.error("Failed to send salary emails", { description: (err as Error).message });
    return false;
  }
}

// ── Attendance ─────────────────────────────────────────────────────────────
export async function sendAttendanceEmails(payload: {
  date: string;
  records: Array<{ student_id: string; status: string }>;
  teacher_name: string;
  class_name: string;
}) {
  try {
    const data = await apiPost<{ message: string }>("/api/email/attendance", payload);
    toast.success("Attendance emails sent", { description: data.message });
    return true;
  } catch (err) {
    toast.error("Failed to send attendance emails", { description: (err as Error).message });
    return false;
  }
}

// ── Marks ──────────────────────────────────────────────────────────────────
export async function sendMarksEmails(payload: {
  grades: Array<{ student_id: string; subject: string; marks_obtained: number; total_marks: number; exam_type: string }>;
  teacher_name: string;
  exam_type: string;
}) {
  try {
    const data = await apiPost<{ message: string }>("/api/email/marks", payload);
    toast.success("Marks emails sent", { description: data.message });
    return true;
  } catch (err) {
    toast.error("Failed to send marks emails", { description: (err as Error).message });
    return false;
  }
}

// ── Complaint ──────────────────────────────────────────────────────────────
export async function sendComplaintEmail(studentId: string, complaint: string, teacherName: string) {
  try {
    const data = await apiPost<{ message: string }>("/api/email/complaint", {
      student_id: studentId, complaint, teacher_name: teacherName,
    });
    toast.success("Notice sent to parent", { description: data.message });
    return true;
  } catch (err) {
    toast.error("Failed to send notice", { description: (err as Error).message });
    return false;
  }
}

// ── Teacher Credentials ────────────────────────────────────────────────────
export async function sendCredentialsEmail(teacherId: string, password: string) {
  try {
    const data = await apiPost<{ message: string }>("/api/email/credentials", {
      teacher_id: teacherId, password,
    });
    toast.success("Credentials emailed", { description: data.message });
    return true;
  } catch (err) {
    toast.error("Could not send credentials email", { description: (err as Error).message });
    return false;
  }
}

export async function resetAndEmailCredentials(teacherId: string) {
  try {
    const data = await apiPost<{ message: string }>("/api/email/credentials/reset", { teacher_id: teacherId });
    toast.success("Password reset & emailed", { description: data.message });
    return true;
  } catch (err) {
    toast.error("Reset failed", { description: (err as Error).message });
    return false;
  }
}

export async function bulkSendAllCredentials() {
  try {
    const data = await apiPost<{ message: string }>("/api/email/credentials/bulk", {});
    toast.success("All credentials emailed", { description: data.message });
    return true;
  } catch (err) {
    toast.error("Bulk credentials failed", { description: (err as Error).message });
    return false;
  }
}

// ── Attendance CSV download (Google Sheets import) ─────────────────────────
export function downloadAttendanceCSV(date?: string, className?: string) {
  const token  = getToken();
  const params = new URLSearchParams();
  if (date)      params.set("date",       date);
  if (className) params.set("class_name", className);

  const url = `/api/attendance/export?${params.toString()}`;

  // Create hidden link to trigger download with auth header via fetch
  fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } })
    .then(async (res) => {
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob     = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "attendance.csv";
      const link     = document.createElement("a");
      link.href      = URL.createObjectURL(blob);
      link.download  = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("CSV downloaded", { description: "Open in Google Sheets → File → Import" });
    })
    .catch(() => toast.error("CSV export failed"));
}
