require('dotenv').config();
const express = require('express');
const path    = require('path');
const cors    = require('cors');
const fs      = require('fs');

const app  = express();
const PORT = parseInt(process.env.PORT || '7860', 10);

// ── Uploads directory ──────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOptions = allowedOrigin === '*'
  ? { origin: true, credentials: true }
  : { origin: allowedOrigin, credentials: true };
app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use('/uploads', express.static(uploadsDir));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth.cjs'));
app.use('/api/teachers',   require('./routes/teachers.cjs'));
app.use('/api/students',   require('./routes/students.cjs'));
app.use('/api/attendance', require('./routes/attendance.cjs'));
app.use('/api/grades',     require('./routes/grades.cjs'));
app.use('/api/email',      require('./routes/email.cjs'));

// ── Stats (admin dashboard) ────────────────────────────────────────────────
const { authenticateToken, requireAdmin } = require('./middleware/auth.cjs');
const { Teacher, Student, Attendance, Grade } = require('./database/models.cjs');

app.get('/api/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [totalTeachers, totalStudents, recentAtt, recentGrades] =
      await Promise.all([
        Teacher.countDocuments(),
        Student.countDocuments(),
        Attendance.find().sort({ createdAt: -1 }).limit(8).populate('student_id', 'name class_name'),
        Grade.find().sort({ createdAt: -1 }).limit(8).populate('student_id', 'name'),
      ]);
    res.json({
      totalTeachers, totalStudents,
      recentAttendance: recentAtt.map(a => ({
        date: a.date, status: a.status,
        student_name: a.student_id?.name       || '—',
        class_name:   a.student_id?.class_name || '—',
      })),
      recentGrades: recentGrades.map(g => ({
        subject: g.subject, exam_type: g.exam_type,
        marks_obtained: g.marks_obtained, total_marks: g.total_marks,
        student_name: g.student_id?.name || '—',
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Serve Frontend (static SPA build) ──────────────────────────────────────
const staticPublicDir = path.join(__dirname, '.output', 'public');
const indexHtml = path.join(staticPublicDir, 'index.html');

if (fs.existsSync(staticPublicDir)) {
  app.use(express.static(staticPublicDir, { index: ['index.html'] }));
}

// SPA fallback for all remaining routes (not API, not uploads, not static files)
app.get('*', (req, res) => {
  res.sendFile(indexHtml);
});

// ── Connect MongoDB then start ─────────────────────────────────────────────
const { connect } = require('./database/db.cjs');
connect()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🏫  S.D. Model Sr. Sec. School — Management System`);
      console.log(`🚀  http://0.0.0.0:${PORT}  [${process.env.NODE_ENV || 'development'}]\n`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
