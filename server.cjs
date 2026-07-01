/**
 * Express API server — handles /api/* and /uploads/* only.
 *
 * In production (Docker / Hugging Face Spaces):
 *   - This server listens on port 3001 (API_PORT env var).
 *   - The Nitro SSR server (.output/server/index.mjs) listens on port 7860
 *     (PORT env var) and is started separately by the Dockerfile CMD.
 *   - Requests flow: Browser → Nitro :7860 → Express :3001 (for /api/*)
 *
 * In development:
 *   - Run `npm run api`  → starts Express on port 3001
 *   - Run `npm run dev`  → starts Vite dev server which proxies /api/* to :3001
 */

require('dotenv').config();
const express = require('express');
const path    = require('path');
const cors    = require('cors');
const fs      = require('fs');

const app      = express();
// API server always runs on 3001 internally; the public-facing port (7860)
// belongs to the Nitro SSR server.
const API_PORT = parseInt(process.env.API_PORT || '3001', 10);

// ── Uploads directory ──────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── CORS ───────────────────────────────────────────────────────────────────
// In production the Nitro SSR server is on the same origin, so CORS is only
// needed for local dev (Vite on :5173 → Express on :3001).
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

// ── Health check (used by Nitro proxy & Docker HEALTHCHECK) ───────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Connect MongoDB then start ─────────────────────────────────────────────
const { connect } = require('./database/db.cjs');
connect()
  .then(() => {
    app.listen(API_PORT, '127.0.0.1', () => {
      console.log(`✅  MongoDB connected`);
      console.log(`📡  Express API  → http://127.0.0.1:${API_PORT}  [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
