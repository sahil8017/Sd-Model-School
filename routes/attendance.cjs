const express = require('express');
const { Attendance, Student, Teacher } = require('../database/models.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

async function enrich(records) {
  const sids = [...new Set(records.map(r => r.student_id?.toString()).filter(Boolean))];
  const tids = [...new Set(records.map(r => r.teacher_id?.toString()).filter(Boolean))];
  const [students, teachers] = await Promise.all([
    Student.find({ _id: { $in: sids } }, 'name class_name parent_guardian_phone'),
    Teacher.find({ _id: { $in: tids } }, 'name'),
  ]);
  const smap = Object.fromEntries(students.map(s => [s._id.toString(), s]));
  const tmap = Object.fromEntries(teachers.map(t => [t._id.toString(), t.name]));
  return records.map(r => {
    const s = smap[r.student_id?.toString()];
    return {
      ...r.toObject ? r.toObject() : r,
      id:                    r._id.toString(),
      student_name:          s?.name            || '—',
      class_name:            s?.class_name       || '—',
      parent_guardian_phone: s?.parent_guardian_phone || null,
      teacher_name:          tmap[r.teacher_id?.toString()] || '—',
    };
  });
}

// GET attendance records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'teacher') query.teacher_id = req.user.id;
    if (req.query.date)              query.date = req.query.date;

    let records = await Attendance.find(query).sort({ date: -1 });
    let enriched = await enrich(records);

    if (req.query.class_name)
      enriched = enriched.filter(r => r.class_name === req.query.class_name);

    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST mark attendance (batch upsert)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, records, teacher_id: body_tid } = req.body;
    if (!date || !Array.isArray(records) || !records.length)
      return res.status(400).json({ error: 'date and records[] required' });

    const teacher_id = req.user.role === 'teacher' ? req.user.id : (body_tid || null);
    if (!teacher_id) return res.status(400).json({ error: 'teacher_id required for admin' });

    await Promise.all(records.map(r =>
      Attendance.findOneAndUpdate(
        { student_id: r.student_id, date },
        { teacher_id, status: r.status },
        { upsert: true, new: true }
      )
    ));

    res.json({ message: `Attendance saved for ${records.length} student(s)`, date, total: records.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET class-level summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const query = { date };
    if (req.user.role === 'teacher') query.teacher_id = req.user.id;

    const records   = await Attendance.find(query);
    const enriched  = await enrich(records);

    const classMap = {};
    enriched.forEach(r => {
      const cls = r.class_name || 'Unknown';
      if (!classMap[cls]) classMap[cls] = { class_name: cls, present_count: 0, absent_count: 0, total: 0 };
      classMap[cls].total++;
      if (r.status === 'Present') classMap[cls].present_count++;
      else classMap[cls].absent_count++;
    });

    res.json(Object.values(classMap).sort((a, b) => a.class_name.localeCompare(b.class_name)));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/attendance/export — download as CSV (for Google Sheets import)
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'teacher') query.teacher_id = req.user.id;
    if (req.query.date)       query.date       = req.query.date;
    if (req.query.class_name) {
      // We filter by class after population
    }

    const records  = await Attendance.find(query).sort({ date: -1 });
    const enriched = await enrich(records);

    const filtered = req.query.class_name
      ? enriched.filter(r => r.class_name === req.query.class_name)
      : enriched;

    // Build CSV
    const header = ['Date', 'Student Name', 'Class', 'Status', 'Teacher'];
    const rows   = filtered.map(r => [r.date, r.student_name, r.class_name, r.status, r.teacher_name]);
    const csv    = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const filename = `attendance_${req.query.date || 'all'}_${req.query.class_name || 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
