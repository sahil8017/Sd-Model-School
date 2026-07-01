/**
 * Vercel Serverless Function entry point.
 *
 * Key differences from a long-running Express server:
 *  - Each invocation is stateless (no persistent in-memory state).
 *  - MongoDB connection is cached across warm invocations via the module cache.
 *  - Dynamic ESM import() of local files is avoided during trace, but loaded via includeFiles.
 */

'use strict';

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');

// ── Cached DB connection (survives warm Lambda restarts) ─────────────────────
let dbConnected = false;

async function ensureDb() {
  if (dbConnected || mongoose.connection.readyState >= 1) {
    dbConnected = true;
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI env variable is not set');
  await mongoose.connect(uri, { dbName: 'sdmodel' });
  dbConnected = true;
  console.log('✅ MongoDB connected (serverless)');

  // Seed admin + teachers on first cold start
  const { seedAdmin, seedTeachers } = require('../database/db.cjs');
  if (typeof seedAdmin === 'function')   await seedAdmin().catch(console.error);
  if (typeof seedTeachers === 'function') await seedTeachers().catch(console.error);
}

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

// CORS — allow the production domain + localhost for dev
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, same-origin SSR)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── DB middleware — ensure connection before every request ────────────────────
app.use(async (_req, _res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('DB connection error:', err.message);
    _res.status(503).json({ error: 'Database unavailable', details: err.message });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('../routes/auth.cjs'));
app.use('/api/teachers',   require('../routes/teachers.cjs'));
app.use('/api/students',   require('../routes/students.cjs'));
app.use('/api/attendance', require('../routes/attendance.cjs'));
app.use('/api/grades',     require('../routes/grades.cjs'));
app.use('/api/email',      require('../routes/email.cjs'));

// ── Stats ─────────────────────────────────────────────────────────────────────
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');
const { Teacher, Student, Attendance, Grade } = require('../database/models.cjs');

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

// ── Serve Frontend via SSR ───────────────────────────────────────────────────
const ssrServerPath = path.join(__dirname, '..', 'dist', 'server', 'server.js');
let ssrHandler = null;

function webFetchBridge(fetchHandler) {
  return async (req, res) => {
    try {
      const protocol = req.socket.encrypted ? 'https' : 'http';
      const host = req.headers.host || 'localhost';
      const url = `${protocol}://${host}${req.url}`;

      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const webRequest = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: body && body.length > 0 ? body : undefined,
        duplex: 'half',
      });

      const webResponse = await fetchHandler(webRequest);

      res.statusCode = webResponse.status;
      for (const [key, value] of webResponse.headers.entries()) {
        res.setHeader(key, value);
      }
      const responseBody = await webResponse.arrayBuffer();
      res.end(Buffer.from(responseBody));
    } catch (err) {
      console.error('SSR fetch bridge error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  };
}

async function getSsrHandler() {
  if (ssrHandler) return ssrHandler;
  if (fs.existsSync(ssrServerPath)) {
    try {
      const m = await import(ssrServerPath);
      const ssrApp = m.default || m;
      if (ssrApp && typeof ssrApp.fetch === 'function') {
        ssrHandler = webFetchBridge(ssrApp.fetch);
        console.log('✅ Vite SSR Handler loaded successfully in serverless context');
        return ssrHandler;
      }
    } catch (err) {
      console.error('❌ Failed to load SSR handler in serverless context:', err);
    }
  }
  return null;
}

app.get('*', async (req, res) => {
  const handler = await getSsrHandler();
  if (handler) {
    await handler(req, res);
  } else {
    // SPA fallback in case SSR server bundle is not generated/found
    const indexPath = path.join(__dirname, '..', 'dist', 'client', 'index.html');
    res.sendFile(indexPath, err => {
      if (err) {
        res.status(503).send('<h1>App is starting up…</h1><p>The SSR engine is initializing or not built yet.</p>');
      }
    });
  }
});

module.exports = app;
