const express = require('express');
const { EmailConfig, Teacher, Student } = require('../database/models.cjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail, sendBatch, salaryTemplate, attendanceTemplate, marksTemplate, complaintTemplate, credentialsTemplate, bulkCredentialsTemplate } = require('../services/email.cjs');

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

const router = express.Router();

// ── Config (admin only) ────────────────────────────────────────────────────

// GET current email config (hide password)
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cfg = await EmailConfig.findOne() || {};
    res.json({
      gmail_user:     cfg.gmail_user     || '',
      from_name:      cfg.from_name      || '',
      enabled:        cfg.enabled        || false,
      sheets_id:      cfg.sheets_id      || '',
      sheets_enabled: cfg.sheets_enabled || false,
      has_password:   !!(cfg.gmail_app_password),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST save config
router.post('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { gmail_user, gmail_app_password, from_name, enabled, sheets_id, sheets_enabled } = req.body;
    const update = { gmail_user: gmail_user?.trim(), from_name, enabled: !!enabled, sheets_id, sheets_enabled: !!sheets_enabled };
    // Only update password if provided
    if (gmail_app_password?.trim()) update.gmail_app_password = gmail_app_password.trim();

    await EmailConfig.findOneAndUpdate({}, update, { upsert: true, new: true });
    res.json({ message: 'Email settings saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST test connection
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cfg = await EmailConfig.findOne();
    if (!cfg?.gmail_user) return res.status(400).json({ error: 'Gmail not configured yet' });
    await sendEmail({
      to: cfg.gmail_user,
      subject: 'Test Email — S.D. Model School Management',
      html: '<p>✅ Email configuration is working correctly!</p><p>You can now send emails to teachers and parents.</p>',
    });
    res.json({ message: `Test email sent to ${cfg.gmail_user}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Salary email (admin → teacher) ────────────────────────────────────────
router.post('/salary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { teacher_id, amount, month } = req.body;
    if (!teacher_id || !amount || !month)
      return res.status(400).json({ error: 'teacher_id, amount and month required' });

    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const to = teacher.personal_email || teacher.school_email;
    const tpl = salaryTemplate({
      teacherName:  teacher.name,
      amount,
      month,
      designation:  teacher.designation || 'Teacher',
    });
    await sendEmail({ to, ...tpl });
    res.json({ message: `Salary email sent to ${teacher.name} (${to})` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Bulk salary (admin → all teachers) ────────────────────────────────────
router.post('/salary/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'month required' });

    const teachers = await Teacher.find({ salary_amount: { $gt: 0 } });
    const messages = teachers.map(t => {
      const to  = t.personal_email || t.school_email;
      const tpl = salaryTemplate({ teacherName: t.name, amount: t.salary_amount, month, designation: t.designation });
      return { to, ...tpl };
    });

    const result = await sendBatch(messages);
    res.json({ message: `Salary emails sent: ${result.sent}/${result.total}`, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Attendance email (teacher → parents) ──────────────────────────────────
router.post('/attendance', authenticateToken, async (req, res) => {
  try {
    const { date, records, teacher_name, class_name } = req.body;
    if (!date || !Array.isArray(records)) return res.status(400).json({ error: 'date and records[] required' });

    const studentIds = records.map(r => r.student_id);
    const students   = await Student.find({ _id: { $in: studentIds } });
    const smap       = Object.fromEntries(students.map(s => [s._id.toString(), s]));

    const messages = records
      .filter(r => smap[r.student_id]?.parent_email)
      .map(r => {
        const s   = smap[r.student_id];
        const tpl = attendanceTemplate({
          studentName:  s.name,
          className:    s.class_name,
          date,
          status:       r.status,
          teacherName:  teacher_name || 'Class Teacher',
        });
        return { to: s.parent_email, ...tpl };
      });

    if (!messages.length)
      return res.status(400).json({ error: 'No students with parent email found. Add parent emails to student records.' });

    const result = await sendBatch(messages);
    res.json({ message: `Attendance emails: ${result.sent}/${result.total} sent`, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Marks email (teacher → parents) ───────────────────────────────────────
router.post('/marks', authenticateToken, async (req, res) => {
  try {
    const { grades, teacher_name, exam_type } = req.body;
    if (!Array.isArray(grades)) return res.status(400).json({ error: 'grades[] required' });

    const studentIds = grades.map(g => g.student_id);
    const students   = await Student.find({ _id: { $in: studentIds } });
    const smap       = Object.fromEntries(students.map(s => [s._id.toString(), s]));

    const messages = grades
      .filter(g => smap[g.student_id]?.parent_email)
      .map(g => {
        const s   = smap[g.student_id];
        const tpl = marksTemplate({
          studentName:    s.name,
          className:      s.class_name,
          subject:        g.subject,
          marksObtained:  g.marks_obtained,
          totalMarks:     g.total_marks || 100,
          examType:       exam_type || g.exam_type || 'Exam',
          teacherName:    teacher_name || 'Class Teacher',
        });
        return { to: s.parent_email, ...tpl };
      });

    if (!messages.length)
      return res.status(400).json({ error: 'No students with parent email found.' });

    const result = await sendBatch(messages);
    res.json({ message: `Marks emails: ${result.sent}/${result.total} sent`, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Credentials: send after new teacher add ────────────────────────────────
// POST /api/email/credentials  — called right after teacher creation with the known plaintext password
router.post('/credentials', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { teacher_id, password } = req.body;
    if (!teacher_id || !password) return res.status(400).json({ error: 'teacher_id and password required' });

    const cfg = await EmailConfig.findOne();
    const schoolInbox = cfg?.gmail_user || process.env.GMAIL_USER;
    if (!schoolInbox) return res.status(400).json({ error: 'Gmail not configured' });

    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const tpl = credentialsTemplate({
      teacherName: teacher.name,
      designation: teacher.designation,
      schoolEmail: teacher.school_email,
      password,
    });
    await sendEmail({ to: schoolInbox, ...tpl });
    res.json({ message: `Credentials email sent to ${schoolInbox}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/email/credentials/reset  — reset password + send to school inbox (for existing teachers)
router.post('/credentials/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { teacher_id } = req.body;
    if (!teacher_id) return res.status(400).json({ error: 'teacher_id required' });

    const cfg = await EmailConfig.findOne();
    const schoolInbox = cfg?.gmail_user || process.env.GMAIL_USER;
    if (!schoolInbox) return res.status(400).json({ error: 'Gmail not configured' });

    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const newPassword = randomPassword();
    await Teacher.findByIdAndUpdate(teacher_id, { password_hash: bcrypt.hashSync(newPassword, 10) });

    const tpl = credentialsTemplate({
      teacherName: teacher.name,
      designation: teacher.designation,
      schoolEmail: teacher.school_email,
      password: newPassword,
    });
    await sendEmail({ to: schoolInbox, ...tpl });
    res.json({ message: `Password reset and credentials sent to ${schoolInbox}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/email/credentials/bulk  — reset ALL teacher passwords + send one combined email
router.post('/credentials/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cfg = await EmailConfig.findOne();
    const schoolInbox = cfg?.gmail_user || process.env.GMAIL_USER;
    if (!schoolInbox) return res.status(400).json({ error: 'Gmail not configured' });

    const teachers = await Teacher.find().sort({ name: 1 });
    const creds = teachers.map(t => ({ teacher: t, password: randomPassword() }));

    await Promise.all(creds.map(({ teacher, password }) =>
      Teacher.findByIdAndUpdate(teacher._id, { password_hash: bcrypt.hashSync(password, 10) })
    ));

    const tpl = bulkCredentialsTemplate(creds.map(({ teacher, password }) => ({
      name:        teacher.name,
      designation: teacher.designation || 'Teacher',
      schoolEmail: teacher.school_email,
      password,
    })));
    await sendEmail({ to: schoolInbox, ...tpl });
    res.json({ message: `Bulk credentials email sent for ${teachers.length} teachers to ${schoolInbox}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Complaint email (teacher → parent) ────────────────────────────────────
router.post('/complaint', authenticateToken, async (req, res) => {
  try {
    const { student_id, complaint, teacher_name } = req.body;
    if (!student_id || !complaint) return res.status(400).json({ error: 'student_id and complaint required' });

    const student = await Student.findById(student_id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!student.parent_email) return res.status(400).json({ error: 'This student has no parent email on record.' });
    if (req.user.role === 'teacher' && student.teacher_id?.toString() !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const tpl = complaintTemplate({ studentName: student.name, className: student.class_name, complaint, teacherName: teacher_name || 'Class Teacher', date: today });
    await sendEmail({ to: student.parent_email, ...tpl });
    res.json({ message: `Notice sent to parent of ${student.name}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
